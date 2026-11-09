"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

const links = [
  { href: "/posts", label: "文章" },
  { href: "/about", label: "关于" },
]

function isCurrent(pathname: string | null, href: string) {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

function HeaderBar({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="group flex items-baseline gap-2 rounded-sm" aria-label={`${site.name} 首页`}>
          <span className="font-serif text-lg tracking-tight text-[var(--ink)]">canwen</span>
          <span className="text-sm text-[var(--ink-dim)] transition-colors group-hover:text-[var(--accent)]">
            {site.nameZh}
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm text-[var(--ink-dim)] transition-colors hover:text-[var(--ink)]",
                isCurrent(pathname, link.href) && "bg-white/5 text-[var(--ink)]",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink)] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden className="size-4" /> : <Menu aria-hidden className="size-4" />}
          <span className="sr-only">{open ? "关闭菜单" : "打开菜单"}</span>
        </button>
      </div>
      {open ? (
        <nav id="mobile-nav" className="border-t border-[var(--line)] px-5 py-3 md:hidden" aria-label="移动端导航">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
              className="block rounded-lg px-2 py-3 text-base text-[var(--ink)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  return <HeaderBar pathname={pathname} />
}

export function SiteHeaderFallback() {
  return <HeaderBar pathname={null} />
}
