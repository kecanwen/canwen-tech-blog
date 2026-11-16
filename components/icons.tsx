import type { ReactNode, SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function RssIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 19a1 1 0 1 0 0.01 0" />
      <path d="M5 12a7 7 0 0 1 7 7" />
      <path d="M5 5a14 14 0 0 1 14 14" />
    </Icon>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16.5 20 20.5" />
    </Icon>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 7.2 7.2 0 1 0 20 14.5Z" />
    </Icon>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3.5v1.8M12 18.7v1.8M3.5 12h1.8M18.7 12h1.8M5.8 5.8l1.3 1.3M16.9 16.9l1.3 1.3M18.2 5.8l-1.3 1.3M7.1 16.9l-1.3 1.3" />
    </Icon>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  )
}

export function HashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 4 7.5 20M16.5 4 15 20M4.5 9h16M3.5 15h16" />
    </Icon>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 6 8.5 12l6 6" />
    </Icon>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 6 15.5 12l-6 6" />
    </Icon>
  )
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 14.5 12 8.5l6 6" />
    </Icon>
  )
}
