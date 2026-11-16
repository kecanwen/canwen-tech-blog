---
title: "明确治理意图的体系化 CSS 设计"
slug: css-governance-by-intent
description: "分层目录只是骨架。CSS 治理要写清每种样式的合法位置、Token 语义和能阻断的规则。"
tags:
  - CSS
  - Frontend-Architecture
rank: 26
featured: false
date: "2022-12-08"
---

# 明确治理意图的体系化 CSS 设计

## 先说结论

一份常见的 CSS 分层方案，往往已经有可落地治理框架的 80% 骨架。这些判断通常是对的：

- **分层思路对**：把 reset / token / base / vendor / pattern / utility 拆开，天然就能解决“样式乱飞”
- **把第三方覆写集中管理**，这是治理成败的关键
- **把 Token 提升为唯一真相来源**，这是后续主题化、统一改版、减少硬编码的基础
- **强调样式所有权边界**，这是比“目录结构漂亮”更重要的东西

但如果按能执行、能守住的标准看：

> 它现在更像「分层目录设计」，还差一步才能变成可执行、可治理、能演进的 CSS 规则系统。

**结构有了，但规则还不够硬。** 下面这些点，是执行时最容易失控的地方。

---

## 这套方案里最值得肯定的部分

### 1）这套方案抓住了治理核心：不是“怎么写样式”，而是“样式该写在哪里”

这点非常重要。很多项目 CSS 治理失败，不是因为没用 Less、没用 BEM、没用 CSS Modules，而是：

- 任何地方都能改任何样式
- 没有“合法位置”概念
- 最终所有人都在做局部最优

方案里提出：

> **让每种样式只有一个合法的存在位置**

这句话本身就是对的，而且比“统一规范”更高级。因为它是在**定义所有权**。

### 2）Vendors 单独成层，是非常正确的

这往往是后台项目最容易炸的地方。

如果 Ant Design 的覆写散落在：

- 页面 .vue
- 组件局部 scoped
- 某些公共 less
- 某些主题文件

那最后一定会出现：

- 优先级战争
- 组件升级后不敢动
- 一处改按钮，十处受伤

所以把 Vendor 单独拉出来，是对的。但这里我后面会强调一点：

> **Vendor 层不是“覆写收纳盒”，而应该是“受控适配层”**

否则后期还是会变成垃圾堆。

### 3）Pattern 层的引入，说明目标不是只做“原子类治理”

这也很好。很多团队治理 CSS，最后会陷入两个极端：

- **极端 A：全局样式一锅炖** —— 所有公共样式都扔 `global.less`
- **极端 B：原子类宗教化** —— 所有问题都靠 `.mt8 .flex .text-gray .w100`

这套 Pattern 层，其实是在表达：

- 有些样式不是“单点工具”
- 有些样式是“业务场景反复出现的组合模式”

比如：
- 表格操作区
- 表单底部操作区
- 状态 badge
- 页面容器布局

这些都应该进入 Pattern，而不是沦为各页面复制粘贴。这个认知是成熟的。

---

## 但我现在会开始“挑刺”了：下面这些问题不解决，方案执行时会失真

---

### 问题 1：目前定义了“层”，但还没有定义“样式所有权判定规则”

这是第一优先级问题。

目前只说了：
- 第三方覆写放 vendors
- 跨页面复用放 patterns
- 工具类放 utilities
- 基础样式放 base

但实际开发时，大家一定会碰到这种问题：

**例子 1**
“这个页面里有一个特殊的 a-table，列间距要变一下，这算 vendor 还是页面样式？”

**例子 2**
“这个 badge 只在商品页面用了两次，但未来可能别的页面也会用，先放页面里还是抽 patterns？”

**例子 3**
“这个 .search-form 是页面局部结构，还是 layout pattern？”

如果没有明确判定规则，最后所有层都会被污染。

#### 补一张「所有权决策表」

这个比目录更重要。比如：

