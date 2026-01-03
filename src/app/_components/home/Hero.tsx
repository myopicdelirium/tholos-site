'use client'

import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="pt-14 sm:pt-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(133,118,101,0.25)] bg-[rgba(255,255,255,0.35)] px-4 py-2 shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
          <span className="text-[11px] uppercase tracking-[0.24em] text-[#857665]">Build</span>
          <span className="text-[12px] font-mono text-[#1b1b1b]">v0.1.0</span>
          <span className="text-[#857665]">•</span>
          <span className="text-[11px] uppercase tracking-[0.24em] text-[#857665]">Updated</span>
          <span className="text-[12px] font-mono text-[#1b1b1b]">2025-12-24</span>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-[44px] leading-[0.98] tracking-tight text-[#1b1b1b] sm:text-[64px]">
              TTTTT
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[#3a352f]">
              WWWWW
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/demo"
                className="inline-flex items-center justify-center rounded-2xl bg-[#00394F] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-[#E8E5E0] shadow-[0_18px_55px_rgba(0,0,0,0.16)] hover:translate-y-[-1px] transition"
              >
                Enter Demo
              </a>
              <a
                href="/logbook"
                className="inline-flex items-center justify-center rounded-2xl border border-[rgba(133,118,101,0.35)] bg-[rgba(255,255,255,0.35)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-[#1b1b1b] hover:bg-[rgba(255,255,255,0.55)] transition"
              >
                Read Logbook
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[28px] border border-[rgba(133,118,101,0.25)] bg-[rgba(255,255,255,0.35)] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.10)]"
          >
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#857665]">Field Notes</div>
            <div className="mt-3 grid gap-3">
              <div className="rounded-2xl border border-[rgba(133,118,101,0.18)] bg-[rgba(0,57,79,0.06)] px-4 py-4">
                <div className="text-[12px] uppercase tracking-[0.22em] text-[#00394F]">TTTTT</div>
                <div className="mt-2 text-[13px] leading-relaxed text-[#3a352f]">WWWWW</div>
              </div>
              <div className="rounded-2xl border border-[rgba(133,118,101,0.18)] bg-[rgba(255,255,255,0.25)] px-4 py-4">
                <div className="text-[12px] uppercase tracking-[0.22em] text-[#857665]">TTTTT</div>
                <div className="mt-2 text-[13px] leading-relaxed text-[#3a352f]">WWWWW</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
