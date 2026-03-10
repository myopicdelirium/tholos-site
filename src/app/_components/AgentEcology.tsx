"use client";

import { useEffect, useRef, useState } from "react";

/* ─── types ─── */
interface Agent {
  x: number; y: number;
  vx: number; vy: number;
  mode: 0 | 1 | 2 | 3; // calm, stressed, cooperative, fleeing
  energy: number;
  stress: number;
  modeTimer: number;
  prevX: number[]; prevY: number[];
  dead: number; // 0 = alive, >0 = respawn countdown
}

interface Patch {
  cx: number; cy: number;
  radius: number;
  level: number;
  maxLevel: number;
  phase: number;
  regenRate: number;
}

interface Predator {
  x: number; y: number;
  vx: number; vy: number;
  target: number;
  cooldown: number;
}

interface World {
  agents: Agent[];
  patches: Patch[];
  predators: Predator[];
  tick: number;
  grid: Map<number, number[]>;
}

interface Params {
  metricPressure: number;
  scarcity: number;
  predatorCount: number;
}

/* ─── constants ─── */
const GRID_N = 32;
const PERCEPTION = 0.045;
const FLEE_RADIUS = 0.09;
const BASE_SPEED = 0.0012;
const MAX_ACCEL = 0.0004;
const DAMPING = 0.96;
const MODE_LOCK = 40;
const SEASON_FREQ = 0.0003;
const TRAIL_LEN = 3;

const COLORS = {
  calm:  [0, 180, 200],
  stressed: [200, 170, 90],
  cooperative: [240, 234, 224],
  fleeing: [194, 58, 43],
  predator: [220, 60, 45],
} as const;

/* ─── helpers ─── */
function wrap(v: number) { return ((v % 1) + 1) % 1; }

function dist(ax: number, ay: number, bx: number, by: number) {
  let dx = ax - bx; if (dx > 0.5) dx -= 1; else if (dx < -0.5) dx += 1;
  let dy = ay - by; if (dy > 0.5) dy -= 1; else if (dy < -0.5) dy += 1;
  return Math.sqrt(dx * dx + dy * dy);
}

function toward(ax: number, ay: number, bx: number, by: number): [number, number] {
  let dx = bx - ax; if (dx > 0.5) dx -= 1; else if (dx < -0.5) dx += 1;
  let dy = by - ay; if (dy > 0.5) dy -= 1; else if (dy < -0.5) dy += 1;
  const m = Math.sqrt(dx * dx + dy * dy) || 1;
  return [dx / m, dy / m];
}

function gridKey(x: number, y: number) {
  return (Math.floor(y * GRID_N) * GRID_N + Math.floor(x * GRID_N));
}

function clamp(v: number, lo: number, hi: number) { return v < lo ? lo : v > hi ? hi : v; }

function rng(lo = 0, hi = 1) { return lo + Math.random() * (hi - lo); }

/* ─── init ─── */
function initWorld(agentCount: number, patchCount: number, predCount: number): World {
  const agents: Agent[] = [];
  for (let i = 0; i < agentCount; i++) {
    agents.push({
      x: Math.random(), y: Math.random(),
      vx: rng(-0.0005, 0.0005), vy: rng(-0.0005, 0.0005),
      mode: 0, energy: rng(0.5, 1), stress: 0, modeTimer: 0, dead: 0,
      prevX: [Math.random(), Math.random(), Math.random()],
      prevY: [Math.random(), Math.random(), Math.random()],
    });
  }

  const patches: Patch[] = [];
  for (let i = 0; i < patchCount; i++) {
    patches.push({
      cx: Math.random(), cy: Math.random(),
      radius: rng(0.04, 0.08),
      level: rng(0.4, 1), maxLevel: rng(0.7, 1),
      phase: rng(0, Math.PI * 2),
      regenRate: rng(0.001, 0.003),
    });
  }

  const predators: Predator[] = [];
  for (let i = 0; i < predCount; i++) {
    predators.push({
      x: Math.random(), y: Math.random(),
      vx: 0, vy: 0, target: -1, cooldown: 0,
    });
  }

  return { agents, patches, predators, tick: 0, grid: new Map() };
}

/* ─── spatial grid ─── */
function rebuildGrid(w: World) {
  w.grid.clear();
  for (let i = 0; i < w.agents.length; i++) {
    const a = w.agents[i];
    if (a.dead > 0) continue;
    const k = gridKey(a.x, a.y);
    const bucket = w.grid.get(k);
    if (bucket) bucket.push(i); else w.grid.set(k, [i]);
  }
}

