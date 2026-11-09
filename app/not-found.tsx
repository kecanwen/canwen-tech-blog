import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-24">
      <p className="font-mono text-sm text-[var(--accent)]">404</p>
      <h1 className="mt-3 font-serif text-4xl">这页不在目录里</h1>
      <p className="mt-4 max-w-md text-[var(--ink-dim)]">地址可能写错了，或者这篇文章没有公开。</p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/posts">回到文章</Link>
        </Button>
      </div>
    </main>
  )
}
