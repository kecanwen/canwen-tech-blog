import type { Metadata, Viewport } from "next"
import { IBM_Plex_Mono } from "next/font/google"
import Script from "next/script"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { site } from "@/lib/site"
import { themeInitScript } from "@/lib/theme"

import "./globals.css"

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-plex",
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.title,
  authors: [{ name: `${site.nameZh}（${site.name}）`, url: site.url }],
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  openGraph: {
    title: site.title,
    description: site.description,
    locale: "zh_CN",
    type: "website",
    siteName: site.title,
    url: site.url,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFEFB" },
    { media: "(prefers-color-scheme: dark)", color: "#212737" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={`${plex.variable} h-full`} suppressHydrationWarning>
      <body className="flex min-h-svh flex-col antialiased">
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <a className="skip-link" href="#content">
          跳到正文
        </a>
        <SiteHeader />
        <div id="content" className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-12">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  )
}
