"use client";

// The interactive replay player (WO-V4). Replays a logged Batch A run:
// agents move on the logged environment, scrubbable, inspectable, layer-toggled.
// rAF owns the canvas; React state is only for controls/UI (never per-frame).

import { useCallback, useEffect, useRef, useState } from "react";
import { loadPlayback, type Frame, type Playback } from "@/lib/playback";
import {
  buildFieldImage,
  drawFrame,
  pickAgent,
  type DeathMark,
  type Layers,
} from "@/lib/player/render";
import { NEED_LABEL, NEED_ORDER, SIM } from "@/lib/player/palette";

const SPEEDS = [0.5, 1, 2, 4, 8];
const FPS_AT_1X = 20; // strided frames advanced per second at 1×

type Tooltip = {
  sx: number;
  sy: number;
  needs: number[];
  action: string;
} | null;

export interface SimPlayerProps {
  src: string;
  accent?: string;
  autoplay?: boolean;
  className?: string;
}

export default function SimPlayer({
  src,
  accent = SIM.case.a4,
  autoplay = true,
  className,
}: SimPlayerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pbRef = useRef<Playback | null>(null);
  const cursorRef = useRef(0); // float frame cursor
  const playingRef = useRef(autoplay);
  const speedRef = useRef(1);
  const layersRef = useRef<Layers>({
    moisture: true,
    temperature: true,
    risk: true,
    agents: true,
  });
  const hoveredRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const deathsRef = useRef<DeathMark[]>([]);
  const lastFrameIntRef = useRef(-1);
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  // imperative readout/scrub refs (updated in rAF, not via React state)
  const scrubRef = useRef<HTMLInputElement>(null);
  const tickRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLSpanElement>(null);
  const seasonRef = useRef<HTMLSpanElement>(null);
  const droughtRef = useRef<HTMLSpanElement>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(1);
  const [layers, setLayers] = useState<Layers>(layersRef.current);
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const [meta, setMeta] = useState<{ frames: number; ticks: number } | null>(null);

  const rebuildField = useCallback(() => {
    const pb = pbRef.current;
    if (!pb) return;
    let fc = fieldCanvasRef.current;
    if (!fc) {
      fc = document.createElement("canvas");
      fc.width = pb.grid;
      fc.height = pb.grid;
      fieldCanvasRef.current = fc;
    }
    const fctx = fc.getContext("2d");
    if (fctx) fctx.putImageData(buildFieldImage(pb, layersRef.current), 0, 0);
  }, []);

  const draw = useCallback(() => {
    const pb = pbRef.current;
    const canvas = canvasRef.current;
    const fc = fieldCanvasRef.current;
    if (!pb || !canvas || !fc) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    const idx = Math.min(pb.frames.length - 1, Math.max(0, Math.round(cursorRef.current)));
    const frame: Frame = pb.frames[idx];

    // hover pick against the current frame
    if (mouseRef.current) {
      hoveredRef.current = pickAgent(pb, frame, mouseRef.current.x, mouseRef.current.y, w, h);
    }

    drawFrame(
      ctx,
      pb,
      frame,
      { width: w, height: h, fieldCanvas: fc, hovered: hoveredRef.current, deaths: deathsRef.current },
      layersRef.current.agents,
    );

    // imperative readout (no React re-render)
    if (scrubRef.current && document.activeElement !== scrubRef.current) {
      scrubRef.current.value = String(idx);
    }
    if (tickRef.current) tickRef.current.textContent = String(frame.t);
    if (popRef.current) popRef.current.textContent = String(frame.pop);
    if (seasonRef.current) {
      seasonRef.current.textContent = pb.fields.temperature
        ? `${Math.round(frame.season * 100)}%`
        : "—";
    }
    if (droughtRef.current) droughtRef.current.textContent = frame.drought ? "ON" : "off";
  }, []);

  // load
  useEffect(() => {
    let alive = true;
    setStatus("loading");
    loadPlayback(src)
      .then((pb) => {
        if (!alive) return;
        pbRef.current = pb;
        cursorRef.current = 0;
        lastFrameIntRef.current = -1;
        deathsRef.current = [];
        setMeta({ frames: pb.frames.length, ticks: pb.ticks });
        rebuildField();
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
  }, [src, rebuildField]);

  // sizing (DPR-aware)
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      sizeRef.current = { w, h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    return () => ro.disconnect();
  }, [draw, status]);

  // animation loop — honors prefers-reduced-motion (no autoplay)
  useEffect(() => {
    if (status !== "ready") return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      playingRef.current = false;
      setPlaying(false);
    }
    let last = performance.now();
    const loop = (now: number) => {
      const pb = pbRef.current;
      if (pb) {
        const dt = Math.min(100, now - last);
        last = now;
        if (playingRef.current) {
          cursorRef.current += (speedRef.current * FPS_AT_1X * dt) / 1000;
          if (cursorRef.current >= pb.frames.length) cursorRef.current = 0;
        }
        // advance death marks once per integer-frame change
        const idx = Math.round(cursorRef.current);
        if (idx !== lastFrameIntRef.current) {
          lastFrameIntRef.current = idx;
          for (const dm of deathsRef.current) dm.age += 1;
          deathsRef.current = deathsRef.current.filter((d) => d.age < 10);
          const f = pb.frames[Math.min(pb.frames.length - 1, Math.max(0, idx))];
          for (const d of f.deaths) {
            deathsRef.current.push({ x: d[0], y: d[1], cause: d[2], age: 0 });
          }
        }
        draw();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, draw]);

  // control handlers
  const togglePlay = () => {
    const v = !playingRef.current;
    playingRef.current = v;
    setPlaying(v);
  };
  const onSpeed = (s: number) => {
    speedRef.current = s;
    setSpeed(s);
  };
  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    cursorRef.current = Number(e.target.value);
    deathsRef.current = [];
    draw();
  };
  const toggleLayer = (key: keyof Layers) => {
    const next = { ...layersRef.current, [key]: !layersRef.current[key] };
    layersRef.current = next;
    setLayers(next);
    rebuildField();
    draw();
  };
  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    mouseRef.current = { x: mx, y: my };
    const pb = pbRef.current;
    if (!pb) return;
    const idx = Math.min(pb.frames.length - 1, Math.max(0, Math.round(cursorRef.current)));
    const frame = pb.frames[idx];
    const pick = pickAgent(pb, frame, mx, my, sizeRef.current.w, sizeRef.current.h);
    hoveredRef.current = pick;
    if (pick != null) {
      const a = frame.agents[pick];
      setTooltip({ sx: mx, sy: my, needs: [a[2], a[3], a[4], a[5]], action: pb.actions[a[6]] ?? "—" });
    } else {
      setTooltip(null);
    }
  };
  const onLeave = () => {
    mouseRef.current = null;
    hoveredRef.current = null;
    setTooltip(null);
  };

  const layerDefs: { key: keyof Layers; label: string }[] = [
    { key: "moisture", label: "Moisture" },
    { key: "temperature", label: "Temperature" },
    { key: "risk", label: "Risk" },
    { key: "agents", label: "Agents" },
  ];
  const pb = pbRef.current;
  const availableLayer = (key: keyof Layers) =>
    key === "agents" ? true : !!pb?.fields[key as "moisture" | "temperature" | "risk"];

  return (
    <div className={className}>
      <div
        ref={wrapRef}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-[6px] border"
        style={{ borderColor: "rgba(133,118,101,0.4)", background: SIM.bgEdge }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block"
          role="img"
          aria-label={`Batch A case ${pb?.case ?? ""} replay: agents moving on the logged environment.`}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        />

        {status === "loading" && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="mono text-[11px] uppercase tracking-[0.3em] text-[#f0eae0]/55">
              Loading replay…
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="mono text-[11px] leading-relaxed text-[#f0eae0]/70">
              Could not load replay.
              <br />
              <span className="text-[#f0eae0]/40">{errorMsg}</span>
            </div>
          </div>
        )}

        {/* readout strip */}
        {status === "ready" && (
          <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-x-4 gap-y-1 rounded-[4px] border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm">
            <Readout label="Tick" inner={tickRef} />
            <Readout label="Pop" inner={popRef} />
            <Readout label="Season" inner={seasonRef} />
            <Readout label="Drought" inner={droughtRef} />
          </div>
        )}

        {/* hover tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 w-[150px] -translate-x-1/2 rounded-[4px] border border-white/12 bg-black/80 px-3 py-2 backdrop-blur-sm"
            style={{ left: tooltip.sx, top: tooltip.sy + 14 }}
          >
            <div className="mono text-[9px] uppercase tracking-[0.25em] text-[#f0eae0]/45">
              Agent · {tooltip.action}
            </div>
            <div className="mt-1.5 space-y-1">
              {NEED_ORDER.map((n, i) => (
                <NeedBar key={n} name={NEED_LABEL[n]} value={tooltip.needs[i]} rgb={SIM.need[n]} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* controls */}
      {status === "ready" && (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause replay" : "Play replay"}
            className="inline-flex h-8 w-16 items-center justify-center rounded-[4px] border text-[10px] uppercase tracking-[0.28em] transition-colors"
            style={{ borderColor: "rgba(133,118,101,0.45)", color: accent }}
          >
            {playing ? "Pause" : "Play"}
          </button>

          <label className="flex flex-1 items-center gap-3 min-w-[180px]">
            <span className="smallcaps text-[10px] text-[#6a6258]">Tick</span>
            <input
              ref={scrubRef}
              type="range"
              min={0}
              max={(meta?.frames ?? 1) - 1}
              defaultValue={0}
              onChange={onScrub}
              aria-label="Scrub timeline"
              className="h-1 flex-1 cursor-pointer appearance-none rounded bg-[rgba(133,118,101,0.25)]"
              style={{ accentColor: accent }}
            />
          </label>

          <div className="flex items-center gap-2">
            <span className="smallcaps text-[10px] text-[#6a6258]">Speed</span>
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeed(s)}
                aria-pressed={speed === s}
                className="mono rounded-[3px] px-1.5 py-0.5 text-[10px] transition-colors"
                style={
                  speed === s
                    ? { background: accent, color: "#f0eae0" }
                    : { color: "#6a6258" }
                }
              >
                {s}×
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="smallcaps text-[10px] text-[#6a6258]">Layers</span>
            {layerDefs.map((l) =>
              availableLayer(l.key) ? (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => toggleLayer(l.key)}
                  aria-pressed={layers[l.key]}
                  className="rounded-[3px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] transition-colors"
                  style={
                    layers[l.key]
                      ? { borderColor: accent, color: "#1b1b1b", background: "rgba(133,118,101,0.12)" }
                      : { borderColor: "rgba(133,118,101,0.3)", color: "#9a9186" }
                  }
                >
                  {l.label}
                </button>
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Readout({
  label,
  inner,
}: {
  label: string;
  inner: React.RefObject<HTMLSpanElement | null>;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="mono text-[9px] uppercase tracking-[0.22em] text-[#f0eae0]/40">{label}</span>
      <span ref={inner} className="mono text-[12px] tabular-nums text-[#f0eae0]/85">
        —
      </span>
    </div>
  );
}

function NeedBar({ name, value, rgb }: { name: string; value: number; rgb: readonly number[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="mono w-[58px] shrink-0 text-[9px] text-[#f0eae0]/55">{name}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded bg-white/10">
        <span
          className="block h-full"
          style={{ width: `${(value / 255) * 100}%`, background: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` }}
        />
      </span>
    </div>
  );
}
