---
title: "升维设计：AI-Native 前端工程体系 2.0"
slug: ai-native-frontend-architecture-v2
description: "生成是概率的，交付要确定。决策预解决、模板契约和置信度升级，用来消掉模型需要当场猜测的地方。"
tags:
  - AI-Native
  - Frontend-Architecture
  - MCP
rank: 3
featured: false
date: "2026-06-15"
---

# 升维设计：AI-Native 前端工程体系 2.0

> 面向前端开发者的 AI-Native 工程体系完整设计方案
> 日期：2026-06-15

---

## 核心矛盾

AI 生成是**概率性的**（每次生成可能不同），但工程交付需要**确定性的**（零非业务 bug、可预测的产出）。传统方案试图让 AI 更"聪明"，这是错的——正确方向是：**消除 AI 需要做决策的场景。当只有一种正确做法时，AI 不会犯错。**

---

## 五大设计原则

| # | 原则 | 含义 |
|---|------|------|
| 1 | **决策预解决 (Decision Pre-resolution)** | 所有歧义在代码生成前解决，而非生成时让 AI 猜测 |
| 2 | **约定即代码 (Convention as Code)** | 任何"按规定应该这样做"都编码为可执行的规则/模板 |
| 3 | **契约驱动 (Contract-Driven)** | 每一层有可自动验证的契约（类型、Schema、截图基线、测试用例） |
| 4 | **置信度升级 (Confidence Escalation)** | 每个 AI 动作附带置信度分数，低于阈值自动升级给人 |
| 5 | **左移验证 (Shift-Left Verification)** | 越早发现的问题修复成本越低，在生成阶段就验证 |

---

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP 基建层（贯穿所有阶段）                    │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ Lanhu MCP    │  │ Chrome DevTools  │  │ Apifox MCP    │  │
│  │ 设计稿提取    │  │ MCP 截图/审计    │  │ 接口契约同步   │  │
│  │ 设计Token    │  │ Console监控      │  │ 字段映射      │  │
│  └──────────────┘  └──────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   阶段 0：决策预解决                            │
│  PRD + Lanhu 设计稿 → AI 生成问题清单                         │
│  → 人工回答 → Spec Lock 文件锁定（含设计Token）                │
│  所有歧义在此阶段消除，AI 后续只需填模板                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   阶段 1：模板化代码生成                         │
│  参数化模板 + Lanhu 设计Token 注入 + Zod 校验 → 确定性产出     │
│  不是"生成代码"，而是"按设计稿填充模板"                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          阶段 2：分层验证（每层独立可验证）                      │
│  L0 TSC → L1 Vitest → L2 组件 → L3 API → L4 Playwright      │
│  L5 视觉验证（Chrome MCP 截图 + Lanhu 设计稿对比）             │
│  L6 运行时验证（Chrome MCP Console/Network/Performance）      │
│  一层失败就不往下走，快速反馈                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          阶段 3：置信度评估 & 自动回滚                          │
│  合并所有 MCP 采集数据计算置信度 → < 阈值 → 自动回滚 + 报告   │
└─────────────────────────────────────────────────────────────┘
```

---

## MCP 基建层详解

整个体系依赖三个 MCP 工具，贯穿所有阶段：

### Lanhu MCP — 设计稿对接桥梁

```
Lanhu MCP 能力                                 在流程中如何使用
──────────────────────────────────────────────────────────────────
提取页面设计稿JSON       →    阶段0: 自动解析组件布局、间距、颜色
提取设计Token/变量       →    阶段1: 注入模板，代码自动使用正确变量
获取设计稿截图           →    阶段2: 作为视觉验证基线图（baseline）
查询设计组件规范         →    阶段0: 问题清单自动预填设计属性
```

**Lanhu MCP 典型调用**（在 `/new-page` 命令中自动触发）：

```bash
# 思路：/new-page 时传入 lanhu-id，AI 自动拉取设计稿信息
lanhu-mcp get-page-spec --id "lanhu_page_xxx"
# 返回设计稿中的：
# - 页面布局结构（组件位置、间距）
# - 设计 Token（主色、字体大小、圆角）
# - 组件列表（Button、Table、Input 等）
```

### Chrome DevTools MCP — 浏览器运行时检测

```
Chrome MCP 能力                                在流程中如何使用
──────────────────────────────────────────────────────────────────
页面截图                →    阶段2: L5 视觉验证，多分辨率截图
Console 消息获取         →    阶段2: L6 运行时错误检测
网络请求监控             →    阶段2: L6 API 请求/响应校验
Lighthouse 审计          →    阶段2: 性能基线（CLS/LCP/INP）
DOM 元素选择器验证       →    阶段2: 确认组件渲染正确
Performance Trace       →    阶段3: 性能回归检测
```

**Chrome MCP 多分辨率截图流程**（依据拷问中确认的两种分辨率）：

```bash
# 1920×1080 桌面全屏
chrome-mcp resize 1920 1080
chrome-mcp screenshot → docs/ui/user-list/actual-1920.png

