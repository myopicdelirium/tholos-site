// Pure rendering for the Batch A player (WO-V4). No React in here.
// Given decoded tracks + a tick cursor, draw one frame to a 2D context.
// It computes pixels from logged state only — it never evolves state.

import type { Frame, PackedField, Playback } from "../playback";
import { NEED_ORDER, SIM } from "./palette";

export interface Layers {
  moisture: boolean;
  temperature: boolean;
  risk: boolean;
  agents: boolean;
}

export interface DeathMark {
  x: number;
  y: number;
  cause: number;
  age: number; // frames since death, for fade
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Build the static field image (grid×grid). Recompute only when layers change,
// not every frame — the fields themselves never change (replay, not re-sim).
export function buildFieldImage(pb: Playback, layers: Layers): ImageData {
  const n = pb.grid;
  const img = new ImageData(n, n);
  const d = img.data;
  const M = pb.fields.moisture;
  const T = pb.fields.temperature;
  const R = pb.fields.risk;
  const band = pb.comfortBand;

  const sample = (f: PackedField | undefined, x: number, y: number) =>
    f ? f.data[y * f.w + x] / 255 : 0;

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let r = 11, g = 20, b = 25; // SIM.bg #0b1419

      if (layers.moisture && M) {
        const v = sample(M, x, y);
        const [mr, mg, mb] = SIM.field.moisture;
        r += mr * v * 0.55;
        g += mg * v * 0.55;
        b += mb * v * 0.55;
      }
      if (layers.temperature && T) {
        const v = sample(T, x, y);
        const cr = lerp(SIM.field.tempCold[0], SIM.field.tempWarm[0], v);
        const cg = lerp(SIM.field.tempCold[1], SIM.field.tempWarm[1], v);
        const cb = lerp(SIM.field.tempCold[2], SIM.field.tempWarm[2], v);
        r += cr * 0.32;
        g += cg * 0.32;
        b += cb * 0.32;
        if (band && v >= band.low && v <= band.high) {
          // mark the habitable comfort band with a faint ivory wash
          r += 26;
          g += 24;
          b += 18;
        }
      }
      if (layers.risk && R) {
        const v = sample(R, x, y);
        const [rr, rg, rb] = SIM.field.risk;
        r += rr * v * 0.5;
        g += rg * v * 0.5;
        b += rb * v * 0.5;
      }

      const i = (y * n + x) * 4;
      d[i] = Math.min(255, r);
      d[i + 1] = Math.min(255, g);
      d[i + 2] = Math.min(255, b);
      d[i + 3] = 255;
    }
  }
  return img;
}

// Which need is most urgent (lowest value) — the agent's "about".
function dominantNeed(a: number[]): number {
  let lo = 256;
  let idx = 0;
  for (let k = 0; k < 4; k++) {
    if (a[2 + k] < lo) {
      lo = a[2 + k];
      idx = k;
    }
  }
  return idx;
}

export interface DrawOpts {
  width: number;
  height: number;
  fieldCanvas: HTMLCanvasElement; // pre-rendered grid×grid field
  hovered: number | null;
  deaths: DeathMark[];
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  pb: Playback,
  frame: Frame,
  opts: DrawOpts,
  showAgents: boolean,
) {
  const { width: W, height: H } = opts;
  // Fill the whole panel (the world is square; an anisotropic stretch to the
  // panel keeps agents and field consistent and avoids letterbox bars).
  const cellX = W / pb.grid;
  const cellY = H / pb.grid;
  const cellMin = Math.min(cellX, cellY);
  const px = (gx: number) => (gx + 0.5) * cellX;
  const py = (gy: number) => (gy + 0.5) * cellY;

  // panel background
  ctx.fillStyle = SIM.bgEdge;
  ctx.fillRect(0, 0, W, H);

  // field (scaled up from grid×grid, soft) — fills the panel
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(opts.fieldCanvas, 0, 0, W, H);

  // subtle grid plate over the field
  ctx.strokeStyle = SIM.grid;
  ctx.lineWidth = 1;
  const step = pb.grid / 8;
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const p = i * step * cellY;
    ctx.moveTo(0, p);
    ctx.lineTo(W, p);
    const q = i * step * cellX;
    ctx.moveTo(q, 0);
    ctx.lineTo(q, H);
  }
  ctx.stroke();

  // death flashes (oldest first, fading)
  for (const dmk of opts.deaths) {
    const fade = Math.max(0, 1 - dmk.age / 9);
    if (fade <= 0) continue;
    const rad = cellMin * (0.8 + (1 - fade) * 3);
    ctx.strokeStyle = `rgba(244,236,224,${(fade * 0.5).toFixed(3)})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(px(dmk.x), py(dmk.y), rad, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (!showAgents) return;

  // agents — colored by dominant (most urgent) need, alpha by overall health
  const r = Math.max(1.7, cellMin * 0.42);
  for (let i = 0; i < frame.agents.length; i++) {
    const a = frame.agents[i];
    const need = NEED_ORDER[dominantNeed(a)];
    const [cr, cg, cb] = SIM.need[need];
    const avg = (a[2] + a[3] + a[4] + a[5]) / (4 * 255);
    const alpha = 0.45 + avg * 0.5;
    const X = px(a[0]);
    const Y = py(a[1]);

    // soft glow
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${(alpha * 0.10).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(X, Y, r * 3.0, 0, Math.PI * 2);
    ctx.fill();

    // body
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(X, Y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // hovered agent ring + crosshair
  if (opts.hovered != null && opts.hovered < frame.agents.length) {
    const a = frame.agents[opts.hovered];
    const X = px(a[0]);
    const Y = py(a[1]);
    ctx.strokeStyle = "rgba(240,234,224,0.92)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(X, Y, r * 2.4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Map a canvas-space point to the nearest agent index in a frame (for hover).
export function pickAgent(
  pb: Playback,
  frame: Frame,
  mx: number,
  my: number,
  W: number,
  H: number,
): number | null {
  const cellX = W / pb.grid;
  const cellY = H / pb.grid;
  let best: number | null = null;
  let bestD = (Math.min(cellX, cellY) * 1.8) ** 2;
  for (let i = 0; i < frame.agents.length; i++) {
    const a = frame.agents[i];
    const X = (a[0] + 0.5) * cellX;
    const Y = (a[1] + 0.5) * cellY;
    const dd = (X - mx) ** 2 + (Y - my) ** 2;
    if (dd < bestD) {
      bestD = dd;
      best = i;
    }
  }
  return best;
}
