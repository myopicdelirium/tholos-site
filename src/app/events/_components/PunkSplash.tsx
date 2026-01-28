"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
  ms?: number;
  onDone: () => void;
};

export default function PunkSplash(props: Props) {
  const ms = props.ms ?? 1400;
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setHide(true), Math.max(200, ms - 350));
    const t2 = window.setTimeout(() => props.onDone(), ms);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [ms, props]);

  return (
    <div
      className={[
        "fixed inset-0 z-[120] bg-black",
        "transition-opacity duration-500 ease-out",
        hide ? "opacity-0" : "opacity-100",
      ].join(" ")}
      aria-hidden
    >
      <div className="absolute inset-0">
        <img
          src={props.src}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="absolute inset-0 flex items-end justify-start">
        <div className="mx-auto w-full max-w-6xl px-6 pb-10">
          <div className="mono text-[11px] uppercase tracking-[0.45em] text-white/70">
            MYOPIC DELIRIUM
          </div>
        </div>
      </div>
    </div>
  );
}
