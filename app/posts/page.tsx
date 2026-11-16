import type { Metadata } from "next"

import { PostList } from "@/components/post-list"
import { getPostIndex } from "@/lib/posts"

export const metadata: Metadata = {
  title: "文章",
  description: "按发布日期排列的工程笔记：AI Coding、前端门禁、Agent 约束、可观测性与全栈边界。",
}

export default async function PostsPage() {
  const posts = await getPostIndex()

  return (
    <main className="pt-8">
      <h1 className="page-title">文章</h1>
      <hr className="mt-6 border-0 border-t border-skin-line" />
      <PostList posts={posts} />
    </main>
  )
}
