import type { ReactNode } from "react"

export default function Button({ children, variant = "primary" }: { children: ReactNode; variant?: "primary" | "ghost" }) {
  if (variant === "primary") {
    return (
      <button className="rounded-lg bg-[rgb(var(--teal))] text-[rgb(var(--mist))] px-4 py-2 text-sm shadow-paper border border-[rgb(var(--brass))/0.25]">
        {children}
      </button>
    )
  }
  return (
    <button className="rounded-lg border rule bg-[rgb(var(--ivory))] px-4 py-2 text-sm text-ink">
      {children}
    </button>
  )
}
