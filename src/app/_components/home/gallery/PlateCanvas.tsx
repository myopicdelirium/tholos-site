"use client";

import { useEffect, useRef } from "react";

type Kind = "metric" | "deviant" | "automaton" | "consensus";

const INK = [38, 30, 20];
const ACC = [246, 181, 69];
const HP = Math.PI / 2;
const hash = (i: number, j: number) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
const hash2 = (i: number, j: number) => { const v = Math.sin(i * 269.5 + j * 183.3) * 43758.5453; return v - Math.floor(v); };
const smooth = (t: number) => t * t * (3 - 2 * t);
const wd = (a: number, b: number) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

/**
 * A cream "figure on the wall" — a Molnár-lineage lattice rendered live on a
 * light plate. The homepage runs one engine, `consensus`, across every panel:
 *   consensus — a field of bounded agents (an XY / Vicsek model). Each stroke
 *               aligns to its neighbours, so order emerges on its own: domains
 *               that agree, seams where they meet, and vortices where agreement
 *               is topologically impossible. One gold agent moves through and
 *               stirs the field, reorganising whatever it passes. Myopic
 *               Delirium in one image: local rules, emergent structure, and the
 *               outsized effect of a single deviant.
 * The older motions (metric / deviant / automaton) are kept for reuse.
 * It is a plain <canvas> in an image slot; swap it for an <img> anytime.
 */
