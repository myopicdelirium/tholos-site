import type { Metadata } from "next";
import Link from "next/link";
import SimPlayerMount from "@/components/sim/SimPlayerMount";

export const metadata: Metadata = {
  title: "Batch A — Agent Ecology · Tholos",
  description:
    "Replayed agent-based ecology: agents surviving a fixed world by optimizing among competing physical needs, from a single learner (A1) to a fragile non-stationary world (A4).",
};

const CASES = [
  {
    id: "A1",
    accentVar: "--teal",
    title: "One agent, learning",
    blurb:
      "A single agent with only a moisture field and water. It must read the gradient, reach water, and drink before thirst kills it. The simplest plate — charming, instantly readable.",
    src: "/runs/a1.manifest.json",
    status: "Survives every seed — learning, not luck.",
  },
  {
    id: "A2",
    accentVar: "--brass",
    title: "Population & selection",
    blurb:
      "Movement now costs energy, and agents are born and die — so the heritable exploration disposition is exposed to selection, and birthplace starts to matter.",
    src: "/runs/a2.manifest.json",
    status: "Selection at work — births fill the plate to the cap, movement costs bite.",
  },
  {
    id: "A3",
    accentVar: "--brass",
    title: "The full stationary ecology",
    blurb:
      "Heat (a comfort band), vegetation, prey, and predators (a risk field) — four needs at once, everything still stationary. The world A4 will invalidate.",
    src: "/runs/a3.manifest.json",
    status: "Stable: the population settles into the comfort band and holds.",
  },
  {
    id: "A4",
    accentVar: "--insurgent",
    title: "The non-stationary phase change",
    blurb:
      "Seasons turn, fauna move, water dries and rebounds. Everything an agent learned or was selected for can be invalidated — survival turns fragile.",
    src: "/runs/a4.manifest.json",
    status: "Fragile: persists in some worlds, collapses in others.",
  },
];

export default function BatchAPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-24">
      {/* ── header ── */}
      <div className="smallcaps text-[11px] text-[#6a6258]">Agent-Based Ecology · Survey Plates</div>
      <h1 className="mt-2 md-display text-[54px] leading-[1.02] tracking-[-0.02em] text-[#191714]">
        Batch&nbsp;A
      </h1>
      <p className="mt-4 max-w-2xl md-prose text-[#1b1b1b]/80">
        The substrate the lab&rsquo;s humanistic work stands on: agents that survive a fixed
        ecology by optimizing among competing physical needs. Each plate below is a{" "}
        <em>replay of a real logged run</em> — read like a naturalist&rsquo;s survey, with the
        population trace as its clock.
      </p>
      <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-[#1b1b1b]/55">
        Nothing here is simulated in your browser. Every position, need, and death was computed in
        Python and logged; the page only draws the pixels. Reproducible from{" "}
        <span className="mono">(code, config, seed)</span>.
      </p>

      {/* ── hero: A4 ── */}
      <section className="mt-12" aria-label="A4 live replay">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="smallcaps text-[11px]" style={{ color: "rgb(var(--insurgent))" }}>
              Plate IV · A4
            </div>
            <h2 className="mt-1 md-display text-[26px] leading-tight text-[#191714]">
              A world that is not enough
            </h2>
          </div>
          <div className="mono hidden text-right text-[10px] leading-relaxed text-[#6a6258] sm:block">
            seed 3 · 1500 ticks
            <br />
            replay · not re-simulation
          </div>
        </div>

        <div className="mt-4">
          <SimPlayerMount src="/runs/a4.manifest.json" accentVar="--insurgent" autoplay />
        </div>

        <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-[#1b1b1b]/65">
          The trace shares the plate&rsquo;s clock: when the dots thin, the line falls in the same
          instant, and the dashed cap line shows the ceiling binding. Hover any agent to read its
          need vector; drag the trace to seek; toggle the layers.
        </p>
      </section>

      {/* ── legend ── */}
      <section className="mt-12 rounded-[6px] border bg-[rgba(133,118,101,0.05)] p-5 rule">
        <div className="smallcaps text-[11px] text-[#6a6258]">How to read the plate</div>
        <div className="mt-4 grid gap-x-8 gap-y-3 text-[13px] text-[#1b1b1b]/75 sm:grid-cols-2">
          <Key swatch={<Dot kind="ink" />}>
            <b>Agent</b> — an ink dot; fuller ink means more energy.
          </Key>
          <Key swatch={<Dot kind="ring" />}>
            <b>Stressed agent</b> — flips to a hollow rust ring when a need runs low.
          </Key>
          <Key swatch={<Cell />}>
            <b>Water</b> — crisp blue cells, the only blue on the plate.
          </Key>
          <Key swatch={<Band />}>
            <b>Comfort band</b> — the surveyed survivable temperature zone (A4).
          </Key>
          <Key swatch={<Diamond />}>
            <b>Predator</b> — a rust diamond with a thin risk ring (A4).
          </Key>
          <Key swatch={<Cross />}>
            <b>Death</b> — a rust × that fades; births are expanding ink rings.
          </Key>
        </div>
        <div className="mt-4 border-t pt-3 text-[12px] leading-relaxed text-[#1b1b1b]/55 rule">
          The <b>population trace</b> beneath each plate is its timeline: it plots the whole run,
          the dashed line is the population <span className="mono">CAP</span>, and the cursor is the
          current tick — drag it to seek.
        </div>
      </section>

      {/* ── case ladder ── */}
      <section className="mt-14">
        <div className="smallcaps text-[11px] text-[#6a6258]">The four plates</div>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#1b1b1b]/60">
          The complexity is layered, not dumped: start at A1 and descend. Each plate adds one thing
          to the same world.
        </p>

        <div className="mt-8 space-y-14">
          {CASES.map((c) => (
            <article key={c.id} className="md-timeline-rail">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="md-display text-[22px] text-[#191714]">{c.id}</span>
                <h3 className="md-display text-[20px] text-[#191714]/90">{c.title}</h3>
                <span
                  className="ml-auto rounded-[3px] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: `rgb(var(${c.accentVar}))`, background: "rgba(133,118,101,0.10)" }}
                >
                  {c.src ? "Live replay" : "Soon"}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#1b1b1b]/72">{c.blurb}</p>
              <div className="mt-1 text-[12px] italic text-[#6a6258]">{c.status}</div>

              {c.src && c.id !== "A4" ? (
                <div className="mt-5">
                  <SimPlayerMount src={c.src} accentVar={c.accentVar} autoplay={c.id === "A1"} />
                </div>
              ) : null}
              {c.id === "A4" ? (
                <div className="mt-2 text-[12px] text-[#6a6258]">↑ shown above as the hero.</div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <div className="mt-16 border-t pt-6 rule">
        <p className="max-w-2xl text-[12px] leading-relaxed text-[#1b1b1b]/50">
          All four plates replay real logged runs; static analysis figures follow as the diagnostic
          runs land. The full specification, parameter table, and results live in the{" "}
          <Link href="/artifacts" className="underline underline-offset-2">
            artifacts
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

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
  return (
    <span className="h-2.5 w-2.5 rotate-45" style={{ background: "rgb(var(--insurgent))" }} />
  );
}
function Cross() {
  return (
    <span className="mono text-[14px] leading-none" style={{ color: "rgb(var(--insurgent))" }}>
      ×
    </span>
  );
}
