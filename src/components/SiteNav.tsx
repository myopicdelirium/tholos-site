import Link from 'next/link'

const links = [
  { href: '/about', label: 'ABOUT' },
  { href: '/articles', label: 'ARTICLES' },
  { href: '/logbook', label: 'LOGBOOK' },
  { href: '/artifacts', label: 'ARTIFACTS' },
]

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-50 bg-[#E8E5E0]/80 backdrop-blur border-b rule">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="md-display text-[18px] tracking-tight text-[#1b1b1b] hover:opacity-80">
          Tholos.
        </Link>

        <nav className="flex items-center gap-5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[11px] uppercase tracking-[0.28em] text-[#5f564d] hover:text-[#1b1b1b]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
