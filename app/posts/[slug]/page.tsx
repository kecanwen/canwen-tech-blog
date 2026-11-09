import "katex/dist/katex.min.css"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { PostBody } from "@/components/post-body"
import { ReadingProgress } from "@/components/reading-progress"
import { TableOfContents } from "@/components/table-of-contents"
import { getPost, getPostIndex } from "@/lib/posts"
import { tagHref, tagLabel } from "@/lib/tags"
import { formatDate, padRank } from "@/lib/utils"

export async function generateStaticParams() {
  const posts = await getPostIndex()
  return posts.map((post) => ({ slug: post.slug }))
}

type PostRouteProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostRouteProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "未找到文章" }
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
    },
  }
}

export default function PostPage({ params }: PostRouteProps) {
  return (
    <Suspense fallback={<PostFallback />}>
      <PostScreen params={params} />
    </Suspense>
  )
}

async function PostScreen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, posts] = await Promise.all([getPost(slug), getPostIndex()])
  if (!post) notFound()
  const index = posts.findIndex((item) => item.slug === post.slug)
  const previous = index > 0 ? posts[index - 1] : null
  const next = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null

  return (
    <>
      <ReadingProgress />
      <main className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <p className="rise-in text-sm text-[var(--ink-faint)]">
          <Link href="/posts" className="hover:text-[var(--accent)]">
            文章
          </Link>
          <span className="px-2">/</span>
          <span className="font-mono">{padRank(post.rank)}</span>
        </p>
        <header className="mt-4 max-w-3xl">
          <h1 className="font-serif text-3xl leading-tight md:text-5xl">{post.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--ink-dim)]">
            {post.date ? <time dateTime={post.date}>{formatDate(post.date)}</time> : <span>笔记</span>}
            <span>约 {post.readingMinutes} 分钟</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link key={tag} href={tagHref(tag)} className="chip" title={tag}>
                {tagLabel(tag)}
              </Link>
            ))}
          </div>
        </header>

        {post.toc.length > 0 ? (
          <details className="toc-disclosure mt-8 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 lg:hidden">
            <summary className="cursor-pointer text-sm text-[var(--ink)]">目录 · {post.toc.length}</summary>
            <div className="mt-3">
              <TableOfContents toc={post.toc} />
            </div>
          </details>
        ) : null}

        <div className="mt-10 grid items-start gap-12 lg:grid-cols-[minmax(0,42rem)_220px]">
          <article id="article" className="min-w-0">
            <PostBody html={post.html} />
            <nav className="mt-14 grid gap-3 border-t border-[var(--line)] pt-6 sm:grid-cols-2" aria-label="相邻文章">
              {previous ? (
                <Link href={`/posts/${previous.slug}`} className="rounded-2xl border border-[var(--line)] p-4 hover:border-[var(--accent)]">
                  <span className="text-xs text-[var(--ink-faint)]">上一篇</span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--ink)]">{previous.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={`/posts/${next.slug}`}
                  className="rounded-2xl border border-[var(--line)] p-4 text-left hover:border-[var(--accent)] sm:text-right"
                >
                  <span className="text-xs text-[var(--ink-faint)]">下一篇</span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--ink)]">{next.title}</span>
                </Link>
              ) : null}
            </nav>
          </article>
          {post.toc.length > 0 ? (
            <aside className="sticky top-24 hidden lg:block">
              <p id="toc-label" className="mb-3 text-xs tracking-[0.16em] text-[var(--ink-faint)] uppercase">
                目录
              </p>
              <TableOfContents toc={post.toc} labelledBy="toc-label" />
            </aside>
          ) : null}
        </div>
      </main>
    </>
  )
}

function PostFallback() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16" aria-busy="true">
      <div className="h-4 w-24 rounded bg-white/10" />
      <div className="mt-6 h-12 w-4/5 rounded bg-white/10" />
      <div className="mt-4 h-4 w-2/3 rounded bg-white/5" />
      <div className="mt-10 space-y-3">
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-11/12 rounded bg-white/5" />
        <div className="h-4 w-4/5 rounded bg-white/5" />
      </div>
    </main>
  )
}
