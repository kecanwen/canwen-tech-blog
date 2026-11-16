---
title: "断言哲学：Oracle Problem 与虚假信心"
slug: assertion-oracle-problem
description: "总是为真的断言会制造覆盖率。断言的真值必须来自独立于生成过程的来源。"
tags:
  - Testing
  - AI-E2E
rank: 21
featured: false
date: "2024-05-09"
---

# 断言哲学：Oracle Problem 与虚假信心

> [!IMPORTANT]
> **本文探讨的核心问题：**
> 1. 为什么一个测试全绿、CI 放行的系统，上线后仍然可能被边界情况打穿？
> 2. 什么是自动化测试领域的 Oracle Problem？它在 AI 生成测试的时代为什么更加严峻？
> 3. "好断言"和"坏断言"之间有没有一个可操作的判断标准？

---

## 一、Oracle Problem：测试的根本困境

### 1.1 什么是 Oracle Problem

Oracle Problem 是软件测试领域的一个根本性问题：

> 给定一个程序的输入，你怎么知道它的输出是"正确的"？

如果有一个权威的 oracle（比如一个已知正确的参考实现、一个数学公式、一份人工验证过的预期结果），那么自动化测试可以精确判断对错。但在大多数实际场景中，**oracle 是不存在的**——代码输出的"正确性"只有人看了才知道。于是自动化测试用了一个替代品：**程序员写在断言里的预期**。

问题是：**程序员写在断言里的预期，不一定等于真正的正确性。** 这就是 Oracle Problem 的核心。

### 1.2 为什么 AI 生成测试让 Oracle Problem 更严峻

传统手工编写的测试中，Oracle Problem 是隐性存在的——一个人写了一个断言，他对这个断言是有意识的，知道自己在验证什么。但 AI 生成测试带来了新的风险维度。

[中后台 AI 自动化 E2E 技术方案](/posts/schema-driven-b-end-ai-e2e) 中有一段非常真实的描述：

> 有团队真实翻车过——语法正确、跑得通，但断言的是错误的属性。学术界把这叫 oracle problem：LLM 自动生成断言而不加保障，会产出大量 false positive，反而拉低整个测试的可信度。

AI 生成测试的过程是：

```
AI 看到代码 → 推断"预期行为" → 生成断言
```

问题出在第二步：AI 推断的"预期行为"是**基于当前实现推测的**。代码是 A，AI 就生成"断言结果是 A"。但真正的正确性可能应该是 B。于是测试全绿、CI 放行、上线翻车——因为测试只是在验证"代码如实现地工作"，而不是"代码如需求地工作"。

学术界对这个问题有明确的警告：**LLM 自动生成的断言如果直接采用，会系统性地产出"看着对"但其实是废的断言。**

---

## 二、"坏断言"的分类学

结合 [自动化测试全景：分层、策略与取舍](/posts/automated-testing-layers) 中提到的"断言真值可靠性"框架，坏断言可以归为三类：

### 2.1 空断言（Void Assertion）

最坏的一种——断言了一个总是为真的条件，不具备任何区分能力。在 [中后台 AI 自动化 E2E 技术方案](/posts/schema-driven-b-end-ai-e2e) 中被列为**铁律禁止**。

```typescript
// ❌ 空断言：断言了一个几乎不可能失败的条件
expect(response).toBeDefined()       // 只要返回了对象就过
expect(data).not.toBeNull()          // 同上
expect(result).toBeTruthy()          // 0、false、'' 以外全过
expect(error).toBeUndefined()        // 没报错就行，不管数据对不对
```

这些断言的问题：一个"返回了错误数据但没有报错"的实现，同样可以让它们通过。**它们筛不掉"错误但凑巧实现"的情况**，而后者正是回归测试要抓的。

### 2.2 自验证断言（Self-Validating Assertion）

AI 生成测试时的典型错误——用实现本身来验证实现：

```typescript
// ❌ 自验证：AI 看到字段名 fieldCode，就断言它存在
// 但这个字段可能是后端返回的、可能是写死的、可能是拼错的
expect(body.data.fieldCode).toBeDefined()

// ❌ 更隐蔽的自验证
// AI 看到表格渲染了，就断言"有行"，但没验证行里的数据
expect(rows.length).toBeGreaterThan(0)
```

区分"自验证"和"真验证"的方法：问一个问题——**一个"返回了错误数据但刚好满足这个条件"的实现，能让这条断言通过吗？** 如果能，它就是自验证断言。

### 2.3 模糊断言（Vague Assertion）

断言条件过于模糊，无法精确描述正确的行为：

```typescript
// ❌ 模糊：只说"看起来对"，没定义"对"的标准
expect(table).toMatchScreenshot()                    // 像素通过但业务数据错误
await ai.aiAssert('表格数据看起来正确')                // 把判断责任甩给 LLM
expect(page.getByText(total)).toBeVisible()           // 显示了"总数"但数值对不对？
```

模糊断言最大的问题是：**它们把"正确性"的判断从精确的条件退化成了"大概齐"。** 测试的权威性被稀释了。

---

## 三、"好断言"的可操作标准

### 3.1 可证伪性（Falsifiability）

这是判断断言好坏的**唯一最重要标准**：

> 一条好的断言，必须能被一个"错误但凑巧的实现"证伪。

换句话说：**你能构造出一种"功能是错的、但这行断言过了"的场景吗？** 如果能，断言不够好。

拿一个真实的例子对比：

