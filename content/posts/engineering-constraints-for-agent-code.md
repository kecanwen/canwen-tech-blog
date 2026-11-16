---
title: "用工程化手段约束 Agent 生成代码的质量与一致性"
slug: engineering-constraints-for-agent-code
description: "生成是概率的。输入规则、静态拦截、测试回填和评审门禁，把合进主干的代码收成确定的。"
tags:
  - Agent
  - Frontend-Engineering
  - AI-Coding
rank: 30
featured: false
date: "2024-11-13"
---

# 用工程化手段约束 Agent 生成代码的质量与一致性

在 100% 由 Agent 生成代码的研发体系下，Agent 的本质是一个**概率模型**，而工程化的本质是**确定性**。

治理 Agent 的核心工程哲学是：**“以确定性驯服随机性，用机器约束机器。”**

要让散落在各个开发者手中的 Agent 产出高度一致、高可维护性、符合架构规范的代码，需要在工程链路上搭建**“输入约束、静态拦截、动态验证、双 Agent 质检、闭环自愈”**五道自动化流水线：

```
                 [ 开发者输入自然语言 / 任务 ]
                              │
 1. 输入约束层 ──────────────▼───────────────────────────────────
    • .cursorrules / AGENT.md (系统级提示词注入)
    • MCP Server (注入精准的 OpenAPI 契约、SDK 资产库、AST 索引)
                              │
 2. 编码与生成层 ─────────────▼───────────────────────────────────
    • Agent 生成代码 + 伴生生成单元测试 (TDD 模式)
                              │
 3. 静态拦截层 ───────────────▼───────────────────────────────────
    • TypeScript Strict 编译 (类型不通过直接中断)
    • ast-grep / ESLint (架构边界、强制 SDK、禁用危险副作用)
    • Gitleaks / Semgrep (安全与敏感数据静态扫描)
                              │
 4. 动态闭环层 ───────────────▼───────────────────────────────────
    • CI 本地执行 Vitest / 契约测试
    • ❌ 失败 ──► 自动将错误栈回填给 Agent 自愈重写 (Self-Healing)
    • ✅ 通过
                              │
 5. 准入质检层 ───────────────▼───────────────────────────────────
    • Reviewer Agent (基于架构规范的专用评审模型打分)
    • 人类终审 (只需做 2 分钟的业务对齐确认) ──► 合并上线
```

---

### 一、 输入层约束：用“规则即代码（Rules as Code）”给 Agent 戴上紧箍咒

不要指望开发者每次都写出完美的 Prompt，必须把规范做成**机器可读取的项目上下文资产**：

1. **统一上下文规则文件（`.cursorrules` / `AGENT.md` / `CLAUDE.md`）**：
   * 在 Monorepo 根目录下固化系统级 System Prompt。
   * **明确告知 Agent“什么禁止做”**：例如 *“严禁调用原生 `axios`，网络请求必须通过 `@acme/app-sdk` 的 `httpClient`”*、*“状态变更严禁原地修改对象，必须返回新副本”*。
2. **构建企业级 MCP（Model Context Protocol）服务**：
   * 传统 RAG 是文本检索，容易漏掉关键定义。通过搭建团队内部的 **MCP Server**，让 Agent 在写代码时可以直接通过标准协议查询：
     * 后端 Swagger / OpenAPI 的实时类型定义；
     * 工作台 `@acme/app-sdk` 的精准 API 签名与最佳示例代码；
     * 避免 Agent 依靠训练集记忆去“猜”接口和参数。
3. **“契约先行（Contract-First）”代码生成**：
   * 接口对接前，CI 先根据后端 Swagger 生成不可篡改的 TypeScript 类型包（`@acme/api-contracts`）。
   * Agent 只能在实现已有接口契约的前提下生成逻辑，从源头杜绝字段命名不一致。

---

### 二、 静态层约束：用 AST 和强类型构筑“物理防御网”

凡是靠人去肉眼看代码风格或规范，都是工程治理的失败。所有架构约束必须沉淀为**确定性的静态分析工具**：

1. **结构化语法树拦截（`ast-grep` / ESLint 自定义规则）**：
   * 传统的正则检查容易被换行和注释绕过，改用 **AST 语法树匹配**：
     ```yaml
     # ast-grep 规则示例：拦截未经 SDK 包装的 wx.request
     id: forbid-raw-wx-request
     language: typescript
     rule:
       pattern: wx.request($$$ARGS)
     message: "【架构违规】禁止直接调用 wx.request，必须使用业务 SDK 注入租户上下文！"
     severity: error
     ```
