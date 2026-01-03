import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LOGBOOK } from '../_data'

export default function LogEntryPage({ params }: { params: { slug: string } }) {
  const entry = LOGBOOK.find(e => e.slug === params.slug)
  if (!entry) notFound()

  return (
    <div className="min-h-screen bg-[#E8E5E0] text-[#1b1b1b]">
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#857665]">{entry.tag}</div>
          <div className="text-[12px] font-mono text-[#5f564d]">{entry.date}</div>
        </div>

        <h1 className="mt-6 text-[40px] leading-[1.02] tracking-tight sm:text-[56px]">
          {entry.title}
        </h1>

        <div className="mt-6 text-[15px] leading-relaxed text-[#3a352f]">
          {entry.deck}
        </div>

        <div className="mt-10 h-px bg-[rgba(133,118,101,0.22)]" />

        <article className="mt-10">
          {entry.body.map((p, i) => (
            <p key={i} className="mt-4 text-[15px] leading-relaxed text-[#1b1b1b]">
              {p}
            </p>
          ))}
        </article>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/logbook"
            className="inline-flex items-center justify-center rounded-2xl border border-[rgba(133,118,101,0.28)] bg-[rgba(255,255,255,0.35)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-[#1b1b1b] hover:bg-[rgba(255,255,255,0.60)] transition"
          >
            Back to Logbook
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-[rgba(133,118,101,0.22)] bg-transparent px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-[#5f564d] hover:text-[#1b1b1b] transition"
          >
            Home
          </Link>
        </div>
      </main>
    </div>
  )
}