```typescript
// ❌ 不可证伪：数量>0 总是成立，但数量对不对不知道
expect(items.length).toBeGreaterThan(0)

// ✅ 可证伪：如果后端 filter 没生效，这条断言会挂
expect(items.every(i => i.status === '待审核')).toBe(true)
```

第二行的断言可以被"filter 未生效"这个 bug 证伪——它就是一条好断言。

### 3.2 来源优先级

断言应该按照真值的可靠性从高到低选择来源。 [中后台 AI 自动化 E2E 技术方案](/posts/schema-driven-b-end-ai-e2e) 中已经定义了三级优先级，这里从原理角度解释为什么是这个顺序：

**最高：后端接口响应**

```typescript
// 拦截 API，断言返回数据的结构和值
const [resp] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/field/list') && r.status() === 200),
  search.getQueryButton().click(),
])
const body = await resp.json()
expect(body.data.every(r => r.category === '零食')).toBe(true)
```

后端响应是**最接近真相的断言源**——它直接告诉你的数据对不对，而不经过 DOM 渲染层。如果后端返回了正确数据但页面渲染错了，那是前端 bug，应该另起一条断言覆盖渲染。

**中等：DOM 结构化断言**

```typescript
// 验证表格行数与接口返回一致
expect(table.rows.count).toBe(body.data.length)
// 验证特定单元格文本
expect(table.cell(0, 'name').text()).toBe(body.data[0].name)
```

DOM 断言的价值在于验证**渲染层**的正确性。缺点是定位靠 `data-testid` 体系支撑才稳定。

**兜底：视觉/语义断言**

```typescript
await ai.aiAssert('弹窗标题显示为"新增标签"')
// 或：截图 diff，人工审核
```

只有纯布局、富文本渲染这类无法结构化的场景才应该走到这一级。

### 3.3 链路完整性

一条断言应该覆盖**完整的"用户意图 → 系统响应"链路**，而不是只测中间状态：

```typescript
// ❌ 只测链路的中间点
await expect(search.getQueryButton()).toBeEnabled()  // 按钮能点不等于查询生效

// ✅ 覆盖完整链路
const [resp] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/field/list')),
  search.getQueryButton().click(),
])
expect(resp.status()).toBe(200)
const body = await resp.json()
expect(body.data.length).toBeGreaterThan(0)
```

---

## 四、AI 时代的断言策略

### 4.1 禁止 AI 顺手写断言

这是前面提到的 [中后台 AI 自动化 E2E 技术方案](/posts/schema-driven-b-end-ai-e2e) 和 一次实测 共同指向的核心教训：**写测试数据的 AI 和定义断言真值的逻辑必须分离。**

```typescript
// ❌ AI 同时管数据和断言
// AI 生成："用户输入'测试'，断言表格显示了'测试'"
// 风险：AI 固定了一个值，这个值在真实数据里也可能存在，测试永远过

// ✅ 数据来源和断言真值分离
// 数据来源：运行时表格或者规则推断
// 断言真值：waitForResponse 抓 API 响应
```

### 4.2 lint 强制约束

用自动化手段防止 AI 生成劣质断言：

```typescript
// eslint 规则示例（伪代码）
'no-void-assertions': 'error',  // 禁止 toBeDefined/not.toBeNull/toBeTruthy
'no-self-assertions': 'error',  // 断言值不能直接来自生成时的代码分析
'require-response-assertion': 'warn',  // 涉及 API 交互的测试，建议有 waitForResponse
```

### 4.3 assertion 作为一等公民

在用例描述中，断言应该和步骤平级，而不是附属品。你已经在 `suite.json` 中做了这一点——断言是独立的结构化字段：

```json
{
  "steps": [...],
  "assertions": [
    { "type": "visible", "target": ".ant-table" }
  ]
}
```

这种设计让断言成为显式的声明，而不是藏在步骤实现里的隐式 `expect`。当你把断言提升为与步骤平级的设计实体时，它的质量就更容易被审查和约束。

---

## 五、总结

- **Oracle Problem** 是测试的根本困境：没有天然 oracle 时，断言只是"程序员对正确性的猜测"。
- **AI 生成测试加剧了 Oracle Problem**：LLM 倾向于"基于当前实现推断预期"，产生自验证断言。
- **好断言的可操作标准**：可证伪性 > 来源优先级（后端 > DOM > 视觉） > 链路完整性。
- **坏断言的三类**：空断言（总为真）、自验证断言（测实现不测需求）、模糊断言（标准不清晰）。
- **应对策略**：禁止 AI 顺手写断言 + lint 强制约束 + assertion 作为一等公民。

延伸问题：
- 断言的可证伪性可以自动化检查吗？——比如静态分析一条断言是否能被一个类型正确但值错误的实现通过？
- 断言质量能否作为测试质量的量化指标？能否定义一个"断言密度 × 断言权威性"的得分？
- AI 写断言但人审，和 AI 只辅助人写断言，哪个在实践中更有效？

---

**关联文章：**
- [中后台 AI 自动化 E2E 技术方案](/posts/schema-driven-b-end-ai-e2e) — "第 5 层：断言策略"是本文学原则的工程落地，定义了三级断言来源和铁律
- [自动化测试全景：分层、策略与取舍](/posts/automated-testing-layers) — 测试有效性公式（断言真值的可靠性 × 边界覆盖数量）与本文直接呼应
- 团队自动化测试的现状 — 首段的"虚假覆盖"是 Oracle Problem 在团队视角的表现
