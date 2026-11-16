import fs from "node:fs"
import path from "node:path"

const dir = path.join(process.cwd(), "content/posts")
const expected = [
  "2026-h1-engineering-retro",
  "agent-rules-short-entry",
  "ai-coding-architecture-panorama",
  "ai-coding-efficiency-metrics",
  "ai-native-frontend-architecture-v2",
  "ai-native-frontend-monitoring",
  "assertion-oracle-problem",
  "automated-testing-layers",
  "backend-auth-evolution",
  "conway-law",
  "cross-platform-component-library",
  "css-governance-by-intent",
  "defaults-are-boundary-tools",
  "defending-llm-nondeterminism",
  "element-locator-spectrum",
  "engineering-constraints-for-agent-code",
  "evals-across-lifecycle",
  "lint-type-mock-build-gates",
  "llm-agent-react-explained",
  "llm-agent-tool-call-security",
  "monorepo-vs-polyrepo-tradeoffs",
  "multi-agent-silent-failure-defense",
  "node-java-cross-language-microservices",
  "rag-systematic-failures-and-fixes",
  "reuse-is-not-always-a-virtue",
  "schema-driven-b-end-ai-e2e",
  "sliding-window-alert-denoising",
  "spec-first-tutorial",
  "typescript-any-governance",
  "vw-vh-vs-rem",
]

const banned = [
  /@yf\//,
  /益丰/,
  /pharmacyyf/i,
  /jm-hrs/i,
  /jm-test/i,
  /storeTag/,
  /jm-workspace/i,
  /jm-rebate/i,
  /jm-confluence/i,
  /收钱吧/,
  /德邦/,
  /飞书/,
  /yifeng/i,
  /加盟/,
  /wb-sdk/,
  /kevinkevin/,
  /DSFjo/,
  /业务同学日常反馈/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /!\[\[/,
  /<\/p>/,
  /<h2>/,
  /<pre class=/,
]

const files = fs.readdirSync(dir).filter((file) => file.endsWith(".md"))
const slugs = files.map((file) => file.replace(/\.md$/, "")).sort()
const missing = expected.filter((slug) => !slugs.includes(slug))
if (missing.length || slugs.length !== expected.length) {
  console.error("文章数量或 slug 不匹配", { slugs, missing })
  process.exit(1)
}

let failed = false
for (const file of files) {
  const text = fs.readFileSync(path.join(dir, file), "utf8")
  for (const pattern of banned) {
    if (pattern.test(text)) {
      console.error(`${file} 命中敏感或损坏片段：${pattern}`)
      failed = true
    }
  }
  if (!text.startsWith("---\n")) {
    console.error(`${file} 缺少 frontmatter`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log(`content ok: ${files.length} posts`)
