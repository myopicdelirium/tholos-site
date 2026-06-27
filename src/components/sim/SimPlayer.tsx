"use client";

// The interactive replay player (locked aesthetic). Replays a logged Batch A
// run as an ink-on-paper survey plate. The population trace IS the timeline.
// rAF owns the canvases; React state is only for controls. There is NO
// simulation here — no drain, no decision rule, no reproduction. It seeks logged
// frames (O(1)) and draws them.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadFrames,
  loadManifest,
  type Frame,
  type Manifest,
} from "@/lib/playback";
import {
  drawPlate,
  drawTrace,
  pickAgent,
  type FadeMark,
  type Layers,
} from "@/lib/player/render";
import { NEED_LABELS, readTokens, type Tokens } from "@/lib/player/palette";

const SPEEDS = [1, 2, 4, 8];
const TICKS_PER_SEC_1X = 55;

type Tooltip = {
  sx: number;
  sy: number;
  id: number;
  needs: number[];
  trait: number;
  age: number;
} | null;

export interface SimPlayerProps {
  src: string; // url to the manifest json
  accentVar?: string; // css var name for the case accent chrome
  autoplay?: boolean;
  className?: string;
}

export default function SimPlayer({
  src,
  accentVar = "--insurgent",
  autoplay = true,
  className,
}: SimPlayerProps) {
  const plateWrap = useRef<HTMLDivElement>(null);
  const plateCanvas = useRef<HTMLCanvasElement>(null);
  const traceWrap = useRef<HTMLDivElement>(null);
  const traceCanvas = useRef<HTMLCanvasElement>(null);

  const tk = useRef<Tokens | null>(null);
  const manifestRef = useRef<Manifest | null>(null);
  const framesRef = useRef<Frame[] | null>(null);
  const frameMapsRef = useRef<Map<number, [number, number]>[] | null>(null);

  const tickRef = useRef(0);
  const playingRef = useRef(autoplay);
  const speedRef = useRef(1);
  const layersRef = useRef<Layers>({ water: true, comfort: true, risk: true, trails: true });
  const hoveredRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const deathsRef = useRef<FadeMark[]>([]);
  const birthsRef = useRef<FadeMark[]>([]);
  const lastFrameRef = useRef(-1);
  const draggingRef = useRef(false);
  const plateSize = useRef({ w: 0, h: 0 });
  const traceSize = useRef({ w: 0, h: 0 });
  const rafRef = useRef(0);

  const tickReadout = useRef<HTMLSpanElement>(null);
  const popReadout = useRef<HTMLSpanElement>(null);
  const seasonReadout = useRef<HTMLSpanElement>(null);
  const droughtReadout = useRef<HTMLSpanElement>(null);

  const [status, setStatus] = useState<"loading" | "substrate" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(1);
  const [layers, setLayers] = useState<Layers>(layersRef.current);
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const [accent, setAccent] = useState("rgb(194,58,43)");

  const frameIndex = useCallback((tick: number) => {
    const m = manifestRef.current!;
    return Math.min(m.frameCount - 1, Math.max(0, Math.round(tick / m.stride)));
  }, []);

  const draw = useCallback(() => {
    const m = manifestRef.current;
    const T = tk.current;
    if (!m || !T) return;
    const pc = plateCanvas.current;
    const tc = traceCanvas.current;
    if (pc) {
      const ctx = pc.getContext("2d");
      if (ctx) {
        const { w, h } = plateSize.current;
        const idx = framesRef.current ? frameIndex(tickRef.current) : -1;
        if (mouseRef.current && framesRef.current) {
          hoveredRef.current = pickAgent(
            m, framesRef.current[idx], mouseRef.current.x, mouseRef.current.y, w, h);
        }
        drawPlate(ctx, m, framesRef.current, idx, frameMapsRef.current, T,
          layersRef.current, w, h, hoveredRef.current, deathsRef.current, birthsRef.current);
      }
    }
    if (tc) {
      const ctx = tc.getContext("2d");
      if (ctx) {
        const { w, h } = traceSize.current;
        drawTrace(ctx, m, tickRef.current, T, w, h);
      }
    }
    // readouts
    const t = Math.min(m.ticks - 1, Math.max(0, Math.round(tickRef.current)));
    if (tickReadout.current) tickReadout.current.textContent = String(t);
    if (popReadout.current) popReadout.current.textContent = String(m.population[t] ?? 0);
    const fr = framesRef.current?.[frameIndex(tickRef.current)];
    if (seasonReadout.current) {
      seasonReadout.current.textContent = m.comfortBand && fr
        ? `${Math.round(fr.season * 100)}%` : "—";
    }
    if (droughtReadout.current) {
      droughtReadout.current.textContent = fr ? (fr.drought ? "ON" : "off") : "—";
    }
  }, [frameIndex]);

  // load: tokens + manifest (substrate) first, then frames (progressive)
  useEffect(() => {
    let alive = true;
    tk.current = readTokens();
    const acc = getComputedStyle(document.documentElement).getPropertyValue(accentVar).trim();
    if (acc) setAccent(`rgb(${acc.split(/[\s,]+/).join(",")})`);
    setStatus("loading");
    loadManifest(src)
      .then((m) => {
        if (!alive) return;
        manifestRef.current = m;
        tickRef.current = 0;
        lastFrameRef.current = -1;
        setStatus("substrate");
        draw();
        return loadFrames(src, m);
      })
      .then((frames) => {
        if (!alive || !frames) return;
        framesRef.current = frames;
        frameMapsRef.current = frames.map((f) => {
          const map = new Map<number, [number, number]>();
          for (const a of f.agents) map.set(a[0], [a[1], a[2]]);
          return map;
        });
        setStatus("ready");
      })
      .catch((e) => {
        if (!alive) return;
        setErrorMsg(String(e?.message ?? e));
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [src, accentVar, draw]);

  // DPR-aware sizing for both canvases
  useEffect(() => {
    const setup = (
      wrap: HTMLDivElement | null,
      canvas: HTMLCanvasElement | null,
      store: { current: { w: number; h: number } },
    ) => {
      if (!wrap || !canvas) return () => {};
      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        store.current = { w, h };
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(wrap);
      resize();
      return () => ro.disconnect();
    };
    const a = setup(plateWrap.current, plateCanvas.current, plateSize);
    const b = setup(traceWrap.current, traceCanvas.current, traceSize);
    return () => {
      a();
      b();
    };
  }, [draw, status]);

  // animation loop
  useEffect(() => {
    if (status === "loading" || status === "error") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      playingRef.current = false;
      setPlaying(false);
    }
    let last = performance.now();
    const loop = (now: number) => {
      const m = manifestRef.current;
      if (m) {
        const dt = Math.min(100, now - last);
        last = now;
        if (playingRef.current && !draggingRef.current) {
          tickRef.current += (speedRef.current * TICKS_PER_SEC_1X * dt) / 1000;
          if (tickRef.current >= m.ticks) tickRef.current = 0;
        }
        // fade aging
        for (const d of deathsRef.current) d.age += 1;
        for (const b of birthsRef.current) b.age += 1;
        deathsRef.current = deathsRef.current.filter((d) => d.age < 15);
        birthsRef.current = birthsRef.current.filter((b) => b.age < 16);
        // spawn fades from newly-passed frames
        if (framesRef.current) {
          const idx = frameIndex(tickRef.current);
          if (idx !== lastFrameRef.current) {
            if (idx < lastFrameRef.current) {
              deathsRef.current = [];
              birthsRef.current = [];
            } else {
              for (let fi = lastFrameRef.current + 1; fi <= idx; fi++) {
                const f = framesRef.current[fi];
                if (!f) continue;
                for (const d of f.deaths) deathsRef.current.push({ x: d[1], y: d[2], age: 0 });
                for (const b of f.births) birthsRef.current.push({ x: b[1], y: b[2], age: 0 });
              }
            }
            lastFrameRef.current = idx;
          }
        }
        draw();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, draw, frameIndex]);

  // ── controls ──
  const togglePlay = useCallback(() => {
    const v = !playingRef.current;
    playingRef.current = v;
    setPlaying(v);
  }, []);
  const onSpeed = (s: number) => {
    speedRef.current = s;
    setSpeed(s);
  };
  const toggleLayer = (k: keyof Layers) => {
    const next = { ...layersRef.current, [k]: !layersRef.current[k] };
    layersRef.current = next;
    setLayers(next);
    draw();
  };
  const step = (dir: number) => {
    const m = manifestRef.current;
    if (!m) return;
    tickRef.current = Math.min(m.ticks - 1, Math.max(0, tickRef.current + dir * m.stride));
    deathsRef.current = [];
    birthsRef.current = [];
    draw();
  };

  const seekFromTrace = (clientX: number) => {
    const tc = traceCanvas.current;
    const m = manifestRef.current;
    if (!tc || !m) return;
    const rect = tc.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    tickRef.current = frac * (m.ticks - 1);
    deathsRef.current = [];
    birthsRef.current = [];
    draw();
  };

  const onPlateMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const m = manifestRef.current;
    const frames = framesRef.current;
    if (!m || !frames) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    mouseRef.current = { x: mx, y: my };
    const id = pickAgent(m, frames[frameIndex(tickRef.current)], mx, my,
      plateSize.current.w, plateSize.current.h);
    hoveredRef.current = id;
    if (id != null) {
      const a = frames[frameIndex(tickRef.current)].agents.find((x) => x[0] === id);
      if (a) setTooltip({ sx: mx, sy: my, id, needs: [a[3], a[4], a[5], a[6]], trait: a[7], age: a[8] });
    } else setTooltip(null);
  };
  const onPlateLeave = () => {
    mouseRef.current = null;
    hoveredRef.current = null;
    setTooltip(null);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " ") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  };

  const m = manifestRef.current;
  const layerDefs: { key: keyof Layers; label: string; need?: boolean }[] = [
    { key: "water", label: "Water" },
    { key: "comfort", label: "Comfort", need: !!m?.comfortBand },
    { key: "risk", label: "Risk", need: !!m?.comfortBand },
    { key: "trails", label: "Trails" },
  ];

  return (
    <div className={className}>
      {/* plate */}
      <div
        ref={plateWrap}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label={`Batch A case ${m?.case ?? ""} replay plate. Space to play or pause; arrow keys to step.`}
        className="relative aspect-[3/2] w-full overflow-hidden rounded-[4px] border outline-none rule focus-visible:ring-2 focus-visible:ring-black/20"
        style={{ background: "rgb(var(--ivory))" }}
      >
        <canvas
          ref={plateCanvas}
          className="absolute inset-0 block"
          role="img"
          onMouseMove={onPlateMove}
          onMouseLeave={onPlateLeave}
        />
        {/* readout strip */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-x-4 gap-y-1">
          <Readout label="Tick" inner={tickReadout} />
          <Readout label="Pop" inner={popReadout} />
          <Readout label="Season" inner={seasonReadout} />
          <Readout label="Drought" inner={droughtReadout} />
        </div>
        {status === "substrate" && (
          <div className="pointer-events-none absolute bottom-3 right-3 mono text-[10px] uppercase tracking-[0.25em] text-[#1b1b1b]/40">
            streaming agents…
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="mono text-[11px] leading-relaxed text-[#1b1b1b]/70">
              Could not load replay.<br />
              <span className="text-[#1b1b1b]/40">{errorMsg}</span>
            </div>
          </div>
        )}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 w-[156px] -translate-x-1/2 rounded-[3px] border bg-[rgb(var(--ivory))] px-3 py-2 shadow-paper rule"
            style={{ left: tooltip.sx, top: tooltip.sy + 14 }}
          >
            <div className="mono text-[9px] uppercase tracking-[0.22em] text-[#6a6258]">
              Agent #{tooltip.id}
            </div>
            <div className="mt-1.5 space-y-1">
              {NEED_LABELS.map((n, i) => (
                <NeedBar key={n} name={n} value={tooltip.needs[i]} accent={accent} />
              ))}
            </div>
            <div className="mono mt-2 flex justify-between text-[9px] text-[#6a6258]">
              <span>explore {(tooltip.trait / 255).toFixed(2)}</span>
              <span>age {tooltip.age}</span>
            </div>
          </div>
        )}
      </div>

      {/* population trace = the timeline */}
      <div
        ref={traceWrap}
        onPointerDown={(e) => {
          draggingRef.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          seekFromTrace(e.clientX);
        }}
        onPointerMove={(e) => draggingRef.current && seekFromTrace(e.clientX)}
        onPointerUp={(e) => {
          draggingRef.current = false;
          (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        }}
        className="relative mt-2 h-[72px] w-full cursor-ew-resize touch-none rounded-[4px] border rule"
        style={{ background: "rgb(var(--ivory))" }}
        aria-label="Population over time — drag to seek"
      >
        <canvas ref={traceCanvas} className="absolute inset-0 block" />
        <div className="pointer-events-none absolute right-2 top-1 smallcaps text-[9px] text-[#6a6258]">
          Population
        </div>
      </div>

      {/* controls */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="inline-flex h-8 w-16 items-center justify-center rounded-[3px] border text-[10px] uppercase tracking-[0.28em] transition-colors rule focus-visible:ring-2 focus-visible:ring-black/20"
          style={{ color: accent }}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <div className="flex items-center gap-2">
          <span className="smallcaps text-[10px] text-[#6a6258]">Speed</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeed(s)}
              aria-pressed={speed === s}
              className="mono rounded-[3px] px-1.5 py-0.5 text-[10px] transition-colors"
              style={speed === s ? { background: accent, color: "rgb(var(--ivory))" } : { color: "#6a6258" }}
            >
              {s}×
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="smallcaps text-[10px] text-[#6a6258]">Layers</span>
          {layerDefs.map((l) =>
            l.need === false ? null : (
              <button
                key={l.key}
                type="button"
                onClick={() => toggleLayer(l.key)}
                aria-pressed={layers[l.key]}
                className="rounded-[3px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] transition-colors"
                style={
                  layers[l.key]
                    ? { borderColor: accent, color: "#1b1b1b", background: "rgba(133,118,101,0.10)" }
                    : { borderColor: "rgba(133,118,101,0.3)", color: "#9a9186" }
                }
              >
                {l.label}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function Readout({ label, inner }: { label: string; inner: React.RefObject<HTMLSpanElement | null> }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="mono text-[9px] uppercase tracking-[0.22em] text-[#6a6258]">{label}</span>
      <span ref={inner} className="mono text-[12px] tabular-nums text-[#1b1b1b]/80">—</span>
    </div>
  );
}

function NeedBar({ name, value, accent }: { name: string; value: number; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="mono w-[54px] shrink-0 text-[9px] text-[#1b1b1b]/60">{name}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
        <span
          className="block h-full"
          style={{ width: `${(value / 255) * 100}%`, background: value < 64 ? accent : "rgba(18,18,18,0.6)" }}
        />
      </span>
    </div>
  );
}