export default function PlateCanvas({ kind, className, seed = 0 }: { kind: Kind; className?: string; seed?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current, cvs = cvsRef.current;
    if (!wrap || !cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;
    let sp = 13, cols = 0, rows = 0;
    let F: Float32Array | null = null;

    // consensus (XY / Vicsek) state
    let cur: Float32Array | null = null, nxt: Float32Array | null = null, coh: Float32Array | null = null;
    const INERTIA = 0.8, RATE = 0.10, NOISE = 0.018, DRIFT = 0.16, AW = 3.1;
    const ph = seed * 1.7;

    // Plate palette read from the active theme tokens, cross-faded on theme change
    // so the art turns day → night in sync with the chrome. Data plates elsewhere
    // stay fixed cream; only these expressive homepage figures theme.
    type Pal = { bg: number[]; bg2: number[]; ink: number[]; acc: number[] };
    const triplet = (s: string, fb: number[]) => {
      const p = s.trim().split(/\s+/).map(Number);
      return p.length >= 3 && !p.some(isNaN) ? [p[0], p[1], p[2]] : fb;
    };
    const readPal = (): Pal => {
      const cs = getComputedStyle(document.documentElement);
      const bg = triplet(cs.getPropertyValue("--plate-bg"), [244, 239, 228]);
      return {
        bg,
        // horizon color for the ground gradient; falls back to bg, which renders flat
        bg2: triplet(cs.getPropertyValue("--plate-bg2"), bg),
        ink: triplet(cs.getPropertyValue("--plate-ink"), [38, 30, 20]),
        acc: triplet(cs.getPropertyValue("--plate-acc"), [246, 181, 69]),
      };
    };
    const lerp3 = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    let palFrom: Pal = readPal(), palTo: Pal = palFrom, palStart = 0;
    const PAL_DUR = 550;
    const curPal = (now: number): Pal => {
      const t = palStart ? Math.min(1, (now - palStart) / PAL_DUR) : 1;
      if (t >= 1) return palTo;
      return { bg: lerp3(palFrom.bg, palTo.bg, t), bg2: lerp3(palFrom.bg2, palTo.bg2, t), ink: lerp3(palFrom.ink, palTo.ink, t), acc: lerp3(palFrom.acc, palTo.acc, t) };
    };
    // Track the active theme by reading the cheap dataset string each frame; only
    // re-read the (costlier) computed palette when it actually changes. This is
    // robust to the mount race where the stored theme lands after first paint.
    let lastTheme = document.documentElement.dataset.theme || "";

    const STATES = 5, THRESH = 2;
    const PAL = [[244, 239, 228], [221, 201, 150], [246, 181, 69], [140, 115, 85], [42, 33, 20]];
    let cw = 9, acols = 0, arows = 0, g: Uint8Array | null = null, ng: Uint8Array | null = null, last = 0;

    function initAutomaton() {
      acols = Math.max(16, Math.floor(W / cw));
      arows = Math.max(16, Math.floor(H / cw));
      g = new Uint8Array(acols * arows);
      ng = new Uint8Array(acols * arows);
      for (let i = 0; i < g.length; i++) g[i] = Math.floor(Math.random() * STATES);
    }

    function seedConsensus() {
      cur = new Float32Array(cols * rows);
      nxt = new Float32Array(cols * rows);
      coh = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const nx = i / cols, ny = j / rows;
        const u = Math.sin(nx * 6.0 + ph) + Math.sin(ny * 5.0 + 1.0 + ph) + Math.sin((nx + ny) * 4.0);
        const v = Math.cos(nx * 5.0 - 1.0 + ph) + Math.cos(ny * 6.0 + 2.0) + Math.cos((nx - ny) * 4.5 + ph);
        cur[j * cols + i] = Math.atan2(v, u) + (Math.random() - 0.5) * 0.6;
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap!.clientWidth; H = wrap!.clientHeight;
      if (W === 0 || H === 0) return;
      cvs!.width = Math.round(W * dpr); cvs!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (kind === "automaton") { cw = Math.max(8, Math.round(W / 34)); initAutomaton(); }
      else if (kind === "consensus") { sp = Math.max(13, Math.round(W / 46)); cols = Math.ceil(W / sp); rows = Math.ceil(H / sp); seedConsensus(); }
      else { sp = Math.max(11, Math.round(W / (kind === "metric" ? 56 : 34))); cols = Math.ceil(W / sp); rows = Math.ceil(H / sp); F = new Float32Array(cols * rows); }
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    function stepConsensus(now: number, ax: number, ay: number) {
      const R = 0.21 * Math.min(W, H), R2 = 2 * R * R, gp = now * 0.00008 + ph;
      const gdx = Math.cos(gp) * DRIFT, gdy = Math.sin(gp) * DRIFT;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = j * cols + i; let nvx = 0, nvy = 0, c = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = (i + dx + cols) % cols, ny = (j + dy + rows) % rows, a = cur![ny * cols + nx];
          nvx += Math.cos(a); nvy += Math.sin(a); c++;
        }
        coh![k] = Math.hypot(nvx, nvy) / c;
        const cx = (i + .5) * sp, cy = (j + .5) * sp, ddx = cx - ax, ddy = cy - ay, d2 = ddx * ddx + ddy * ddy;
        const w = AW * Math.exp(-d2 / R2), ta = Math.atan2(ddy, ddx) + HP;
        const vx = nvx + INERTIA * Math.cos(cur![k]) + w * Math.cos(ta) + gdx;
        const vy = nvy + INERTIA * Math.sin(cur![k]) + w * Math.sin(ta) + gdy;
        const tgt = Math.atan2(vy, vx);
        nxt![k] = cur![k] + wd(tgt, cur![k]) * RATE + (Math.random() - .5) * NOISE;
      }
      const tmp = cur; cur = nxt; nxt = tmp;
    }
    function drawConsensus(now: number, ax: number, ay: number) {
      const P = curPal(now), I = P.ink, A = P.acc;
      // ground: a radial wash rising from the bottom edge, bg2 at the horizon
      // fading to bg overhead; where bg2 equals bg this is a flat fill
      const sunX = W / 2, sunY = H * 1.06;
      const ground = ctx!.createRadialGradient(sunX, sunY, 0, sunX, sunY, Math.hypot(W / 2, sunY));
      const rgb = (c: number[]) => "rgb(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + ")";
      ground.addColorStop(0, rgb(P.bg2));
      ground.addColorStop(1, rgb(P.bg));
      ctx!.fillStyle = ground;
      ctx!.fillRect(0, 0, W, H); ctx!.lineCap = "round";
      const R = 0.21 * Math.min(W, H), Ra = R * 0.85, len = sp * 0.82;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = j * cols + i, cx = (i + .5) * sp, cy = (j + .5) * sp, th = cur![k], co = coh![k];
        const ddx = cx - ax, ddy = cy - ay, gA = Math.exp(-(ddx * ddx + ddy * ddy) / (2 * Ra * Ra));
        const gDef = co < 0.42 ? (0.42 - co) / 0.42 : 0, gold = Math.min(1, gA * 1.15 + gDef * 0.32);
        const r = Math.round(I[0] + (A[0] - I[0]) * gold), gg = Math.round(I[1] + (A[1] - I[1]) * gold), b = Math.round(I[2] + (A[2] - I[2]) * gold);
        ctx!.strokeStyle = "rgba(" + r + "," + gg + "," + b + "," + (0.32 + 0.44 * co + 0.16 * gA).toFixed(3) + ")";
        ctx!.lineWidth = 1.15 + 1.15 * gold;
        const dx = Math.cos(th) * len * .5, dy = Math.sin(th) * len * .5;
        ctx!.beginPath(); ctx!.moveTo(cx - dx, cy - dy); ctx!.lineTo(cx + dx, cy + dy); ctx!.stroke();
      }
      // agent — a luminous point, lit from within (no hard outline), tinted by the theme accent
      const ac = (a: number) => "rgba(" + Math.round(A[0]) + "," + Math.round(A[1]) + "," + Math.round(A[2]) + "," + a + ")";
      const gr = ctx!.createRadialGradient(ax, ay, 0, ax, ay, R * 0.72);
      gr.addColorStop(0, ac(.26)); gr.addColorStop(1, ac(0));
      ctx!.fillStyle = gr; ctx!.beginPath(); ctx!.arc(ax, ay, R * 0.72, 0, 6.283); ctx!.fill();
      ctx!.fillStyle = "rgba(" + Math.round(A[0] * .92) + "," + Math.round(A[1] * .86) + "," + Math.round(A[2] * .8) + ",.9)"; ctx!.beginPath(); ctx!.arc(ax, ay, 4.4, 0, 6.283); ctx!.fill();
      ctx!.fillStyle = "rgb(" + Math.round(A[0]) + "," + Math.round(A[1]) + "," + Math.round(A[2]) + ")"; ctx!.beginPath(); ctx!.arc(ax, ay, 3.2, 0, 6.283); ctx!.fill();
      ctx!.fillStyle = "rgba(255,244,222,.95)"; ctx!.beginPath(); ctx!.arc(ax - 0.4, ay - 0.4, 1.35, 0, 6.283); ctx!.fill();
    }

    function drawMetric(now: number) {
      ctx!.fillStyle = "#f4efe4"; ctx!.fillRect(0, 0, W, H);
      const lx = (0.5 + 0.36 * Math.sin(now * 0.00009 + Math.sin(now * 0.00004))) * W;
      const ly = (0.5 + 0.28 * Math.cos(now * 0.00007 + 1.7)) * H;
      const R = 0.30 * Math.min(W, H), M = now * 0.0001;
      ctx!.lineCap = "round";
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = j * cols + i, cx = i * sp + sp * .5, cy = j * sp + sp * .5, nx = cx / W, ny = cy / H;
        const dx = cx - lx, dy = cy - ly, dist = Math.hypot(dx, dy);
        const s = 1 / (1 + Math.exp((dist - R) / (R * .10)));
        F![k] = Math.max(F![k] * 0.9962, s);
        const a = F![k];
        const band = Math.exp(-((dist - R) * (dist - R)) / ((R * .15) * (R * .15)));
        const h = hash(i, j), h2 = hash2(i, j);
        const noiseAng = .32 + .5 * Math.sin(now * .00015 + nx * 3.1 + ny * 2.7) + (h - .5) * .9;
        const sm = smooth(Math.min(1, a * 1.05));
        let ang = noiseAng + wd(M, noiseAng) * sm;
        ang += (h2 - .5) * Math.PI * 1.7 * band;
        const jit = band * sp * .5, ox = (h - .5) * jit, oy = (h2 - .5) * jit, len = sp * .66;
        const gold = Math.max(0, a - band * .4);
        if (gold > .1) { ctx!.strokeStyle = "rgba(" + Math.round(INK[0] + (ACC[0] - INK[0]) * gold * .9) + "," + Math.round(INK[1] + (ACC[1] - INK[1]) * gold * .9) + "," + Math.round(INK[2] + (ACC[2] - INK[2]) * gold * .9) + "," + (.4 + .5 * Math.max(a, .25)).toFixed(3) + ")"; ctx!.lineWidth = 1.3 + .8 * gold; }
        else { ctx!.strokeStyle = "rgba(38,30,20," + (.30 + .52 * Math.max(a, .16)).toFixed(3) + ")"; ctx!.lineWidth = 1.3; }
        const ddx = Math.cos(ang) * len * .5, ddy = Math.sin(ang) * len * .5;
        ctx!.beginPath(); ctx!.moveTo(cx + ox - ddx, cy + oy - ddy); ctx!.lineTo(cx + ox + ddx, cy + oy + ddy); ctx!.stroke();
      }
      ctx!.strokeStyle = "rgba(246,181,69,.28)"; ctx!.lineWidth = 1.4;
      ctx!.beginPath(); ctx!.arc(lx, ly, R, 0, 6.283); ctx!.stroke();
    }

    function drawDeviant(now: number) {
      ctx!.fillStyle = "#f4efe4"; ctx!.fillRect(0, 0, W, H);
      const ax = (0.5 + 0.34 * Math.sin(now * 0.00009 + 1.3 * Math.sin(now * 0.00003))) * W;
      const ay = (0.5 + 0.36 * Math.cos(now * 0.00007 + Math.sin(now * 0.00004))) * H;
      const R = 0.24 * Math.min(W, H);
      ctx!.lineCap = "round";
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = j * cols + i, cx = i * sp + sp * .5, cy = j * sp + sp * .5, ny = cy / H;
        const dx = cx - ax, dy = cy - ay;
        const prox = Math.exp(-(dx * dx + dy * dy) / (R * R));
        F![k] = Math.min(1, Math.max(F![k] * 0.977, prox));
        const d = F![k], h = hash(i, j), h2 = hash2(i, j);
        const base = .32 + .3 * Math.sin(now * .00012 + ny * 2.4);
        const tang = Math.atan2(dy, dx) + Math.PI / 2;
        const s = smooth(Math.min(1, prox * 1.7));
        const ang = base + wd(tang, base) * s + (h - .5) * Math.PI * 1.5 * d;
        const jit = d * sp * .45, ox = (h - .5) * jit, oy = (h2 - .5) * jit, len = sp * .64;
        const b = Math.min(1, d * 1.1);
        if (b > .08) { ctx!.strokeStyle = "rgba(" + Math.round(INK[0] + (ACC[0] - INK[0]) * b * .92) + "," + Math.round(INK[1] + (ACC[1] - INK[1]) * b * .92) + "," + Math.round(INK[2] + (ACC[2] - INK[2]) * b * .92) + ",.92)"; ctx!.lineWidth = 1.3 + .7 * b; }
        else { ctx!.strokeStyle = "rgba(38,30,20,.82)"; ctx!.lineWidth = 1.25; }
        const ddx = Math.cos(ang) * len * .5, ddy = Math.sin(ang) * len * .5;
        ctx!.beginPath(); ctx!.moveTo(cx + ox - ddx, cy + oy - ddy); ctx!.lineTo(cx + ox + ddx, cy + oy + ddy); ctx!.stroke();
      }
      ctx!.fillStyle = "rgba(246,181,69,.15)"; ctx!.beginPath(); ctx!.arc(ax, ay, 11, 0, 6.283); ctx!.fill();
      ctx!.fillStyle = "#f6b545"; ctx!.beginPath(); ctx!.arc(ax, ay, 3.4, 0, 6.283); ctx!.fill();
      ctx!.lineWidth = 1.2; ctx!.strokeStyle = "rgba(38,30,20,.85)"; ctx!.stroke();
    }

    function stepAutomaton() {
      for (let y = 0; y < arows; y++) for (let x = 0; x < acols; x++) {
        const s = g![y * acols + x], nxtS = (s + 1) % STATES; let c = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = (x + dx + acols) % acols, ny2 = (y + dy + arows) % arows; if (g![ny2 * acols + nx] === nxtS) c++; }
        ng![y * acols + x] = c >= THRESH ? nxtS : s;
      }
      const t = g; g = ng; ng = t;
    }
    function drawAutomaton() {
      if (!g) return;
      for (let y = 0; y < arows; y++) for (let x = 0; x < acols; x++) { const c = PAL[g[y * acols + x]]; ctx!.fillStyle = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; ctx!.fillRect(x * cw, y * cw, cw + 1, cw + 1); }
    }

    let raf = 0, running = true, visible = true;
    function loop(now: number) {
      if (running && visible && W > 0) {
        if (kind === "consensus") {
          const th = document.documentElement.dataset.theme || "";
          if (th !== lastTheme) { lastTheme = th; palFrom = curPal(now); palTo = readPal(); palStart = now; }
          const ax = (.5 + .32 * Math.sin(now * .00013 + ph + 0.7 * Math.sin(now * .00005))) * W;
          const ay = (.5 + .30 * Math.cos(now * .0001 + ph + Math.sin(now * .00006))) * H;
          stepConsensus(now, ax, ay); drawConsensus(now, ax, ay);
        }
        else if (kind === "metric") drawMetric(now);
        else if (kind === "deviant") drawDeviant(now);
        else { if (now - last > 170) { last = now; stepAutomaton(); drawAutomaton(); } }
      }
      raf = requestAnimationFrame(loop);
    }
    if (kind === "automaton") drawAutomaton();
    raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 });
    io.observe(cvs);
    const onVis = () => { running = document.visibilityState === "visible"; };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [kind, seed]);

  return (
    <div ref={wrapRef} className={className} style={{ position: "absolute", inset: 0 }}>
      <canvas ref={cvsRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
