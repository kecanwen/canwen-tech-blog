---
title: "中后台 AI 自动化 E2E 技术方案"
slug: schema-driven-b-end-ai-e2e
description: "中后台不该再做一个通用测试 Agent。用 PageContract 把 AI 压在推断数据和翻译断言两个窄口子上。"
tags:
  - AI-E2E
  - Playwright
  - Schema-Driven
rank: 5
featured: false
---

## 一句话定调

不要做“通用 AI 测试 Agent”，要做“**Schema 驱动的测试代码生成器 + 后端契约断言**“。B 端页面本质是一份配置（字段、组件、规则、联动），你的测试生成器的第一输入就应该是这份配置，而不是让 AI 去看截图、爬 DOM、猜流程。AI 只在两个窄口子上发力：**推断测试数据**和**翻译断言意图**。骨架、定位、断言真值，全部交给确定性代码和后端接口。页面一致性越强，这套方案的复用率越高、AI 自由度越低、系统越稳——这跟“让 AI 自由发挥”恰好相反。

## 整体架构：六层流水线

整条链路是一个单向管道，前四层是把“页面配置”变成“测试代码”，后两层管断言真值和长期维护。每一层都遵守同一个设计原则：**能用确定性代码做的绝不交给 AI**。

```plaintext
源码字段配置 / JSON Schema
        │
        ▼
[1] Extract   → 解析成标准化 PageContract(确定性,零 AI)
        │
        ▼
[2] Plan      → PageContract 映射到测试场景(固定模板,零 AI)
        │
        ▼
[3] Synthesize→ 证据包 → AI 推断测试数据(AI,严格约束)
        │
        ▼
[4] Render    → 渲染成你的内部测试库 DSL(确定性模板渲染)
        │
        ▼
[5] Assert    → 断言真值来自后端契约 waitForResponse(确定性优先)
        │
        ▼
[6] Heal + CI → 自愈 + 流水线(低维护)
```

关键认知：真正需要 AI 的只有第 3 层，第 4 层的“渲染”是纯模板替换（像 Handlebars），第 2 层的“规划”99% 是查表。把 AI 的作用域压到最小，是这套方案能稳的根本原因。

## 第 0 层（前置改造）：组件库注入 data-testid

这是整个方案里**性价比最高的一次性投资**，必须先做。在你的内部二次封装组件库层统一注入稳定的 `data-testid`——一次改造，全站所有页面受益。

```tsx
// 内部组件库:CustomInput 渲染时自动注入
<input data-testid={`field-${props.fieldName}`} />
// 表格行:tableLocator 依赖 data-row-index

// 操作按钮
<button data-testid={`action-${actionKey}-${rowIndex}`} />
```

做完这一步，定位就是确定性的，AI 几乎不需要「找元素」。这直接绕开了 Skyvern 那套「DOM 不可靠所以只能看视觉」的前提——你的 DOM 不但可靠，还能由你自己规定语义。**视觉模型每次吞截图、对坐标理解还差的成本，你完全不用付。** 这也是中后台相对 C 端野生页面最大的工程红利。

## 第 1 层：PageContract 提取器

把内部组件库那套字段配置，解析成一份与组件库解耦的标准化中间表示（IR）。这层是确定性的纯静态分析，不碰 AI。

输入是你那种 Zod 字段声明：

```ts
{
  component: 'CustomInput',
  fieldName: 'fieldCode',
  label: '字段 A',
  rules: z.string().min(1).max(20).regex(/^[A-Za-z0-9\-.*+\/%$]+$/),
  rulesBlur: z.string().superRefine(async (v, ctx) => {
    const r = await verifyFieldUniqueness('fieldCode', v)
    if (!r?.passed) ctx.addIssue({ code: 'custom', message: r.msg })
  }),
}
```

输出是稳定的 PageContract JSON——把校验规则结构化抽出来，这份契约才是后续所有环节的唯一权威输入：

```json
{
  "pageId": "field-mgmt",
  "search": {
    "fields": [
      { "key": "keyword", "type": "input", "label": "关键字" },
      { "key": "category", "type": "select", "source": "remote", "api": "/api/category" },
      { "key": "period", "type": "dateRange" }
    ]
  },
  "table": {
    "columns": [{ "key": "displayName", "type": "string" }],
    "rowActions": ["edit", "delete"],
    "api": { "list": "/api/field/list", "method": "POST" }
  },
  "form": {
    "fields": [
      {
        "key": "fieldCode",
        "type": "input",
        "required": true,
        "rules": { "minLen": 1, "maxLen": 20, "regex": "^[A-Za-z0-9\\-.*+/%$]+$" },
        "asyncRules": [{ "type": "uniqueness", "api": "verifyFieldUniqueness" }]
      }
    ],
    "api": { "create": "/api/field/create", "update": "/api/field/update" }
  }
}
```

