"use client";

import { useEffect, useState } from "react";

export default function EventsHero() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 30);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section
      className={[
        "relative h-[92vh] min-h-[680px] bg-[#123e63] text-[rgb(var(--ivory))]",
        "transition-opacity duration-[900ms] ease-out",
        on ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <div className="mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mono text-[11px] uppercase tracking-[0.45em] text-[rgb(var(--ivory))]/70">
          MYOPIC DELIRIUM
        </div>

        <h1 className="md-display mt-6 text-[clamp(84px,11vw,164px)] leading-[0.9] tracking-tight">
          Events
        </h1>

        <div className="mt-8 max-w-[62ch] text-[13px] leading-relaxed text-[rgb(var(--ivory))]/78">
          Colloquia, salons, and working sessions. vTEST-0128
        </div>

        <div className="mt-10 flex items-center gap-3">
          <a
            className="border rule bg-transparent px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-[rgb(var(--ivory))]/85 hover:bg-white/10 hover:text-[rgb(var(--ivory))]"
            href="/conduct"
          >
            Customs
          </a>
          <a
            className="border rule bg-transparent px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-[rgb(var(--ivory))]/85 hover:bg-white/10 hover:text-[rgb(var(--ivory))]"
            href="/#connect"
          >
            Contact
          </a>
        </div>

        <div className="mt-10 h-px w-24 bg-[rgb(var(--ivory))]/30" />
        <div className="mono mt-6 text-[12px] text-[rgb(var(--ivory))]/55">
          Scroll for program and archive.
        </div>
      </div>
    </section>
  );
}
