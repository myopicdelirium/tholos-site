'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

export default function ScrollSection(props: {
  id: string
  eyebrow: string
  title: string
  lead: string
  children: ReactNode
}) {
  return (
    <section id={props.id} className="scroll-mt-28 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="inline-flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#00394F]" />
              <span className="text-[11px] uppercase tracking-[0.24em] text-[#857665]">{props.eyebrow}</span>
            </div>
            <div className="mt-4 text-[28px] sm:text-[34px] leading-[1.05] tracking-tight text-[#1b1b1b]">
              {props.title}
            </div>
            <div className="mt-4 text-[14px] leading-relaxed text-[#3a352f]">
              {props.lead}
            </div>
            <div className="mt-6 h-px w-full bg-[rgba(133,118,101,0.25)]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[28px] border border-[rgba(133,118,101,0.25)] bg-[rgba(255,255,255,0.35)] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.08)]"
          >
            {props.children}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