# 1166×500 窄窗口（表格列数临界点）
chrome-mcp resize 1166 500
chrome-mcp screenshot → docs/ui/user-list/actual-1166.png
```

### 三个 MCP 在流程中的协作时序

```
                        时间线 →
Lanhu MCP  ───────┬─────────────────────────────────────────
                   │ 阶段0: 拉设计稿    阶段2: 提供基线图
                   │     ↓                    ↓
Chrome MCP  ───────┼─────────────────────────────────────────
                   │                    阶段2: 截图/审计
                   │    阶段1: 注入Token      ↓
Apifox MCP  ───────┼─────────────────────────────────────────
                   │ 阶段0: 拉接口定义   阶段2: 校验响应
                   │     ↓                    ↓
执行阶段     [决策预解决] → [代码生成] → [分层验证] → [置信度评估]
```

---

## 具体设计

### 1. 决策预解决系统

**核心思路**：写代码前，AI 先读 PRD + Lanhu MCP 拉设计稿，生成一份**问题清单**，人回答完锁定成 Spec Lock 文件，之后 AI 只有"执行"没有"决策"。

**工作流**：

```
① AI 读取 PRD
② AI 调用 Lanhu MCP → 拉取设计稿组件布局、设计Token、页面尺寸
③ AI 自动交叉分析 PRD 描述与设计稿 → 生成问题清单
④ 人回答问题，确认后锁定
⑤ 生成 Spec Lock 文件（含设计Token，后续阶段不需要再看设计稿）
```

**Spec Lock 文件 (`docs/spec-lock/[feature].yaml`) 结构**：

```yaml
# 由 AI 自动生成，人确认后锁定
feature: 用户管理
route: /user/list

# ============================================
# ★ 新增：Lanhu MCP 自动提取的设计规格
# ============================================
design_spec:
  lanhu_page_id: "lanhu_page_xxx"
  resolution: [1920, 1080]          # 设计稿分辨率
  design_tokens:
    primary_color: "#1890ff"
    font_size_base: "14px"
    border_radius: "4px"
    spacing: "16px"
  components_layout:                # 从设计稿提取的组件布局
    - type: SearchForm
      rect: [24, 24, 1872, 120]     # [x, y, width, height]
    - type: DataTable
      rect: [24, 168, 1872, 600]
    - type: ActionModal
      rect: "centered, 520×400"

# 字段映射：UI 名 → API 字段名 → 类型
field_mappings:
  - ui_label: "用户名"
    api_field: "userName"
    type: string
    component: Input
  - ui_label: "状态"
    api_field: "status"
    type: enum
    component: Select
    enum_values: ["active", "disabled", "pending"]

# 组件决策：每个区域用什么组件
components:
  search_area: SearchForm    # 标准搜索表单
  table: DataTable           # 标准表格
  action: ActionModal        # 弹窗操作

# 验收标准（可执行的）
acceptance:
  - "搜索后分页重置到第一页"    # → AI 生成对应测试
  - "禁用需要二次确认"          # → AI 生成对应测试
  - "空列表显示 Empty 组件"     # → AI 生成对应测试

# API 契约
api_contracts:
  - id: user_list_001
    method: GET
    path: /api/users
    response_schema: ApiResponse<PageResult<UserItem>>
```

**工作流问题列表（AI 结合 PRD + Lanhu 设计稿自动生成）**：

```
AI 读取 PRD + Lanhu 设计稿后，自动生成这些问题让人回答：

