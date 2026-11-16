---
title: "代码是如何被 Lint & 类型 & Mock & 构建拦截住"
slug: lint-type-mock-build-gates
description: "Lint、类型、Mock、构建按拦截时机叠成四层：每层写明拦什么、怎么拦，以及故意不拦什么。"
tags:
  - Frontend-Engineering
  - TypeScript
  - Agent-Governance
rank: 4
featured: false
date: "2026-04-16"
---

这四层不是「质量口号」，而是按**拦截时机**叠的。人写错和 Agent 写错，走的是同一条管道：写的时候就红、提交进不去、跑起来对不上契约、打生产包漏不进去。

先给一张总图，再按层讲「拦什么 / 怎么拦 / 故意不拦什么」。

核心判断：**文档和 Cursor 规则只改变「默认生成什么」；真正挡住错误的是确定性工具。** Agent 不读规则也会乱写，所以规则必须能被 `pnpm lint` / `pnpm build` 复现。

---

## 一、Lint：拦「放错层、逃逸类型、手写 memo、脏格式」

Lint 分两套，这是刻意拆的，不是再叠一套 Prettier。

| 工具                | 拦什么                                  | 为什么拆开                                                        |
| ----------------- | ------------------------------------ | ------------------------------------------------------------ |
| **Biome**         | 格式、简单语法、import 排序                    | 快；commit 前 `biome check --write`，0.1s 量级，AI 连着改几十个文件不会卡 hook |
| **ESLint 9 Flat** | 架构和语义：分层、React Compiler、禁 `any`/`as` | Biome 做不了 FSD 边界和 Compiler 纯度；ESLint 只留「贵」规则，避免双工具抢格式        |

**1. 分层（`eslint-plugin-boundaries`）**

依赖只能向下：`app → pages → features → shared`。  
Agent 最爱干的事是：在 `shared/ui` 里为了「方便」去 `import` 订单 Query，或从 `features/order` 深挖 `features/user/ui/Avatar`。
- [x] 
拦住的样子很具体：`shared` 里出现 `@/features/...`，保存即 error，CI 同规则，不是 Code Review 口头说「别跨层」。

Trade-off：**完整 FSD 六层**（再加 widgets/entities）规则表会膨胀，人和模型都为对称建空目录。后来收成四层 FSD-lite，Lint 规则更短、误报更少。同层互引也禁——否则 `order` 和 `user` 互相 import，边界图当场环形。跨域只能走对方 `index.ts` facade；这条如果只写在 `AGENTS.md` 里，大约一周就会被打破。

**2. 类型逃逸（从第一天就开，不是事后治理）**

存量项目里 `any` / `as T` 是「类型检查形同虚设」的入口。脚手架里：

- 禁 `any`、禁 `as T`、禁 `as unknown as T`、禁非空断言 `!`
- `consistent-type-assertions: never`（只放行 `as const`）
- `JSON.parse` 的 DOM 类型是 `any`：全仓唯一出口是 `parseJsonUnknown()`，返回 `unknown`；业务文件再写 `JSON.parse` 直接 lint 挂

Agent 生成 `const order = data as Order` 过不了本地 lint，也就过不了 hook。Trade-off 是：早期会烦，尤其是第三方不完备类型；做法是在 `shared` 做一层窄适配，而不是对业务开豁口——豁口一旦开，模型会学着走豁口。

**3. React Compiler 规则**

`eslint-plugin-react-compiler` 开成 error：违反 Compiler 假设的写法直接红（不稳定的参数、不该有的副作用形态等）。同时 **禁手写 `useMemo` / `useCallback`**——不是审美，是防止「规范式包一层」把依赖数组漏了，也防止 Agent 在已经 Compiler 的项目里再堆 memo 噪声。

Trade-off：个别真需要手动缓存的极端路径（和第三方不可编译组件）要走白名单文件，而不是全局关掉规则。全局一关，Compiler 等于没买。

