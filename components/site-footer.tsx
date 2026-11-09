import Link from "next/link"

import { site } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-[var(--ink-dim)] md:flex-row md:items-center md:justify-between md:px-8">
        <p>
          <span className="text-[var(--ink)]">{site.name}</span>
          <span className="px-2 text-[var(--line-strong)]">/</span>
          约束写进能复现的工具里。
        </p>
        <div className="flex gap-4">
          <Link href="/posts" className="hover:text-[var(--ink)]">
            文章
          </Link>
          <Link href="/about" className="hover:text-[var(--ink)]">
            关于
          </Link>
        </div>
      </div>
    </footer>
  )
}