2. **架构边界防劣化（`dependency-cruiser`）**：
   * 在 Monorepo 中配置包依赖单向流动规则（如 `H5 业务模块` 禁止直接 `import` `工作台宿主私有代码`）。
   * 一旦 Agent 破坏了分层架构或循环依赖，构建立刻抛错打断。
3. **严格的 TypeScript 编译（`"strict": true`）**：
   * 强制开启 `"noImplicitAny"`、`"strictNullChecks"`、`"noUnusedLocals"`。
   * Agent 最容易在类型报错时写 `as any`，配置 ESLint 规则 `typescript-eslint/no-explicit-any: error` 直接阻断提交。

---

### 三、 动态层约束：测试驱动开发与“Agent 自愈闭环”（Self-Healing Loop）

让 Agent 产生确定性代码的最好方法是：**先给它一个裁判（测试用例）**。

1. **Spec & Test-First（测试先行生成）**：
   * **第一步**：给 Agent 输入业务 PRD 或需求描述，要求 Agent **先生成测试用例（Vitest / Playwright）**，定义好输入与预期输出。
   * **第二步**：Agent 编写业务实现，在本地自动执行测试。
2. **自动化“错误回填与自愈”流水线（Feedback Loop）**：
   * 如果 Agent 编写的代码跑不通测试或未通过 Lint：
   * **工程化脚本自动捕获控制台的 Error Stack Trace**，组装成固定的 Feedback Prompt 重新发给 Agent：
     > *“你刚才生成的代码在运行 `vitest` 时出现如下报错：[Error Details]。请在不破坏现有类型契约的前提下，修复这个 Bug 并重新通过测试。”*
   * 允许 Agent 在沙盒内自动重试 2~3 轮，直到测试全部亮绿灯。

---

### 四、 评审与准入层：引入“AI Reviewer Agent”充当质检门禁

人类面对成百上千行 AI 生成的代码很容易产生审查疲劳（Review Fatigue）。解决办法是**用专门的 Reviewer Agent 去做第一道把关**：

1. **配置独立的 Review Agent（GitHub Actions / GitLab CI Bot）**：
   * 当开发者提交 PR 时，CI 自动拉起一个专门调教过的 Code Review Agent（与写代码的 Agent 隔离，专精于代码审查）。
   * Review Agent 拿着《架构规范 Checklist》去对照 Diff 进行静态扫描，并输出结构化审查报告：
     * 🟢 架构边界合规性评估
     * 🟡 副作用与内存泄漏风险（如未解绑的监听、过深的 Hook 依赖）
     * 🔴 敏感信息与安全漏洞
2. **设置自动化合并门禁（Quality Gates）**：
   * 只有在：① TS 编译 0 报错、② Lint 0 告警、③ 单元测试覆盖率无下降、④ Reviewer Agent 评分达到 90 分以上时，才开放给人类架构师或 Tech Lead 点击最后的 Merge。

---

### 🛠️ 架构师落地实施清单（工程工具栈推荐）

| 治理阶段 | 推荐工具 / 技术选型 | 核心职责 |
| :--- | :--- | :--- |
| **规则注入** | `.cursorrules` / `.github/copilot-instructions.md` | 固化系统提示词、强制项目目录规范与 SDK 范式 |
| **上下文协议** | **Model Context Protocol (MCP)** | 为 Agent 注入精准的实时 API Schema 与组件文档 |
| **静态 AST** | **`ast-grep`** / **ESLint (Boundaries)** | 毫秒级拦截架构越权、直接网络调用、硬编码常量 |
| **依赖拓扑** | **`dependency-cruiser`** | 守护 Monorepo 模块间单向依赖，防止架构腐化 |
| **动态闭环** | **Vitest** + 自建 Node 自动化反馈脚本 | 运行单测，报错自动喂回 Agent 进行自愈迭代 |
| **PR 质检 Bot**| **PR-Agent (Codium)** / 自建 CI Review Bot | 对 PR 进行自动化架构打分，拦截低质量与危险改动 |

> **核心结论**：
> 治理 100% AI Coding 的终极形态，**不是让人去盯每一个字母，而是把人类的架构智慧全部转化为“机器可执行的规则、测试与门禁”**。
> 只要沙盒够坚固、反馈链条够闭环，无论 Agent 背后使用的是什么模型，最终流向主分支的代码质量和一致性都将完全处于工程架构的掌控之中。
