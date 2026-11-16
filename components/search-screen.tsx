"use client"

import { useRef, useState } from "react"

import { PostList, type PostListItem } from "@/components/post-list"

export type SearchablePost = PostListItem & {
  description: string
  tags: string[]
}

export function SearchScreen({ posts }: { posts: SearchablePost[] }) {
  const [query, setQuery] = useState("")
  const [filterQuery, setFilterQuery] = useState("")
  const composing = useRef(false)
  const needle = filterQuery.trim().toLowerCase()
  const filtered = needle
    ? posts.filter((post) => {
        const haystack = [post.title, post.description, ...post.tags].join("\n").toLowerCase()
        return haystack.includes(needle)
      })
    : posts

  return (
    <div>
      <label htmlFor="q" className="sr-only">
        关键词
      </label>
      <input
        id="q"
        type="search"
        value={query}
        placeholder="搜索文章"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        className="search-input"
        onCompositionStart={() => {
          composing.current = true
        }}
        onCompositionEnd={(event) => {
          composing.current = false
          setFilterQuery(event.currentTarget.value)
        }}
        onChange={(event) => {
          const value = event.target.value
          setQuery(value)
          if (!composing.current) setFilterQuery(value)
        }}
      />
      <p className="sr-only" aria-live="polite">
        {needle ? `${filtered.length} 篇匹配` : `${posts.length} 篇文章`}
      </p>
      {filtered.length > 0 ? (
        <div className="mt-4">
          <PostList posts={filtered} />
        </div>
      ) : (
        <p className="mt-8 text-sm opacity-70">没有匹配的文章。</p>
      )}
    </div>
  )
}
