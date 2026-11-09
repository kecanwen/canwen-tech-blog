import Link from "next/link"

import { HoverCard } from "@/components/hover-card"
import { tagHref, tagLabel } from "@/lib/tags"
import type { PostMeta } from "@/lib/types"
import { padRank } from "@/lib/utils"

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <HoverCard>
      <article className="post-card group relative flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
        <div className="flex items-center justify-between gap-3 text-xs text-[var(--ink-faint)]">
          <span className="font-mono tracking-wider">{padRank(post.rank)}</span>
          <span>约 {post.readingMinutes} 分钟</span>
        </div>
        <h2 className="mt-4 font-serif text-xl leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
          <Link
            href={`/posts/${post.slug}`}
            className="after:absolute after:inset-0 after:rounded-2xl after:content-['']"
          >
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--ink-dim)]">{post.description}</p>
        <div className="relative z-10 mt-5 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link key={tag} href={tagHref(tag)} title={tag} className="chip chip-mini">
              {tagLabel(tag)}
            </Link>
          ))}
        </div>
      </article>
    </HoverCard>
  )
}