❓ 搜索区域
  - 用户名搜索是模糊匹配还是精确匹配？ → 模糊
  - 状态下拉是否有"全部"选项？ → 是
  - [Lanhu] 搜索区域的高度和间距是否按设计稿？ → 是

❓ 表格
  - 是否支持多选？ → 否
  - 是否支持排序？ → 否
  - [Lanhu] 表格列宽是否严格对齐设计稿？ → 是

❓ 操作
  - 禁用操作是否需要填写原因？ → 否
  - 编辑弹窗是 Modal 还是 Drawer？ → Modal
  - [Lanhu] Modal 尺寸是否按设计稿 520×400？ → 是

❓ 设计 Token
  - [Lanhu] 主题色使用设计稿 #1890ff？ → 是
  - [Lanhu] 圆角使用 4px？ → 是

❓ 异常
  - 接口超时是否显示重试按钮？ → 是
  - 网络断开是否有独立提示？ → 否
```

**收益**：人只需要回答一次问题，AI 不再需要在生成时猜测。问答过程本身就是需求澄清。

---

### 2. 模板化代码生成（确保代码一致性）

**核心思路**：不是让 AI 每次从头生成代码，而是维护一套**参数化模板**，AI 只负责填充参数。模板中注入 Lanhu 提取的**设计 Token**，确保 UI 还原度。

**模板目录结构**：

```
_templates/
├── search-table/          # 搜索-表格页面模板
│   ├── schema.ts          # Zod 参数校验
│   ├── index.vue.ts       # EJS/HBS 模板
│   ├── composable.ts.ts
│   ├── SearchForm.vue.ts
│   ├── DataTable.vue.ts
│   └── ActionModal.vue.ts
├── form-page/             # 纯表单页面模板
├── detail-page/           # 详情页面模板
└── modal/                 # 弹窗模板
    └── confirm-modal.vue.ts
```

**模板参数 Schema（Zod 校验，含 Lanhu 设计Token）**：

```typescript
// _templates/search-table/schema.ts
import { z } from 'zod'

// Lanhu MCP 提取的设计 Token
const DesignTokensSchema = z.object({
  primaryColor: z.string(),        // 主色，如 "#1890ff"
  fontSizeBase: z.string(),        // 基础字号，如 "14px"
  borderRadius: z.string(),        // 圆角，如 "4px"
  spacing: z.string(),             // 间距，如 "16px"
})

export const SearchTableSchema = z.object({
  domain: z.string(),           // 业务域: user, order
  pageName: z.string(),         // 页面名
  designTokens: DesignTokensSchema.optional(), // ★ Lanhu 注入的设计 Token
  searchFields: z.array(z.object({
    label: z.string(),
    apiField: z.string(),
    component: z.enum(['Input', 'Select', 'DatePicker', 'RangePicker']),
    enumValues: z.record(z.string(), z.string()).optional(),
  })),
  tableColumns: z.array(z.object({
    title: z.string(),
    dataIndex: z.string(),
    width: z.number().optional(),
    render: z.enum(['text', 'tag', 'link', 'image']).optional(),
  })),
  operations: z.array(z.enum(['view', 'edit', 'disable', 'delete'])),
  apiEndpoint: z.string(),
  apiMethod: z.enum(['GET', 'POST']),
})
```

**`/new-page` 命令行为变更**：
1. 读取 Spec Lock 文件（或现场问答填充 Schema）
2. Zod 校验参数完整性
3. 用模板引擎渲染每个文件
4. 输出到 `src/pages/[domain]/`
5. **不需要 AI 做任何样式/结构决策**

---

### 3. API 契约层 & 字段映射注册表

**字段映射注册表**：

```
docs/field-mappings/
├── user.yaml        # 用户域字段映射
├── order.yaml       # 订单域字段映射
└── product.yaml     # 产品域字段映射
```

```yaml
# docs/field-mappings/user.yaml
# 由 /new-service 自动维护，人工修正
mappings:
  - ui: "用户名"
    api: "userName"
    prd: "用户名"
    type: "string"
  - ui: "状态"
    api: "status"
    prd: "状态"
    type: "enum"
    values:
      active: "正常"
      disabled: "禁用"
      pending: "待审核"
```

**收益**：
- `/new-service` 生成 api.ts 时自动写入映射
- PRD 引用 UI 名 → 自动解析为 API 字段
- 接口字段变更 → 映射表标记过期 → 人工确认后自动更新

**运行时 API 契约校验（Zodios 或类似方案）**：

```typescript
// services/user/api.ts
import { z } from 'zod'

