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
    <main className="pt-8">
      <h1 className="page-title">{site.nameZh}</h1>
      <p className="mt-2 opacity-70">{site.name}</p>
      <p className="mt-6">{site.role}</p>
      <div className="mt-6 space-y-5">
        <p>
          关心的问题比较具体：模型生成是概率性的，合进主干的变更却必须可预测。所以这里的笔记大多在写约束，而不是模型又多会写了多少行。
        </p>
        <p>
          前端架构是主场，全栈是同一套判断延伸出去的部分。类型和契约、中后台的 Schema 驱动测试、告警降噪、仓库选型和跨语言互调，都按这个标准写：讲清 trade-off，也讲清故意不做什么。
        </p>
        <p>一篇文章如果不能被工具复现，就还停在愿望清单上。</p>
      </div>
      <ul className="mt-10 space-y-6">
        {focuses.map((item) => (
          <li key={item.title}>
            <Link href={item.href} className="font-medium underline decoration-dashed underline-offset-4">
              {item.title}
            </Link>
            <p className="mt-1">{item.body}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
