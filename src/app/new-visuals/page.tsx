import type { Metadata } from "next"
import SeveredTwin from "./_components/SeveredTwin"
import TheToldPlace from "./_components/TheToldPlace"
import SeveredToldPlace from "./_components/SeveredToldPlace"
import TTPThree from "./_components/TTPThree"

export const metadata: Metadata = {
  title: "New Visuals · Myopic Delirium",
}

export default function NewVisualsPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-24">
        <div className="smallcaps text-[11px] text-[var(--site-muted)]">Projects</div>
        <h1 className="mt-3 md-display text-[54px] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">
          New Visuals
        </h1>

        <div className="mt-14">
          <div className="smallcaps text-[11px] text-[var(--site-accent)]">Instrument</div>
          <h2 className="mt-2 md-display text-[32px] leading-[1.06] tracking-[-0.01em] text-[var(--site-ink)]">
            TTP-S
          </h2>
          <div className="mt-6">
            <SeveredToldPlace />
          </div>
        </div>

        <div className="mt-20 border-t border-[var(--site-line)] pt-14">
          <div className="smallcaps text-[11px] text-[var(--site-accent)]">Instrument</div>
          <h2 className="mt-2 md-display text-[32px] leading-[1.06] tracking-[-0.01em] text-[var(--site-ink)]">
            TTP-3
          </h2>
          <div className="mt-6">
            <TTPThree />
          </div>
        </div>

        <div className="mt-20 border-t border-[var(--site-line)] pt-14">
          <div className="smallcaps text-[11px] text-[var(--site-accent)]">Instrument</div>
          <h2 className="mt-2 md-display text-[32px] leading-[1.06] tracking-[-0.01em] text-[var(--site-ink)]">
            TTP
          </h2>
          <div className="mt-6">
            <TheToldPlace />
          </div>
        </div>

        <div className="mt-20 border-t border-[var(--site-line)] pt-14">
          <div className="smallcaps text-[11px] text-[var(--site-accent)]">Instrument</div>
          <h2 className="mt-2 md-display text-[32px] leading-[1.06] tracking-[-0.01em] text-[var(--site-ink)]">
            TST
          </h2>
          <div className="mt-6">
            <SeveredTwin />
          </div>
        </div>
      </section>
    </div>
  )
}
