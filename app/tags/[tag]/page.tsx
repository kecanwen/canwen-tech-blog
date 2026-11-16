import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PostList } from "@/components/post-list"
import { getAllTags, getPostIndex } from "@/lib/posts"

export async function generateStaticParams() {
  const tags = await getAllTags()
  return tags.map((item) => ({ tag: item.tag }))
}

type TagRouteProps = {
  params: Promise<{ tag: string }>
}

function decodeTag(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export async function generateMetadata({ params }: TagRouteProps): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeTag(tag)
  return {
    title: decoded,
    description: `标签「${decoded}」下的文章。`,
  }
}

export default async function TagPage({ params }: TagRouteProps) {
  const { tag } = await params
  const decoded = decodeTag(tag)
  const [posts, tags] = await Promise.all([getPostIndex(), getAllTags()])
  if (!tags.some((item) => item.tag === decoded)) notFound()
  const matched = posts.filter((post) => post.tags.includes(decoded))

  return (
    <main className="pt-8">
      <nav aria-label="面包屑" className="text-sm opacity-60">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span aria-hidden="true"> » </span>
        <Link href="/tags" className="hover:underline">
          Tags
        </Link>
        <span aria-hidden="true"> » </span>
        <span>{decoded}</span>
      </nav>
      <h1 className="page-title mt-4">{decoded}</h1>
      <hr className="mt-6 border-0 border-t border-skin-line" />
      <PostList posts={matched} />
    </main>
  )
}
