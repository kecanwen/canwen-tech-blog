export function readingMinutes(markdown: string) {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, " ")
  const han = withoutCode.match(/[\u4e00-\u9fff]/g)?.length ?? 0
  const words = withoutCode
    .replace(/[\u4e00-\u9fff]/g, " ")
    .split(/\s+/)
    .filter((word) => /[A-Za-z0-9]/.test(word)).length
  return Math.max(1, Math.round(han / 420 + words / 180))
}
