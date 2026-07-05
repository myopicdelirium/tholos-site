// Pure rendering for the Batch A plate (locked aesthetic). No React in here.
// Survey-plate substrate: ink-on-paper, hairline grid, surveyed comfort band,
// crisp water cells, ink agents (stressed → hollow rust ring), quiet motion.
// It computes pixels from logged frames only — it never evolves state.

import type { Frame, Manifest } from "../playback";
import { rgba, type Tokens } from "./palette";

export interface Layers {
  water: boolean;
  comfort: boolean;
  risk: boolean;
  trails: boolean;
}

export interface FadeMark {
  x: number;
  y: number;
  age: number; // render-ticks since the event
}

export interface PlateGeom {
  ox: number;
  oy: number;
  s: number;
  cell: number;
}

// Square plate centred in the canvas with paper margins (reads as a plate on a
// page; the margin is paper, not letterbox).
export function plateGeom(W: number, H: number, grid: number): PlateGeom {
  const s = Math.min(W, H) * 0.94;
  return { ox: (W - s) / 2, oy: (H - s) / 2, s, cell: s / grid };
}

const TRAIL_LEN = 5;

export function drawPlate(
  ctx: CanvasRenderingContext2D,
  m: Manifest,
  frames: Frame[] | null,
  index: number,
  frameMaps: Map<number, [number, number]>[] | null,
  tk: Tokens,
  layers: Layers,
  W: number,
  H: number,
  hoveredId: number | null,
  deaths: FadeMark[],
  births: FadeMark[],
) {
  const { ox, oy, s, cell } = plateGeom(W, H, m.grid);
  const gx = (x: number) => ox + x * cell;
  const gy = (y: number) => oy + y * cell;

  // paper
  ctx.fillStyle = rgba(tk.paper, 1);
  ctx.fillRect(0, 0, W, H);

  // hairline grid: minor every 4, major every 16
  ctx.lineWidth = 1;
  for (let i = 0; i <= m.grid; i++) {
    const major = i % 16 === 0;
    if (!major && i % 4 !== 0) continue;
    ctx.strokeStyle = rgba(tk.ink, major ? 0.16 : 0.06);
    ctx.beginPath();
    ctx.moveTo(gx(i), oy);
    ctx.lineTo(gx(i), oy + s);
    ctx.moveTo(ox, gy(i));
    ctx.lineTo(ox + s, gy(i));
    ctx.stroke();
  }

  // comfort band — surveyed horizontal zone with dashed edges + label
  if (layers.comfort && m.comfortBand) {
    const yt = gy(m.comfortBand.yLow);
    const yb = gy(m.comfortBand.yHigh);
    ctx.fillStyle = rgba(tk.water, 0.05);
    ctx.fillRect(ox, yt, s, yb - yt);
    ctx.strokeStyle = rgba(tk.ink, 0.4);
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, yt);
    ctx.lineTo(ox + s, yt);
    ctx.moveTo(ox, yb);
    ctx.lineTo(ox + s, yb);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = rgba(tk.ink, 0.5);
    ctx.font = '9px ui-monospace, "SFMono-Regular", Menlo, monospace';
    ctx.fillText(m.comfortBand.label, ox + 6, yt + 12);
  }

  // water — crisp blue cells
  if (layers.water) {
    ctx.fillStyle = rgba(tk.water, 0.55);
    for (const [wx, wy] of m.waterCells) {
      ctx.fillRect(gx(wx), gy(wy), Math.ceil(cell), Math.ceil(cell));
    }
  }

  // plate frame
  ctx.strokeStyle = rgba(tk.ink, 0.45);
  ctx.lineWidth = 1;
  ctx.strokeRect(ox, oy, s, s);

  const frame = frames ? frames[index] : null;

  // trails — faint ink polylines of each agent's last k logged positions
  if (frame && layers.trails && frameMaps) {
    ctx.strokeStyle = rgba(tk.ink, 0.14);
    ctx.lineWidth = 1;
    for (const a of frame.agents) {
      const id = a[0];
      ctx.beginPath();
      ctx.moveTo(gx(a[1] + 0.5), gy(a[2] + 0.5));
      let moved = false;
      for (let k = 1; k <= TRAIL_LEN; k++) {
        const fi = index - k;
        if (fi < 0) break;
        const p = frameMaps[fi]?.get(id);
        if (!p) break;
        ctx.lineTo(gx(p[0] + 0.5), gy(p[1] + 0.5));
        moved = true;
      }
      if (moved) ctx.stroke();
    }
  }

  // predators — rust diamond + thin risk ring
  if (frame && layers.risk) {
    for (const [pxc, pyc] of frame.predators) {
      const cx = gx(pxc + 0.5);
      const cy = gy(pyc + 0.5);
      ctx.strokeStyle = rgba(tk.rust, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 2.2, 0, Math.PI * 2);
      ctx.stroke();
      const d = cell * 0.7;
      ctx.fillStyle = rgba(tk.rust, 0.9);
      ctx.beginPath();
      ctx.moveTo(cx, cy - d);
      ctx.lineTo(cx + d, cy);
      ctx.lineTo(cx, cy + d);
      ctx.lineTo(cx - d, cy);
      ctx.closePath();
      ctx.fill();
    }
  }

  // agents — ink dot (alpha ∝ energy); stressed → hollow rust ring
  if (frame) {
    const r = Math.max(1.7, cell * 0.42);
    for (const a of frame.agents) {
      const cx = gx(a[1] + 0.5);
      const cy = gy(a[2] + 0.5);
      const energy = a[3] / 255;
      const stressed = Math.min(a[3], a[4], a[5], a[6]) < m.stressThreshold;
      if (stressed) {
        ctx.strokeStyle = rgba(tk.rust, 0.92);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = rgba(tk.ink, 0.4 + energy * 0.55);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (hoveredId != null && a[0] === hoveredId) {
        ctx.strokeStyle = rgba(tk.ink, 0.95);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // births — ink rings expand + fade
  for (const b of births) {
    const fade = 1 - b.age / 16;
    if (fade <= 0) continue;
    ctx.strokeStyle = rgba(tk.ink, fade * 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(gx(b.x + 0.5), gy(b.y + 0.5), cell * (0.5 + (1 - fade) * 2.5), 0, Math.PI * 2);
    ctx.stroke();
  }

  // deaths — small rust × marks that fade
  for (const d of deaths) {
    const fade = 1 - d.age / 15;
    if (fade <= 0) continue;
    const cx = gx(d.x + 0.5);
    const cy = gy(d.y + 0.5);
    const e = cell * 0.55;
    ctx.strokeStyle = rgba(tk.rust, fade * 0.85);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - e, cy - e);
    ctx.lineTo(cx + e, cy + e);
    ctx.moveTo(cx + e, cy - e);
    ctx.lineTo(cx - e, cy + e);
    ctx.stroke();
  }
}

// Nearest agent id to a canvas point (for hover).
export function pickAgent(
  m: Manifest,
  frame: Frame | null,
  mx: number,
  my: number,
  W: number,
  H: number,
): number | null {
  if (!frame) return null;
  const { ox, oy, cell } = plateGeom(W, H, m.grid);
  let best: number | null = null;
  let bestD = (cell * 1.8) ** 2;
  for (const a of frame.agents) {
    const X = ox + (a[1] + 0.5) * cell;
    const Y = oy + (a[2] + 0.5) * cell;
    const dd = (X - mx) ** 2 + (Y - my) ** 2;
    if (dd < bestD) {
      bestD = dd;
      best = a[0];
    }
  }
  return best;
}

// The population trace — the transport control (the trace IS the timeline).
export function drawTrace(
  ctx: CanvasRenderingContext2D,
  m: Manifest,
  tick: number,
  tk: Tokens,
  W: number,
  H: number,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = rgba(tk.paper, 1);
  ctx.fillRect(0, 0, W, H);

  const padT = 8;
  const padB = 4;
  const plotH = H - padT - padB;
  const yMax = Math.max(m.cap * 1.05, ...sampleMax(m.population));
  const yOf = (p: number) => padT + plotH * (1 - p / yMax);

  // CAP line (dashed) + label
  const capY = yOf(m.cap);
  ctx.strokeStyle = rgba(tk.rust, 0.5);
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, capY);
  ctx.lineTo(W, capY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = rgba(tk.rust, 0.7);
  ctx.font = '9px ui-monospace, "SFMono-Regular", Menlo, monospace';
  ctx.fillText("CAP", 4, capY - 4);

  // population polyline (downsampled to width)
  const n = m.population.length;
  ctx.strokeStyle = rgba(tk.ink, 0.7);
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  for (let px = 0; px < W; px++) {
    const t = Math.floor((px / W) * n);
    ctx.lineTo(px, yOf(m.population[Math.min(n - 1, t)]));
  }
  ctx.stroke();

  // baseline
  ctx.strokeStyle = rgba(tk.ink, 0.25);
  ctx.beginPath();
  ctx.moveTo(0, padT + plotH);
  ctx.lineTo(W, padT + plotH);
  ctx.stroke();

  // cursor
  const cx = (tick / Math.max(1, n - 1)) * W;
  ctx.strokeStyle = rgba(tk.rust, 0.9);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, H);
  ctx.stroke();
  ctx.fillStyle = rgba(tk.rust, 1);
  ctx.beginPath();
  ctx.arc(cx, capY, 3.2, 0, Math.PI * 2);
  ctx.fill();
}

function sampleMax(arr: number[]): number[] {
  let mx = 0;
  for (const v of arr) if (v > mx) mx = v;
  return [mx];
}