| 样式类型 | 合法位置 | 判断标准 |
|----------|----------|----------|
| 浏览器默认抹平 | reset | 仅元素默认行为归一化 |
| 全局裸标签样式 | base | 不带业务语义，只定义全局基础表现 |
| 设计变量 | tokens | 不输出具体业务样式，只定义值 |
| 第三方库全局覆盖 | vendors | 直接作用于 antd / surely-vue 类名 |
| 跨页面复用语义模式 | patterns | 至少在 2 个独立页面/模块复用，且具语义 |
| 单一职责工具类 | utilities | 只做一件事，低语义、高复用 |
| 页面私有样式 | 页面 .vue / module | 仅服务当前页面，不允许泄漏 |
| 组件私有样式 | 组件局部样式 | 仅服务当前组件，不允许承担全局职责 |

一句话总结：

> **先判断所有权，再决定文件位置。**

否则执行阶段大家还是会按感觉写。

---

### 问题 2：目前还没有明确“业务组件样式”到底怎么存在

依赖图里写了：

> 业务组件 CSS Modules ↓ 只消费 Token

但你当前项目是 Vue，从你描述看，现状是 .vue 文件里分散样式。所以这里必须先定清楚：

**你到底要什么局部样式模型？**

候选一般有 3 种：

#### 方案 A：继续用 `<style scoped lang="less">`

**优点**：
- 接入成本低
- 适合存量项目迁移

**缺点**：
- 伪局部，不是真正模块化命名
- 深度选择器覆写第三方组件容易失控
- 复用抽象能力一般

#### 方案 B：CSS Modules

**优点**：
- 真局部
- 命名冲突小
- 适合组件化治理

**缺点**：
- Vue 项目里团队接受度不一定高
- 对已有写法迁移成本较高

#### 方案 C：页面/组件局部 less + 全局治理层并存

**优点**：
- 最现实
- 适合渐进迁移

**缺点**：
- 必须配强规则，不然又回到老路

#### 我的建议

对存量中后台 Vue 项目，建议：

> **短中期采用“全局治理层 + 局部 scoped/style module 共存”的渐进模式，不要一上来强推纯 CSS Modules。**

也就是：
- **全局共识**：reset / tokens / base / vendors / patterns / utilities
- **局部样式**：页面和业务组件仍允许写局部样式
- **但局部样式只能做“私有结构和私有表现”**
- **禁止局部样式承担全局职责、第三方覆写职责、跨页面复用职责**

这个边界一定要写进规范里。

---

### 问题 3：Vendor 层的策略还不够细，尤其是 Ant Design v5

这里我要重点讲。

你写的是：

> 优先用 CSS Variables 覆写（Ant Design v5 支持）

这句话方向对，但还不够准确。因为 Ant Design v5 的主题能力，核心不只是 CSS Variables，而是：
- Design Token
- ConfigProvider theme token
- 组件级 token
- 部分 CSS-in-JS 生成样式

所以如果项目已经在使用 Ant Design Vue v4/v5 对应的新 token 机制，那么更推荐分层成两种治理方式：

#### 第一类：主题级定制

比如：
- 主色
- 圆角
- border color
- text color
- 控件高度
- hover / active 色

这些**优先走组件库官方 Token 机制**，不要先想着手写 CSS 覆写。

#### 第二类：结构级/局部视觉修正

比如：
- 某个组件额外间距
- 表头布局调整
- 某种特殊展示态

这些才进入 `vendors/antd.less`

Vendor 层可以再拆成两类概念：

1. **官方 token 映射层**（项目 token → antd token），更像“主题桥接”
2. **CSS override 层**，专门处理官方 token 搞不定的部分

更直接一点说：

> **能用组件库 token 配置解决的，不允许写 CSS override。**

因为 CSS override 是最后手段，不是首选手段。否则 `vendors/antd.less` 很快会越来越大，最后变成“对抗组件库”的文件。

---

### 问题 4：Patterns 和 Utilities 的边界，还需要进一步收紧

这是第二个最容易失控的点。

你说：
- Patterns：语义类优于实现类
- Utilities：单一职责工具类

这没问题。但落地时最容易变成：

- Pattern 文件里全是 `.mb12 .mt16 .flex-between`
- Utilities 里又出现 `.u-page-header, .u-search-bar`

也就是两边互相串位。

#### 用一句更硬的判定规则

**Pattern 的定义**
Pattern 是“可复用的场景结构/交互表现约定”，不是简单样式组合。

比如这些是 Pattern：
- `.table-action-group`
- `.form-action-group`
- `.page-section`
- `.status-badge`

因为它表达的是**场景语义**。

