"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

export function HoverCard({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className="h-full"
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
