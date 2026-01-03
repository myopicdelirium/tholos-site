'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { label: 'About', href: '/about' },
  { label: 'Articles', href: '/articles' },
  { label: 'Logbook', href: '/logbook' },
  { label: 'Demo', href: '/demo' },
  { label: 'Other', href: '/other' },
  { label: 'Connect', href: '/connect' },
]

function IconMenu(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className}>
      <path fill="currentColor" d="M4 7h16v2H4zM4 11h16v2H4zM4 15h16v2H4z" />
    </svg>
  )
}

function IconX(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className}>
      <path fill="currentColor" d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z" />
    </svg>
  )
}

export default function SiteNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  return (
    <div className="sticky top-0 z-50">
      <div className="bg-[rgba(232,229,224,0.82)] backdrop-blur supports-[backdrop-filter]:bg-[rgba(232,229,224,0.66)] border-b border-[rgba(133,118,101,0.25)]">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-6">
          <div className="flex items-baseline gap-3">
            <a href="/" className="text-[18px] tracking-tight font-semibold text-[#1b1b1b]">
              Tholos<span className="text-[#857665]">.</span>
            </a>
            <span className="hidden sm:inline text-[12px] uppercase tracking-[0.22em] text-[#857665]">
              inspectable / ablatable / versioned
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-5">
              {links.map(l => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-[12px] uppercase tracking-[0.24em] text-[#5f564d] hover:text-[#1b1b1b] transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen(v => !v)}
              className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-[rgba(133,118,101,0.35)] bg-[rgba(255,255,255,0.35)] text-[#1b1b1b] hover:bg-[rgba(255,255,255,0.55)] transition-colors"
            >
              {open ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              className="fixed inset-0 z-40 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 bottom-0 z-50 w-[min(420px,92vw)] bg-[#E8E5E0] border-l border-[rgba(133,118,101,0.25)] shadow-2xl"
              initial={{ x: 32, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 32, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] uppercase tracking-[0.24em] text-[#857665]">
                    Menu
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-[rgba(133,118,101,0.35)] bg-[rgba(255,255,255,0.35)] text-[#1b1b1b]"
                    aria-label="Close menu"
                  >
                    <IconX className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-6 h-px bg-[rgba(133,118,101,0.25)]" />

                <div className="mt-6 grid gap-3">
                  {links.map(l => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="group rounded-2xl border border-[rgba(133,118,101,0.22)] bg-[rgba(255,255,255,0.35)] px-4 py-4 hover:bg-[rgba(255,255,255,0.55)] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[13px] uppercase tracking-[0.22em] text-[#1b1b1b]">
                          {l.label}
                        </div>
                        <div className="text-[#857665] group-hover:text-[#00394F] transition-colors">
                          →
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl border border-[rgba(133,118,101,0.22)] bg-[rgba(0,57,79,0.06)] px-4 py-4">
                  <div className="text-[12px] uppercase tracking-[0.22em] text-[#00394F]">
                    Position
                  </div>
                  <div className="mt-2 text-[13px] leading-relaxed text-[#3a352f]">
                    A compendium surface for inspectable systems, field notes, and political-ethical constraints.
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
