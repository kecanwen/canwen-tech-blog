import GithubSlugger from "github-slugger"
import { toString } from "mdast-util-to-string"
import rehypeKatex from "rehype-katex"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeStringify from "rehype-stringify"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"
import { visit } from "unist-util-visit"
import type { Element, ElementContent, Root as HastRoot } from "hast"
import type { Blockquote, Heading, Paragraph, Root, Text } from "mdast"

import type { TocItem } from "@/lib/types"

const WIKI_LINKS: Record<string, string> = {
  "AI Coding 体系架构图全景分析": "/posts/ai-coding-architecture-panorama",
}

const FENCE_LANGS = new Set([
  "typescript",
  "ts",
  "tsx",
  "javascript",
  "js",
  "jsx",
  "bash",
  "sh",
  "shell",
  "yaml",
  "yml",
  "json",
  "html",
  "css",
  "vue",
  "python",
  "py",
  "go",
  "java",
  "sql",
  "diff",
  "markdown",
  "md",
  "plaintext",
  "text",
  "txt",
])

function normalizeFences(markdown: string) {
  let open = false
  return markdown
    .split("\n")
    .map((line) => {
      if (!open && line.startsWith("```")) {
        open = true
        const info = line.slice(3).trim()
        const lang = info.split(/\s+/)[0] ?? ""
        if (!lang || !FENCE_LANGS.has(lang)) return "```plaintext"
        if (lang === "text" || lang === "txt") return "```plaintext"
        return line
      }
      if (open && /^```\s*$/.test(line)) open = false
      return line
    })
    .join("\n")
}

function rewriteWikiAndCallouts(markdown: string) {
  let text = markdown.replace(/^[ \t]*!\s*\[\[[^\]]*\]\][ \t]*$/gm, "")
  text = text.replace(
    /\[\[([^\]\n|]+?)(?:\|([^\]\n]+))?\]\]/g,
    (_, target: string, alias?: string) => {
      const key = target.trim()
      const label = (alias ?? target).trim()
      const href = WIKI_LINKS[key]
      return href ? `[${label}](${href})` : label
    },
  )
  text = normalizeFences(text)

  const lines = text.split("\n")
  const out: string[] = []
  let inFence = false
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    if (line.startsWith("```")) {
      inFence = !inFence
      out.push(line)
      continue
    }
    if (inFence) {
      out.push(line)
      continue
    }
    const marker = line.match(/^> \[!(important|tip|warning|note)\]\s*$/i)
    if (!marker) {
      out.push(line)
      continue
    }
    const kind = marker[1]?.toLowerCase() ?? "note"
    const block: string[] = []
    index += 1
    while (index < lines.length && /^>/.test(lines[index] ?? "")) {
      block.push(lines[index] ?? "")
      index += 1
    }
    index -= 1
    out.push(`> :::callout-${kind}`)
    out.push(">")
    let openedList = false
    for (const entry of block) {
      if (/^> \d+\.\s/.test(entry) && !openedList) {
        out.push(">")
        openedList = true
      }
      out.push(entry)
    }
  }
  return out.join("\n")
}

function stripLeadingH1(markdown: string) {
  return markdown.replace(/^\s*#\s+[^\n]+\n+/, "")
}

function promoteDisplayMath(markdown: string) {
  let inFence = false
  return markdown
    .split("\n")
    .map((line) => {
      if (line.startsWith("```")) {
        inFence = !inFence
        return line
      }
      if (inFence) return line
      const match = line.match(/^\$\$(.+)\$\$\s*$/)
      if (!match) return line
      return `$$\n${match[1]}\n$$`
    })
    .join("\n")
}

function remarkCallouts() {
  return (tree: Root) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0]
      if (!first || first.type !== "paragraph") return
      const text = toString(first).trim()
      const match = text.match(/^:::callout-(important|tip|warning|note)$/)
      if (!match) return
      const kind = match[1]
      const data = (node.data ??= {}) as { hProperties?: Record<string, unknown> }
      data.hProperties = {
        ...data.hProperties,
        className: ["callout", `callout-${kind}`],
        "data-callout": kind,
      }
      node.children.shift()
    })
  }
}

function remarkQuoteBreaks() {
  return (tree: Root) => {
    visit(tree, "blockquote", (blockquote: Blockquote) => {
      visit(blockquote, "paragraph", (paragraph: Paragraph) => {
        const next: Paragraph["children"] = []
        for (const child of paragraph.children) {
          if (child.type !== "text" || !child.value.includes("\n")) {
            next.push(child)
            continue
          }
          const parts = child.value.split("\n")
          parts.forEach((part, partIndex) => {
            if (part) next.push({ type: "text", value: part } satisfies Text)
            if (partIndex < parts.length - 1) next.push({ type: "break" })
          })
        }
        paragraph.children = next
      })
    })
  }
}

function remarkToc(toc: TocItem[]) {
  const slugger = new GithubSlugger()
  return (tree: Root) => {
    visit(tree, "heading", (node: Heading) => {
      if (node.depth !== 2 && node.depth !== 3) return
      const text = toString(node).replace(/\s+/g, " ").trim()
      const id = slugger.slug(text)
      const data = (node.data ??= {}) as { hProperties?: Record<string, unknown> }
      data.hProperties = { ...data.hProperties, id }
      toc.push({ id, text, depth: node.depth })
    })
  }
}

function rehypeChrome() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "figure") return
      if (!node.properties || !("data-rehype-pretty-code-figure" in node.properties)) return
      const pre = node.children.find(
        (child): child is Element => child.type === "element" && child.tagName === "pre",
      )
      const lang = pre?.properties?.["data-language"]
      const label = typeof lang === "string" && lang !== "plaintext" ? lang : "text"
      const chrome: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["code-chrome"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["code-lang"] },
            children: [{ type: "text", value: label }],
          },
          {
            type: "element",
            tagName: "button",
            properties: {
              type: "button",
              className: ["code-copy"],
              "aria-label": "复制代码",
              "aria-live": "polite",
            },
            children: [{ type: "text", value: "复制" }],
          },
        ],
      }
      node.children.unshift(chrome)
    })

    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || parent == null || index == null) return
      const wrapped: Element = {
        type: "element",
        tagName: "div",
        properties: {
          className: ["table-scroll"],
          tabIndex: 0,
          role: "region",
          "aria-label": "可横向滚动的表格",
        },
        children: [node],
      }
      ;(parent.children as ElementContent[])[index] = wrapped
    })
  }
}

export async function compileMarkdown(source: string) {
  const toc: TocItem[] = []
  const markdown = promoteDisplayMath(rewriteWikiAndCallouts(stripLeadingH1(source)))
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkCallouts)
    .use(remarkQuoteBreaks)
    .use(() => remarkToc(toc))
    .use(remarkRehype)
    .use(rehypeKatex, { throwOnError: false, strict: "ignore" } as never)
    .use(rehypePrettyCode, {
      theme: "github-dark-dimmed",
      keepBackground: false,
      defaultLang: "plaintext",
      grid: false,
      bypassInlineCode: true,
    })
    .use(rehypeChrome)
    .use(rehypeStringify)
    .process(markdown)

  return { html: String(file), toc }
}
