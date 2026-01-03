import Link from 'next/link'
import { ARTICLES } from '../../articles/_data'

export default function ArticlesSection() {
  const featured = ARTICLES.slice(0, 3)

  return (
    <section className="relative w-screen left-1/2 -translate-x-1/2 bg-[#E8E5E0]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.55]">
        <div className="absolute inset-0 bg-[radial-gradient(900px_650px_at_20%_20%,rgba(0,57,79,0.09),transparent_60%),radial-gradient(900px_650px_at_80%_40%,rgba(133,118,101,0.09),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#857665]">Articles</div>
            <div className="mt-6 text-[36px] leading-[1.02] tracking-tight text-[#1b1b1b] sm:text-[54px]">
              Selected writing
            </div>
            <div className="mt-6 max-w-2xl text-[14px] leading-relaxed text-[#3a352f] sm:text-[15px]">
              Three recent pieces. Essays, notes, methods, and travelogues. Click to read the full text.
            </div>
          </div>

          <Link
            href="/articles"
            className="inline-flex items-center justify-center rounded-2xl border border-[rgba(133,118,101,0.28)] bg-[rgba(255,255,255,0.35)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-[#1b1b1b] hover:bg-[rgba(255,255,255,0.60)] transition"
          >
            More articles
          </Link>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {featured.map(a => (
            <Link
              key={a.slug}
              href={`/articles/${a.slug}`}
              className="group rounded-2xl border border-[rgba(133,118,101,0.22)] bg-[rgba(255,255,255,0.30)] p-5 hover:bg-[rgba(255,255,255,0.55)] transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#857665]">{a.tag}</div>
                <div className="text-[12px] font-mono text-[#5f564d]">{a.date}</div>
              </div>
              <div className="mt-4 text-[18px] leading-snug tracking-tight">{a.title}</div>
              <div className="mt-3 text-[13px] leading-relaxed text-[#3a352f]">{a.deck}</div>
              <div className="mt-6 text-[12px] uppercase tracking-[0.22em] text-[#00394F] opacity-80 group-hover:opacity-100">
                Read →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 h-px w-full bg-[rgba(133,118,101,0.22)]" />
      </div>
    </section>
  )
}
