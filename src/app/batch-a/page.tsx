import type { Metadata } from "next";
import Link from "next/link";
import SimPlayerMount from "@/components/sim/SimPlayerMount";
import { NEED_LABEL, NEED_ORDER, SIM } from "@/lib/player/palette";

export const metadata: Metadata = {
  title: "Batch A — Agent Ecology · Tholos",
  description:
    "Replayed agent-based ecology: agents surviving a fixed world by optimizing among competing physical needs, from a single learner (A1) to a fragile non-stationary world (A4).",
};

const CASES = [
  {
    id: "A1",
    accent: SIM.case.a1,
    title: "One agent, learning",
    blurb:
      "A single agent with only a moisture field and water. It must read the gradient, reach water, and drink before thirst kills it. The simplest player — charming, instantly readable.",
    src: "/runs/a1.json",
    status: "Survives every seed — learning, not luck.",
  },
  {
    id: "A2",
    accent: SIM.case.a2,
    title: "Population & selection",
    blurb:
      "Movement now costs energy, and agents are born and die — so the heritable exploration disposition is exposed to selection, and birthplace starts to matter.",
    src: null,
    status: "In preparation — diagnostic figures pending.",
  },
  {
    id: "A3",
    accent: SIM.case.a3,
    title: "The full stationary ecology",
    blurb:
      "Heat (a comfort band), vegetation, prey, and predators (a risk field) — four needs at once, everything still stationary. The world A4 will invalidate.",
    src: null,
    status: "In preparation — diagnostic figures pending.",
  },
  {
    id: "A4",
    accent: SIM.case.a4,
    title: "The non-stationary phase change",
    blurb:
      "Seasons turn, fauna move, water dries and rebounds. Everything an agent learned or was selected for can be invalidated — survival turns fragile.",
    src: "/runs/a4.json",
    status: "Fragile: persists in some worlds, collapses in others.",
  },
];

export default function BatchAPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-24">
      {/* ── header ── */}
      <div className="smallcaps text-[11px] text-[#6a6258]">Agent-Based Ecology</div>
      <h1 className="mt-2 md-display text-[54px] leading-[1.02] tracking-[-0.02em] text-[#191714]">
        Batch&nbsp;A
      </h1>
      <p className="mt-4 max-w-2xl md-prose text-[#1b1b1b]/80">
        The substrate the lab&rsquo;s humanistic work stands on: agents that survive a fixed
        ecology by optimizing among competing physical needs. Below, four cases — from a single
        learner to a world that defeats them — each one a <em>replay of a real logged run</em>.
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
            <div className="smallcaps text-[11px]" style={{ color: SIM.case.a4 }}>
              Case A4 · Hero
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
          <SimPlayerMount src="/runs/a4.json" accent={SIM.case.a4} autoplay />
        </div>

        <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-[#1b1b1b]/65">
          The population booms in fertile seasons, then deep recurrent crashes thin it as the
          climate turns, the fauna roam, and the water dries. Hover any agent to read its need
          vector; toggle the moisture, temperature, and risk layers to see what it is contending
          with.
        </p>
      </section>

      {/* ── legend ── */}
      <section className="mt-12 rounded-[6px] border bg-[rgba(133,118,101,0.05)] p-5 rule">
        <div className="smallcaps text-[11px] text-[#6a6258]">How to read it</div>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-[#1b1b1b]/55">
              Agents — coloured by their most urgent need
            </div>
            <ul className="mt-3 space-y-2">
              {NEED_ORDER.map((n) => (
                <li key={n} className="flex items-center gap-2.5">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: `rgb(${SIM.need[n].join(",")})` }}
                  />
                  <span className="text-[13px] text-[#1b1b1b]/75">{NEED_LABEL[n]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-[#1b1b1b]/55">
              Environment layers
            </div>
            <ul className="mt-3 space-y-2 text-[13px] text-[#1b1b1b]/75">
              <li>
                <span className="mono text-[#1b1b1b]/55">Moisture</span> — the field that leads to
                water.
              </li>
              <li>
                <span className="mono text-[#1b1b1b]/55">Temperature</span> — the lit band is the
                survivable comfort zone.
              </li>
              <li>
                <span className="mono text-[#1b1b1b]/55">Risk</span> — the predators&rsquo; halo;
                a ring marks each death.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── case ladder ── */}
      <section className="mt-14">
        <div className="smallcaps text-[11px] text-[#6a6258]">The four cases</div>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#1b1b1b]/60">
          The complexity is layered, not dumped: start at A1 and descend. Each case adds one thing
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
                  style={{ color: c.accent, background: "rgba(133,118,101,0.10)" }}
                >
                  {c.src ? "Live replay" : "Soon"}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#1b1b1b]/72">
                {c.blurb}
              </p>
              <div className="mt-1 text-[12px] italic text-[#6a6258]">{c.status}</div>

              {c.src && c.id !== "A4" ? (
                <div className="mt-5">
                  <SimPlayerMount src={c.src} accent={c.accent} autoplay={c.id === "A1"} />
                </div>
              ) : null}
              {c.id === "A4" ? (
                <div className="mt-2 text-[12px] text-[#6a6258]">
                  ↑ shown above as the hero.
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <div className="mt-16 border-t pt-6 rule">
        <p className="max-w-2xl text-[12px] leading-relaxed text-[#1b1b1b]/50">
          Static analysis figures and additional cases (A2, A3) follow as the diagnostic runs land.
          The full specification, parameter table, and results live in the{" "}
          <Link href="/artifacts" className="underline underline-offset-2">
            artifacts
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
