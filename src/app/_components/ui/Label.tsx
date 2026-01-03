import type { ReactNode } from "react"

export default function Label({ children }: { children: ReactNode }) {
  return <div className="smallcaps text-xs text-brass">{children}</div>
}
