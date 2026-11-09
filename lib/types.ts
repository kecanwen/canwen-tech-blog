export type TocItem = {
  id: string
  text: string
  depth: 2 | 3
}

export type PostMeta = {
  title: string
  slug: string
  description: string
  tags: string[]
  rank: number
  featured: boolean
  date?: string
  readingMinutes: number
}

export type Post = PostMeta & {
  html: string
  toc: TocItem[]
}