// 运行时 Schema（与 types.ts 同步）
export const UserListResponse = z.object({
  code: z.number(),
  data: z.object({
    list: z.array(UserItemSchema),
    total: z.number(),
  }),
  message: z.string().optional(),
})

// API 函数：请求 + 运行时校验
export async function getUserList(params: UserListParams) {
  const res = await request.get('/api/users', { params })
  const parsed = UserListResponse.parse(res) // 运行时校验
  return parsed.data
}
```

**收益**：后端改了字段类型但语义没改（如 status 从 `1|2` 变 `a|b|c`），**运行时 Zod 校验直接抛错**，比 TSC 更早发现问题。

---

### 4. 置信度评估系统

**置信度计算器**（集成了 Lanhu MCP + Chrome MCP 的数据源）：

```typescript
// scripts/confidence-score.ts
interface ConfidenceReport {
  overall: number  // 0-100
  checks: {
    // === 静态校验（代码层面） ===
    typeCheck: { passed: boolean; score: number }           // TSC 通过 → 20分
    unitTests: { passed: boolean; score: number }           // Vitest 通过 → 15分
    schemaValidation: { passed: boolean; score: number }    // Zod 校验通过 → 15分

    // === Chrome MCP 运行时校验 ===
    consoleErrors: { passed: boolean; score: number }       // Console 无报错 → 10分
    networkErrors: { passed: boolean; score: number }       // API 请求无 4xx/5xx → 5分

    // === Lanhu MCP + Chrome MCP 视觉校验 ===
    visualDiff: {
      score: number                                        // 像素差异率 → 10分
      baseline: string                                     // Lanhu 设计稿路径
      screenshots: {                                       // Chrome MCP 截图
        '1920x1080': string
        '1166x500': string
      }
      diffRate: number                                     // 差异百分比
    }

    // === Chrome MCP 性能基线 ===
    performance: {
      score: number                                        // Lighthouse 分数 → 5分
      metrics: {
        lcp: number                                        // Largest Contentful Paint
        inp: number                                        // Interaction to Next Paint
        cls: number                                        // Cumulative Layout Shift
      }
    }

    e2eTests: { passed: boolean; score: number }           // Playwright 通过 → 10分
  }
  threshold: number  // 默认 80
  escalated: boolean  // overall < threshold
}
```

**置信度运行流程**（含 MCP 调用）：

```
1. pnpm tsc --noEmit                          ← 代码层面
2. pnpm vitest run                            ← 逻辑层面
3. Chrome MCP: list_console_messages          ← 运行时错误
4. Chrome MCP: list_network_requests           ← 网络异常
5. Chrome MCP: take_screenshot 1920x1080      ← 截图
6. Chrome MCP: take_screenshot 1166x500
7. pixelmatch(actual, lanhu_baseline)          ← 视觉差异
8. Chrome MCP: lighthouse_audit               ← 性能基线
9. pnpm playwright test                        ← E2E
10. 汇总所有分项，计算置信度
```

**各操作置信度阈值**：

| 操作 | 阈值 | 低于阈值行为 |
|------|------|-------------|
| `/new-page` | 90 | 不允许合并，人工审查 |
| `/bug` | 95 | 自动回滚 + 标记 |
| `/optimize` | 80 | 生成 PR 但不自动合并 |
| `/new-service` | 95 | 不允许合并 |
| `/e2e` | 70 | 只是骨架，可接受 |

**`/bug` 安全网机制**：

```
1. 用户执行 /bug
2. AI 分析 → 生成修复方案 + 置信度分数
3. 自动创建 git stash（当前工作区快照）
4. 应用修复
5. 运行 tsc --noEmit → Vitest → Playwright (影响范围)
6. 计算置信度分数
7. 如果置信度 < 95：
   - git stash pop（回滚）
   - 输出修复方案 + 失败报告
   - 标记为"需要人工介入"
8. 如果置信度 ≥ 95：
   - 保留修复
   - 输出报告
