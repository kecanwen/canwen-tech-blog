import "katex/dist/katex.min.css"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, HashIcon } from "@/components/icons"
import { PostBody } from "@/components/post-body"
import { getPost, getPostIndex } from "@/lib/posts"
import { tagHref } from "@/lib/tags"
import { formatDate } from "@/lib/utils"

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

export default async function PostPage({ params }: PostRouteProps) {
  const { slug } = await params
  const [post, posts] = await Promise.all([getPost(slug), getPostIndex()])
  if (!post) notFound()
  const index = posts.findIndex((item) => item.slug === post.slug)
  const previous = index > 0 ? posts[index - 1] : null
  const next = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null

  return (
    <main className="pt-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm">
        <ChevronLeftIcon className="size-4" />
        返回首页
      </Link>
      <h1 className="post-title mt-3">{post.title}</h1>
      {post.date ? (
        <time dateTime={post.date} className="mt-2 block text-base italic text-zinc-400 opacity-80">
          {formatDate(post.date)}
        </time>
      ) : null}
      <article className="mt-8">
        <PostBody html={post.html} />
      </article>
      <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {post.tags.map((tag) => (
          <li key={tag}>
            <Link href={tagHref(tag)} className="inline-flex items-center gap-1 underline underline-offset-4">
              <HashIcon className="size-4" />
              {tag}
            </Link>
          </li>
        ))}
      </ul>
      <a href="#top" className="mt-10 inline-flex w-full items-center justify-center gap-1 text-sm">
        返回顶部
        <ChevronUpIcon className="size-4" />
      </a>
      <hr className="mt-8 border-0 border-t border-dashed border-skin-line" />
      <nav className="mt-6 grid gap-6 sm:grid-cols-2" aria-label="相邻文章">
        {previous ? (
          <Link href={`/posts/${previous.slug}`} className="flex items-start gap-2 text-sm">
            <ChevronLeftIcon className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="block">上一篇</span>
              <span className="mt-1 block opacity-85">{previous.title}</span>
            </span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next ? (
          <Link
            href={`/posts/${next.slug}`}
            className="flex items-start justify-end gap-2 text-right text-sm sm:col-start-2"
          >
            <span>
              <span className="block">下一篇</span>
              <span className="mt-1 block opacity-85">{next.title}</span>
            </span>
            <ChevronRightIcon className="mt-0.5 size-4 shrink-0" />
          </Link>
        ) : null}
      </nav>
    </main>
  )
}
