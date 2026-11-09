import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { PostBrowser } from "@/components/post-browser"
import { getAllTags, getPostIndex } from "@/lib/posts"
import { tagLabel } from "@/lib/tags"

export async function generateStaticParams() {
  const tags = await getAllTags()
  return tags.map((item) => ({ tag: item.tag }))
}

type TagRouteProps = {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: TagRouteProps): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return {
    title: tagLabel(decoded),
    description: `主题「${tagLabel(decoded)}」下的工程笔记。`,
  }
}

export default function TagPage({ params }: TagRouteProps) {
  return (
    <Suspense fallback={<TagFallback />}>
      <TagScreen params={params} />
    </Suspense>
  )
}

async function TagScreen({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const [posts, tags] = await Promise.all([getPostIndex(), getAllTags()])
  if (!tags.some((item) => item.tag === decoded)) notFound()

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <p className="text-xs tracking-[0.2em] text-[var(--ink-faint)] uppercase">主题</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">{tagLabel(decoded)}</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[var(--ink-dim)]">
        只留下打了「{tagLabel(decoded)}」的笔记。原始标签是 {decoded}。
      </p>
      <div className="mt-8">
        <PostBrowser posts={posts} tags={tags} activeTag={decoded} />
      </div>
    </main>
  )
}

function TagFallback() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8" aria-busy="true">
      <p className="text-xs tracking-[0.2em] text-[var(--ink-faint)] uppercase">主题</p>
      <div className="mt-4 h-12 w-48 rounded-lg bg-white/5" />
    </main>
  )
}