**4. 页面层约定（规则 + Lint 能扫到的部分）**

`pages/` 不许 `fetch`、不许新建 Zustand、不许就地定 Zod。Agent 最容易把「加个列表页」写成一个 400 行 page。目录 spec + `fsd-pages` 规则是给模型看的；能静态扫的 import（page 里直接引 `api-client` / 直接 `z.object`）尽量写成 ESLint。扫不干净的（page 里写了一堆 if 计价）靠 Code Review 和「对照黄金样本 `pages/home`」——这点要诚实讲：**Lint 拦结构，不拦业务糊在 JSX 里**，那是下一层 domain 纪律的事。

**5. Git hook 时机**

`husky` + `nano-staged`：只对暂存的 `*.ts,*.tsx` 跑 Biome + ESLint。Trade-off 是不用全仓 lint 当 pre-commit——全仓在大仓会劝退；全量放 CI。本地拦增量，CI 拦漏网和配置被改坏。

**故意不塞进 Lint 的：** 「颜色必须用 `bg-brand-primary`」这类设计 token，用 Cursor 规则 + Review 更合适；硬写成自定义 ESLint 对 Tailwind 任意值（`bg-[#ff5722]`）可以做，但误报多、和设计稿临时色冲突。先 token 约定，真成灾再加 plugin。

---

## 二、类型：编译期指路，运行期收口——两套「类型」不能混为一谈

面试里最容易被追问的点：**`axios.get<Order[]>` 不是类型安全。** 它只是告诉 TS「你相信我」；JSON 从网上来的那一刻仍是 `any` 形状。

脚手架把类型拆成两段：

**编译期（`tsc` / IDE）**

- `strict: true`，Zod Schema 推导业务类型：`type Order = z.infer<typeof OrderSchema>`，禁止手写一份 interface 再断言过去——两份会漂。
- 路由若上 TanStack Router，path params / search 进类型，Agent 拼错 `/order/$id` 会在编译期炸。没上的项目用配置式路由，就少这一层，要在口头里承认。
- OpenAPI → `openapi-typescript`（或 Apifox MCP 读字段）生成/对齐 Schema，模型猜字段 `userName` vs `username` 会在对不上 Schema 时红。

**运行期（真正挡住脏数据）**

请求统一 `apiFetch(path, schema)`：body 先收成 `unknown`，再 `schema.parse`。后端少字段、枚举从 `PAID` 改成 `payed`、金额变成字符串，**开发环境直接 throw**，页面不会用半残对象把布局撑裂。

```text
网络字符串 → parseJsonUnknown → schema.parse → Order
```

禁止：`apiFetch<unknown>(url)` 再 `as T`。Schema 必须是第二参数，类型上就能逼你传入——这是 API 设计上的拦住，比再写一条 ESLint「检查有没有 parse」更稳。

`sessionStorage` 恢复草稿同样走 Zod `safeParse`，坏数据丢弃而不是把脏 JSON 灌进 Zustand。

Trade-off：

- **parse 有运行时成本**，列表页可接受；超大 JSON 要收窄 Schema（只要用到的字段），不要把整份 OAS dump 进每次响应。
- **开发期失败要响、生产期策略要单独定**：生产用 `safeParse` + 上报 + 降级空态，还是直接失败，取决于业务能不能「展示错单」。脚手架默认开发 throw、生产可配置，避免 Mock 很绿、线上静默错。
- **Mock 数据必须能通过同一套 Schema**。否则 Mock  greener、联调全挂——这正好接到下一层。

---

## 三、Mock：拦住的不是语法，是「假闭环」和「联调幻觉」

Mock 在这套脚手架里是一等公民，因为 Agent 出 UI 已经是分钟级，瓶颈是「页面能不能立刻跑、跑的是不是契约」。

**拦什么**

