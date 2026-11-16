const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://kecanwen.com").replace(/\/$/, "")

export const site = {
  name: "canwen",
  nameZh: "柯灿文",
  role: "AI 全栈工程师 / 资深前端架构",
  title: "canwen · 柯灿文",
  description: "用确定性驯服概率。",
  bio: "柯灿文（canwen）。写门禁、契约、指标和跨语言边界。生成可以是概率的，合进主干的东西不行。",
  url: origin,
  links: [
    { href: "https://odyssey.kecanwen.com", label: "odyssey.kecanwen.com" },
    { href: "https://policymind.kecanwen.com", label: "policymind.kecanwen.com" },
    { href: "https://github.com/kecanwen", label: "github.com/kecanwen" },
  ],
}
