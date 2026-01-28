"use client";

import { useEffect, useState } from "react";

export default function EventsHero() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 30);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section className="relative h-[92vh] min-h-[680px] overflow-hidden text-[rgb(var(--ivory))]">
      <div
        className={[
          "absolute inset-0",
          "bg-[url('/punk.png')] bg-cover bg-center bg-no-repeat",
          "transition-opacity duration-[900ms] ease-out",
          on ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      <div
        className={[
          "absolute inset-0 bg-[#123e63]",
          "transition-opacity duration-[1200ms] ease-out",
          on ? "opacity-[0.78]" : "opacity-0",
        ].join(" ")}
      />

      <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(244,241,234,0.08)]" />

      <div className="relative mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mono text-[11px] uppercase tracking-[0.45em] text-[rgb(var(--ivory))]/75">
          MYOPIC DELIRIUM
        </div>

        <h1 className="md-display mt-6 text-[clamp(84px,11vw,164px)] leading-[0.9] tracking-tight">
          Events
        </h1>

        <div className="mt-8 max-w-[62ch] text-[13px] leading-relaxed text-[rgb(var(--ivory))]/82">
          Colloquia, salons, and working sessions.
        </div>

        <div className="mt-10 flex items-center gap-3">
          <a
            className="border rule bg-transparent px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-[rgb(var(--ivory))]/90 hover:bg-white/10 hover:text-[rgb(var(--ivory))]"
            href="/conduct"
          >
            Customs
          </a>
          <a
            className="border rule bg-transparent px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-[rgb(var(--ivory))]/90 hover:bg-white/10 hover:text-[rgb(var(--ivory))]"
            href="/#connect"
          >
            Contact
          </a>
        </div>

        <div className="mt-10 h-px w-24 bg-[rgb(var(--ivory))]/35" />
        <div className="mono mt-6 text-[12px] text-[rgb(var(--ivory))]/60">
          Scroll for program and archive.
        </div>
      </div>
    </section>
  );
}
