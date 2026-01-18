import Link from 'next/link'

const LINKS = [
  { href: '/about', label: 'ABOUT' },
  { href: '/artifacts', label: 'ARTIFACTS' },
  { href: '/logbook', label: 'LOGBOOK' },
  { href: '/#connect', label: 'CONNECT' },
]

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-[#f4f1ea]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-sm text-black/70 hover:text-black/90">
          Myopic Delirium
        </Link>

        <nav className="flex items-center gap-8">
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs tracking-[0.32em] text-black/55 hover:text-black/85"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