实现上，因为字段配置是声明式的 JS 对象，优先用 **AST 解析（ts-morph / babel）** 静态抽取，把 Zod 链式调用 `.min().max().regex()` 翻译成结构化 rules。Zod 这种链式 schema 天然就是机器可读的，这是中后台能玩转 schema 驱动的前提——`.min/.max/.regex/superRefine` 直接就是边界用例的生成依据。

## 第 2 层：场景规划器（固定模板）

中后台交互单一，把它枚举成有限的几类参数化模板。这层是查表，不是 AI。三大核心动作 + 校验边界：

- **筛选查询**：填筛选项 → 点查询 → 断言列表返回数据符合筛选条件

- **新增**：打开表单 → 填字段 → 提交 → 断言创建接口成功 + 列表出现新行

- **编辑**：选行 → 改值 → 保存 → 断言更新接口成功 + 对应行值已变

- **校验边界**：对每个字段的每条 rule，自动派生用例（必填留空、超 maxLen、regex 非法、唯一性冲突）

校验用例完全可以从 PageContract 的 rules **确定性派生**，不需要 AI。例如 `{ minLen:1, maxLen:20, regex }` 直接产出四个用例：空值应报“请输入”、21 字符应报“最多 20 个字符”、含非法字符应报“格式不符合要求”、重复值应触发唯一性校验失败。

## 第 3 层：测试数据推断（唯一真正用 AI 的地方）

这是全链路唯一需要 AI 的环节，而且必须严格约束。**测试数据绝不写死**，推断优先级严格按三级降级：

1. **页面当前运行时表格里的真实数据**（最高优先级——表里已经躺着合法业务数据）

2. **页面代码里的字段规则 / 联动 / 数据流**（次优先级）

3. **AI 推断**（兜底，且必须在前两者约束下进行）

给 AI 的不是大段源码让它自己悟，而是一个结构化“**证据包**“。一个字段一个证据包，信息密度高、可解释性强、命中率远高于裸喂源码：

```json
{
  "field": "amount",
  "rules": { "type": "number", "min": 0, "max": 99999, "required": true },
  "runtimeValues": [120, 350, 80],
  "dependencies": [
    { "expr": "amount > minAmount", "ref": "minAmount", "refRuntimeValue": 50 }
  ],
  "codeEvidence": "z.number().min(0).max(99999)",
  "task": "生成一个合法值和一组边界值,合法值优先复用 runtimeValues 的分布"
}
```

复杂联动校验（A 必须大于 B、A 有值则 B 必填、多字段组合校验）给 AI 的是**结构化规则 + 局部源码证据 + 运行时数据**这个三件套，而不是整页源码。前者命中率和可解释性都明显更高。

AI 的输出必须经过 **schema 校验门禁**：推断出的数据先用同一份 Zod rules 本地跑一遍，不通过就打回重推，绝不落盘。这一步把 AI 的幻觉挡在测试代码之外。

## 第 4 层：代码渲染（模板替换，零 AI）

把“场景模板 + 推断数据”渲染成你已有的内部测试库 DSL。这是纯字符串模板替换，不让 AI 写代码——因为让写代码的 LLM 再去写断言，正是后面要讲的“虚假信心”陷阱的根源。

```typescript
// 渲染产物:复用你已有的 searchLocator/tableLocator/formActions
test('列表查询-关键字+分类+时间段', async ({
  page, tableLocator, searchLocator, formActions, selectActions, datePickerActions,
}) => {
  const search = searchLocator.createSearchArea(TABLE_ID)
  const table = tableLocator.createTable(TABLE_ID)

  await formActions.fillInput(search.getInput('keyword'), '示例关键字')
  await datePickerActions.setDate(search.getField('period', 'custom-period'), '202601')
  await selectActions.selectFromTableByIndex(search.getSelect('category'), 1)

  // —— 断言真值来自后端契约,不是看表格 ——
  const [resp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/field/list') && r.status() === 200),
    search.getQueryButton().click(),
  ])
  const body = await resp.json()
  expect(body.data.length).toBeGreaterThan(0)
  // 断言返回数据确实符合筛选条件
  expect(body.data.every(r => r.keyword?.includes('示例关键字'))).toBe(true)
})
```

## 第 5 层：断言策略（后端契约优先，这是防“假绿”的命门）

这一层决定了你的测试到底有没有用。当前 AI E2E 最大的坑不是脆弱，而是**虚假信心**：测试全绿、CI 放行，上线被生产边界打穿。根因是 AI 倾向于“看着实现写断言”，生成的全是 `expect(x).toBeDefined()` 这种对任何返回值都成立的废断言。有团队真实翻车过——语法正确、跑得通，但断言的是错误的属性。学术界把这叫 oracle problem:LLM 自动生成断言而不加保障，会产出大量 false positive，反而拉低整个测试的可信度。

