import Link from "next/link"

import { PostCard } from "@/components/post-card"
import { tagHref, tagLabel } from "@/lib/tags"
import type { PostMeta } from "@/lib/types"
import { cn } from "@/lib/utils"

export function PostBrowser({
  posts,
  tags,
  activeTag,
}: {
  posts: PostMeta[]
  tags: { tag: string; count: number }[]
  activeTag: string | null
}) {
  const visible = activeTag ? posts.filter((post) => post.tags.includes(activeTag)) : posts

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="navigation" aria-label="按主题筛选">
        <Link href="/posts" className={cn("chip", activeTag === null && "is-on")} aria-current={activeTag === null ? "page" : undefined}>
          全部
          <span className="chip-count">{posts.length}</span>
        </Link>
        {tags.map((item) => (
          <Link
            key={item.tag}
            href={tagHref(item.tag)}
            title={item.tag}
            className={cn("chip", activeTag === item.tag && "is-on")}
            aria-current={activeTag === item.tag ? "page" : undefined}
          >
            {tagLabel(item.tag)}
            <span className="chip-count">{item.count}</span>
          </Link>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-[var(--line-strong)] px-6 py-16 text-center">
          <p className="font-serif text-2xl text-[var(--ink)]">这个主题下还没有文章</p>
          <p className="mt-3 text-sm text-[var(--ink-dim)]">换一个标签，或者回到全部目录。</p>
          <Link href="/posts" className="mt-6 inline-flex text-sm text-[var(--accent)]">
            查看全部文章
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {visible.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
