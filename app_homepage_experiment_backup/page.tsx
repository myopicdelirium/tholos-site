import SiteNav from './components/SiteNav'
import Hero from './components/Hero'
import ScrollSection from './components/ScrollSection'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#E8E5E0] text-[#1b1b1b]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.55]">
        <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_30%_15%,rgba(0,57,79,0.10),transparent_60%),radial-gradient(900px_600px_at_70%_25%,rgba(133,118,101,0.10),transparent_55%),radial-gradient(900px_600px_at_40%_85%,rgba(0,0,0,0.06),transparent_55%)]" />
      </div>

      <div className="relative">
        <SiteNav />
        <main>
          <Hero />

          <ScrollSection
            id="thesis"
            eyebrow="Plate I"
            title="TTTTT"
            lead="WWWWW"
          >
            <div className="grid gap-4">
              <div className="rounded-2xl border border-[rgba(133,118,101,0.18)] bg-[rgba(0,57,79,0.06)] px-5 py-5">
                <div className="text-[12px] uppercase tracking-[0.22em] text-[#00394F]">TTTTT</div>
                <div className="mt-2 text-[14px] leading-relaxed text-[#3a352f]">WWWWW</div>
              </div>
              <div className="rounded-2xl border border-[rgba(133,118,101,0.18)] bg-[rgba(255,255,255,0.25)] px-5 py-5">
                <div className="text-[12px] uppercase tracking-[0.22em] text-[#857665]">TTTTT</div>
                <div className="mt-2 text-[14px] leading-relaxed text-[#3a352f]">WWWWW</div>
              </div>
            </div>
          </ScrollSection>

          <ScrollSection
            id="mechanisms"
            eyebrow="Plate II"
            title="TTTTT"
            lead="WWWWW"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[rgba(133,118,101,0.18)] bg-[rgba(255,255,255,0.25)] p-5">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#857665]">TTTTT</div>
                <div className="mt-2 text-[14px] leading-relaxed text-[#3a352f]">WWWWW</div>
                <div className="mt-5 h-px bg-[rgba(133,118,101,0.22)]" />
                <div className="mt-4 text-[12px] font-mono text-[#5f564d]">Mechanism 1.0</div>
              </div>
              <div className="rounded-2xl border border-[rgba(133,118,101,0.18)] bg-[rgba(0,57,79,0.06)] p-5">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#00394F]">TTTTT</div>
                <div className="mt-2 text-[14px] leading-relaxed text-[#3a352f]">WWWWW</div>
                <div className="mt-5 h-px bg-[rgba(133,118,101,0.22)]" />
                <div className="mt-4 text-[12px] font-mono text-[#5f564d]">Ablation-ready</div>
              </div>
            </div>
          </ScrollSection>

          <ScrollSection
            id="logbook"
            eyebrow="Plate III"
            title="TTTTT"
            lead="WWWWW"
          >
            <div className="grid gap-3">
              {['Entry 0001', 'Entry 0002', 'Entry 0003'].map(x => (
                <a
                  key={x}
                  href="/logbook"
                  className="group rounded-2xl border border-[rgba(133,118,101,0.18)] bg-[rgba(255,255,255,0.25)] px-5 py-4 hover:bg-[rgba(255,255,255,0.45)] transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[12px] uppercase tracking-[0.22em] text-[#1b1b1b]">{x}</div>
                      <div className="mt-1 text-[13px] text-[#3a352f]">WWWWW</div>
                    </div>
                    <div className="text-[#857665] group-hover:text-[#00394F] transition-colors">→</div>
                  </div>
                </a>
              ))}
            </div>
          </ScrollSection>

          <section className="py-20">
            <div className="mx-auto max-w-6xl px-6">
              <div className="rounded-[30px] border border-[rgba(133,118,101,0.25)] bg-[#00394F] text-[#E8E5E0] shadow-[0_30px_90px_rgba(0,0,0,0.20)]">
                <div className="p-8 sm:p-10">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[rgba(232,229,224,0.80)]">
                    Terminal access
                  </div>
                  <div className="mt-4 text-[28px] sm:text-[34px] leading-[1.05] tracking-tight">
                    TTTTT
                  </div>
                  <div className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[rgba(232,229,224,0.86)]">
                    WWWWW
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a
                      href="/demo"
                      className="inline-flex items-center justify-center rounded-2xl bg-[#E8E5E0] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-[#00394F] hover:translate-y-[-1px] transition"
                    >
                      Open Demo
                    </a>
                    <a
                      href="/connect"
                      className="inline-flex items-center justify-center rounded-2xl border border-[rgba(232,229,224,0.35)] bg-[rgba(232,229,224,0.10)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-[#E8E5E0] hover:bg-[rgba(232,229,224,0.16)] transition"
                    >
                      Correspondence
                    </a>
                  </div>
                </div>
                <div className="h-px bg-[rgba(232,229,224,0.20)]" />
                <div className="px-8 py-5 text-[11px] uppercase tracking-[0.24em] text-[rgba(232,229,224,0.72)]">
                  inspectable / ablatable / versioned
                </div>
              </div>
            </div>
          </section>

          <footer className="pb-16">
            <div className="mx-auto max-w-6xl px-6">
              <div className="h-px bg-[rgba(133,118,101,0.25)]" />
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="text-[12px] uppercase tracking-[0.24em] text-[#857665]">
                  Tholos
                </div>
                <div className="text-[12px] font-mono text-[#5f564d]">
                  BUILD v0.1.0
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
