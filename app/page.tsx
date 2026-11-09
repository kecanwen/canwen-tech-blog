import Link from "next/link"

import { Button } from "@/components/ui/button"
import { LayerStack, type LayerLink } from "@/components/layer-stack"
import { architectureLayers } from "@/lib/layers"
import { getPost, getPostIndex } from "@/lib/posts"
import { site } from "@/lib/site"
import { tagHref, tagLabel } from "@/lib/tags"
import { formatDate, padRank } from "@/lib/utils"

export default async function HomePage() {
  const posts = await getPostIndex()
  const featured = posts.find((post) => post.featured) ?? posts[0]
  if (!featured) return null
  const featuredPost = await getPost(featured.slug)
  const layers: LayerLink[] = architectureLayers.map((layer) => {
    const heading = featuredPost?.toc.find((item) => item.text.includes(layer.match))
    return {
      zh: layer.zh,
      en: layer.en,
      duty: layer.duty,
      href: heading ? `/posts/${featured.slug}#${heading.id}` : `/posts/${featured.slug}`,
    }
  })
  const tagCounts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  }
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  return (
    <main>
      <section className="mx-auto grid w-full max-w-6xl items-end gap-12 px-5 pt-14 pb-16 md:px-8 md:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:pt-24 lg:pb-20">
        <div>
          <p className="rise-in text-xs tracking-[0.22em] text-[var(--ink-faint)] uppercase">笔记 01 · 工程</p>
          <h1 className="mt-5 font-serif text-[2.7rem] leading-[1.12] text-[var(--ink)] sm:text-6xl lg:text-7xl">
            用确定性
            <br />
            驯服概率<span className="text-[var(--accent)]">。</span>
          </h1>
          <div className="draw-line mt-6 h-px w-24 bg-[var(--accent)]" />
          <p className="mt-6 text-lg text-[var(--ink)]">{site.role}</p>
          <p className="mt-3 max-w-xl text-[15px] leading-8 text-[var(--ink-dim)]">
            {site.nameZh}（{site.name}）。写门禁、契约、指标和跨语言边界。生成可以是概率的，合进主干的东西不行。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={`/posts/${featured.slug}`}>阅读旗舰文</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/posts">全部 {posts.length} 篇</Link>
            </Button>
          </div>
        </div>
        <LayerStack layers={layers} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-8 md:px-8">
        <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 text-xs tracking-[0.16em] text-[var(--ink-faint)] uppercase">
            <span className="text-[var(--accent)]">旗舰</span>
            <span>约 {featured.readingMinutes} 分钟</span>
            {featured.date ? <span>{formatDate(featured.date)}</span> : null}
          </div>
          <h2 className="mt-4 max-w-3xl font-serif text-3xl leading-snug md:text-4xl">
            <Link href={`/posts/${featured.slug}`} className="hover:text-[var(--accent)]">
              {featured.title}
            </Link>
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[var(--ink-dim)]">{featured.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {featured.tags.map((tag) => (
              <Link key={tag} href={tagHref(tag)} className="chip" title={tag}>
                {tagLabel(tag)}
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl">按主题</h2>
          <Link href="/posts" className="text-sm text-[var(--ink-dim)] hover:text-[var(--accent)]">
            进入目录
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map(([tag, count]) => (
            <Link key={tag} href={tagHref(tag)} className="chip" title={tag}>
              {tagLabel(tag)}
              <span className="chip-count">{count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pt-2 pb-20 md:px-8">
        <h2 className="font-serif text-2xl">目录</h2>
        <ol className="mt-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/posts/${post.slug}`} className="index-row">
                <span className="index-num font-mono text-xs text-[var(--ink-faint)]">{padRank(post.rank)}</span>
                <span className="min-w-0">
                  <span className="index-title block text-[15px] leading-7 text-[var(--ink)] md:text-base">
                    {post.title}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--ink-faint)] md:hidden">
                    {post.tags.map((tag) => tagLabel(tag)).join(" · ")}
                  </span>
                </span>
                <span className="hidden text-xs text-[var(--ink-faint)] md:block">
                  {post.tags.map((tag) => tagLabel(tag)).join(" · ")}
                </span>
                <span className="text-xs text-[var(--ink-faint)] tabular-nums">{post.readingMinutes} 分钟</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
