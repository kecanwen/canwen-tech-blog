import type { Metadata } from "next"

import { SearchScreen } from "@/components/search-screen"
import { getPostIndex } from "@/lib/posts"

export const metadata: Metadata = {
  title: "搜索",
  description: "在文章标题、摘要和标签里查找。",
}

export default async function SearchPage() {
  const posts = await getPostIndex()

  return (
    <main className="pt-8">
      <h1 className="page-title">搜索</h1>
      <SearchScreen
        posts={posts.map((post) => ({
          title: post.title,
          slug: post.slug,
          date: post.date,
          description: post.description,
          tags: post.tags,
        }))}
      />
    </main>
  )
}
