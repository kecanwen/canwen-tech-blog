---
title: "防御大模型输出非确定性的架构设计"
slug: defending-llm-nondeterminism
description: "把 temperature 调到 0 也挡不住格式抖动。结构化输出、自愈解析和自纠正循环，在架构层把非确定性吃掉。"
tags:
  - Agent
  - LLM
  - Architecture
rank: 6
featured: false
---

# 防御大模型输出非确定性的架构设计

> [!IMPORTANT]
> **本文探讨的核心问题：**
> 1. LLM 即使将 Temperature 设为 0，在高并发或跨服务调度时，其输出依然具有本质上的“非确定性”。如何防范其格式微小差异导致下游业务代码崩溃？
> 2. 如何在系统架构层面建立起“柔性消化”这种非确定性的机制，而不是在业务代码中疯狂堆砌 `try-catch`？

在传统的软件工程中，API 的契约是严格的。调用一个接口，它要么返回符合定义的数据，要么返回预设的报错。

但在 Agent 系统中，大模型是连接外部业务的核心中枢。哪怕你在 Prompt 里强调一万遍“你必须严格输出 JSON 且键值必须为 action”，哪怕你把 `temperature` 设为 `0`，大模型也可能会在某一次高并发请求中，吐出一个带有点缀的 JSON，或者把 `action` 首字母写成了大写（`Action`）。

如果我们直接用 `result["action"]` 来编写下游的 Python/TS 代码，业务崩溃只是时间问题。这种崩溃不能靠零碎地在代码里加 `try-catch` 去修补，而应该在**系统架构层面**提供吸收不确定性的缓冲垫。

---

## 一、 原生层限制：强制结构化输出（Structured Outputs）

最底层的防线是利用模型厂商原生提供的 Schema 锁死功能，直接在推理网关层截断非标准输出。

*   **实现方式**：
    *   不要指望纯文字 Prompt 约束。应该使用 OpenAI 提供的 `response_format: {"type": "json_schema", "json_schema": ...}` 或 Gemini 的 `response_schema`。
    *   这一层直接在推理引擎的 Token 生成阶段（Decoding）施加语法限制（Grammar-based Decoding），如果模型试图生成不符合 Schema 规范的 Token，会被引擎强行纠正。
*   **局限**：不是所有模型（尤其是本地开源小模型）都稳定支持强制 JSON Schema。因此，我们必须在应用层设计**自愈解析层**。

---

## 二、 应用解析层：模糊映射与自愈解析（Resilient Parsers）

当大模型输出的文本流进入宿主程序时，在调用任何业务逻辑代码前，先经过一个**“自愈解析适配层（Sanitizing Parser）”**：

```
[ LLM 原始输出文本 ]
        │
        ▼ (示例: "Here is: ```json \n {\n  "Action": "search" \n} \n```")
┌────────────────────────────────────────────────────────┐
│  第一步：正则清洗与 JSON 提取 (Regex Extractor)          │
└────────────────────────────────────────────────────────┘
        │
        ▼ (提取出 JSON 片段)
┌────────────────────────────────────────────────────────┐
│  第二步：键值模糊对齐与容错映射 (Fuzzy Key Alignment)   │
│  - 编辑距离计算: 'Action' -> 'action'                  |
│  - 兼容别名映射: 'tool' -> 'action'                    |
└────────────────────────────────────────────────────────┘
        │
        ▼ (得到标准格式的 Dict)
┌────────────────────────────────────────────────────────┐
│  第三步：类型契约校验与兜底填充 (Pydantic Validation)    │
└────────────────────────────────────────────────────────┘
        │
        ▼
[ 输出 100% 确定性的标准数据结构 ]
```

### 1. 正则清洗与 JSON 提取
*   **做法**：模型经常会在 JSON 的外面包一层 Markdown 的 ```json ... ``` 标记，或者在最前面加上一行闲聊：“这是为您生成的 Action：”。
*   **自愈**：解析器使用正则表达式捕获被 `{}` 包裹的最长文本段落，并用 `json.loads` 进行反序列化，容忍并剔除所有外部包裹文本。

### 2. 键值模糊对齐（Fuzzy Key Alignment）
*   **做法**：如果解析出来的 JSON 中，没有找到代码强需要的 Key（如 `action`），解析器自动计算已有 Key 与标准 Key 的 Levenshtein 距离（编辑距离）。
*   **自愈**：如果相似度 $> 0.8$（例如 `Action`、`action_name`），则自动在内存中把这个键改写为标准的 `action`。如果找不到，则尝试在已有的同义词库（Alias Table，如 `tool -> action`）中映射。

### 3. 类型契约校验（Pydantic Validation）
*   定义清晰的 Pydantic 类：
    ```python
    class ToolCall(BaseModel):
        action: str = Field(..., alias="Action")
        arguments: dict = Field(default_factory=dict)
    ```
    利用 Pydantic 的 `alias` 和 `default_factory` 机制，自动处理键首字母大写、缺失参数赋默认空值等细节错误。

---

## 三、 反馈重试机制：自我纠正循环（Self-Correction Loop）

如果上述静态解析手段全部失败，JSON 结构严重损坏（例如少写了半边括号），系统千万不要直接抛 500 崩溃，而是自动触发一次**带有报错上下文的“自愈重试机制”**：

```python
try:
    parsed_data = resilient_parse(raw_output)
except ValidationError as e:
    # 自动开启第二轮交互，把 Pydantic 抛出的详细报错直接塞回给大模型
    correction_prompt = f"""
    你刚才输出的格式不符合预期的 JSON Schema。
    【报错详情】: {e.errors()}
    【你的原始输出】: {raw_output}
    请你根据上面的报错信息，重新输出一份符合规范的纯 JSON 数据，不要包含任何闲聊字样。
    """
    new_raw_output = llm.call(correction_prompt)
    parsed_data = resilient_parse(new_raw_output) # 第二次解析
```

这种“报错-重新生成”的反馈回路，由于有具体的 Python 报错信息指引，第二次尝试在机制上更容易收敛（这是预期，不是实测成功率），从而在架构层面上吸收不可预测的剧烈格式变动。

---

## 四、 总结一句话

**吸收大模型输出不确定性的王道是“不信任原则”——前端通过 JSON Schema 强制约束，中端通过正则提取与模糊编辑距离自愈对齐，后端通过 Pydantic 契约配合“报错即时反馈重试”构建起坚固的自愈闭环。**
