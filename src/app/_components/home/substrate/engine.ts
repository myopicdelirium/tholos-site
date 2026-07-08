/**
 * Substrate simulation engine.
 *
 * A framework-free extraction of the Myopic Delirium agent ecology: bounded
 * agents on a unit torus that forage, flock, stress and flee across four
 * behavioural modes, plus regenerating resource patches and hunting predators.
 * Rendering lives elsewhere; this module is pure state + stepping so it can be
 * driven imperatively from a scroll loop.
 *
 * Adapted from src/app/_components/AgentEcology.tsx (the same core physics).
 */

/* ─── types ─── */
export type Mode = 0 | 1 | 2 | 3; // calm, stressed, cooperative, fleeing

export interface Agent {
  x: number; y: number;
  vx: number; vy: number;
  mode: Mode;
  energy: number;
  stress: number;
  modeTimer: number;
  prevX: number[]; prevY: number[];
  dead: number; // 0 = alive, >0 = respawn countdown
}

export interface Patch {
  cx: number; cy: number;
  radius: number;
  level: number;
  maxLevel: number;
  phase: number;
  regenRate: number;
}

export interface Predator {
  x: number; y: number;
  vx: number; vy: number;
  target: number;
  cooldown: number;
}

export interface World {
  agents: Agent[];
  patches: Patch[];
  predators: Predator[];
  tick: number;
  grid: Map<number, number[]>;
  _metrics?: Metrics;
}

export interface Params {
  metricPressure: number; // crowding threshold + acceleration bias
  scarcity: number;       // resource regen + energy drain
  predatorCount: number;  // number of hunters in the field
}

export interface Metrics {
  pop: number;
  stress: number;    // 0..1
  resources: number; // 0..1
  cohesion: number;  // fraction of agents in cooperative mode, 0..1
}

/* ─── constants ─── */
export const GRID_N = 32;
const PERCEPTION = 0.045;
const FLEE_RADIUS = 0.09;
const BASE_SPEED = 0.0012;
const MAX_ACCEL = 0.0004;
const DAMPING = 0.96;
const MODE_LOCK = 40;
const SEASON_FREQ = 0.0003;
export const TRAIL_LEN = 3;

/* ─── helpers ─── */
export function wrap(v: number) { return ((v % 1) + 1) % 1; }

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
export function initWorld(agentCount: number, patchCount: number, predCount: number): World {
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
    predators.push({ x: Math.random(), y: Math.random(), vx: 0, vy: 0, target: -1, cooldown: 0 });
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
        if (dist(x, y, w.agents[idx].x, w.agents[idx].y) < radius) result.push(idx);
      }
    }
  }
  return result;
}

/* ─── update ─── */
export function updateWorld(w: World, p: Params) {
  w.tick++;

  rebuildGrid(w);

  // adjust predator count toward target
  const targetPred = Math.max(0, Math.round(p.predatorCount));
  while (w.predators.length < targetPred) {
    w.predators.push({ x: Math.random(), y: Math.random(), vx: 0, vy: 0, target: -1, cooldown: 0 });
  }
  while (w.predators.length > targetPred) w.predators.pop();

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
    if (pred.cooldown > 0) pred.cooldown--;

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

    if (pred.cooldown <= 0 && bestIdx >= 0 && bestDist < 0.012) {
      w.agents[bestIdx].dead = 90;
      pred.cooldown = 60;
    }
  }

  if (w.tick % 6 === 0) w._metrics = computeMetrics(w);
}

export function computeMetrics(w: World): Metrics {
  let alive = 0, totalStress = 0, totalRes = 0, coop = 0;
  for (const a of w.agents) {
    if (a.dead <= 0) { alive++; totalStress += a.stress; if (a.mode === 2) coop++; }
  }
  for (const p of w.patches) totalRes += p.level / p.maxLevel;
  return {
    pop: alive,
    stress: alive > 0 ? totalStress / alive : 0,
    resources: w.patches.length > 0 ? totalRes / w.patches.length : 0,
    cohesion: alive > 0 ? coop / alive : 0,
  };
}
