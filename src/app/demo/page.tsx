"use client";

import AgentEcology from "../_components/AgentEcology";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#070d16]">
      {/* header */}
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-6">
        <div className="text-[10px] uppercase tracking-[0.38em] text-[#f4f1ea]/30">
          Live Simulation
        </div>
        <h1
          className="mt-3 text-4xl tracking-tight text-[#f4f1ea]/90"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Agent Ecology
        </h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#f4f1ea]/40">
          Bounded agents forage, flock, and flee across a shifting resource
          landscape. Adjust parameters to watch regime transitions emerge in
          real time.
        </p>
      </div>

      {/* canvas container — 16:10 aspect, full bleed within max-w */}
      <div className="mx-auto max-w-7xl px-6 pb-20">
        <div className="relative w-full overflow-hidden border border-white/[0.06]"
          style={{ aspectRatio: "16 / 10" }}
        >
          <AgentEcology className="h-full w-full" />
        </div>

        {/* legend */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Legend color="rgb(0, 180, 200)" label="Calm / Foraging" />
          <Legend color="rgb(200, 170, 90)" label="Stressed" />
          <Legend color="rgb(240, 234, 224)" label="Cooperative" />
          <Legend color="rgb(194, 58, 43)" label="Fleeing" />
          <Legend color="rgb(220, 60, 45)" label="Predator" shape="diamond" />
        </div>
      </div>
    </main>
  );
}

function Legend({
  color,
  label,
  shape = "circle",
}: {
  color: string;
  label: string;
  shape?: "circle" | "diamond";
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={shape === "diamond" ? "h-2.5 w-2.5 rotate-45" : "h-2 w-2 rounded-full"}
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] uppercase tracking-[0.2em] text-[#f4f1ea]/35">
        {label}
      </span>
    </div>
  );
}
