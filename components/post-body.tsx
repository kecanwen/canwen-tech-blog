"use client"

async function copyCode(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.top = "0"
    area.style.left = "0"
    area.style.opacity = "0"
    document.body.appendChild(area)
    area.focus()
    area.select()
    const ok = document.execCommand("copy")
    area.remove()
    return ok
  }
}

export function PostBody({ html }: { html: string }) {
  return (
    <div
      className="prose"
      onClick={(event) => {
        const target = event.target
        if (!(target instanceof Element)) return
        const button = target.closest("button.code-copy")
        if (!(button instanceof HTMLButtonElement)) return
        const pre = button.closest("figure")?.querySelector("pre")
        const text = pre?.innerText ?? ""
        const original = "复制"
        void copyCode(text).then(
          (ok) => {
            button.textContent = ok ? "已复制" : "失败"
            window.setTimeout(() => {
              button.textContent = original
            }, 1400)
          },
        )
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