**Utility 的定义**
Utility 是“脱离场景也成立的单一能力类”。

比如这些是 Utility：
- `.u-text-ellipsis`
- `.u-flex-center`
- `.u-hidden`
- `.u-w-full`

#### 一个很实用的判断方法

问自己一句：

> “这个类名脱离当前页面语义，单独拿出去还成立吗？”

- **成立**：大概率 Utility
- **不成立但跨页面复用**：大概率 Pattern
- **只服务当前页面**：局部样式，不该进全局

---

### 问题 5：Base 层“只写裸标签，不写 class”——原则对，但建议保留少量例外

你这个原则很克制，我认可。
但如果写死成绝对规则，后面会难受。

因为真实项目里通常会有少量“全局基础类”是必要的，比如：
- `.app-root`
- `.page-root`
- `.sr-only`
- 某些全局滚动容器基础类

如果你完全禁止 base 里出现 class，后面这些东西就不知道该去哪。

所以规则应改成：

> **Base 层以裸标签选择器为主，允许极少量“全局基础设施类”，但禁止承载业务语义。**

这样更符合工程现实。

---

### 问题 6：还缺一个非常关键的层面：命名空间策略

你提到：

> 针对具体组件的定制覆写必须加命名空间前缀

这个方向对，但还不够具体。你需要明确：**命名空间加在哪？**

例如：

**错误做法**
```css
.ant-table-thead > tr > th { ... }
```
这是全局污染。

**更稳妥的做法**
```css
.goods-page {
  .ant-table-thead > tr > th { ... }
}
```
或
```css
.ui-table-compact {
  .ant-table-thead > tr > th { ... }
}
```

#### 命名空间可以定成 3 类

1. **页面级命名空间**（如 `.goods-page`）
   用于某页面专属的第三方组件修正

2. **模式级命名空间**（如 `.ui-table-compact`、`.ui-form-inline`）
   用于可复用模式下的 vendor 配合

3. **全局级 override**
   仅允许极少数真正全局统一规则

一个关键原则：

> **默认不写全局第三方覆写，默认都要挂在命名空间下。**

只有确实全站统一的视觉规范，才允许直接作用于 `.ant-*`。这条非常关键。

---

### 问题 7：这张「单向依赖图」是对的，但还缺“优先级/加载顺序约束”

CSS 里光有逻辑层次不够，还要有真实装配顺序。

方案里已有 `index.less`，但还要进一步明确：

**装配顺序建议**
```less
@import './reset.less';
@import './tokens.less';
@import './base.less';
@import './vendors/antd.less';
@import './vendors/surely-vue.less';
@import './patterns/layout.less';
@import './patterns/table-actions.less';
@import './patterns/form-actions.less';
@import './patterns/status-badge.less';
@import './utilities.less';
```

这个顺序大体合理。但还要提醒一点：

> **Utilities 放最后是为了“可覆盖性”，但也意味着它的滥用风险最高。**

所以你需要明确：
- utility 允许做轻量覆盖
- 不允许拿 utility 去对抗 pattern / vendor
- 更不能依赖 utility 去修补组件 bug

否则后期大家会疯狂堆工具类。

---

### 问题 8：Token 层目前还是“值分类”，还没上升到“语义 token”

这是一个很重要的成熟度问题。

目前写的是：
- 主色、文本色、背景色、边框色
- 间距
- 字体
- 圆角
- 阴影
- z-index

这说明已经有基础 token 意识。
但如果要真正治理得稳，把 Token 分两层理解：

#### 第一层：基础 Token（Primitive Tokens）

例如：
```css
--ui-color-blue-500
--ui-gray-100
--ui-space-8
--ui-radius-4
```
这是“原料”。

#### 第二层：语义 Token（Semantic Tokens）

例如：
```css
--ui-color-text-primary
--ui-color-text-secondary
--ui-color-bg-page
--ui-color-bg-card
--ui-color-border-default
--ui-color-status-success
--ui-space-page-gap
--ui-table-action-gap
```
这是“用途”。

**为什么这很重要？**
因为如果业务代码直接用：
```css
color: var(--ui-gray-700);
padding: var(--ui-space-12);
```
那只是把“硬编码 hex”升级成了“硬编码变量名”。

真正的治理应该尽量让业务和 pattern 依赖语义 token，而不是原始色值 token。