```

---

### 5. 测试分层边界

| 层级 | 工具 | 覆盖范围 | 运行时机 | 速度 |
|------|------|---------|---------|------|
| **L0: 类型** | `tsc --noEmit` | 所有 TS 文件 | 每次保存 / pre-commit | ~5s |
| **L1: 单元** | Vitest | composables, utils, types 的纯逻辑 | pre-commit | ~10s |
| **L2: 组件** | Vitest + @vue/test-utils | 组件 Props/Emit/Slots 行为 | pre-commit | ~20s |
| **L3: API** | Vitest + MSW | API 请求/响应/错误处理 | CI | ~30s |
| **L4: E2E** | Playwright | 完整用户流程 | CI (MR) | ~3min |
| **L5: 视觉** | Chrome MCP + Lanhu MCP | 设计稿 vs 实际截图对比 | CI (MR) | ~1min |
| **L6: 运行时** | Chrome MCP | Console错误/Network/Performance | CI (MR) | ~30s |

**具体分工**：

```
useTable composable → L1 单元测试（不需要 DOM）
  - search 函数是否重置分页
  - refresh 是否携带上次参数
  - reset 是否清空状态
  - 竞态场景：两次快速调用，只保留最后一次结果

SearchForm.vue → L2 组件测试（需要挂载组件）
  - 表单字段渲染是否正确
  - emit('search', values) 是否在提交时触发
  - 重置按钮是否清空所有字段

用户管理完整流程 → L4 E2E（需要浏览器）
  - 登录 → 进入用户列表 → 搜索 → 查看详情 → 返回
  - 新建用户 → 填写表单 → 提交 → 列表出现新数据

用户管理页面 → L5 视觉验证（Chrome MCP 截图 + Lanhu 基线图）
  - Chrome MCP 截图 1920×1080 → pixelmatch(Lanhu 设计稿基线)
  - Chrome MCP 截图 1166×500 → pixelmatch(Lanhu 设计稿基线)
  - 差异率 > 1% → 视觉验证失败 → 生成 diff 标记图

页面操作 → L6 运行时验证（Chrome MCP 监控）
  - Console 无 error/warning 级别消息
  - 所有 API 请求无 4xx/5xx 响应
  - Lighthouse: LCP < 2.5s, CLS < 0.1, INP < 200ms
```

---

### 6. useTable 升级（防竞态 + 批量选择）

```typescript
export function useTable<TParams extends object, TItem>(
  fetcher: (params: TParams & PaginationParams, signal?: AbortSignal) => Promise<PageResult<TItem>>
) {
  // ... 原有逻辑 ...

  // 1. 请求竞态处理
  let abortController: AbortController | null = null
  async function load() {
    abortController?.abort()              // 取消上一次请求
    abortController = new AbortController()
    loading.value = true
    try {
      const res = await fetcher({ ...lastParams, ...pagination }, abortController.signal)
      list.value = res.list
      pagination.total = res.total
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      throw e  // 真实错误继续抛
    } finally {
      loading.value = false
    }
  }

  // 2. 批量选择（内嵌 useSelection）
  const selectedKeys = ref<(string | number)[]>([])
  const selectedRows = computed(() =>
    list.value.filter(item => selectedKeys.value.includes(item.id))
  )
  function toggleSelect(key: string | number) { /* ... */ }
  function clearSelection() { selectedKeys.value = [] }

  // 3. URL Query 同步（可选）
  function syncWithUrl() {
    const route = useRoute()
    const router = useRouter()
    watch(pagination, () => {
      router.replace({ query: { ...route.query, page: pagination.current, pageSize: pagination.pageSize } })
    })
  }

  return {
    list, loading, pagination,
    search, refresh, reset,
    selectedKeys, selectedRows, toggleSelect, clearSelection,
    syncWithUrl,
  }
}
```

---

### 7. XMind → Playwright 的工程化方案

**问题**：XMind 导出 Markdown 格式不稳定。

**方案**：不依赖 XMind 导出格式，而是定义**中间 DSL（领域特定语言）**。

```yaml
# e2e/plans/user-management.yaml（测试同学直接写或工具生成）
suites:
  - name: "用户管理 / 列表页"
    tests:
      - name: "能正常加载"
        steps:
          - action: goto
            url: "/user/list"
          - action: waitForVisible
            selector: ".ant-table"
        assertions:
          - ".ant-empty" 不存在  # 有数据
          - 分页组件可见

      - name: "搜索有效"
        steps:
          - action: fill
            selector: "[data-testid=search-input]"
            value: "张三"
          - action: click
            selector: "[data-testid=search-button]"
        assertions:
          - 表格中每一行都包含 "张三"
