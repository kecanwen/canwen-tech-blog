"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { CloseIcon, MenuIcon, MoonIcon, RssIcon, SearchIcon, SunIcon } from "@/components/icons"
import { site } from "@/lib/site"
import { applyTheme, readTheme } from "@/lib/theme"

const links = [
  { href: "/posts", label: "文章" },
  { href: "/tags", label: "标签" },
]

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1)
  return pathname
}

function isCurrent(pathname: string, href: string) {
  const path = normalizePath(pathname)
  const target = normalizePath(href)
  if (target === "/posts") return path === "/posts" || path.startsWith("/posts/")
  if (target === "/tags") return path === "/tags" || path.startsWith("/tags/")
  return path === target
}

export function SiteHeader() {
  const pathname = normalizePath(usePathname() ?? "/")
  const [open, setOpen] = useState(false)
  const onSearch = pathname === "/search"

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 640px)").matches) setOpen(false)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  function toggleTheme() {
    applyTheme(readTheme() === "dark" ? "light" : "dark")
  }

  return (
    <header id="top">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:py-8">
        <Link href="/" className="whitespace-nowrap text-xl font-semibold leading-8 sm:text-2xl">
          {site.title}
        </Link>
        <div className="flex items-center">
          <nav className="hidden items-center gap-4 sm:flex" aria-label="主导航">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="ml-1 flex items-center sm:ml-3">
            <a className="icon-btn inline-flex" href="/rss.xml" aria-label="RSS">
              <RssIcon />
            </a>
            <Link
              href="/search"
              className="icon-btn inline-flex"
              aria-label="搜索"
              aria-current={onSearch ? "page" : undefined}
            >
              <SearchIcon />
            </Link>
            <button
              id="theme-btn"
              type="button"
              className="icon-btn inline-flex"
              aria-label="切换主题"
              onClick={toggleTheme}
            >
              <MoonIcon id="moon-svg" />
              <SunIcon id="sun-svg" />
            </button>
            <button
              type="button"
              className="icon-btn inline-flex sm:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
              <span className="sr-only">{open ? "关闭菜单" : "打开菜单"}</span>
            </button>
          </div>
        </div>
      </div>
      <nav
        id="mobile-nav"
        aria-label="移动端导航"
        hidden={!open}
        className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pb-4 sm:hidden"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="nav-link py-1"
            aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mx-auto w-full max-w-3xl px-4">
        <hr className="border-0 border-t border-skin-line" />
      </div>
    </header>
  )
}