#### 我的建议

这份 `tokens.less` 最好内部就分两段：
- primitive
- semantic

并且规定：

> **业务样式优先使用 semantic token，只有设计系统底层才允许直接使用 primitive token。**

这会让未来改版轻松很多。

---

### 问题 9：缺少“例外机制”，没有例外机制的规范必然被绕开

所有治理体系都不能只讲“禁止”，还要讲：

> **遇到确实不适合归类的样式怎么办？**

否则开发者一定偷偷写在页面里。

#### 增加一个「临时例外规则」

比如：

允许局部例外，但必须满足：
1. 写明注释，说明为什么不能进入 pattern/vendor
2. 标注是否后续抽离
3. 禁止复制传播

例如：
```css
/* TEMP: 当前仅商品导出弹窗使用，待第二处复用后抽到 patterns */
.export-dialog-extra-tip { ... }
```

这样治理不会太理想主义。

---

### 问题 10：缺少迁移策略和验收标准

这是执行层面最关键的。

当前方案很像“目标架构”，但还不是“落地方案”。
真正执行时，你必须回答：

- **先改什么？**
  先上目录和 index？先收敛 token？先收敛 vendor override？还是先改某几个高频页面？

- **什么叫迁移完成？**
  硬编码颜色减少到多少？页面内直接覆写 `.ant-*` 归零？公共 pattern 抽取多少个？stylelint 阻断哪些行为？

#### 我的建议：按 3 阶段推进

**Phase 1：止血**
目标：不让问题继续扩散

措施：
- 建 style 目录结构
- 接入 index.less
- 增加基础 token
- 建 vendors 集中入口
- 上 stylelint 基础规则
- 新代码禁止新增页面内 `.ant-*` 覆写

**Phase 2：归并**
目标：把高频重复模式收敛

措施：
- 收拢各页面里的第三方覆写
- 抽取前 3~5 个 pattern
- 把高频硬编码色值/间距替换成 token
- 建立页面样式命名空间

**Phase 3：治理**
目标：让规范变成工程约束

措施：
- lint 阻断硬编码颜色
- lint 阻断非法 selector
- PR review checklist
- 组件样式归属审查
- 统计治理指标

---

## Stylelint：方向对，但还缺几条能止血的规则

至少要关注这些规则方向：

**必须拦截：**
- 硬编码颜色值
- `!important`
- 过深嵌套
- 过高 specificity
- 非法第三方覆写位置

尤其最后一条最难。Stylelint 很难直接理解“只能在 vendors 里覆写 `.ant-*`”，但可以做近似治理：
- 对普通业务文件出现 `.ant-` 选择器报错/警告
- `vendors` 目录例外放行

这条价值非常大。

---

## 这套架构真正应该强调的 4 条铁律

如果要给团队定规矩，可以浓缩成下面 4 句话：

**铁律 1：值只能从 Token 来**
禁止裸写颜色、间距、圆角、阴影。

**铁律 2：第三方覆写只能进 Vendor 层**
业务页面和组件禁止直接覆写 `.ant-*` / `.surely-*`。

**铁律 3：跨页面复用样式只能进 Pattern 或 Utility**
禁止复制粘贴“公共样式”。

**铁律 4：局部样式只服务当前组件/页面**
不得承担全局职责，不得偷改第三方组件全局表现。

如果这 4 条能落地，这个治理体系就基本成立了。

---

## 落地前要写死的五件事

分层图画完之后，方案会不会失控，取决于这五个决定：

1. **业务局部样式用哪种模型？** `<style scoped>`、CSS Modules，还是混合，但只能有一种默认。
2. **第三方组件靠 token 还是靠选择器覆写？** 这决定 Vendor 层的边界。
3. **Token 是否拆成 primitive 和 semantic？** 不拆，后面还是伪治理。
4. **Pattern 的抽取门槛是什么？** 出现两次就抽，还是确认跨模块复用再抽。
5. **Stylelint 从哪天开始阻断？** 新目录直接 error，旧目录 warning，比全局一刀切更能落地。

方向大约是 8/10：分层是对的，所有权规则、Vendor 策略、Token 语义和迁移步骤还要补硬。它值得执行，不是推倒重来。

最先要写清的边界是：局部样式、Pattern、Vendor 三者分别允许写什么、禁止写什么。