落到你的方案，断言真值的来源优先级是：

1. **后端接口响应（最高）**：筛选/新增/编辑提交后，用 `waitForResponse` 抓接口响应，断言返回的**结构化数据**符合预期。这是确定性的，不依赖 AI 也不依赖视觉。

2. **DOM 结构化断言**：元素数量、行数、特定单元格文本、`getBoundingClientRect` 坐标范围。

3. **视觉/语义断言（兜底）**：只有纯布局正确性、富文本展示这类无法结构化的，才动用 `aiAssert` 或 LLM 当裁判。

铁律，写进 lint 规则强制执行：

- **禁止空断言**：`toBeDefined()` / `not.toBeNull()` / `toBeTruthy()` 这类一律禁掉，CI 直接拦。

- **禁止自验证**：写测试数据的 AI 和定义断言真值的逻辑必须分离。断言真值来自后端契约或确定性派生，不让 LLM“看一眼表格说看起来对”。

- **断言必须能被错误实现证伪**：一条断言如果被一个“错误但凑巧的实现”也能满足，它就是废的。

## 第 6 层：自愈 + CI

因为第 0 层已经注入了语义化 `data-testid`、内部测试库又用 `TABLE_ID` 驱动定位，你的**自愈需求本来就很低**——大部分 UI 改动不会动到这些稳定锚点。在此基础上：

- **自愈走 source-level**：要的是把修复**永久写回仓库的测试定义**，而不是运行时打补丁让 CI 临时变绿、代码却还坏着。后者是技术债。

- **缓存提速**：如果引入 Midscene 做兜底视觉断言，开启它的任务缓存——首次 AI 推理，之后走缓存，既降本又降低非确定性。

- **CI 集成**：测试以标准 `.spec.ts` 形态存在，能读能改，即使将来不用这套生成器，测试照样活在 CI 里。PR 触发增量生成 + 全量回归。

## 工具选型（直接结论）

| 角色 | 选型 | 理由 |
| --- | --- | --- |
| 测试运行器 | Playwright（你已有） | 不动现有设施 |
| 测试代码形态 | 你的内部测试库 DSL | 复用 searchLocator/tableLocator/formActions |
| AI 编排 | Claude/GPT API，或参考 Playwright Test Agents 的 Planner/Generator/Healer 分工 | 官方三件套生成标准可改代码，理念契合 |
| 定位增强 | 组件库注入 data-testid | 一次投资全站受益，自愈需求趋零 |
| 视觉兜底 | Midscene（可选，补充层） | 仅做疑难视觉断言，不做主干 |
| **不要用** | browser-use / Skyvern 当回归主力 | 强项（应对未知野生页面）你用不上，弱项（每步推理成本、非确定性）正好是回归大忌 |

## 分阶段落地路线

按风险从低到高推进，每一阶段都能独立产出价值，不必一步到位。

- **Phase 0 — 地基（1~2 周）**：组件库注入 `data-testid`；打通字段配置的可导出/可静态解析。这步不做，后面全是空中楼阁。

- **Phase 1 — 查询模板（最安全，只读）**:PageContract 提取器 + 筛选查询模板 + `waitForResponse` 断言。只读操作零副作用，最适合先跑通全链路。

- **Phase 2 — 增删改 + 证据包**：接入运行时表格数据，实现证据包驱动的数据推断，落地新增/编辑模板。这里开始引入 AI，务必带 schema 校验门禁。

- **Phase 3 — 校验边界用例**：从 Zod rules 确定性派生必填/超长/格式/唯一性用例。覆盖率提升最快的一步。

- **Phase 4 — CI + 自愈**：接入流水线，PR 增量生成 + 全量回归，加上 source-level 自愈。

## 反模式清单（踩了必翻车）

- ❌ 把整页源码丢给 LLM 让它“自由发挥”生成测试 → ✅ 喂结构化证据包

- ❌ 测试数据写死 → ✅ 运行时真实数据 → 规则 → AI 推断的三级降级

- ❌ 让写代码的 AI 顺手写断言 → ✅ 断言真值来自后端契约

- ❌ `toBeDefined()` 类空断言 → ✅ lint 强制结构化断言

- ❌ 用纯视觉 Agent 跑回归 → ✅ DOM 派 + 语义定位

- ❌ 运行时打补丁式自愈 → ✅ source-level 修复写回仓库

---

**收口：** 这套方案的全部赌注押在一个判断上——中后台的“一致性”不是让 AI 更容易看懂页面，而是让你能用确定性的模板和契约，把 AI 死死按在“推数据、翻译断言”这两件它真正擅长的事上。AI 作用域越小，系统越稳。现在没有“零人工”的银弹，但你这个场景，恰好是把人工降到最低的最佳土壤。Phase 0 的组件库改造是地基，先把它砸实，后面每一层都会顺。
