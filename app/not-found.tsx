import type { Metadata } from "next"
import Link from "next/link"

import { ChevronLeftIcon } from "@/components/icons"

export const metadata: Metadata = {
  title: "未找到页面",
}

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col justify-center py-24">
      <p className="text-sm opacity-70">404</p>
      <h1 className="post-title mt-2">这页不在目录里</h1>
      <p className="mt-4 max-w-md">地址可能写错了，或者这篇文章没有公开。</p>
      <Link href="/" className="mt-8 inline-flex items-center gap-1 text-sm">
        <ChevronLeftIcon className="size-4" />
        返回首页
      </Link>
    </main>
  )
}
