import Link from 'next/link'
import { ARTICLES } from './_data'

export default function ArticlesIndex() {
  return (
    <div className="min-h-screen bg-[#E8E5E0] text-[#1b1b1b]">
      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="text-[11px] uppercase tracking-[0.28em] text-[#857665]">Articles</div>
        <h1 className="mt-5 text-[40px] leading-[1.02] tracking-tight sm:text-[56px]">
          Writing, field notes, and methods
        </h1>
        <div className="mt-5 max-w-2xl text-[14px] leading-relaxed text-[#3a352f] sm:text-[15px]">
          A living compendium. Essays, notes, travelogues, and technical method pages. Replace placeholders as you publish.
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map(a => (
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
      </main>
    </div>
  )
}
