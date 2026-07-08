"use client";

/**
 * The Vigil — a self-measuring instrument of terminal commitment.
 *
 * Left: a living population (thirst, hunger, predators, grief) on one
 * attention budget. Right: the same update law swept across parameter space
 * in the browser, painted as a phase diagram whose prediction is checked
 * against the field's observed outcomes, live. Mechanism toggles ablate one
 * component at a time. Everything runs client-side; seeds are displayed and
 * every run reproduces. No death is scripted anywhere in this file — the
 * martyrdom lives in the coupling of gate, shield, and a declining body.
 */

import { useEffect, useRef } from "react";

const INK = "#241d15";
const MUTED = "#6a6258";
const FAINT = "#9a917f";
const LINE = "rgba(36,29,21,0.16)";
const OX = "#8a3033";
const PAPER = "#fbf8f1";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const CSS = `
.vg{color:${INK};max-width:100%;font-family:ui-sans-serif,system-ui,sans-serif}
.vg *{box-sizing:border-box}
.vg-top{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:14px}
.vg-stage{position:relative;border:1px solid ${LINE};border-radius:10px;overflow:hidden;background:${PAPER}}
.vg-canvas{display:block;width:100%;height:auto}
.vg-hint{position:absolute;right:8px;top:7px;font-size:11px;color:${FAINT};font-family:${MONO}}
.vg-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:${MUTED};margin:8px 2px 0}
.vg-legend span{display:inline-flex;align-items:center;gap:6px}
.vg-gl{font-family:${MONO};font-size:13px;line-height:1}
.vg-bands{margin:11px 2px 0}
.vg-tbl{font-size:11px;color:${MUTED};margin-bottom:5px}
.vg-tbb{height:9px;border-radius:2px;overflow:hidden;display:flex;background:${PAPER};border:1px solid ${LINE}}
.vg-tbb span{transition:width .3s linear}
.vg-s-search{background:${OX}}.vg-s-flee{background:${INK}}.vg-s-drink{background:${MUTED}}.vg-s-forage{background:${FAINT}}.vg-s-rest{background:${LINE}}
.vg-tbc{font-family:${MONO};font-size:11px;color:${MUTED};margin-top:5px;display:flex;gap:12px;flex-wrap:wrap}
.vg-tbc b{font-weight:600;color:${INK}}
.vg-map{border:1px solid ${LINE};border-radius:10px;background:rgba(36,29,21,0.03);padding:11px 12px;display:flex;flex-direction:column}
.vg-maph{font-size:12px;color:${MUTED};font-weight:600;margin-bottom:9px}
.vg-prog{float:right;font-family:${MONO};color:${FAINT};font-weight:400}
.vg-mapc{display:block;width:100%;height:auto;background:${PAPER};border:1px solid ${LINE};border-radius:6px;cursor:crosshair}
.vg-mapcap{font-size:11px;color:${FAINT};line-height:1.55;margin-top:8px}
.vg-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.vg-panel{border:1px solid ${LINE};border-radius:10px;padding:12px 13px;background:rgba(36,29,21,0.03)}
.vg-ph{font-size:12px;color:${MUTED};font-weight:600;margin-bottom:10px}
.vg-phn{color:${FAINT};font-weight:400}
.vg-mets{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.vg-m{border:1px solid ${LINE};border-radius:8px;padding:8px 10px;background:${PAPER}}
.vg-mv{font-family:${MONO};font-size:22px;line-height:1}
.vg-ml{font-size:11px;color:${MUTED};margin-top:4px}
.vg-tll{font-size:11px;color:${MUTED};margin-top:11px}
.vg-tl{height:12px;overflow:hidden;white-space:nowrap;margin-top:4px}
.vg-tl i{display:inline-block;width:5px;height:10px;margin-right:2px;border-radius:1px}
.vg-barw{margin-top:11px}
.vg-barl{font-size:11px;color:${MUTED};margin-bottom:5px}
.vg-bar{height:7px;border-radius:2px;overflow:hidden;display:flex;background:${PAPER};border:1px solid ${LINE}}
.vg-bm{background:${OX}}.vg-bg{background:${FAINT}}
.vg-bare{display:flex;justify-content:space-between;font-family:${MONO};font-size:11px;color:${MUTED};margin-top:5px}
.vg-pred{font-family:${MONO};font-size:11px;color:${MUTED};margin-top:8px;line-height:1.6}
.vg-pred b{color:${INK};font-weight:600}
.vg-ins{margin-top:11px;border-top:1px solid ${LINE};padding-top:10px;min-height:96px}
.vg-insh{font-size:12.5px;margin-bottom:6px;font-family:${MONO}}
.vg-insb{font-size:12px;color:${MUTED};line-height:1.55}
.vg-insr{display:flex;align-items:center;gap:8px;margin-top:7px;font-family:${MONO};font-size:11px;color:${MUTED}}
.vg-insr .k{width:96px;color:${FAINT}}
.vg-track{flex:1;height:7px;border-radius:2px;background:${PAPER};border:1px solid ${LINE};overflow:hidden}
.vg-fill{height:100%}
.vg-num{width:42px;text-align:right;color:${INK}}
.vg-feed{height:238px;overflow:hidden;display:flex;flex-direction:column}
.vg-el{font-family:var(--font-display),ui-serif,Georgia,serif;font-size:13.5px;line-height:1.5;padding:6px 0;border-bottom:1px solid ${LINE};color:${MUTED}}
.vg-el.mart{color:${INK}}
.vg-el.surv{color:${FAINT}}
.vg-el .en{font-family:${MONO};font-size:11px;color:${FAINT};margin-right:7px}
.vg-ctls{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;margin-top:14px}
.vg-ctl{flex:1;min-width:145px}
.vg-ctl label{display:block;font-size:12px;color:${MUTED};margin-bottom:6px}
.vg-cv{float:right;font-family:${MONO};color:${INK}}
.vg-ctl input[type=range]{width:100%;accent-color:${INK}}
.vg-ends{display:flex;justify-content:space-between;font-size:10.5px;color:${FAINT};margin-top:3px}
.vg-btns{display:flex;gap:7px;flex-wrap:wrap}
.vg-btn{background:${PAPER};border:1px solid ${LINE};color:${INK};border-radius:8px;padding:8px 11px;font-size:12px;cursor:pointer;font-family:inherit}
.vg-btn:hover{border-color:${MUTED}}
.vg-btn.on{border-color:${INK}}
.vg-btn.abl{border-color:${OX};color:${OX}}
.vg-mechl{font-size:11px;color:${MUTED};margin-bottom:6px}
.vg-foot{font-size:12px;color:${MUTED};line-height:1.65;margin-top:13px;max-width:84ch}
@media(max-width:760px){.vg-top{grid-template-columns:1fr}.vg-grid{grid-template-columns:1fr}}
`;

