import type { Metadata } from "next"

import { PostBrowser } from "@/components/post-browser"
import { getAllTags, getPostIndex } from "@/lib/posts"

export const metadata: Metadata = {
  title: "文章",
  description: "十篇工程笔记：AI Coding 体系、前端门禁、Agent 约束、可观测性与全栈边界。",
}

export default async function PostsPage() {
  const [posts, tags] = await Promise.all([getPostIndex(), getAllTags()])

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <p className="text-xs tracking-[0.2em] text-[var(--ink-faint)] uppercase">目录</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">文章</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[var(--ink-dim)]">
        按选文顺序排。主题来自文章自己的标签，点进去是同一份目录的一个切面。
      </p>
      <div className="mt-8">
        <PostBrowser posts={posts} tags={tags} activeTag={null} />
      </div>
    </main>
  )
}
