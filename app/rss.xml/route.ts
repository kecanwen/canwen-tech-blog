import { getPostIndex } from "@/lib/posts"
import { site } from "@/lib/site"

export const dynamic = "force-static"

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function rfc822(iso: string) {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  return date.toUTCString()
}

export async function GET() {
  const posts = await getPostIndex()
  const origin = site.url.replace(/\/$/, "")
  const items = posts
    .map((post) => {
      const link = `${origin}/posts/${post.slug}/`
      const categories = post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")
      const published = post.date ? rfc822(post.date) : null
      const pubDate = published ? `      <pubDate>${published}</pubDate>\n` : ""
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(post.description)}</description>
${pubDate}${categories}
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${origin}/</link>
    <description>${escapeXml(site.description)}</description>
    <language>zh-CN</language>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  })
}
