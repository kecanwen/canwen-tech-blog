"use client"

import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"

import { padRank } from "@/lib/utils"

export type LayerLink = {
  zh: string
  en: string
  duty: string
  href: string
}

export function LayerStack({ layers }: { layers: LayerLink[] }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="text-xs tracking-[0.18em] text-[var(--ink-faint)] uppercase">六层架构</p>
        <p className="text-xs text-[var(--ink-faint)]">悬停看每一层在管什么</p>
      </div>
      <ol className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)]/80" onMouseLeave={() => setActive(0)}>
        {layers.map((layer, index) => {
          const current = active === index
          return (
            <li key={layer.en} className="relative border-t border-[var(--line)] first:border-t-0">
              {current && !reduce ? (
                <motion.span
                  layoutId="layer-wash"
                  className="absolute inset-0 bg-[rgba(198,246,212,0.06)]"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              ) : null}
              <Link
                href={layer.href}
                className="relative flex items-start gap-3 px-4 py-3 outline-none"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
              >
                <span
                  className={`w-6 shrink-0 pt-0.5 font-mono text-xs ${current ? "text-[var(--accent)]" : "text-[var(--ink-faint)]"}`}
                >
                  {padRank(index + 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={`text-[15px] ${current ? "text-[var(--ink)]" : "text-[var(--ink-dim)]"}`}>
                      {layer.zh}
                    </span>
                    <span className="hidden font-mono text-[11px] tracking-wide text-[var(--ink-faint)] sm:inline">
                      {layer.en}
                    </span>
                  </span>
                  <span className={`layer-duty ${current ? "is-open" : ""}`}>
                    <span className="min-h-0 overflow-hidden">
                      <span className="block pt-1 text-sm leading-6 text-[var(--ink-dim)]">{layer.duty}</span>
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
