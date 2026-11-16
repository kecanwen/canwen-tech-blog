import type { Metadata } from "next"
import Link from "next/link"

import { HashIcon } from "@/components/icons"
import { getAllTags } from "@/lib/posts"
import { tagHref } from "@/lib/tags"

export const metadata: Metadata = {
  title: "Tags",
  description: "文章里用过的全部标签。",
}

export default async function TagsPage() {
  const tags = (await getAllTags()).slice().sort((a, b) => a.tag.localeCompare(b.tag, "en", { sensitivity: "base" }))

  return (
    <main className="pt-8">
      <nav aria-label="面包屑" className="text-sm opacity-60">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span aria-hidden="true"> » </span>
        <span>Tags</span>
      </nav>
      <h1 className="page-title mt-3">Tags</h1>
      <p className="mt-2 italic opacity-80">All the tags used in posts.</p>
      <ul className="mt-6 flex flex-wrap">
        {tags.map(({ tag }) => (
          <li key={tag} className="mx-1 my-3">
            <Link href={tagHref(tag)} className="inline-flex items-center gap-1 text-lg">
              <HashIcon className="size-5" />
              <span className="underline decoration-dashed underline-offset-4">{tag}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
