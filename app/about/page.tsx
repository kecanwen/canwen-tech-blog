import type { Metadata } from "next"
import Link from "next/link"

import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "关于",
  description: "柯灿文（canwen），AI 全栈工程师，前端架构是主场。这些笔记写约束和取舍，不写工具清单。",
}

const focuses = [
  {
    title: "确定性约束",
    body: "类型、Schema、Lint 到构建的门禁。模型可以猜，合并进主干的代码不行。",
    href: "/posts/lint-type-mock-build-gates",
  },
  {
    title: "把 AI 压进窄口子",
    body: "决策提前锁死，测试生成只负责推数据和翻译断言。作用域越小，系统越稳。",
    href: "/posts/schema-driven-b-end-ai-e2e",
  },
  {
    title: "全栈边界",
    body: "告警怎么降噪，Node 和 Java 互调时数字和连接池会在哪一层出事。",
    href: "/posts/node-java-cross-language-microservices",
  },
]

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <p className="text-xs tracking-[0.2em] text-[var(--ink-faint)] uppercase">关于</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">
        {site.nameZh}
        <span className="mt-2 block text-2xl text-[var(--ink-dim)] md:text-3xl">{site.name}</span>
      </h1>
      <p className="mt-6 text-lg text-[var(--ink)]">{site.role}</p>
      <div className="mt-8 max-w-2xl space-y-5 text-[16px] leading-8 text-[var(--ink-dim)]">
        <p>
          关心的问题比较具体：模型生成是概率性的，合进主干的变更却必须可预测。所以这里的笔记大多在写约束，而不是模型又多会写了多少行。
        </p>
        <p>
          前端架构是主场，全栈是同一套判断延伸出去的部分。类型和契约、中后台的 Schema 驱动测试、告警降噪、仓库选型和跨语言互调，都按这个标准写：讲清 trade-off，也讲清故意不做什么。
        </p>
        <p>一篇文章如果不能被工具复现，就还停在愿望清单上。</p>
      </div>
      <div className="draw-line mt-10 h-px w-24 bg-[var(--accent)]" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {focuses.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 transition-colors hover:border-[var(--accent)]"
          >
            <h2 className="font-serif text-xl">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-dim)]">{item.body}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
