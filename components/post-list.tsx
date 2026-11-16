import Link from "next/link"

import { formatDate } from "@/lib/utils"

export type PostListItem = {
  title: string
  slug: string
  date?: string
}

export function PostList({ posts }: { posts: PostListItem[] }) {
  if (posts.length === 0) return null

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.slug} className="my-6">
          <Link
            href={`/posts/${post.slug}`}
            className="group flex w-full flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
          >
            <span className="text-lg font-medium leading-7 group-hover:underline group-hover:decoration-dashed group-hover:underline-offset-4 sm:min-w-0 sm:truncate">
              {post.title}
            </span>
            {post.date ? (
              <time
                dateTime={post.date}
                className="hidden shrink-0 text-sm italic text-zinc-400 opacity-80 sm:block"
              >
                {formatDate(post.date)}
              </time>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