1. **业务里写死 `const list = [{ name: 'test' }]`**  
   假数据藏在组件里，切真接口要改业务。约定：Mock 在 `src/mocks/handlers`（ADR）或和 Query 同文件的 `MOCK_ORDERS`（脚手架早期，少一套目录）。两条路的共同点是：**业务 `fetch` 路径不变**，用环境变量切 `VITE_ENABLE_MOCK` / `VITE_USE_MOCK`。

2. **请求库被改写导致「开发代码 ≠ 生产代码」**  
   不用 Mock.js 去 patch `XMLHttpRequest`。MSW 走 Service Worker，URL 仍是 `/api/v1/user`，Network 面板看得到。Agent 不会为了 Mock 去改 `baseURL` 成 `http://localhost:3001`，那种改法上线必炸。

3. **契约漂移**  
   Handler 返回的 JSON 应能被同一 Zod Schema parse。理想闭环：OpenAPI → 类型 + Mock。Handler 字段和 Schema 不一致，本地一请求就 Zod 失败——这是刻意的，比「Mock 永远 200」有用。

4. **移动端假幸福**  
   Faker `zh_CN` 出超长姓名、带小数价格，才能在真机上提前看到折行、撑破。垃圾 `name: 'test1'` 过不了视觉，但过得了功能——所以 Mock 规范里要求 Faker，控制台还能切 401/500、慢 3G。拦的是「没测过弱网/未登录」这种漏测，不是编译错误。

5. **真机 MSW 直接死掉**  
   Service Worker 只要 Secure Context。手机访问 `http://192.168.x.x:5173` 时 Worker 注册失败，请求打到不存在的后端，表现为白屏，会被误判成业务 bug。脚手架默认 `vite-plugin-mkcert` + `https` + `host: 0.0.0.0`，把这类环境坑挡在脚手架层，而不是每个业务自己发现。

6. **JSBridge**  
   扫码、支付不是 HTTP。没有 Bridge 抽象时，Agent 会发明 `window.wx.foo`。类型化 `JSBridge` + 浏览器分支返回 Mock Promise，业务只调接口；在 Web 里就能测跳转逻辑，不必每次打 App 包。

**和生产构建的咬合：** `initMocks()` 动态 import，`import.meta.env.DEV && VITE_ENABLE_MOCK` 才加载 worker / Faker。生产 bundle 不应出现 `msw`、`faker`。这既是 Mock 纪律，也是构建纪律。

Trade-off：**脚手架早期把 mock 写在 `get-orders.ts` 里**，少一套 `src/mocks`，Agent 仿黄金样本更容易；接口一多、要场景切换/Chaos 面板，再抽 MSW handlers。先闭环、后基础设施，避免脚手架第一天就比业务重。

---

## 四、构建：拦住「开发态漏网」和「体积/依赖回潮」

构建是最后一道，也是最不该承担「业务对不对」的一层。它拦的是**确定性产物问题**。

| 检查 | 拦住的典型事故 |
|------|----------------|
| `tsc --noEmit` / `vue-tsc` | Lint 没覆盖的类型洞、错误的 export、Router 类型不匹配 |
| `pnpm build`（Vite 生产） | DEV-only 分支被摇掉失败、错误的 `import.meta.env`、循环依赖在打包期爆 |
| 产物扫描：bundle 里不准出现 `lodash` | 有人/Agent 又装回 `lodash-es`；ADR 里用 `es-toolkit` + `structuredClone` 就是为这个 |
| Gzip 首屏预算（例如 &lt; 150KB 量级） | 误把 antd-mobile 全家桶、大图、Faker 打进主包 |
| React Compiler 在生产编译生效 | 本地以为开了、CI 没开 `babel-plugin-react-compiler`，memo 规则白写 |
| `shared` 误 import `entities` | ESLint 应已拦；构建再拦一层循环依赖，双保险 |

