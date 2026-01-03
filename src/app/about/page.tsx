import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="w-full">
      <section className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden bg-[#0b0b0b] text-[#F6F1E7]">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <div className="smallcaps text-[12px] tracking-[0.34em] opacity-70">About</div>

              <h1 className="mt-6 md-display text-[44px] sm:text-[60px] leading-[1.02] tracking-[-0.02em]">
                Our Mission
              </h1>

              <div className="mt-8 text-[16px] sm:text-[18px] leading-[1.75] text-[rgba(246,241,231,0.86)] max-w-[62ch]">
                Instead of treating agents as legible optimizers, we focus on making their internal architecture
                fuller. In most sociological models, it’s efficient to compress human stand-ins with simple needs
                and stable preferences, because it makes systems easier to analyze. Our work is driven by a
                curiosity about happens when you unravel those simplifications. Attention narrows, memory decays
                and distorts, motives conflict, and meaning is misread as we try to capture as much of the mess of
                patterns within our cognitive architecture we can.
              </div>

              <div className="mt-10 flex items-center gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-[rgba(246,241,231,0.22)] px-5 py-2 text-[12px] tracking-[0.26em] uppercase text-[rgba(246,241,231,0.9)] hover:bg-[rgba(246,241,231,0.08)] transition"
                >
                  Back to Home
                </Link>

                <Link
                  href="/connect"
                  className="inline-flex items-center rounded-full border border-[rgba(246,241,231,0.16)] px-5 py-2 text-[12px] tracking-[0.26em] uppercase text-[rgba(246,241,231,0.75)] hover:bg-[rgba(246,241,231,0.06)] transition"
                >
                  Connect
                </Link>
              </div>
            </div>

            <div className="lg:pt-2">
              <div className="relative overflow-hidden rounded-3xl border border-[rgba(246,241,231,0.18)] shadow-[0_22px_90px_rgba(0,0,0,0.55)]">
                <div className="aspect-[4/5] w-full bg-[radial-gradient(900px_650px_at_30%_25%,rgba(255,255,255,0.10),transparent_60%),radial-gradient(700px_520px_at_80%_40%,rgba(0,114,156,0.14),transparent_62%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.12))]" />
                <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_20%_20%,rgba(0,0,0,0.20),transparent_60%),linear-gradient(to_bottom,rgba(0,0,0,0.10),rgba(0,0,0,0.45))]" />
              </div>

              <div className="mt-4 smallcaps text-[11px] tracking-[0.34em] text-[rgba(246,241,231,0.68)]">
                Image placeholder
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
