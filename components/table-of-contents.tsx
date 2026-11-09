"use client"

import { useEffect, useState } from "react"

import type { TocItem } from "@/lib/types"
import { cn } from "@/lib/utils"

export function TableOfContents({ toc, labelledBy }: { toc: TocItem[]; labelledBy?: string }) {
  const [active, setActive] = useState(toc[0]?.id ?? "")

  useEffect(() => {
    const nodes = toc
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node instanceof HTMLElement)
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible?.target.id) setActive(visible.target.id)
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: [0, 1] },
    )
    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [toc])

  if (toc.length === 0) return null

  return (
    <nav aria-labelledby={labelledBy} className="toc-scroll">
      <ol className="space-y-1.5">
        {toc.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "block border-l py-1 text-[13px] leading-5 text-[var(--ink-dim)] transition-colors hover:text-[var(--ink)]",
                item.depth === 3 ? "pl-4" : "pl-3",
                active === item.id
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