type Ent = {
  id: number; kind: string; x: number; y: number; vx: number; vy: number; wa: number;
  H: number; E: number; age: number; childId: number | null; parentId?: number;
  latched: boolean; M: number; lossAge: number; memX: number; memY: number;
  optimizer: boolean; devotion: number; thirstMul: number; passes: number; flash: number;
  band: string; trail: { x: number; y: number }[] | null; dead?: boolean; deadAgo?: number; maint?: number;
};

export default function Vigil() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ac = new AbortController();
    const sig = { signal: ac.signal };
    const canvas = root.querySelector(".vg-canvas") as HTMLCanvasElement;
    const mapCanvas = root.querySelector(".vg-mapc") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    const mtx = mapCanvas.getContext("2d")!;
    const feed = root.querySelector(".vg-feed") as HTMLDivElement;
    feed.innerHTML = "";
    (root.querySelector('[data-k="tl"]') as HTMLDivElement).innerHTML = "";

    const WW = 900, WH = 560, MN = 14;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let scale = 1, mapSize = 300;

    function fit() {
      const w = Math.max(300, (canvas.parentElement as HTMLElement).clientWidth);
      canvas.style.height = Math.round((w * WH) / WW) + "px";
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(((w * WH) / WW) * dpr);
      scale = w / WW;
      mapSize = Math.max(220, (mapCanvas.parentElement as HTMLElement).clientWidth - 24);
      mapCanvas.style.height = mapSize + "px";
      mapCanvas.width = Math.round(mapSize * dpr);
      mapCanvas.height = Math.round(mapSize * dpr);
    }

    function mulberry32(a: number) {
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const devoR = (r: () => number) => 0.7 + 1.05 * Math.pow(r(), 1.4);

    const P = {
      baseThirst: 0.0014, baseHunger: 0.0018, thirstThreshold: 0.5, forageThreshold: 0.5,
      drinkRate: 0.035, eatRate: 0.045, speed: 1.7, predSpeed: 1.85, fleeRange: 64,
      actionThreshold: 0.5, missionWeight: 2.5, shielding: 0.85, affectDecay: 0.003,
      closeThreshold: 0.25, optimizerFrac: 0.25, matureAge: 520, lockRange: 230, birthRate: 0.012,
    };
    const abl = { gate: true, shared: true };

    let seed = 0, rnd = mulberry32(1);
    let agents: Ent[] = [], predators: { x: number; y: number; tx: number; ty: number; cool: number }[] = [];
    let pools: { x: number; y: number; r: number }[] = [], forage: { x: number; y: number; r: number }[] = [];
    let marks: { x: number; y: number }[] = [], nextId = 1;
    let stats = { martyr: 0, grief: 0, taken: 0 }, eStats = { m: 0, g: 0 };
    let follow: Ent | null = null, tick = 0, reveal = false, playing = true, speedMul = 1;
    let bandCount = { search: 0, flee: 0, drink: 0, forage: 0, rest: 0 };

    function nearest(list: { x: number; y: number }[], x: number, y: number) {
      let b = list[0], bd = 1e9;
      for (const p of list) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; b = p; } }
      return { o: b, dist: bd };
    }
    function spawnAdult() {
      agents.push({
        id: nextId++, kind: "adult", x: 40 + rnd() * (WW - 80), y: 40 + rnd() * (WH - 80),
        vx: 0, vy: 0, wa: rnd() * 6.28, H: 0.55 + rnd() * 0.45, E: 0.5 + rnd() * 0.5,
        age: (rnd() * 300) | 0, childId: null, latched: false, M: 0, lossAge: 0, memX: 0, memY: 0,
        optimizer: rnd() < P.optimizerFrac, devotion: devoR(rnd), thirstMul: 0.8 + rnd() * 0.45,
        passes: 0, flash: 0, band: "rest", trail: null,
      });
    }
    function spawnChild(par: Ent) {
      const c: Ent = {
        id: nextId++, kind: "child", x: par.x + (rnd() - 0.5) * 16, y: par.y + (rnd() - 0.5) * 16,
        vx: 0, vy: 0, wa: 0, H: 1, E: 1, age: 0, childId: null, parentId: par.id,
        latched: false, M: 0, lossAge: 0, memX: 0, memY: 0, optimizer: false, devotion: 1,
        thirstMul: 1, passes: 0, flash: 0, band: "rest", trail: null,
      };
      par.childId = c.id; agents.push(c); return c;
    }
    function reset() {
      seed = (Math.random() * 1e9) | 0;
      rnd = mulberry32(seed);
      pools = []; for (let i = 0; i < 6; i++) pools.push({ x: 90 + rnd() * (WW - 180), y: 80 + rnd() * (WH - 160), r: 42 });
      forage = []; for (let i = 0; i < 8; i++) forage.push({ x: 60 + rnd() * (WW - 120), y: 60 + rnd() * (WH - 120), r: 16 });
      agents = []; predators = []; marks = []; nextId = 1; tick = 0; follow = null;
      stats = { martyr: 0, grief: 0, taken: 0 }; eStats = { m: 0, g: 0 };
      for (let i = 0; i < 46; i++) spawnAdult();
      for (let i = 0; i < 6; i++) { const a = agents[(rnd() * agents.length) | 0]; if (a && a.kind === "adult" && !a.childId) spawnChild(a); }
      for (let i = 0; i < 3; i++) predators.push({ x: rnd() * WW, y: rnd() * WH, tx: rnd() * WW, ty: rnd() * WH, cool: 0 });
      bandCount = { search: 0, flee: 0, drink: 0, forage: 0, rest: 0 };
      const h = root!.querySelector('[data-k="hint"]'); if (h) h.textContent = "click a dot · seed " + seed;
      renderMetrics();
    }

    function ago(t: number) {
      const s = Math.round(t / 22);
      if (s < 60) return s + " beats ago";
      const m = Math.round(s / 60);
      return m + (m === 1 ? " minute ago" : " minutes ago");
    }
    function pushEleg(a: Ent, type: string) {
      const paces = Math.round(nearest(pools, a.x, a.y).dist / 6);
      const steps = Math.round(a.lossAge / 3);
      const dv = a.devotion.toFixed(2);
      if (type === "martyr") {
        const opt = [
          `died of thirst ${paces} paces from water, on the ${steps}th step of a search for a child taken ${ago(a.deadAgo || 0)}. it never looked up.`,
          `walked past water ${a.passes} times while searching. the thirst signal fired and reached no one. devotion ${dv}.`,
          `the child was gone; the search was not. it went out reaching, ${paces} paces short of the pool.`,
          `held the mission ${steps} steps past the point of no return.`,
          `its attention never left the last place it saw the child. the body forgot to drink.`,
        ];
        addLine(a.id, opt[a.id % opt.length], "mart");
      } else {
        const opt = [
          `let go on the ${steps}th step and turned back to the water. it will carry it, but it lived.`,
          `the grief released before the body failed. it drank, ${paces} paces from where it had stopped looking.`,
          `forgetting arrived in time. the search closed.`,
        ];
        addLine(a.id, opt[a.id % opt.length], "surv");
      }
    }
    function addLine(id: number, txt: string, cls: string) {
      const el = document.createElement("div");
      el.className = "vg-el " + cls;
      el.innerHTML = '<span class="en">' + id + "</span>" + txt;
      feed.insertBefore(el, feed.firstChild);
      while (feed.childNodes.length > 16) feed.removeChild(feed.lastChild!);
    }
    function addTick(died: number) {
      const tl = root!.querySelector('[data-k="tl"]') as HTMLDivElement;
      const i = document.createElement("i");
      i.style.background = died ? OX : FAINT;
      tl.insertBefore(i, tl.firstChild);
      while (tl.childNodes.length > 60) tl.removeChild(tl.lastChild!);
    }

    function move(a: Ent, dvx: number, dvy: number, sp: number) {
      const dl = Math.hypot(dvx, dvy) || 1; dvx /= dl; dvy /= dl;
      a.vx += (dvx * sp - a.vx) * 0.2 + (rnd() - 0.5) * 0.12;
      a.vy += (dvy * sp - a.vy) * 0.2 + (rnd() - 0.5) * 0.12;
      const vl = Math.hypot(a.vx, a.vy);
      if (vl > sp) { a.vx = (a.vx / vl) * sp; a.vy = (a.vy / vl) * sp; }
      a.x = clamp(a.x + a.vx, 5, WW - 5); a.y = clamp(a.y + a.vy, 5, WH - 5);
    }

    function step() {
      tick++;
      const byId = new Map(agents.map((a) => [a.id, a]));
      P.lockRange = lerp(120, 350, ctlv.pred);
      P.shielding = lerp(0.3, 0.98, ctlv.shield);
      P.affectDecay = lerp(0.0015, 0.0075, ctlv.forget);
      const bc = { search: 0, flee: 0, drink: 0, forage: 0, rest: 0 };

      for (const pr of predators) {
        let target: Ent | null = null, bd = 1e9;
        for (const a of agents) if (a.kind === "child") { const d = Math.hypot(a.x - pr.x, a.y - pr.y); if (d < bd) { bd = d; target = a; } }
        if (target && bd < P.lockRange) { pr.tx = target.x; pr.ty = target.y; }
        else if (Math.hypot(pr.tx - pr.x, pr.ty - pr.y) < 24) { pr.tx = rnd() * WW; pr.ty = rnd() * WH; }
        const ang = Math.atan2(pr.ty - pr.y, pr.tx - pr.x);
        pr.x += Math.cos(ang) * P.predSpeed; pr.y += Math.sin(ang) * P.predSpeed;
        if (target && bd < 24 && pr.cool <= 0) {
          target.dead = true; stats.taken++;
          const parent = target.parentId != null ? byId.get(target.parentId) : null;
          if (parent && !parent.dead) {
            parent.flash = 1;
            if (parent.optimizer || !abl.gate) { parent.childId = null; }
            else {
              parent.latched = true; parent.M = 1; parent.lossAge = 0;
              parent.memX = target.x; parent.memY = target.y;
              parent.childId = null; parent.passes = 0; parent.trail = [];
            }
          }
          pr.cool = 90;
        }
        pr.cool--;
      }

      for (const a of agents) {
        if (a.dead) continue;
        a.age++; a.flash *= 0.93;
        a.H -= P.baseThirst * (a.thirstMul || 1);
        if (a.kind === "child") {
          const par = a.parentId != null ? byId.get(a.parentId) : null;
          if (par && !par.dead) move(a, par.x - a.x, par.y - a.y, P.speed * 0.9);
          else { a.wa += (rnd() - 0.5) * 0.4; move(a, Math.cos(a.wa), Math.sin(a.wa), P.speed * 0.7); }
          if (a.age > P.matureAge) {
            a.kind = "adult"; a.parentId = undefined; a.childId = null;
            a.optimizer = rnd() < P.optimizerFrac; a.latched = false; a.M = 0;
            a.H = Math.max(a.H, 0.7); a.E = 0.8; a.devotion = devoR(rnd);
            a.thirstMul = 0.8 + rnd() * 0.45; a.passes = 0; a.wa = rnd() * 6.28; a.band = "rest"; a.trail = null;
          }
          if (a.H <= 0) a.dead = true;
          continue;
        }
        a.E = Math.max(0, a.E - P.baseHunger);
        const thirst = clamp((P.thirstThreshold - a.H) / P.thirstThreshold, 0, 1);

        if (a.latched) {
          a.lossAge++;
          a.M = Math.exp(-(P.affectDecay / a.devotion) * a.lossAge);
          if (a.M < P.closeThreshold) {
            a.latched = false; a.M = 0; a.trail = null;
            if (!a.dead) { stats.grief++; eStats.g++; addTick(0); pushEleg(a, "grief"); }
          }
        }
        let goMission = false, maint = 1;
        if (a.latched && !a.optimizer) {
          const effShield = clamp(P.shielding * a.devotion, 0, 0.995);
          const effThirst = thirst * (1 - effShield * a.M);
          const mission = P.missionWeight * a.M;
          maint = effThirst / (effThirst + mission + 1e-6);
          goMission = maint < P.actionThreshold;
          if (!abl.shared && thirst > 0.12) goMission = false;
        }
        a.maint = maint;

        let pd = 1e9, pnx = 0, pny = 0;
        for (const pr of predators) { const d = Math.hypot(a.x - pr.x, a.y - pr.y); if (d < pd) { pd = d; pnx = pr.x; pny = pr.y; } }

        let band: string, seek = false, eat = false;
        if (goMission) {
          band = "search"; move(a, a.memX - a.x, a.memY - a.y, P.speed);
          if (nearest(pools, a.x, a.y).dist < 52) a.passes++;
          a.trail = a.trail || [];
          if (tick % 2 === 0) { a.trail.push({ x: a.x, y: a.y }); if (a.trail.length > 16) a.trail.shift(); }
        } else if (!a.latched && pd < P.fleeRange) {
          band = "flee"; move(a, a.x - pnx, a.y - pny, P.speed * 1.5);
        } else if (a.H < 0.9) {
          band = "drink"; const w = nearest(pools, a.x, a.y); move(a, w.o.x - a.x, w.o.y - a.y, P.speed); seek = true;
        } else if (a.E < P.forageThreshold) {
          band = "forage"; const f = nearest(forage, a.x, a.y); move(a, f.o.x - a.x, f.o.y - a.y, P.speed); eat = true;
        } else {
          band = "rest";
          const c = a.childId != null ? byId.get(a.childId) : null;
          if (c && Math.hypot(c.x - a.x, c.y - a.y) > 70) { move(a, c.x - a.x, c.y - a.y, P.speed * 0.7); }
          else { a.wa += (rnd() - 0.5) * 0.35; move(a, Math.cos(a.wa), Math.sin(a.wa), P.speed * 0.6); }
        }
        a.band = band; bc[band as keyof typeof bc]++;

        if (seek && nearest(pools, a.x, a.y).dist < 40) a.H = Math.min(1, a.H + P.drinkRate);
        if (eat && nearest(forage, a.x, a.y).dist < 16) a.E = Math.min(1, a.E + P.eatRate);
        if (follow === a) {
          a.trail = a.trail || [];
          if (tick % 2 === 0) { a.trail.push({ x: a.x, y: a.y }); if (a.trail.length > 16) a.trail.shift(); }
        }
        if (a.kind === "adult" && a.H > 0.8 && a.E > 0.6 && a.childId == null && !a.latched && rnd() < P.birthRate) {
          if (agents.filter((z) => !z.dead).length < 140) spawnChild(a);
        }
        if (a.H <= 0) {
          a.dead = true; a.deadAgo = a.lossAge;
          if (a.latched) { stats.martyr++; eStats.m++; addTick(1); marks.push({ x: a.x, y: a.y }); pushEleg(a, "martyr"); }
        }
      }
      for (let i = agents.length - 1; i >= 0; i--) if (agents[i].dead) { if (follow === agents[i]) follow = null; agents.splice(i, 1); }
      while (agents.filter((z) => z.kind === "adult").length < 36) spawnAdult();
      if (marks.length > 200) marks.splice(0, marks.length - 200);
      bandCount = bc;
    }

    let mapCells: { n: number; d: number; a: number }[] = [];
    let mapIdx = 0, mapMode = "";
    let rngM = mulberry32(2);
    const mapCache: Record<string, { cells: { n: number; d: number; a: number }[]; idx: number }> = {};
    const TRIALS = 60, ATT = 90;
    function cellParams(i: number, j: number) {
      return { decay: lerp(0.0015, 0.0075, i / (MN - 1)), shield: lerp(0.3, 0.98, 1 - j / (MN - 1)) };
    }
    function modeKey() { return (abl.gate ? "g1" : "g0") + (abl.shared ? "s1" : "s0"); }
    function resetMap() {
      mapMode = modeKey();
      if (!mapCache[mapMode]) {
        const cells = []; for (let k = 0; k < MN * MN; k++) cells.push({ n: 0, d: 0, a: 0 });
        mapCache[mapMode] = { cells, idx: 0 };
      }
      mapCells = mapCache[mapMode].cells;
      mapIdx = mapCache[mapMode].idx;
      rngM = mulberry32((seed ^ 0x5f356495) >>> 0);
    }
    function mapDone() { return !abl.gate || mapIdx >= MN * MN; }
    function cohortTrial(shield: number, decay: number) {
      const dev = devoR(rngM), tm = 0.8 + rngM() * 0.45;
      let H = 0.78 + 0.2 * rngM();
      const D = 50 + 180 * rngM();
      let p = 0, latched = true, M = 1, lossAge = 0;
      for (let t = 0; t < 8000; t++) {
        H -= P.baseThirst * tm;
        if (latched) {
          lossAge++; M = Math.exp(-(decay / dev) * lossAge);
          if (M < P.closeThreshold) { latched = false; M = 0; }
        }
        let goMission = false;
        if (latched) {
          const effShield = clamp(shield * dev, 0, 0.995);
          const thirst = clamp((P.thirstThreshold - H) / P.thirstThreshold, 0, 1);
          const effThirst = thirst * (1 - effShield * M);
          const mission = P.missionWeight * M;
          goMission = effThirst / (effThirst + mission + 1e-6) < P.actionThreshold;
          if (!abl.shared && thirst > 0.12) goMission = false;
        }
        if (goMission) { p = Math.max(0, p - P.speed); }
        else { p = Math.min(D, p + P.speed); if (D - p < 40) H = Math.min(1, H + P.drinkRate); }
        if (H <= 0) return latched ? 1 : -1;
        if (!latched && H >= 0.6) return 0;
      }
      return -1;
    }
    function mapWork(budget: number) {
      if (mapDone()) return;
      const t0 = performance.now();
      while (performance.now() - t0 < budget && mapIdx < MN * MN) {
        const c = mapCells[mapIdx];
        const pp = cellParams(mapIdx % MN, (mapIdx / MN) | 0);
        while (c.n < TRIALS && c.a < ATT) {
          c.a++;
          const r = cohortTrial(pp.shield, pp.decay);
          if (r >= 0) { c.n++; c.d += r; }
        }
        if (c.n >= TRIALS || c.a >= ATT) mapIdx++;
        if (performance.now() - t0 >= budget) break;
      }
      if (mapCache[mapMode]) mapCache[mapMode].idx = mapIdx;
      renderProg();
    }
    function renderProg() {
      const e = root!.querySelector('[data-k="prog"]')!;
      if (!abl.gate) { e.textContent = "gate ablated"; return; }
      if (mapDone()) { e.textContent = (MN * MN * TRIALS).toLocaleString() + " runs"; return; }
      e.textContent = "measuring " + Math.round((100 * mapIdx) / (MN * MN)) + "%";
    }

    function drawMap() {
      const S = mapSize;
      mtx.save(); mtx.scale(dpr, dpr);
      mtx.clearRect(0, 0, S, S);
      mtx.fillStyle = PAPER; mtx.fillRect(0, 0, S, S);
      const x0 = 30, y0 = 8, x1 = S - 8, y1 = S - 26;
      const cw = (x1 - x0) / MN, ch = (y1 - y0) / MN;
      if (!abl.gate) {
        mtx.fillStyle = FAINT; mtx.font = "12px " + MONO; mtx.textAlign = "center";
        mtx.fillText("no commitment forms —", (x0 + x1) / 2, (y0 + y1) / 2 - 8);
        mtx.fillText("nothing to measure", (x0 + x1) / 2, (y0 + y1) / 2 + 10);
        mtx.textAlign = "left";
      } else {
        for (let j = 0; j < MN; j++) for (let i = 0; i < MN; i++) {
          const c = mapCells[j * MN + i];
          if (c.n < 12) continue;
          const rate = c.d / c.n;
          if (rate <= 0) continue;
          mtx.globalAlpha = 0.08 + 0.88 * rate;
          mtx.fillStyle = OX;
          mtx.fillRect(x0 + i * cw, y0 + j * ch, cw + 0.5, ch + 0.5);
        }
        mtx.globalAlpha = 1;
      }
      mtx.strokeStyle = LINE; mtx.lineWidth = 1; mtx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      mtx.fillStyle = FAINT; mtx.font = "11px " + MONO;
      mtx.fillText("forgetting →", x0, S - 9);
      mtx.save(); mtx.translate(12, y1); mtx.rotate(-Math.PI / 2); mtx.fillText("devotion →", 0, 0); mtx.restore();
      if (abl.gate) {
        const xf = (P.affectDecay - 0.0015) / 0.006, yf = 1 - (P.shielding - 0.3) / 0.68;
        const cx = x0 + xf * (x1 - x0), cy = y0 + yf * (y1 - y0);
        mtx.strokeStyle = INK; mtx.lineWidth = 1;
        mtx.beginPath(); mtx.moveTo(cx, y0); mtx.lineTo(cx, y1); mtx.moveTo(x0, cy); mtx.lineTo(x1, cy); mtx.stroke();
        mtx.beginPath(); mtx.arc(cx, cy, 3.5, 0, 6.2832); mtx.stroke();
      }
      mtx.restore();
    }

    function xmark(x: number, y: number, r: number, col: string, w: number) {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r);
      ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
      ctx.stroke();
    }

    function draw() {
      ctx.save(); ctx.scale(dpr * scale, dpr * scale);
      ctx.clearRect(0, 0, WW, WH);
      ctx.fillStyle = PAPER; ctx.fillRect(0, 0, WW, WH);
      ctx.strokeStyle = LINE; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.55;
      ctx.beginPath();
      for (let gx = 90; gx < WW; gx += 90) { ctx.moveTo(gx, 0); ctx.lineTo(gx, WH); }
      for (let gy = 90; gy < WH; gy += 90) { ctx.moveTo(0, gy); ctx.lineTo(WW, gy); }
      ctx.stroke(); ctx.globalAlpha = 1;
      ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.globalAlpha = 0.85;
      for (const f of forage) { ctx.strokeRect(f.x - 5, f.y - 5, 10, 10); }
      ctx.globalAlpha = 1;
      for (const p of pools) { ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.stroke(); }
      for (const m of marks) { xmark(m.x, m.y, 2.6, OX, 1); }
      for (const a of agents) {
        if (!a.trail || a.trail.length < 2) continue;
        ctx.strokeStyle = a.latched ? OX : MUTED; ctx.lineWidth = 1; ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.moveTo(a.trail[0].x, a.trail[0].y);
        for (let i = 1; i < a.trail.length; i++) ctx.lineTo(a.trail[i].x, a.trail[i].y);
        ctx.stroke(); ctx.globalAlpha = 1;
      }
      for (const a of agents) {
        if (a.kind !== "adult" || !a.latched) continue;
        ctx.strokeStyle = OX; ctx.globalAlpha = 0.4; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.memX, a.memY); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.strokeRect(a.memX - 2.5, a.memY - 2.5, 5, 5);
      }
      for (const pr of predators) { xmark(pr.x, pr.y, 5, INK, 1.6); }
      for (const a of agents) {
        if (a.kind === "child") {
          ctx.strokeStyle = MUTED; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(a.x, a.y, 2.6, 0, 6.2832); ctx.stroke();
          continue;
        }
        if (a.flash > 0.05) {
          ctx.strokeStyle = OX; ctx.globalAlpha = a.flash; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(a.x, a.y, 6 + 9 * (1 - a.flash), 0, 6.2832); ctx.stroke(); ctx.globalAlpha = 1;
        }
        if (a.latched) { ctx.fillStyle = OX; ctx.beginPath(); ctx.arc(a.x, a.y, 3.4, 0, 6.2832); ctx.fill(); }
        else if (a.band === "flee") { ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(a.x, a.y, 3.2, 0, 6.2832); ctx.stroke(); }
        else if (a.optimizer) {
          if (reveal) { ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(a.x, a.y, 3.1, 0, 6.2832); ctx.stroke(); }
          else { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(a.x, a.y, 3, 0, 6.2832); ctx.fill(); }
        } else { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(a.x, a.y, 3, 0, 6.2832); ctx.fill(); }
        if (follow === a) { ctx.strokeStyle = OX; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(a.x, a.y, 7, 0, 6.2832); ctx.stroke(); }
      }
      ctx.restore();
    }

    const el = (k: string) => root!.querySelector('[data-k="' + k + '"]') as HTMLElement;
    function renderMetrics() {
      el("living").textContent = String(agents.filter((a) => a.kind === "adult" && !a.dead).length);
      el("search").textContent = String(agents.filter((a) => a.latched).length);
      el("martyr").textContent = String(stats.martyr);
      el("grief").textContent = String(stats.grief);
      const tot = eStats.m + eStats.g;
      const mp = tot ? Math.round((100 * eStats.m) / tot) : 50;
      (root!.querySelector(".vg-bm") as HTMLElement).style.width = (tot ? mp : 50) + "%";
      (root!.querySelector(".vg-bg") as HTMLElement).style.width = (tot ? 100 - mp : 50) + "%";
      el("martyrPct").textContent = tot ? "died reaching " + mp + "%" : "died reaching —";
      el("griefPct").textContent = tot ? "turned back " + (100 - mp) + "%" : "turned back —";
      if (!abl.gate) { el("mapPred").textContent = "gate ablated"; }
      else {
        const i = Math.round(((P.affectDecay - 0.0015) / 0.006) * (MN - 1));
        const j = Math.round((1 - (P.shielding - 0.3) / 0.68) * (MN - 1));
        const c = mapCells.length ? mapCells[clamp(j, 0, MN - 1) * MN + clamp(i, 0, MN - 1)] : null;
        el("mapPred").textContent = c && c.n >= 12 ? Math.round((100 * c.d) / c.n) + "%" : "measuring…";
      }
      el("fieldObs").textContent = tot ? mp + "% (" + tot + " losses)" : "— (0 losses)";
      const bc = bandCount;
      const t = Math.max(1, bc.search + bc.flee + bc.drink + bc.forage + bc.rest);
      const set = (cl: string, n: number) => { (root!.querySelector("." + cl) as HTMLElement).style.width = ((100 * n) / t).toFixed(1) + "%"; };
      set("vg-s-search", bc.search); set("vg-s-flee", bc.flee); set("vg-s-drink", bc.drink); set("vg-s-forage", bc.forage); set("vg-s-rest", bc.rest);
      el("bands").innerHTML =
        "searching <b>" + bc.search + "</b> · fleeing <b>" + bc.flee + "</b> · drinking <b>" + bc.drink +
        "</b> · foraging <b>" + bc.forage + "</b> · roaming <b>" + bc.rest + "</b>";
      renderInspect();
    }
    function renderInspect() {
      const box = root!.querySelector(".vg-ins") as HTMLElement;
      if (!follow || follow.dead) {
        if (!box.dataset.empty) {
          box.dataset.empty = "1";
          box.innerHTML =
            '<div class="vg-insh">no dot selected</div><div class="vg-insb">click any dot in the field to read its interior — hydration, energy, the charge of its grief, and how much of its attention the search is taking.</div>';
        }
        return;
      }
      box.dataset.empty = "";
      const a = follow;
      const attMission = a.latched ? 1 - (a.maint || 0) : 0;
      const bl: Record<string, string> = {
        search: "searching — attention shielded", flee: "fleeing a predator",
        drink: "seeking water", forage: "foraging", rest: "roaming",
      };
      const status = a.optimizer && a.band !== "search" ? (bl[a.band] || "stable") + " (optimizer)" : bl[a.band] || "stable";
      box.innerHTML =
        '<div class="vg-insh">agent ' + a.id + " · " + status + "</div>" +
        rowHtml("hydration", clamp(a.H, 0, 1), MUTED) +
        rowHtml("energy", clamp(a.E, 0, 1), FAINT) +
        rowHtml("grief charge", a.latched ? a.M : 0, OX) +
        rowHtml("attention → search", attMission, INK) +
        '<div class="vg-insr"><span class="k">devotion</span><span>' + a.devotion.toFixed(2) + (a.optimizer ? " · cannot latch" : "") + "</span></div>";
    }
    function rowHtml(k: string, v: number, c: string) {
      v = clamp(v, 0, 1);
      return '<div class="vg-insr"><span class="k">' + k + '</span><div class="vg-track"><div class="vg-fill" style="width:' +
        Math.round(v * 100) + "%;background:" + c + '"></div></div><span class="vg-num">' + Math.round(v * 100) + "</span></div>";
    }

    const ctlv = { shield: 0.81, forget: 0.25, pred: 0.55 };
    function readCtl() {
      root!.querySelectorAll("[data-c]").forEach((inp) => {
        const i = inp as HTMLInputElement;
        (ctlv as Record<string, number>)[i.dataset.c!] = +i.value / 100;
      });
      P.shielding = lerp(0.3, 0.98, ctlv.shield);
      P.affectDecay = lerp(0.0015, 0.0075, ctlv.forget);
      (root!.querySelector('[data-cv="shield"]') as HTMLElement).textContent = Math.round(P.shielding * 100) + "%";
      (root!.querySelector('[data-cv="forget"]') as HTMLElement).textContent = (P.affectDecay * 1000).toFixed(1);
      (root!.querySelector('[data-cv="pred"]') as HTMLElement).textContent = Math.round(ctlv.pred * 100) + "%";
    }
    root.querySelectorAll("[data-c]").forEach((inp) =>
      inp.addEventListener("input", (e) => {
        readCtl();
        if ((e.target as HTMLElement).dataset.c !== "pred") { eStats = { m: 0, g: 0 }; }
      }, sig)
    );

    function setMech() {
      const g = root!.querySelector('[data-b="gate"]') as HTMLElement;
      const c = root!.querySelector('[data-b="channel"]') as HTMLElement;
      g.textContent = "inertial gate · " + (abl.gate ? "on" : "ablated");
      g.classList.toggle("on", abl.gate); g.classList.toggle("abl", !abl.gate);
      c.textContent = "alarm channel · " + (abl.shared ? "shared" : "private");
      c.classList.toggle("on", abl.shared); c.classList.toggle("abl", !abl.shared);
    }
    root.querySelector('[data-b="gate"]')!.addEventListener("click", () => { abl.gate = !abl.gate; eStats = { m: 0, g: 0 }; setMech(); resetMap(); renderProg(); }, sig);
    root.querySelector('[data-b="channel"]')!.addEventListener("click", () => { abl.shared = !abl.shared; eStats = { m: 0, g: 0 }; setMech(); resetMap(); renderProg(); }, sig);
    root.querySelector('[data-b="play"]')!.addEventListener("click", (e) => {
      playing = !playing;
      (e.currentTarget as HTMLElement).textContent = playing ? "pause" : "run";
    }, sig);
    root.querySelector('[data-b="speed"]')!.addEventListener("click", (e) => {
      speedMul = speedMul >= 4 ? 1 : speedMul * 2;
      (e.currentTarget as HTMLElement).textContent = speedMul + "×";
    }, sig);
    root.querySelector('[data-b="reveal"]')!.addEventListener("click", (e) => {
      reveal = !reveal;
      (e.currentTarget as HTMLElement).classList.toggle("on", reveal);
    }, sig);
    root.querySelector('[data-b="reset"]')!.addEventListener("click", () => { reset(); feed.innerHTML = ""; }, sig);

    canvas.addEventListener("click", (ev) => {
      const r = canvas.getBoundingClientRect();
      const mx = (ev.clientX - r.left) / scale, my = (ev.clientY - r.top) / scale;
      let best: Ent | null = null, bd = 18;
      for (const a of agents) if (a.kind === "adult") { const d = Math.hypot(a.x - mx, a.y - my); if (d < bd) { bd = d; best = a; } }
      if (follow && follow !== best && !follow.latched) follow.trail = null;
      follow = best; renderInspect();
    }, sig);
    mapCanvas.addEventListener("click", (ev) => {
      const r = mapCanvas.getBoundingClientRect();
      const S = mapSize, x0 = 30, y0 = 8, x1 = S - 8, y1 = S - 26;
      const xf = clamp((ev.clientX - r.left - x0) / (x1 - x0), 0, 1);
      const yf = clamp((ev.clientY - r.top - y0) / (y1 - y0), 0, 1);
      (root!.querySelector('[data-c="forget"]') as HTMLInputElement).value = String(Math.round(xf * 100));
      (root!.querySelector('[data-c="shield"]') as HTMLInputElement).value = String(Math.round((1 - yf) * 100));
      readCtl(); eStats = { m: 0, g: 0 };
    }, sig);

    let raf = 0, acc = 0, last = performance.now(), lastFrame = 0;
    function frame(now: number) {
      const dt = Math.min(50, now - last); last = now; lastFrame = now;
      if (playing) {
        acc += dt; const per = 1000 / 60; let s = 0;
        while (acc >= per && s < speedMul * 3) { step(); acc -= per; s++; }
      }
      mapWork(3.5);
      draw(); drawMap();
      if (tick % 6 === 0) renderMetrics();
    }
    function loop(now: number) {
      frame(now);
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => fit());
    ro.observe(canvas.parentElement as HTMLElement);
    ro.observe(mapCanvas.parentElement as HTMLElement);
    fit(); readCtl(); setMech(); reset(); resetMap();
    frame(performance.now());
    raf = requestAnimationFrame(loop);
    const watchdog = window.setInterval(() => {
      const now = performance.now();
      if (now - lastFrame > 400) frame(now);
    }, 250);

    return () => { cancelAnimationFrame(raf); window.clearInterval(watchdog); ro.disconnect(); ac.abort(); };
  }, []);

  return (
    <div className="vg" ref={rootRef}>
      <style>{CSS}</style>
      <div className="vg-top">
        <div>
          <div className="vg-stage">
            <canvas className="vg-canvas" aria-label="simulation field" />
            <div className="vg-hint" data-k="hint">click a dot · seed —</div>
          </div>
          <div className="vg-legend">
            <span><i className="vg-gl" style={{ color: INK }}>●</i>living</span>
            <span><i className="vg-gl" style={{ color: OX }}>●</i>searching</span>
            <span><i className="vg-gl" style={{ color: MUTED }}>○</i>child</span>
            <span><i className="vg-gl" style={{ color: MUTED }}>◯</i>water</span>
            <span><i className="vg-gl" style={{ color: MUTED }}>▫</i>forage</span>
            <span><i className="vg-gl" style={{ color: INK }}>✕</i>predator</span>
            <span><i className="vg-gl" style={{ color: OX }}>✕</i>died searching</span>
          </div>
          <div className="vg-bands">
            <div className="vg-tbl">population right now — attention across the motivational bands</div>
            <div className="vg-tbb">
              <span className="vg-s-search" style={{ width: 0 }} />
              <span className="vg-s-flee" style={{ width: 0 }} />
              <span className="vg-s-drink" style={{ width: 0 }} />
              <span className="vg-s-forage" style={{ width: 0 }} />
              <span className="vg-s-rest" style={{ width: "100%" }} />
            </div>
            <div className="vg-tbc" data-k="bands" />
          </div>
        </div>
        <div className="vg-map">
          <div className="vg-maph">phase map — % of bereaved who die searching <span className="vg-prog" data-k="prog">measuring…</span></div>
          <canvas className="vg-mapc" aria-label="phase diagram of martyrdom rate over devotion and forgetting" />
          <div className="vg-mapcap">
            each cell: 60 bereavements run under the field&rsquo;s own update law, inputs sampled from field-typical
            hydration and distances. white 0% → oxblood 100%. the crosshair is where the field sits; click the map to
            send it elsewhere.
          </div>
        </div>
      </div>

      <div className="vg-grid">
        <div className="vg-panel">
          <div className="vg-ph">the ledger</div>
          <div className="vg-mets">
            <div className="vg-m"><div className="vg-mv" data-k="living">0</div><div className="vg-ml">living</div></div>
            <div className="vg-m"><div className="vg-mv" data-k="search">0</div><div className="vg-ml">searching now</div></div>
            <div className="vg-m"><div className="vg-mv" data-k="martyr" style={{ color: OX }}>0</div><div className="vg-ml">died searching</div></div>
            <div className="vg-m"><div className="vg-mv" data-k="grief">0</div><div className="vg-ml">let go, lived</div></div>
          </div>
          <div className="vg-tll">losses, newest first</div>
          <div className="vg-tl" data-k="tl" />
          <div className="vg-barw">
            <div className="vg-barl">outcomes at current settings</div>
            <div className="vg-bar"><span className="vg-bm" style={{ width: "50%" }} /><span className="vg-bg" style={{ width: "50%" }} /></div>
            <div className="vg-bare"><span data-k="martyrPct">died reaching —</span><span data-k="griefPct">turned back —</span></div>
          </div>
          <div className="vg-pred">map predicts <b data-k="mapPred">measuring…</b> · field has observed <b data-k="fieldObs">—</b></div>
          <div className="vg-ins" data-empty="1">
            <div className="vg-insh">no dot selected</div>
            <div className="vg-insb">click any dot in the field to read its interior — hydration, energy, the charge of its grief, and how much of its attention the search is taking.</div>
          </div>
        </div>

        <div className="vg-panel">
          <div className="vg-ph">record <span className="vg-phn">— one line for each that fell</span></div>
          <div className="vg-feed" />
        </div>
      </div>

      <div className="vg-ctls">
        <div className="vg-ctl">
          <label>devotion <span className="vg-cv" data-cv="shield" /></label>
          <input type="range" min={0} max={100} defaultValue={81} data-c="shield" aria-label="devotion" />
          <div className="vg-ends"><span>yields to thirst</span><span>overrides survival</span></div>
        </div>
        <div className="vg-ctl">
          <label>forgetting <span className="vg-cv" data-cv="forget" /></label>
          <input type="range" min={0} max={100} defaultValue={25} data-c="forget" aria-label="forgetting" />
          <div className="vg-ends"><span>holds on</span><span>lets go</span></div>
        </div>
        <div className="vg-ctl">
          <label>predation <span className="vg-cv" data-cv="pred" /></label>
          <input type="range" min={0} max={100} defaultValue={55} data-c="pred" aria-label="predation" />
          <div className="vg-ends"><span>rare loss</span><span>constant loss</span></div>
        </div>
        <div>
          <div className="vg-mechl">mechanisms — ablate one at a time</div>
          <div className="vg-btns">
            <button className="vg-btn on" data-b="gate" type="button">inertial gate · on</button>
            <button className="vg-btn on" data-b="channel" type="button">alarm channel · shared</button>
          </div>
        </div>
        <div className="vg-btns">
          <button className="vg-btn" data-b="play" type="button">pause</button>
          <button className="vg-btn" data-b="speed" type="button">1×</button>
          <button className="vg-btn" data-b="reveal" type="button">optimizers</button>
          <button className="vg-btn" data-b="reset" type="button">reset</button>
        </div>
      </div>
      <div className="vg-foot">
        ablate the inertial gate and no search ever forms — loss passes through, and the map goes blank: no commitment,
        so no martyrs. give the alarm a private channel and commitment persists but becomes interruptible: the searching
        continues, the dying stops. predation sets how often loss arrives, not what it does — the map is invariant to
        it. the deaths are written in no rule; they live in the coupling.
      </div>
    </div>
  );
}
