import fs from "node:fs"
import path from "node:path"

import matter from "gray-matter"

import { compileMarkdown } from "@/lib/markdown"
import { readingMinutes } from "@/lib/reading-time"
import type { Post, PostMeta } from "@/lib/types"

const POSTS_DIR = path.join(process.cwd(), "content/posts")

type Frontmatter = {
  title?: unknown
  slug?: unknown
  description?: unknown
  tags?: unknown
  rank?: unknown
  featured?: unknown
  date?: unknown
}

function asString(value: unknown, field: string, file: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${file} 缺少字符串字段 ${field}`)
  }
  return value.trim()
}

function asDate(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim().slice(0, 10)
  return undefined
}

function toMeta(data: Frontmatter, content: string, file: string): PostMeta {
  const tags = Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === "string") : []
  if (tags.length === 0) throw new Error(`${file} 缺少 tags`)
  const rank = typeof data.rank === "number" ? data.rank : Number(data.rank)
  if (!Number.isFinite(rank)) throw new Error(`${file} 缺少 rank`)
  return {
    title: asString(data.title, "title", file),
    slug: asString(data.slug, "slug", file),
    description: asString(data.description, "description", file),
    tags,
    rank,
    featured: data.featured === true,
    date: asDate(data.date),
    readingMinutes: readingMinutes(content),
  }
}

function listFiles() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort()
}

export async function getPostIndex(): Promise<PostMeta[]> {
  const posts = listFiles().map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8")
    const parsed = matter(raw)
    const meta = toMeta(parsed.data as Frontmatter, parsed.content, file)
    if (`${meta.slug}.md` !== file) {
      throw new Error(`${file} 的 slug 与文件名不一致：${meta.slug}`)
    }
    return meta
  })
  posts.sort((a, b) => a.rank - b.rank)
  return posts
}

export async function getPost(slug: string): Promise<Post | null> {
  const file = path.join(POSTS_DIR, `${slug}.md`)
  if (!fs.existsSync(file)) return null
  const raw = fs.readFileSync(file, "utf8")
  const parsed = matter(raw)
  const meta = toMeta(parsed.data as Frontmatter, parsed.content, `${slug}.md`)
  if (meta.slug !== slug) return null
  const { html, toc } = await compileMarkdown(parsed.content)
  return { ...meta, html, toc }
}

export async function getAllTags() {
  const posts = await getPostIndex()
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}
