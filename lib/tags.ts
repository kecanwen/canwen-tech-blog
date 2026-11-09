const labels: Record<string, string> = {
  "AI-Coding": "AI Coding",
  Architecture: "架构",
  Agent: "Agent",
  Metrics: "指标",
  Engineering: "工程",
  "AI-Native": "AI-Native",
  "Frontend-Architecture": "前端架构",
  MCP: "MCP",
  "Frontend-Engineering": "前端工程",
  TypeScript: "TypeScript",
  "Agent-Governance": "Agent 治理",
  "AI-E2E": "AI E2E",
  Playwright: "Playwright",
  "Schema-Driven": "Schema 驱动",
  LLM: "LLM",
  RAG: "RAG",
  Retrieval: "检索",
  "Frontend-Monitoring": "前端监控",
  Observability: "可观测性",
  Performance: "性能",
  Monorepo: "Monorepo",
  "Engineering-Tradeoff": "工程权衡",
  Frontend: "前端",
  Fullstack: "全栈",
  Microservices: "微服务",
  Java: "Java",
}

export function tagLabel(tag: string) {
  return labels[tag] ?? tag
}

export function tagHref(tag: string) {
  return `/posts/tag/${encodeURIComponent(tag)}`
}
