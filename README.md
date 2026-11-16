# canwen · 柯灿文

个人技术博客。中文界面，三十篇工程笔记，主题是 AI 全栈和资深前端架构里的取舍：门禁、契约、指标、可观测性，以及跨语言边界。

首页是窄栏排版：头像、外链、一句角色和简介，下面按发布日期从新到旧排标题和日期。文章仍在 `/posts/<slug>/`。标签在 `/tags/`，搜索在 `/search/`，订阅在 `/rss.xml`。

## 本地运行

需要 Node.js 20 及以上。

```bash
npm install
npm run dev
```

开发服务器默认在 [http://localhost:3000](http://localhost:3000)。指定端口：

```bash
npm run dev -- --port 43123
```

```bash
npm run build
npm start
```

`npm run build` 会先检查 `content/posts` 里没有内部包名、密钥和损坏片段，再执行 `next build`。`next.config.ts` 使用 `output: "export"` 与 `trailingSlash: true`，静态文件写到 `out/`。

## 内容如何对应文章

正文在 `content/posts/*.md`。文件名就是路由 slug。每篇 frontmatter 包含 `title`、`slug`、`description`、`tags`、`rank`、`featured`、`date`。首页、标签和搜索都按 `date` 从新到旧排列。

| 顺序 | slug | 文章 |
| --- | --- | --- |
| 01 | `ai-coding-architecture-panorama` | AI Coding 体系架构图：从基础设施到治理体系的全景分析（首页旗舰） |
| 02 | `ai-coding-efficiency-metrics` | 如何量化我的 AI Coding 效率 |
| 03 | `ai-native-frontend-architecture-v2` | 升维设计：AI-Native 前端工程体系 2.0 |
| 04 | `lint-type-mock-build-gates` | 代码是如何被 Lint & 类型 & Mock & 构建拦截住 |
| 05 | `schema-driven-b-end-ai-e2e` | 中后台 AI 自动化 E2E 技术方案 |
| 06 | `defending-llm-nondeterminism` | 防御大模型输出非确定性的架构设计 |
| 07 | `rag-systematic-failures-and-fixes` | RAG 系统性失败场景与工程补救方案 |
| 08 | `sliding-window-alert-denoising` | 基于滑动窗口的智能降噪机制来区分突增型和长尾型异常 |
| 09 | `monorepo-vs-polyrepo-tradeoffs` | 选择 Monorepo 还是 Polyrepo：工程权衡（Trade-off） |
| 10 | `node-java-cross-language-microservices` | 深入浅出：跨语言微服务互调的底层机制与工程实践（Node.js ↔ Java） |

同目录还有 20 篇，发布日期从 2022-03-18 到 2026-10-08。首页不按上表顺序，而按 `date` 从新到旧。

渲染在 `lib/markdown.ts`：gray-matter 读 frontmatter，remark / rehype 转 HTML。代码块用 Shiki（`rehype-pretty-code`），公式用 KaTeX。Obsidian 的 `> [!IMPORTANT]` / `> [!tip]` 会变成带样式的引用；`[[已知文章标题]]` 会链到站内文章，其余双向链接只保留文字。文首一级标题由页面标题接管，不会在正文里再出现一次。

新增一篇：把 markdown 放进 `content/posts/`，slug 与文件名一致，然后重新构建。标签页路由是 `/tags/<标签>`。

界面字体是 IBM Plex Mono，构建时由 `next/font` 下载并自托管。中文使用系统黑体回退。主题存在浏览器的 `localStorage`，第一次访问跟随系统浅色或深色。

## 脱敏

公开发布的正文去掉了内部包名、加盟业务页面和值班群的具体产品名。03 / 04 / 05 里的接口和页面示例保持为通用契约（用户、订单、字段管理），蓝湖、Apifox 作为通用设计 / 接口工具保留。技术判断没有改写。

## 部署到 Cloudflare Pages（GitHub）

仓库：<https://github.com/kecanwen/canwen-tech-blog>

在 Cloudflare Pages 里用 **Connect to Git** 连接这个仓库，不要用 Direct Upload，也不要改 DNS。

| 设置 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 框架预设 | Next.js |
| 构建命令 | `npm run build` |
| 构建输出目录 | `out` |
| Node.js | 20 及以上 |
| 环境变量 | 不需要。可选 `NEXT_PUBLIC_SITE_URL`（例如以后的正式域名）只用于 Open Graph 绝对地址 |

站点没有登录、数据库或服务端密钥。构建在本地把十篇文章生成进 `out/`，Pages 只托管这些静态文件。免费计划使用项目默认的 `*.pages.dev` 域名即可；接入自定义域名属于另一次 DNS 变更，这里不做。

已有同名 Pages 项目时，只更新这个 Git 连接的构建配置，不要覆盖别的站点。