function neighbors(w: World, x: number, y: number, radius: number): number[] {
  const result: number[] = [];
  const cx = Math.floor(x * GRID_N);
  const cy = Math.floor(y * GRID_N);
  const span = Math.ceil(radius * GRID_N) + 1;
  for (let dy = -span; dy <= span; dy++) {
    for (let dx = -span; dx <= span; dx++) {
      const gx = ((cx + dx) % GRID_N + GRID_N) % GRID_N;
      const gy = ((cy + dy) % GRID_N + GRID_N) % GRID_N;
      const bucket = w.grid.get(gy * GRID_N + gx);
      if (!bucket) continue;
      for (const idx of bucket) {
        if (dist(x, y, w.agents[idx].x, w.agents[idx].y) < radius) {
          result.push(idx);
        }
      }
    }
  }
  return result;
}

/* ─── update ─── */
function updateWorld(w: World, p: Params) {
  w.tick++;
  const season = Math.sin(w.tick * SEASON_FREQ);
  const seasonMul = 0.5 + 0.5 * season; // 0..1

  rebuildGrid(w);

  // adjust predator count
  while (w.predators.length < p.predatorCount) {
    w.predators.push({ x: Math.random(), y: Math.random(), vx: 0, vy: 0, target: -1, cooldown: 0 });
  }
  while (w.predators.length > p.predatorCount) {
    w.predators.pop();
  }

  // update resource patches
  const scarcityMul = 1 - p.scarcity * 0.7;
  for (const patch of w.patches) {
    const regen = patch.regenRate * scarcityMul * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(w.tick * SEASON_FREQ + patch.phase)));
    patch.level = clamp(patch.level + regen, 0, patch.maxLevel);
  }

  // update agents
  for (const a of w.agents) {
    if (a.dead > 0) { a.dead--; if (a.dead === 0) { a.x = Math.random(); a.y = Math.random(); a.energy = 0.6; a.stress = 0; a.mode = 0; } continue; }

    // trail
    a.prevX.pop(); a.prevX.unshift(a.x);
    a.prevY.pop(); a.prevY.unshift(a.y);

    // find neighbors
    const nbs = neighbors(w, a.x, a.y, PERCEPTION);
    const nbCount = nbs.length;

    // predator check
    let nearestPred = -1;
    let nearestPredDist = Infinity;
    for (let pi = 0; pi < w.predators.length; pi++) {
      const d = dist(a.x, a.y, w.predators[pi].x, w.predators[pi].y);
      if (d < FLEE_RADIUS && d < nearestPredDist) { nearestPred = pi; nearestPredDist = d; }
    }

    // mode transitions
    if (nearestPred >= 0) {
      a.mode = 3; a.modeTimer = MODE_LOCK;
    } else if (a.modeTimer > 0) {
      a.modeTimer--;
    } else {
      if (a.mode === 0 && (a.energy < 0.3 || a.stress > 0.5)) { a.mode = 1; a.modeTimer = MODE_LOCK; }
      else if (a.mode === 0 && nbCount >= (4 + p.metricPressure * 4) && a.energy > 0.5) { a.mode = 2; a.modeTimer = MODE_LOCK; }
      else if (a.mode === 1 && a.energy > 0.5 && a.stress < 0.2) { a.mode = 0; a.modeTimer = MODE_LOCK; }
      else if (a.mode === 2 && nbCount < 2) { a.mode = 0; a.modeTimer = MODE_LOCK; }
      else if (a.mode === 3 && nearestPred < 0) { a.mode = a.stress > 0.3 ? 1 : 0; a.modeTimer = MODE_LOCK; }
    }

    // steering
    let fx = 0, fy = 0;
    const noiseSeed = w.tick * 0.02 + a.x * 17 + a.y * 31;
    const wander = [Math.sin(noiseSeed) * 0.3, Math.cos(noiseSeed * 1.3) * 0.3];

    if (a.mode === 0) { // calm — forage
      let bestPatch = -1, bestDist = Infinity;
      for (let pi = 0; pi < w.patches.length; pi++) {
        if (w.patches[pi].level < 0.1) continue;
        const d = dist(a.x, a.y, w.patches[pi].cx, w.patches[pi].cy);
        if (d < bestDist) { bestDist = d; bestPatch = pi; }
      }
      if (bestPatch >= 0) {
        const [dx, dy] = toward(a.x, a.y, w.patches[bestPatch].cx, w.patches[bestPatch].cy);
        fx += dx * 0.6; fy += dy * 0.6;
      }
      fx += wander[0]; fy += wander[1];
    } else if (a.mode === 1) { // stressed — fast wander, avoid crowds
      fx += wander[0] * 2; fy += wander[1] * 2;
      if (nbCount > 3) {
        let cx = 0, cy = 0;
        for (const ni of nbs) { cx += w.agents[ni].x; cy += w.agents[ni].y; }
        cx /= nbCount; cy /= nbCount;
        const [dx, dy] = toward(a.x, a.y, cx, cy);
        fx -= dx * 0.5; fy -= dy * 0.5;
      }
    } else if (a.mode === 2) { // cooperative — boids
      let cohX = 0, cohY = 0, aliVx = 0, aliVy = 0, sepX = 0, sepY = 0;
      for (const ni of nbs) {
        const n = w.agents[ni];
        cohX += n.x; cohY += n.y;
        aliVx += n.vx; aliVy += n.vy;
        const d = dist(a.x, a.y, n.x, n.y);
        if (d < PERCEPTION * 0.5 && d > 0) {
          const [sx, sy] = toward(n.x, n.y, a.x, a.y);
          sepX += sx / d; sepY += sy / d;
        }
      }
      if (nbCount > 0) {
        cohX /= nbCount; cohY /= nbCount;
        const [cx, cy] = toward(a.x, a.y, cohX, cohY);
        fx += cx * 0.3; fy += cy * 0.3;
        aliVx /= nbCount; aliVy /= nbCount;
        fx += (aliVx - a.vx) * 0.2; fy += (aliVy - a.vy) * 0.2;
      }
      fx += sepX * 0.15; fy += sepY * 0.15;
      fx += wander[0] * 0.15; fy += wander[1] * 0.15;
    } else if (a.mode === 3 && nearestPred >= 0) { // fleeing
      const [dx, dy] = toward(w.predators[nearestPred].x, w.predators[nearestPred].y, a.x, a.y);
      fx += dx * 1.5; fy += dy * 1.5;
      fx += wander[0] * 0.3; fy += wander[1] * 0.3;
    }

    // speed multipliers
    const speedMul = a.mode === 1 ? 1.5 : a.mode === 2 ? 0.8 : a.mode === 3 ? 2.0 : 1.0;
    const accel = MAX_ACCEL * speedMul * (1 + p.metricPressure * 0.5);

    // normalize and cap
    const fm = Math.sqrt(fx * fx + fy * fy) || 1;
    a.vx += (fx / fm) * accel;
    a.vy += (fy / fm) * accel;
    a.vx *= DAMPING; a.vy *= DAMPING;

    const speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
    const maxSpd = BASE_SPEED * speedMul * 2;
    if (speed > maxSpd) { a.vx *= maxSpd / speed; a.vy *= maxSpd / speed; }

    a.x = wrap(a.x + a.vx);
    a.y = wrap(a.y + a.vy);

    // energy & stress
    let inPatch = false;
    for (const patch of w.patches) {
      if (dist(a.x, a.y, patch.cx, patch.cy) < patch.radius && patch.level > 0.02) {
        a.energy = clamp(a.energy + patch.level * 0.004, 0, 1);
        patch.level = clamp(patch.level - 0.0005, 0, patch.maxLevel);
        inPatch = true;
        break;
      }
    }
    if (!inPatch) a.energy = clamp(a.energy - 0.0004 * (1 + p.scarcity * 0.5), 0, 1);

    if (a.mode === 3) a.stress = clamp(a.stress + 0.02, 0, 1);
    else if (a.energy < 0.3) a.stress = clamp(a.stress + 0.005, 0, 1);
    else a.stress = clamp(a.stress - 0.003, 0, 1);
  }

  // update predators
  for (const pred of w.predators) {
    if (pred.cooldown > 0) { pred.cooldown--; }

    let bestIdx = -1, bestDist = Infinity;
    for (let i = 0; i < w.agents.length; i++) {
      if (w.agents[i].dead > 0) continue;
      const d = dist(pred.x, pred.y, w.agents[i].x, w.agents[i].y);
      if (d < 0.12 && d < bestDist) { bestDist = d; bestIdx = i; }
    }
    pred.target = bestIdx;

    if (bestIdx >= 0) {
      const [dx, dy] = toward(pred.x, pred.y, w.agents[bestIdx].x, w.agents[bestIdx].y);
      pred.vx += dx * MAX_ACCEL * 0.7;
      pred.vy += dy * MAX_ACCEL * 0.7;
    } else {
      const ns = w.tick * 0.01 + pred.x * 7;
      pred.vx += Math.sin(ns) * MAX_ACCEL * 0.3;
      pred.vy += Math.cos(ns * 1.2) * MAX_ACCEL * 0.3;
    }
    pred.vx *= 0.95; pred.vy *= 0.95;
    const ps = Math.sqrt(pred.vx * pred.vx + pred.vy * pred.vy);
    const predMax = BASE_SPEED * 1.4;
    if (ps > predMax) { pred.vx *= predMax / ps; pred.vy *= predMax / ps; }

    pred.x = wrap(pred.x + pred.vx);
    pred.y = wrap(pred.y + pred.vy);

    // consume
    if (pred.cooldown <= 0 && bestIdx >= 0 && bestDist < 0.012) {
      w.agents[bestIdx].dead = 90;
      pred.cooldown = 60;
    }
  }
}

