import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function padRank(rank: number) {
  return String(rank).padStart(2, "0")
}

export function formatDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-")
  if (!year || !month || !day) return iso
  return `${year}.${month}.${day}`
}