Git hook 不跑完整 production build（太慢）。**CI 必跑 lint + typecheck + build**。本地用 `pnpm build` 做脚手架验收 checklist：故意从 `shared/ui` import 上层，确认 ESLint 先炸；故意 `import _ from 'lodash-es'`，确认产物或依赖策略炸掉。

Trade-off：体积门禁用预算而不是「越小越好」——虚拟列表、Vaul、Query 都有成本。门禁是防回潮（lodash、整库组件、未压缩图），不是每次 PR 都抠 3KB。

构建**拦不住**：计价公式写反、取消订单条件漏了。那是 `domain/` 纯函数单测 + Zod 业务枚举的事。面试里要主动划清：**脚手架保证「代码在对的地方、数据是声明过的形状、脏依赖进不了包」；不保证「业务规则正确」。**

---

## 五、四层怎么配合——用一条 Agent 翻车链路串起来

假设指令是：「做订单列表，点进去看详情」。

Agent 常见生成：

1. 在 `pages/orders.tsx` 里直接 `fetch` + `as Order[]` + `useCallback` + 本地 `const mock = [...]`  
2. 把列表 `set` 进 Zustand  
3. 颜色写 `bg-[#00c692]`  
4. 真机用 HTTP IP 调，接口 404  

对应拦住：

| 步骤 | 谁拦 | 现象 |
|------|------|------|
| page 里 fetch / 深 import service | ESLint boundaries + pages 规则 | 保存即红 |
| `as Order[]` | ESLint 禁断言 | 过不了 lint |
| `useCallback` | Compiler / 编码规则 | error |
| 组件内 mock | Review +「Mock 不进 UI」约定；理想是 CI grep 或自定义规则 | 脚手架成熟后再加硬规则 |
| 列表进 Zustand | AGENTS + Review；可用自定义 ESLint 扫 `useXxxStore.getState` 附近的 query 数据（成本高，先约定） | 先靠黄金样本 `get-orders.ts` |
| 任意色 | Cursor 规则；严重了再禁 arbitrary value | 弱拦 |
| 真机 Mock 全失效 | mkcert HTTPS（环境层拦住，不是业务代码） | 开发服根本不给 HTTP 局域网 |
| 字段是 `order_no` 不是 `orderNo` | Zod.parse 运行时炸 | 列表进不了 UI |
| 把 msw 静态 import 进 `main.tsx` | 生产 build 体积门禁 / 动态 import 约定 | 主包变肥 |

人和 Agent 没有两套标准：**本地 lint 过了只代表结构；要过 Zod + 真机 HTTPS Mock，才叫这条链路在脚手架上闭环。**

---

## 六、我会主动讲的 trade-off（显得像做过，而不是背 ADR）

1. **规则越多，Agent 越对抗。** 只把「一错就会扩散」的做成 error：分层、禁 any/as、Compiler、apiFetch 必须带 Schema。审美和 token 放 soft。  
2. **Lint 不能替代运行时。** 类型逃逸用 ESLint 掐死，脏 JSON 只能 Zod。两边都做，是因为存量项目证明「只写 interface」等于没做。  
3. **Mock 正确性优先于 Mock 花哨。** 先同 Schema、同 URL、真机能跑；Chaos 面板、用户画像切换是下一阶段。  
4. **构建门禁用回归，不用虚荣指标。** 扫 lodash、扫 mock 进生产、typecheck；业务正确性留给单测。  
5. **守卫必须可复现。** 面试官问「AI 规则改了人没改怎么办」——答：CI 只认 `pnpm lint && pnpm typecheck && pnpm build`，不认 `.cursorrules` 是否被读过。

一句话收口：**Lint 拦放错地方和逃逸写法，类型拦「形状」在编译期和运行期对齐，Mock 拦「假开发路径」和契约漂移，构建拦「开发态依赖和体积漏进生产」。** 四层叠完，脚手架才从模板变成守卫；少任何一层，Agent 都能用另一种方式把垃圾送上线。