/* ─── render ─── */
function renderFrame(ctx: CanvasRenderingContext2D, w: World, cw: number, ch: number) {
  const s = Math.min(cw, ch);
  const ox = (cw - s) / 2;
  const oy = (ch - s) / 2;
  const px = (nx: number) => ox + nx * s;
  const py = (ny: number) => oy + ny * s;

  // L0: background
  ctx.fillStyle = "#070d16";
  ctx.fillRect(0, 0, cw, ch);

  // L1: seasonal atmosphere
  const season = Math.sin(w.tick * SEASON_FREQ);
  const warmth = 0.5 + 0.5 * season;
  const grad = ctx.createRadialGradient(cw * 0.45, ch * 0.4, 0, cw * 0.45, ch * 0.4, s * 0.7);
  grad.addColorStop(0, `rgba(${Math.round(warmth * 15)}, ${Math.round(40 + warmth * 20)}, ${Math.round(60 + warmth * 10)}, 0.12)`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  // L2: resource patches (additive)
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const patch of w.patches) {
    if (patch.level < 0.02) continue;
    const r = patch.radius * s * 2.5;
    const alpha = patch.level * 0.14;
    const depleted = patch.level < 0.2;
    const pulse = depleted ? 0.5 + 0.5 * Math.sin(w.tick * 0.08) : 1;
    const g = ctx.createRadialGradient(px(patch.cx), py(patch.cy), 0, px(patch.cx), py(patch.cy), r);
    const teal = `rgba(0, 180, 200, ${(alpha * pulse).toFixed(3)})`;
    g.addColorStop(0, teal);
    g.addColorStop(0.6, `rgba(0, 140, 170, ${(alpha * pulse * 0.4).toFixed(3)})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(px(patch.cx) - r, py(patch.cy) - r, r * 2, r * 2);
  }
  ctx.restore();

  // L3+4: agents (trails + glow + body)
  const modeColors = [COLORS.calm, COLORS.stressed, COLORS.cooperative, COLORS.fleeing];

  for (const a of w.agents) {
    if (a.dead > 0) continue;

    const [cr, cg, cb] = modeColors[a.mode];
    const alpha = 0.5 + a.energy * 0.5;

    // trails
    for (let t = TRAIL_LEN - 1; t >= 0; t--) {
      const ta = alpha * (1 - (t + 1) / (TRAIL_LEN + 1)) * 0.4;
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${ta.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(px(a.prevX[t]), py(a.prevY[t]), 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // glow
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${(alpha * 0.08).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px(a.x), py(a.y), 7, 0, Math.PI * 2);
    ctx.fill();

    // body
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px(a.x), py(a.y), 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // L5: predators
  for (const pred of w.predators) {
    const pulse = 6 + 4 * Math.sin(w.tick * 0.06);
    const pulseAlpha = 0.06 + 0.04 * Math.sin(w.tick * 0.06);
    ctx.fillStyle = `rgba(220, 60, 45, ${pulseAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px(pred.x), py(pred.y), pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(220, 60, 45, 0.9)";
    ctx.beginPath();
    ctx.arc(px(pred.x), py(pred.y), 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 200, 180, 0.6)";
    ctx.beginPath();
    ctx.arc(px(pred.x), py(pred.y), 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // L6: metrics overlay
  if (w.tick % 6 === 0) {
    (w as any)._cachedMetrics = computeMetrics(w);
  }
  const m = (w as any)._cachedMetrics ?? computeMetrics(w);
  const pad = 16;
  ctx.fillStyle = "rgba(7, 13, 22, 0.75)";
  ctx.fillRect(pad, pad, 190, 72);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.strokeRect(pad, pad, 190, 72);
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.fillStyle = "rgba(244, 241, 234, 0.5)";
  ctx.fillText(`POPULATION  ${m.pop}`, pad + 12, pad + 22);
  ctx.fillText(`AVG STRESS  ${m.stress}`, pad + 12, pad + 40);
  ctx.fillText(`RESOURCES   ${m.resources}`, pad + 12, pad + 58);
}

function computeMetrics(w: World) {
  let alive = 0, totalStress = 0, totalRes = 0;
  for (const a of w.agents) { if (a.dead <= 0) { alive++; totalStress += a.stress; } }
  for (const p of w.patches) totalRes += p.level / p.maxLevel;
  return {
    pop: alive,
    stress: alive > 0 ? (totalStress / alive).toFixed(2) : "0.00",
    resources: w.patches.length > 0 ? (totalRes / w.patches.length).toFixed(2) : "0.00",
  };
}

/* ─── React component ─── */
export default function AgentEcology({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const paramsRef = useRef<Params>({ metricPressure: 0.3, scarcity: 0.35, predatorCount: 3 });
  const rafRef = useRef<number>(0);
  const runningRef = useRef(true);

  const [metricPressure, setMetricPressure] = useState(0.3);
  const [scarcity, setScarcity] = useState(0.35);
  const [predatorCount, setPredatorCount] = useState(3);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => { paramsRef.current.metricPressure = metricPressure; }, [metricPressure]);
  useEffect(() => { paramsRef.current.scarcity = scarcity; }, [scarcity]);
  useEffect(() => { paramsRef.current.predatorCount = predatorCount; }, [predatorCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    const isMobile = container.clientWidth < 800;
    const agentCount = isMobile ? 150 : 300;
    worldRef.current = initWorld(agentCount, 16, paramsRef.current.predatorCount);

    runningRef.current = true;

    function loop() {
      if (!runningRef.current) return;
      const w = worldRef.current;
      if (!w || !ctx || !canvas) return;
      updateWorld(w, paramsRef.current);
      const cw = canvas.width / (window.devicePixelRatio || 1);
      const ch = canvas.height / (window.devicePixelRatio || 1);
      renderFrame(ctx, w, cw, ch);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* slider panel */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          type="button"
          onClick={() => setShowControls(v => !v)}
          className="mb-2 ml-auto block border border-white/8 bg-[rgba(7,13,22,0.8)] px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-[#f4f1ea]/50 backdrop-blur-sm hover:text-[#f4f1ea]/80"
        >
          {showControls ? "Hide" : "Controls"}
        </button>

        {showControls && (
          <div className="w-[220px] border border-white/8 bg-[rgba(7,13,22,0.85)] p-4 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.34em] text-[#f4f1ea]/40">Parameters</div>

            <div className="mt-3 space-y-3">
              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#f4f1ea]/50">Metric Pressure</span>
                  <span className="font-mono text-[10px] text-[#f4f1ea]/35">{metricPressure.toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={metricPressure} onChange={e => setMetricPressure(+e.target.value)}
                  className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-none bg-white/10 accent-[rgb(0,180,200)]" />
              </label>

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#f4f1ea]/50">Scarcity</span>
                  <span className="font-mono text-[10px] text-[#f4f1ea]/35">{scarcity.toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={scarcity} onChange={e => setScarcity(+e.target.value)}
                  className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-none bg-white/10 accent-[rgb(0,180,200)]" />
              </label>

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#f4f1ea]/50">Predators</span>
                  <span className="font-mono text-[10px] text-[#f4f1ea]/35">{predatorCount}</span>
                </div>
                <input type="range" min="0" max="6" step="1" value={predatorCount} onChange={e => setPredatorCount(+e.target.value)}
                  className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-none bg-white/10 accent-[rgb(0,180,200)]" />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
