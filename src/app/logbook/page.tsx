import Link from 'next/link'
import { LOGBOOK } from './_data'

export default function LogbookIndex() {
  return (
    <div className="min-h-screen bg-[#E8E5E0] text-[#1b1b1b]">
      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="text-[11px] uppercase tracking-[0.28em] text-[#857665]">Logbook</div>
        <h1 className="mt-5 text-[40px] leading-[1.02] tracking-tight sm:text-[56px]">
          Releases, patches, and working paper drops
        </h1>
        <div className="mt-5 max-w-2xl text-[14px] leading-relaxed text-[#3a352f] sm:text-[15px]">
          Development updates intended for outsiders: what shipped, what changed, what’s next.
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LOGBOOK.map(e => (
            <Link
              key={e.slug}
              href={`/logbook/${e.slug}`}
              className="group rounded-2xl border border-[rgba(133,118,101,0.22)] bg-[rgba(255,255,255,0.30)] p-5 hover:bg-[rgba(255,255,255,0.55)] transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#857665]">{e.tag}</div>
                <div className="text-[12px] font-mono text-[#5f564d]">{e.date}</div>
              </div>
              <div className="mt-4 text-[18px] leading-snug tracking-tight">{e.title}</div>
              <div className="mt-3 text-[13px] leading-relaxed text-[#3a352f]">{e.deck}</div>
              <div className="mt-6 text-[12px] uppercase tracking-[0.22em] text-[#00394F] opacity-80 group-hover:opacity-100">
                Open →
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
