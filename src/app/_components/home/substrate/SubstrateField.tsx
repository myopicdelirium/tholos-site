"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import {
  initWorld, updateWorld, wrap, TRAIL_LEN,
  type World, type Params, type Metrics,
} from "./engine";

export interface FieldSample extends Metrics {
  phase: number;
  heat: number;
}

interface Env {
  metricPressure: number;
  scarcity: number;
  predatorCount: number;
  zoom: number;
  heat: number; // 0..1 — collapse intensity, tints the field red
}

/* Scroll phase (0..1) → simulation environment. The narrative descent:
   ignition → emergence → regimes → delirium (collapse) → recovery. */
type Stop = { p: number } & Env;
const STOPS: Stop[] = [
  { p: 0.00, metricPressure: 0.12, scarcity: 0.22, predatorCount: 1, zoom: 1.06, heat: 0.0 },
  { p: 0.16, metricPressure: 0.40, scarcity: 0.30, predatorCount: 1, zoom: 1.12, heat: 0.0 },
  { p: 0.34, metricPressure: 0.52, scarcity: 0.40, predatorCount: 2, zoom: 1.20, heat: 0.06 },
  { p: 0.58, metricPressure: 0.95, scarcity: 0.82, predatorCount: 6, zoom: 1.30, heat: 1.0 },
  { p: 0.74, metricPressure: 0.62, scarcity: 0.52, predatorCount: 3, zoom: 1.36, heat: 0.35 },
  { p: 1.00, metricPressure: 0.42, scarcity: 0.46, predatorCount: 2, zoom: 1.42, heat: 0.12 },
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function sampleEnv(phase: number): Env {
  const ph = phase < 0 ? 0 : phase > 1 ? 1 : phase;
  let i = 0;
  while (i < STOPS.length - 1 && ph > STOPS[i + 1].p) i++;
  const a = STOPS[i];
  const b = STOPS[Math.min(i + 1, STOPS.length - 1)];
  const span = b.p - a.p || 1;
  const raw = (ph - a.p) / span;
  const t = raw < 0 ? 0 : raw > 1 ? 1 : raw;
  // smoothstep for eased transitions between regimes
  const e = t * t * (3 - 2 * t);
  return {
    metricPressure: lerp(a.metricPressure, b.metricPressure, e),
    scarcity: lerp(a.scarcity, b.scarcity, e),
    predatorCount: lerp(a.predatorCount, b.predatorCount, e),
    zoom: lerp(a.zoom, b.zoom, e),
    heat: lerp(a.heat, b.heat, e),
  };
}

const MODE_COLORS: ReadonlyArray<readonly [number, number, number]> = [
  [0, 180, 200],   // calm — teal
  [200, 170, 90],  // stressed — brass
  [240, 234, 224], // cooperative — ivory
  [194, 58, 43],   // fleeing — insurgent
];

function render(
  ctx: CanvasRenderingContext2D,
  w: World,
  cw: number,
  ch: number,
  env: Env,
) {
  const s = Math.max(cw, ch) * env.zoom;
  const ox = (cw - s) / 2;
  const oy = (ch - s) / 2;
  const px = (nx: number) => ox + nx * s;
  const py = (ny: number) => oy + ny * s;

  // L0 — ground
  ctx.fillStyle = "#070d16";
  ctx.fillRect(0, 0, cw, ch);

  // L1 — atmosphere: cool teal core, warming to insurgent red under heat
  const cxp = cw * 0.42, cyp = ch * 0.4;
  const grad = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, s * 0.75);
  const r = Math.round(10 + env.heat * 70);
  const g = Math.round(46 - env.heat * 22);
  const bl = Math.round(66 - env.heat * 34);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${bl}, ${(0.14 + env.heat * 0.05).toFixed(3)})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  // L2 — resource patches (additive teal)
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const patch of w.patches) {
    if (patch.level < 0.02) continue;
    const rad = patch.radius * s * 2.5;
    const alpha = patch.level * 0.13 * (1 - env.heat * 0.5);
    const depleted = patch.level < 0.2;
    const pulse = depleted ? 0.5 + 0.5 * Math.sin(w.tick * 0.08) : 1;
    const gg = ctx.createRadialGradient(px(patch.cx), py(patch.cy), 0, px(patch.cx), py(patch.cy), rad);
    gg.addColorStop(0, `rgba(0, 180, 200, ${(alpha * pulse).toFixed(3)})`);
    gg.addColorStop(0.6, `rgba(0, 140, 170, ${(alpha * pulse * 0.4).toFixed(3)})`);
    gg.addColorStop(1, "transparent");
    ctx.fillStyle = gg;
    ctx.fillRect(px(patch.cx) - rad, py(patch.cy) - rad, rad * 2, rad * 2);
  }
  ctx.restore();

  // L3 — agents: trails, glow, body
  for (const a of w.agents) {
    if (a.dead > 0) continue;
    const [cr, cg, cb] = MODE_COLORS[a.mode];
    const alpha = 0.5 + a.energy * 0.5;

    for (let t = TRAIL_LEN - 1; t >= 0; t--) {
      const ta = alpha * (1 - (t + 1) / (TRAIL_LEN + 1)) * 0.4;
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${ta.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(px(a.prevX[t]), py(a.prevY[t]), 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = `rgba(${cr},${cg},${cb},${(alpha * 0.08).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px(a.x), py(a.y), 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px(a.x), py(a.y), 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // L4 — predators
  for (const pred of w.predators) {
    const pulse = 6 + 4 * Math.sin(w.tick * 0.06);
    const pulseAlpha = 0.06 + 0.05 * Math.sin(w.tick * 0.06);
    ctx.fillStyle = `rgba(220, 60, 45, ${pulseAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px(pred.x), py(pred.y), pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(220, 60, 45, 0.9)";
    ctx.beginPath();
    ctx.arc(px(pred.x), py(pred.y), 3.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 200, 180, 0.6)";
    ctx.beginPath();
    ctx.arc(px(pred.x), py(pred.y), 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // L5 — heat wash during collapse
  if (env.heat > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const hg = ctx.createRadialGradient(cw * 0.7, ch * 0.66, 0, cw * 0.7, ch * 0.66, s * 0.6);
    hg.addColorStop(0, `rgba(194, 58, 43, ${(env.heat * 0.10).toFixed(3)})`);
    hg.addColorStop(1, "transparent");
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  }

  // L6 — vignette for legibility
  const vg = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
  vg.addColorStop(0, "transparent");
  vg.addColorStop(1, "rgba(3, 6, 11, 0.72)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, cw, ch);
}

export default function SubstrateField({
  phaseRef,
  sampleRef,
}: {
  /** Target scroll phase, 0..1, updated by the scroll loop. */
  phaseRef: MutableRefObject<number>;
  /** Optional out-param the field writes live metrics into, for readouts. */
  sampleRef?: MutableRefObject<FieldSample | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cw = 0, ch = 0;
    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = window.innerWidth;
      ch = window.innerHeight;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const isMobile = cw < 800;
    const world = initWorld(isMobile ? 170 : 320, 16, 1);

    let display = phaseRef.current; // eased follower of target phase
    let raf = 0;
    let running = true;

    function frame() {
      if (!running) { raf = requestAnimationFrame(frame); return; }
      const target = phaseRef.current;
      display += (target - display) * 0.06;
      const env = sampleEnv(display);
      if (reduced) { env.zoom = 1.12; env.predatorCount = Math.min(env.predatorCount, 2); }

      const params: Params = {
        metricPressure: env.metricPressure,
        scarcity: env.scarcity,
        predatorCount: env.predatorCount,
      };
      updateWorld(world, params);
      render(ctx!, world, cw, ch, env);

      if (sampleRef && world._metrics) {
        sampleRef.current = { ...world._metrics, phase: display, heat: env.heat };
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const onVisibility = () => { running = document.visibilityState === "visible"; };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [phaseRef, sampleRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: 0, opacity: 0, animation: "md-substrate-in 1.4s ease-out forwards" }}
    />
  );
}