```

**实现**：

```
e2e/plans/*.yaml  →  AI 解析  →  Playwright spec 生成
     ↑                      ↓
测试同学维护              e2e/generated/*.spec.ts
（或 XMind 转 YAML）     （CI 运行）
```

**收益**：
- 格式稳定（YAML schema 校验）
- 可读性强（非工程师也能写）
- AI 生成断言准确（字段名、选择器、预期值都已定义）

---

### 8. 更新后的项目结构

只列出新增/变更的部分：

```
project/
├── docs/
│   ├── spec-lock/              ★ 新增：决策锁定文件
│   │   └── [feature].yaml
│   ├── field-mappings/         ★ 新增：字段映射注册表
│   │   └── [domain].yaml
│   ├── design-tokens/          ★ 新增：Lanhu MCP 提取的设计 Token
│   │   └── global.yaml         # 全局设计 Token（颜色、字体、间距）
│   ├── ui/
│   │   └── [page]/
│   │       ├── baseline-1920.png   ★ Lanhu 设计稿基线（1920×1080）
│   │       ├── baseline-1166.png   ★ Lanhu 设计稿基线（1166×500）
│   │       ├── actual-1920.png     ★ Chrome MCP 自动截图
│   │       ├── actual-1166.png     ★ Chrome MCP 自动截图
│   │       └── diff.png            ★ pixelmatch 差异图
│   └── qa-questions/           ★ 新增：AI 问题缓存（避免重复问）
│       └── [feature].md
│
├── _templates/                 ★ 新增：参数化代码模板
│   └── search-table/
│       ├── schema.ts           # Zod Schema（含 designTokens 字段）
│       ├── index.vue.ts
│       ├── composable.ts.ts
│       └── ...
│
├── scripts/
│   ├── confidence-score.ts     ★ 新增：置信度评估（含 MCP 数据源）
│   ├── ui-diff.ts              ★ 升级：Chrome MCP + Lanhu MCP 联动
│   ├── gen-service.ts
│   └── gen-testcase.ts
│
├── e2e/
│   ├── plans/                  ★ 新增：YAML 测试计划
│   │   └── user-management.yaml
│   └── generated/              ★ 新增：自动生成的 spec
│
├── src/
│   └── composables/
│       ├── useTable.ts         ← 升级：AbortController + 选择 + URL同步
│       └── useConfidence.ts    ★ 新增：置信度 HUD（开发时显示）
```

---

## 实施路线图

### Phase 1（基础设施）
1. 搭建 `_templates/` 目录 + `/new-page` 命令（参数化模板 + Zod Schema + 设计Token注入）
2. 实现 `docs/field-mappings/` 字段映射注册表
3. 升级 `useTable`（AbortController + 批量选择）
4. **配置 Lanhu MCP + Chrome MCP 接入**（MCP server 注册、设计Token提取脚本、截图脚本）

### Phase 2（质量体系）
5. 实现 `scripts/confidence-score.ts` 置信度评估（含 Chrome MCP 运行时数据 + Lanhu 视觉数据）
6. 实现 `/bug` 安全网（自动快照 → 修复 → 验证 → 回滚）
7. 搭建测试分层（L0-L6）和运行配置，新增 L5 视觉验证 + L6 运行时验证

### Phase 3（高级自动化）
8. 实现 Spec Lock 系统（PRD → Lanhu 设计稿 → 问题清单 → 锁定）
9. 实现 `scripts/ui-diff.ts`（Chrome MCP 截图 → pixelmatch 对比 Lanhu 基线图）
10. 实现 XMind → YAML → Playwright 转化链路
11. **Lanhu MCP + Chrome MCP 全链路打通**：设计稿 → 代码生成 → 截图验证 → 置信度评估

---

## 验证方式

1. **Phase 1**: 跑 `/new-page user/list` 生成完整页面 → `pnpm tsc --noEmit` 通过
2. **Phase 2**: 故意引入一个 bug → 跑 `/bug` → 验证自动回滚
3. **Phase 3**: 写一份 YAML 测试计划 → 跑生成 → 跑 E2E → 验证测试通过
