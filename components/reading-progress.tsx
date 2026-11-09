"use client"

import { useEffect, useRef } from "react"

export function ReadingProgress() {
  const trackRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const article = document.getElementById("article")
    const track = trackRef.current
    const bar = barRef.current
    if (!article || !track || !bar) return

    let frame = 0
    const update = () => {
      frame = 0
      const total = article.offsetHeight - window.innerHeight
      const scrolled = Math.min(Math.max(-article.getBoundingClientRect().top, 0), Math.max(total, 0))
      const value = total > 0 ? scrolled / total : 0
      bar.style.transform = `scaleX(${value})`
      track.setAttribute("aria-valuenow", String(Math.round(value * 100)))
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={trackRef}
      className="reading-progress"
      role="progressbar"
      aria-label="阅读进度"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <span ref={barRef} />
    </div>
  )
}
