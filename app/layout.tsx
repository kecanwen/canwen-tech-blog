import type { Metadata } from "next"
import localFont from "next/font/local"
import { Suspense } from "react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader, SiteHeaderFallback } from "@/components/site-header"
import { site } from "@/lib/site"

import "./globals.css"

const sans = localFont({
  src: [
    { path: "../fonts/noto-sans-sc-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/noto-sans-sc-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans-loaded",
  display: "swap",
})

const serif = localFont({
  src: [{ path: "../fonts/noto-serif-sc-600.woff2", weight: "600", style: "normal" }],
  variable: "--font-serif-loaded",
  display: "swap",
})

const mono = localFont({
  src: [
    { path: "../fonts/jetbrains-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/jetbrains-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono-loaded",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: site.url ? new URL(site.url) : undefined,
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  authors: [{ name: `${site.nameZh}（${site.name}）` }],
  openGraph: {
    title: site.title,
    description: site.description,
    locale: "zh_CN",
    type: "website",
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={`${sans.variable} ${serif.variable} ${mono.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <a className="skip-link" href="#content">
          跳到正文
        </a>
        <Suspense fallback={<SiteHeaderFallback />}>
          <SiteHeader />
        </Suspense>
        <div id="content" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  )
}
