import Link from "next/link"

const links = [
  ["About", "/about"],
  ["Articles", "/articles"],
  ["Logbook", "/logbook"],
  ["Demo", "/demo"],
  ["Other", "/other"],
  ["Connect", "/connect"]
] as const

export default function Nav() {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <div className="flex items-baseline gap-10">
        <Link href="/" className="font-semibold text-[18px] tracking-tight">
          Tholos.
        </Link>
        <nav className="flex flex-wrap gap-6">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="smallcaps text-[11px] text-brass hover:text-[rgb(var(--teal))] transition"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="hidden md:block mono text-[11px] text-brass">
        inspectable / ablatable / versioned
      </div>
    </div>
  )
}
