import type { Metadata } from "next";
import BatchSwitcher from "@/components/BatchSwitcher";
import SimPlayerMount from "@/components/sim/SimPlayerMount";

export const metadata: Metadata = {
  title: "Batch A · MyoDel",
  description: "Interactive replays of Batch A agent-ecology runs (A1–A4).",
};

const CASES = [
  { id: "A1", accentVar: "--teal", src: "/runs/a1.manifest.json", seed: 0, ticks: 900 },
  { id: "A2", accentVar: "--brass", src: "/runs/a2.manifest.json", seed: 0, ticks: 1200 },
  { id: "A3", accentVar: "--brass", src: "/runs/a3.manifest.json", seed: 0, ticks: 1200 },
  { id: "A4", accentVar: "--insurgent", src: "/runs/a4.manifest.json", seed: 3, ticks: 1500 },
];

export default function BatchAPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <main className="mx-auto max-w-5xl px-6 pt-12 pb-24">
        <BatchSwitcher current="A" />
        <h1 className="md-display mt-6 text-[54px] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">
          Batch&nbsp;A
        </h1>

        {/* key — the visual encoding, kept as a light legend figure so the data swatches read */}
        <section className="mt-6 rounded-[6px] border border-[rgba(20,16,10,0.12)] bg-[var(--site-field-bg)] p-5">
          <div className="smallcaps text-[11px] text-[#6a6258]">Key</div>
          <div className="mt-3 grid gap-x-8 gap-y-2 text-[13px] text-[#1b1b1b]/75 sm:grid-cols-2">
            <Key swatch={<Dot kind="ink" />}>Agent — opacity = energy</Key>
            <Key swatch={<Dot kind="ring" />}>Stressed — need below threshold</Key>
            <Key swatch={<Cell />}>Water — source cells</Key>
            <Key swatch={<Band />}>Comfort band — survivable temperature (A3–A4)</Key>
            <Key swatch={<Diamond />}>Predator — with risk radius (A3–A4)</Key>
            <Key swatch={<Cross />}>Death — rust ×; birth — expanding ring</Key>
          </div>
          <div className="mt-3 border-t border-[rgba(20,16,10,0.12)] pt-3 text-[12px] text-[#1b1b1b]/55">
            Trace — population vs. tick; dashed line = <span className="mono">CAP</span>; cursor =
            current tick (drag to seek).
          </div>
        </section>

        {/* plates A1 → A4 */}
        <div className="mt-12 space-y-14">
          {CASES.map((c) => (
            <article key={c.id} aria-label={`${c.id} replay`}>
              <div className="flex items-baseline gap-3">
                <span className="md-display text-[26px] text-[var(--site-ink)]">{c.id}</span>
                <span className="mono text-[10px] tracking-[0.06em] text-[var(--site-muted)]">
                  seed {c.seed} · {c.ticks} ticks
                </span>
              </div>
              <div className="mt-3">
                <SimPlayerMount
                  src={c.src}
                  accentVar={c.accentVar}
                  autoplay={c.id === "A1" || c.id === "A4"}
                />
              </div>
            </article>
          ))}
        </div>

        {/* diagnostics — measured results, rendered from committed run data.
            Each figure is a mounted paper plate (field-bg) so it reads as
            deliberate on the themed page rather than a bare image. */}
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
    src: "/figures/a1_learning_gradient_2x2.svg",
    alt: "A1 learning × gradient 2×2",
    caption: "WO-1 · A1 · freeze_learning × gradient 2×2 · 20 seeds/cell · 1500 ticks",
  },
  {
    src: "/figures/world_gallery.svg",
    alt: "Twenty A3 endowment fields ordered by measured carrying capacity",
    caption:
      "A3 · 20 seeds · resource-endowment field at t=0 · ordered by cycle-averaged R̂ₛ · cap 2000",
  },
  {
    src: "/figures/wo2_selection_reversal.svg",
    alt: "WO-2 selection reverses when learning is frozen",
    caption:
      "WO-2 · A3 uniform · survivor−founder exploration drift · learning on / frozen / traits frozen · 20 seeds · cap 2000",
  },
  {
    src: "/figures/wo2_selection_moderator.svg",
    alt: "WO-2 selection and birthplace moderator",
    caption:
      "WO-2 · A3 · 3 spawn × 3 ablation × 20 seeds · cap 2000 · 3000 ticks · crash-robust stable-tick hazard · bootstrap CIs",
  },
  {
    src: "/figures/wo3_mortality_structure.svg",
    alt: "WO-3 mortality structure A3 vs A4",
    caption:
      "WO-3 · A3↔A4 paired · 20 seeds · cap 2000 · 3000 ticks · Fano of per-tick deaths · drawdown vs A3 oscillation",
  },
  {
    src: "/figures/wo3_death_raster.svg",
    alt: "WO-3 per-tick deaths and population, one seed, A3 vs A4",
    caption:
      "WO-3 · seed 13 · per-tick deaths (stacked by cause) + population · A3 vs A4 · cap 2000 · 3000 ticks",
  },
];

/* ── legend swatches (CSS-token driven, no JS) ── */
function Key({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-5 w-5 shrink-0 place-items-center">{swatch}</span>
      <span>{children}</span>
    </div>
  );
}
function Dot({ kind }: { kind: "ink" | "ring" }) {
  return kind === "ink" ? (
    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "rgb(var(--ink))" }} />
  ) : (
    <span
      className="h-2.5 w-2.5 rounded-full border-[1.5px]"
      style={{ borderColor: "rgb(var(--insurgent))" }}
    />
  );
}
function Cell() {
  return <span className="h-3 w-3 rounded-[1px]" style={{ background: "rgb(var(--teal))" }} />;
}
function Band() {
  return (
    <span
      className="h-3 w-4 rounded-[1px] border-y border-dashed"
      style={{ borderColor: "rgb(var(--ink))", background: "rgba(0,57,79,0.08)" }}
    />
  );
}
function Diamond() {
  return <span className="h-2.5 w-2.5 rotate-45" style={{ background: "rgb(var(--insurgent))" }} />;
}
function Cross() {
  return (
    <span className="mono text-[14px] leading-none" style={{ color: "rgb(var(--insurgent))" }}>
      ×
    </span>
  );
}
