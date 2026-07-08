import type { Metadata } from "next";
import BatchSwitcher from "@/components/BatchSwitcher";
import SimPlayerMount from "@/components/sim/SimPlayerMount";

export const metadata: Metadata = {
  title: "Batch B · Tholos",
  description:
    "Batch B on the Batch A substrate: bounded attention, grief latch, emergent terminal commitment (case B1).",
};

export default function BatchBPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <main className="mx-auto max-w-5xl px-6 pt-12 pb-24">
        <BatchSwitcher current="B" />
        <h1 className="md-display mt-6 text-[54px] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">
          Batch&nbsp;B
        </h1>

        {/* key — the B1 mechanism set, stated technically */}
        <section className="mt-6 rounded-[6px] border border-[rgba(20,16,10,0.12)] bg-[var(--site-field-bg)] p-5">
          <div className="smallcaps text-[11px] text-[#6a6258]">B1 · mechanisms</div>
          <div className="mt-3 grid gap-x-8 gap-y-2 text-[13px] text-[#1b1b1b]/75 sm:grid-cols-2">
            <Key mono="slots=k">Bounded attention — k drives weighted per tick</Key>
            <Key mono="hysteresis">Inertial band — incumbent holds its slot</Key>
            <Key mono="latch">Grief drive on child death, anchored to loss site</Key>
            <Key mono="decay·attended">Latch decays only while attended; releases below θ</Key>
            <Key mono="exempt=[...]">Private channel — drive bypasses the budget (ablation)</Key>
            <Key mono="martyr">Death by self-neglect (energy/hydration) while latched</Key>
          </div>
          <div className="mt-3 border-t border-[rgba(20,16,10,0.12)] pt-3 text-[12px] text-[#1b1b1b]/55">
            Substrate — Batch A, byte-identical when B flags are off (pinned). No death is scripted.
          </div>
        </section>

        {/* the B1 plate */}
        <div className="mt-12">
          <article aria-label="B1 replay">
            <div className="flex items-baseline gap-3">
              <span className="md-display text-[26px] text-[var(--site-ink)]">B1</span>
              <span className="mono text-[10px] tracking-[0.06em] text-[var(--site-muted)]">
                seed 3 · 2000 ticks · slots 2 · latch on
              </span>
            </div>
            <div className="mt-3">
              <SimPlayerMount src="/runs/b1.manifest.json" accentVar="--insurgent" autoplay />
            </div>
          </article>
        </div>

        {/* diagnostics — measured results, rendered from committed run data */}
        <section className="mt-20">
          <div className="smallcaps text-[11px] text-[var(--site-muted)]">Diagnostics</div>
          <div className="mt-5 space-y-8">
            {FIGURES.map((f) => (
              <figure
                key={f.src}
                className="m-0 overflow-hidden rounded-[6px] border border-[rgba(20,16,10,0.12)] bg-[var(--site-field-bg)] p-4"
              >
                <img src={f.src} alt={f.alt} className="w-full" loading="lazy" />
                <figcaption className="mono mt-3 text-[10px] tracking-[0.06em] text-[var(--site-field-ink)]/60">
                  {f.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const FIGURES = [
  {
    src: "/figures/b1_phase.svg",
    alt: "B1 phase structure: martyrdom rate over latch persistence × attention bandwidth",
    caption:
      "B1 · latch decay × attention slots × 8 seeds · martyr rate among bereaved parents vs matched non-bereaved baseline · grief-off + private-channel ablations · cap 250 · 2000 ticks",
  },
];

function Key({ mono, children }: { mono: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="mono shrink-0 text-[10px] tracking-[0.04em] text-[#6a6258]">{mono}</span>
      <span>{children}</span>
    </div>
  );
}
