"use client"

import { useEffect, useRef } from "react"

// TLF: sixty stations in the dark, waves, flares, trust.
// Sim identical to the headless harness (tlf_sim.js). Rendering only on
// top: a dark field where light is information, flares as expanding
// rings, the wave as a sweeping band, trust as lamp brightness and
// threads, and wolf-night branches computed from the same kernel.

const P = {
  size: 100,
  n: 60,
  T: 24000,
  roundLen: 480,
  waveP: 0.55,
  waveSpeed: 0.32,
  waveDepth: 8,
  senseR: 7,
  flareR: 30,
  relayDelay: 8,
  trust0: 0.5,
  actAt: 0.34,
  alpha: 0.25,
  alphaEcho: 0.09,
  vouch: 0.1,
  beta: 0.28,
  epsBase: 0.02,
  epsSpread: 0.05,
  epsWolf: 0.5,
  fpScale: 0.35,
  shelterCost: 0.05,
  prepT: 62,
  hitDmg: 0.18,
  regen: 0.038,
  E0: 0.9,
  moveMax: 3.5,
  forceRef: 0.6,
  movePull: 0.6,
  moveShun: 1.5,
  minGap: 6,
  repel: 2.0,
  moveJitter: 0.14,
}

type Rng = { s: number }
type Ev = Array<string | number>

type World = {
  rng: Rng
  seed: number
  reputation: boolean
  t: number
  round: number
  x: Float64Array
  y: Float64Array
  eps: Float64Array
  wolf: number
  E: Float64Array
  alive: boolean[]
  trust: Float64Array
  wave: boolean
  waveSev: number
  dirX: number
  dirY: number
  front0: number
  hitT: Float64Array
  moveJit: Float64Array
  detectOk: boolean[]
  falseFire: boolean[]
  fireJitter: Float64Array
  fired: boolean[]
  fireAt: Float64Array
  fireKind: Int32Array
  fireOrigin: Int32Array
  sheltered: boolean[]
  usedShelter: boolean[]
  shelterT: Float64Array
  heard: Array<[number, number, boolean, number]>
  heardKey: Set<number>
  vouched: Array<[number, number, number, number]>
  vouchKey: Set<number>
  hitDone: boolean[]
  deaths: number
  events: Ev[]
}

function makeRng(seed: number): Rng {
  return { s: seed >>> 0 }
}
function draw(r: Rng) {
  let t = (r.s += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function makeWorld(seed: number, reputation: boolean): World {
  const w: World = {
    rng: makeRng(seed),
    seed,
    reputation,
    t: 0,
    round: -1,
    x: new Float64Array(P.n),
    y: new Float64Array(P.n),
    eps: new Float64Array(P.n),
    wolf: -1,
    E: new Float64Array(P.n).fill(P.E0),
    alive: new Array(P.n).fill(true),
    trust: new Float64Array(P.n * P.n).fill(P.trust0),
    wave: false,
    waveSev: 1,
    dirX: 0,
    dirY: 0,
    front0: 0,
    hitT: new Float64Array(P.n).fill(Infinity),
    moveJit: new Float64Array(P.n),
    detectOk: new Array(P.n).fill(false),
    falseFire: new Array(P.n).fill(false),
    fireJitter: new Float64Array(P.n),
    fired: new Array(P.n).fill(false),
    fireAt: new Float64Array(P.n).fill(-1),
    fireKind: new Int32Array(P.n),
    fireOrigin: new Int32Array(P.n).fill(-1),
    sheltered: new Array(P.n).fill(false),
    usedShelter: new Array(P.n).fill(false),
    shelterT: new Float64Array(P.n).fill(-1),
    heard: [],
    heardKey: new Set(),
    vouched: [],
    vouchKey: new Set(),
    hitDone: new Array(P.n).fill(false),
    deaths: 0,
    events: [],
  }
  for (let i = 0; i < P.n; i++) {
    w.x[i] = 6 + draw(w.rng) * (P.size - 12)
    w.y[i] = 6 + draw(w.rng) * (P.size - 12)
  }
  for (let i = 0; i < P.n; i++) {
    const u = draw(w.rng)
    w.eps[i] = P.epsBase + P.epsSpread * u * u * u
  }
  w.wolf = Math.floor(draw(w.rng) * P.n)
  w.eps[w.wolf] = P.epsWolf
  return w
}

function cloneWorld(w: World): World {
  const c = {} as Record<string, unknown>
  for (const k of Object.keys(w) as Array<keyof World>) {
    const v = w[k]
    if (v instanceof Float64Array || v instanceof Int32Array) c[k] = v.slice()
    else if (Array.isArray(v)) c[k] = v.map((e) => (Array.isArray(e) ? e.slice() : e))
    else if (k === "rng") c[k] = { s: (v as Rng).s }
    else if (v instanceof Set) c[k] = new Set(v)
    else c[k] = v
  }
  return c as World
}

function meanInTrust(w: World, s: number) {
  if (!w.alive[s]) return 0
  let sum = 0
  let n = 0
  for (let j = 0; j < P.n; j++) {
    if (j === s || !w.alive[j]) continue
    sum += w.trust[j * P.n + s]
    n++
  }
  return n ? sum / n : 0
}

function audienceTrust(w: World, s: number) {
  let sum = 0
  let n = 0
  for (let j = 0; j < P.n; j++) {
    if (j === s || !w.alive[j]) continue
    const d = Math.hypot(w.x[j] - w.x[s], w.y[j] - w.y[s])
    if (d > P.flareR) continue
    sum += w.trust[j * P.n + s]
    n++
  }
  return n ? sum / n : 1
}

function startRound(w: World) {
  w.round++
  const t0 = w.t
  const a = draw(w.rng)
  const b = draw(w.rng)
  const c = draw(w.rng)
  w.wave = a < P.waveP
  const th = b * Math.PI * 2
  w.dirX = Math.cos(th)
  w.dirY = Math.sin(th)
  w.waveSev = 0.6 + 1.6 * c * c * c
  let minP = Infinity
  let maxP = -Infinity
  for (let i = 0; i < P.n; i++) {
    const pr = w.x[i] * w.dirX + w.y[i] * w.dirY
    if (pr < minP) minP = pr
    if (pr > maxP) maxP = pr
  }
  w.front0 = minP - 18
  w.hitT.fill(Infinity)
  for (let i = 0; i < P.n; i++) {
    const d1 = draw(w.rng)
    const d2 = draw(w.rng)
    const d3 = draw(w.rng)
    const d4 = draw(w.rng)
    w.detectOk[i] = d1 >= w.eps[i]
    w.falseFire[i] = d2 < w.eps[i] * P.fpScale
    w.fireJitter[i] = d3 * 20
    w.moveJit[i] = d4
    w.fired[i] = false
    w.fireAt[i] = -1
    w.fireKind[i] = 0
    w.fireOrigin[i] = -1
    w.sheltered[i] = false
    w.usedShelter[i] = false
    w.shelterT[i] = -1
    w.hitDone[i] = false
  }
  w.heard = []
  w.heardKey = new Set()
  w.vouched = []
  w.vouchKey = new Set()
  // only false alarms answer to a clock; a real detection fires when the
  // front actually reaches sensing range of where the station stands
  for (let i = 0; i < P.n; i++) {
    if (!w.alive[i]) continue
    if (!w.detectOk[i] && w.falseFire[i]) {
      w.fireAt[i] = t0 + 40 + w.fireJitter[i] * 8
      w.fireKind[i] = 1
      w.fireOrigin[i] = i
    } else if (!w.wave && w.falseFire[i]) {
      w.fireAt[i] = t0 + 40 + w.fireJitter[i] * 8
      w.fireKind[i] = 1
      w.fireOrigin[i] = i
    }
  }
  if (w.wave) w.events.push([t0, "wave", +th.toFixed(3), +w.waveSev.toFixed(2), w.round])
}

function settleRound(w: World) {
  if (w.reputation) {
    for (const [j, s, informative, heardT] of w.heard) {
      if (!w.alive[j] || !w.alive[s] || j === s) continue
      const k = j * P.n + s
      if (w.wave) {
        // a warning counts only if it arrived before the danger did
        if (heardT < w.hitT[j])
          w.trust[k] += (informative ? P.alpha : P.alphaEcho) * (1 - w.trust[k])
      } else w.trust[k] -= P.beta * w.trust[k]
    }
    for (const [j, r, , heardT] of w.vouched) {
      if (!w.alive[j] || !w.alive[r] || j === r) continue
      const k = j * P.n + r
      if (w.wave) {
        if (heardT < w.hitT[j])
          w.trust[k] += P.vouch * P.alphaEcho * (1 - w.trust[k])
      } else w.trust[k] -= P.vouch * P.beta * w.trust[k]
    }
  }
  for (let i = 0; i < P.n; i++) {
    if (!w.alive[i]) continue
    if (w.usedShelter[i]) w.E[i] -= P.shelterCost
    w.E[i] = Math.min(1, w.E[i] + P.regen)
    if (w.E[i] <= 0) {
      w.alive[i] = false
      w.deaths++
      w.events.push([w.t - 1, "death", i, "exhaustion", w.round])
    }
  }
}

// Trust moves bodies, not just belief: within earshot each neighbour
// pulls by the credit it holds above the threshold for acting on a
// warning and pushes by however far it sits below. A station closed up
// for the night stays put.
function drift(w: World) {
  const per = P.moveMax / P.roundLen
  const nx = new Float64Array(P.n)
  const ny = new Float64Array(P.n)
  for (let i = 0; i < P.n; i++) {
    nx[i] = w.x[i]
    ny[i] = w.y[i]
    if (!w.alive[i] || w.sheltered[i]) continue
    let dx = 0
    let dy = 0
    for (let j = 0; j < P.n; j++) {
      if (j === i || !w.alive[j]) continue
      const ox = w.x[j] - w.x[i]
      const oy = w.y[j] - w.y[i]
      const d = Math.hypot(ox, oy)
      if (d < 1e-6) continue
      // only evidence moves anyone: a neighbour still sitting at the
      // prior exerts nothing. Above it pulls, below it pushes harder.
      if (d < P.flareR) {
        const e = w.trust[i * P.n + j] - P.trust0
        if (e !== 0) {
          const near = 1 - d / P.flareR
          const g = e > 0 ? e * near * P.movePull : e * near * P.moveShun
          dx += (ox / d) * g
          dy += (oy / d) * g
        }
      }
      // elbow room that actually holds: the push climbs steeply as the
      // gap closes instead of flattening out
      if (d < P.minGap) {
        const push = Math.min(6, P.minGap / Math.max(0.5, d) - 1) * P.repel
        dx -= (ox / d) * push
        dy -= (oy / d) * push
      }
    }
    const ang = w.moveJit[i] * Math.PI * 2
    dx += Math.cos(ang) * P.moveJitter
    dy += Math.sin(ang) * P.moveJitter
    const L = Math.hypot(dx, dy)
    if (L > 1e-9) {
      const v = Math.min(1, L / P.forceRef) * per
      nx[i] = Math.max(3, Math.min(P.size - 3, w.x[i] + (dx / L) * v))
      ny[i] = Math.max(3, Math.min(P.size - 3, w.y[i] + (dy / L) * v))
    }
  }
  for (let i = 0; i < P.n; i++) {
    w.x[i] = nx[i]
    w.y[i] = ny[i]
  }
}

function step(w: World) {
  if (w.t % P.roundLen === 0) {
    if (w.round >= 0) settleRound(w)
    startRound(w)
  }
  const t = w.t
  const roundT0 = Math.floor(t / P.roundLen) * P.roundLen
  const front = w.front0 + (t - roundT0) * P.waveSpeed
  if (w.wave) {
    for (let i = 0; i < P.n; i++) {
      if (!w.alive[i] || w.fired[i] || !w.detectOk[i]) continue
      if (w.fireAt[i] >= 0) continue
      const pr = w.x[i] * w.dirX + w.y[i] * w.dirY
      if (front >= pr - P.senseR) {
        w.fireAt[i] = t
        w.fireKind[i] = 1
        w.fireOrigin[i] = i
      }
    }
  }
  const due: number[] = []
  for (let i = 0; i < P.n; i++) {
    if (!w.alive[i] || w.fired[i]) continue
    if (w.fireAt[i] >= 0 && t >= w.fireAt[i]) due.push(i)
  }
  due.sort((a, b) => w.fireAt[a] - w.fireAt[b] || a - b)
  for (const i of due) {
    w.fired[i] = true
    const org = w.fireOrigin[i]
    const detected = w.fireKind[i] === 1 && org === i && w.wave && w.detectOk[i] ? 1 : 0
    w.events.push([t, "flare", i, w.fireKind[i], org, w.wave ? 1 : 0, detected, w.round])
    // firing your own alarm means believing it
    if (w.fireKind[i] === 1 && org === i && !w.sheltered[i] && !w.hitDone[i]) {
      w.sheltered[i] = true
      w.usedShelter[i] = true
      w.shelterT[i] = t
      w.events.push([t, "shelter", i, i, w.round])
    }
    for (let j = 0; j < P.n; j++) {
      if (j === i || !w.alive[j]) continue
      const d = Math.hypot(w.x[j] - w.x[i], w.y[j] - w.y[i])
      if (d > P.flareR) continue
      const key = j * P.n + org
      if (!w.heardKey.has(key)) {
        w.heardKey.add(key)
        w.heard.push([j, org, !w.sheltered[j], t])
      }
      if (w.fireKind[i] === 2) {
        const vk = j * P.n + i
        if (!w.vouchKey.has(vk)) {
          w.vouchKey.add(vk)
          w.vouched.push([j, i, org, t])
        }
      }
      const belief = j === org ? 1 : w.trust[j * P.n + org]
      if (belief >= P.actAt) {
        // a station the front has already passed gains nothing by hiding
        if (!w.sheltered[j] && !w.hitDone[j]) {
          w.sheltered[j] = true
          w.usedShelter[j] = true
          w.shelterT[j] = t
          w.events.push([t, "shelter", j, org, w.round])
        }
        if (!w.fired[j] && (w.fireAt[j] < 0 || w.fireAt[j] > t + P.relayDelay)) {
          w.fireAt[j] = t + P.relayDelay
          w.fireKind[j] = 2
          w.fireOrigin[j] = org
        }
      }
    }
  }
  if (w.wave) {
    for (let i = 0; i < P.n; i++) {
      if (!w.alive[i] || w.hitDone[i]) continue
      const pr = w.x[i] * w.dirX + w.y[i] * w.dirY
      if (front >= pr) {
        w.hitDone[i] = true
        w.hitT[i] = t
        const prog = w.sheltered[i]
          ? Math.max(0, Math.min(1, (t - w.shelterT[i]) / P.prepT))
          : 0
        const dmg = P.hitDmg * w.waveSev * (1 - prog)
        // the front has gone by; it comes back out
        w.sheltered[i] = false
        if (dmg > 0.001) {
          w.E[i] -= dmg
          w.events.push([t, "hit", i, +prog.toFixed(2), w.round])
          if (w.E[i] <= 0) {
            w.alive[i] = false
            w.deaths++
            w.events.push([t, "death", i, "wave", w.round])
          }
        } else {
          w.events.push([t, "hit", i, 1, w.round])
        }
      }
    }
  }
  drift(w)
  w.t++
}

function branchWolfReset(w0: World, wolf: number, endT: number) {
  const w = cloneWorld(w0)
  for (let j = 0; j < P.n; j++) w.trust[j * P.n + wolf] = P.trust0
  while (w.t < endT) step(w)
  return w
}

// runs found by scanning: the station's audience trust at or below 0.2,
// a night where its genuine earliest detection went unrelayed, at least
// two dead after the flare, and the same-tick branch with trust in it
// restored to the prior relaying the claim and losing fewer.
const RUNS: number[] = [58034, 32801, 44803, 63294]

const SPEEDS = [1, 3, 8]
const SIDE = 1000
const SCALE = SIDE / P.size

export default function TheLastFlare() {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const stage = root.querySelector<HTMLCanvasElement>("[data-stage]")!
    const chart = root.querySelector<HTMLCanvasElement>("[data-chart]")!
    const sctx = stage.getContext("2d")!
    const cctx = chart.getContext("2d")!
    const ground = document.createElement("canvas")
    ground.width = SIDE
    ground.height = SIDE
    const gctx = ground.getContext("2d")!

    const el = (k: string) => root.querySelector<HTMLElement>(`[data-k="${k}"]`)!
    const nightBody = root.querySelector<HTMLElement>("[data-nights]")!
    const brBody = root.querySelector<HTMLElement>("[data-branches]")!
    const coBody = root.querySelector<HTMLElement>("[data-cohort]")!

    let PAL = { ink: "#ece4d0", accent: "#f6b545", muted: "#cfe0d2" }
    const readPalette = () => {
      const cs = getComputedStyle(root)
      const g = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb
      PAL = {
        ink: g("--site-ink", PAL.ink),
        accent: g("--site-accent", PAL.accent),
        muted: g("--site-muted", PAL.muted),
      }
    }
    readPalette()
    const mo = new MutationObserver(readPalette)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    const buildGround = (s: number) => {
      const rr = makeRng((s ^ 0x51f15a1e) >>> 0)
      const R = () => draw(rr)
      const grad = gctx.createRadialGradient(
        SIDE * 0.5, SIDE * 0.45, SIDE * 0.05, SIDE * 0.5, SIDE * 0.5, SIDE * 0.8
      )
      grad.addColorStop(0, "#0c1018")
      grad.addColorStop(0.6, "#070a11")
      grad.addColorStop(1, "#03050a")
      gctx.fillStyle = grad
      gctx.fillRect(0, 0, SIDE, SIDE)
      // haze
      for (let k = 0; k < 14; k++) {
        const x = R() * SIDE
        const y = R() * SIDE
        const rad = 90 + R() * 220
        const g = gctx.createRadialGradient(x, y, 0, x, y, rad)
        g.addColorStop(0, `rgba(40,70,110,${0.02 + R() * 0.03})`)
        g.addColorStop(1, "rgba(40,70,110,0)")
        gctx.fillStyle = g
        gctx.beginPath()
        gctx.arc(x, y, rad, 0, 2 * Math.PI)
        gctx.fill()
      }
      // stars
      for (let k = 0; k < 1400; k++) {
        const x = R() * SIDE
        const y = R() * SIDE
        const a = R()
        const sz = a > 0.94 ? 1.8 : a > 0.78 ? 1.2 : 0.8
        gctx.fillStyle = `rgba(150,175,210,${0.02 + a * 0.05})`
        gctx.fillRect(x, y, sz, sz)
      }
    }

    // ---- run state ----
    let runIdx = 0
    let w = makeWorld(RUNS[0], true)
    let evAt = 0
    type Ring = { x: number; y: number; t0: number; relay: boolean }
    let rings: Ring[] = []
    type Flash = { x: number; y: number; t0: number; kind: number }
    let flashes: Flash[] = []
    const TRAIL = 26
    const trail = new Float32Array(P.n * TRAIL * 2).fill(-1)
    let trailAt = 0
    type BranchRow = {
      t: number
      round: number
      trustIn: number
      bDeaths: number
      bRelays: number
      actualDeaths: number
      done: boolean
    }
    let branchRows: BranchRow[] = []
    const wolfTrace: Array<[number, number]> = [] // [round, audience trust]
    const nightRows: string[][] = []
    let curNight = { flaresT: 0, flaresF: 0, shelters: 0, hits: 0, deaths: 0 }
    let paused = false
    let speedIdx = 0
    let tickAcc = 0
    let lastMs = 0
    let raf = 0

    const reset = (idx: number) => {
      runIdx = ((idx % RUNS.length) + RUNS.length) % RUNS.length
      w = makeWorld(RUNS[runIdx], true)
      evAt = 0
      rings = []
      flashes = []
      trail.fill(-1)
      trailAt = 0
      branchRows = []
      wolfTrace.length = 0
      nightRows.length = 0
      curNight = { flaresT: 0, flaresF: 0, shelters: 0, hits: 0, deaths: 0 }
      tickAcc = 0
      nightBody.innerHTML = ""
      brBody.innerHTML = ""
      buildGround(RUNS[runIdx])
      el("seed").textContent = String(RUNS[runIdx])
      el("run").textContent = `${runIdx + 1} / ${RUNS.length}`
      el("wolfId").textContent = String(w.wolf)
      el("wolfId2").textContent = String(w.wolf)
      el("wolfEps").textContent = w.eps[w.wolf].toFixed(2)
    }

    const computeBranch = (fireT: number) => {
      const roundEnd = (Math.floor(fireT / P.roundLen) + 1) * P.roundLen
      const at = makeWorld(RUNS[runIdx], true)
      while (at.t < fireT) step(at)
      const trustIn = audienceTrust(at, at.wolf)
      const b = branchWolfReset(at, at.wolf, roundEnd)
      let bDeaths = 0
      let bRelays = 0
      for (const e of b.events) {
        if ((e[0] as number) < fireT || (e[0] as number) >= roundEnd) continue
        if (e[1] === "death" && e[3] === "wave") bDeaths++
        if (e[1] === "flare" && e[3] === 2 && e[4] === b.wolf) bRelays++
      }
      branchRows.push({
        t: fireT,
        round: Math.floor(fireT / P.roundLen),
        trustIn,
        bDeaths,
        bRelays,
        actualDeaths: 0,
        done: false,
      })
      if (branchRows.length > 6) branchRows.shift()
    }

    const consumeEvents = () => {
      for (; evAt < w.events.length; evAt++) {
        const e = w.events[evAt]
        const kind = e[1]
        if (kind === "flare") {
          const i = e[2] as number
          rings.push({ x: w.x[i], y: w.y[i], t0: e[0] as number, relay: e[3] === 2 })
          if (e[5] === 1) curNight.flaresT++
          else curNight.flaresF++
          // a genuine wolf detection with a written-off audience: branch it
          if (i === w.wolf && e[3] === 1 && e[6] === 1) {
            const trustNow = audienceTrust(w, w.wolf)
            if (trustNow <= 0.3) computeBranch(e[0] as number)
          }
        }
        if (kind === "shelter") {
          curNight.shelters++
          const j = e[2] as number
          flashes.push({ x: w.x[j], y: w.y[j], t0: e[0] as number, kind: 0 })
        }
        if (kind === "hit") {
          curNight.hits++
          const j = e[2] as number
          if ((e[3] as number) < 0.9)
            flashes.push({ x: w.x[j], y: w.y[j], t0: e[0] as number, kind: 1 })
        }
        if (kind === "death") {
          curNight.deaths++
          const j = e[2] as number
          flashes.push({ x: w.x[j], y: w.y[j], t0: e[0] as number, kind: 2 })
          const last = branchRows[branchRows.length - 1]
          if (last && !last.done && e[3] === "wave" && (e[0] as number) >= last.t) {
            last.actualDeaths++
          }
        }
      }
      if (rings.length > 140) rings = rings.slice(-140)
      if (flashes.length > 160) flashes = flashes.slice(-160)
    }

    const closeNight = () => {
      // called at each round boundary for the round that just ended
      const r = w.round
      wolfTrace.push([r, audienceTrust(w, w.wolf)])
      nightRows.unshift([
        String(r),
        w.wave ? `wave ${w.waveSev.toFixed(2)}` : "quiet",
        `${curNight.flaresT} / ${curNight.flaresF}`,
        String(curNight.shelters),
        String(curNight.deaths),
      ])
      if (nightRows.length > 8) nightRows.pop()
      nightBody.innerHTML = nightRows
        .map((row) => `<tr>${row.map((v) => `<td>${v}</td>`).join("")}</tr>`)
        .join("")
      const last = branchRows[branchRows.length - 1]
      if (last && !last.done && w.t >= (last.round + 1) * P.roundLen - 1) {
        last.done = true
        const tr = document.createElement("tr")
        tr.innerHTML =
          `<td>${last.round}</td><td>${last.trustIn.toFixed(3)}</td>` +
          `<td>${last.actualDeaths}</td><td>${last.bDeaths} · ${last.bRelays} relays</td>`
        brBody.prepend(tr)
        while (brBody.children.length > 6) brBody.removeChild(brBody.lastChild!)
      }
      curNight = { flaresT: 0, flaresF: 0, shelters: 0, hits: 0, deaths: 0 }
    }

    const tickOnce = () => {
      if (w.t >= P.T) return
      const boundary = w.t % P.roundLen === 0 && w.round >= 0
      if (boundary) closeNight()
      step(w)
      if (w.t % 4 === 0) {
        const at = (trailAt % TRAIL) * 2
        for (let i = 0; i < P.n; i++) {
          const o = i * TRAIL * 2 + at
          if (w.alive[i]) {
            trail[o] = w.x[i]
            trail[o + 1] = w.y[i]
          } else {
            trail[o] = -1
            trail[o + 1] = -1
          }
        }
        trailAt++
      }
    }

    const paceFor = () => 30 * SPEEDS[speedIdx]

    const updateData = () => {
      el("t").textContent = String(w.t)
      el("night").textContent = String(w.round)
      el("wavecell").textContent = w.wave ? `yes · ${w.waveSev.toFixed(2)}` : "no"
      el("alive").textContent = `${w.alive.filter(Boolean).length} / ${P.n}`
      el("deaths").textContent = String(w.deaths)
      el("wolfTrust").textContent = audienceTrust(w, w.wolf).toFixed(3)
      let o = 0
      let on = 0
      for (let i = 0; i < P.n; i++) {
        if (i === w.wolf) continue
        o += meanInTrust(w, i)
        on++
      }
      el("othersTrust").textContent = (o / on).toFixed(3)
      let wf = 0
      let wt = 0
      for (const e of w.events) {
        if (e[1] === "flare" && e[2] === w.wolf && e[3] === 1) {
          if (e[5] === 0) wf++
          else if (e[6] === 1) wt++
        }
      }
      el("wolfFalse").textContent = String(wf)
      el("wolfTrue").textContent = String(wt)
    }

    const draw2 = () => {
      const c = sctx
      c.clearRect(0, 0, SIDE, SIDE)
      c.drawImage(ground, 0, 0)
      const t = w.t
      const roundT0 = Math.floor(t / P.roundLen) * P.roundLen
      const phase = Math.min(1, (t - roundT0) / P.roundLen)

      // the watch: every station sweeps its own sensing radius, always
      for (let i = 0; i < P.n; i++) {
        if (!w.alive[i]) continue
        const per = 200
        const u = (((t + i * 41) % per) / per) / 0.6
        if (u > 1) continue
        c.beginPath()
        c.arc(w.x[i] * SCALE, w.y[i] * SCALE, u * P.senseR * SCALE, 0, 2 * Math.PI)
        c.strokeStyle = `rgba(140,175,210,${0.11 * (1 - u)})`
        c.lineWidth = 0.7
        c.stroke()
      }

      // trust threads: source to listener, drifting along the line
      c.lineWidth = 0.6
      c.setLineDash([2, 7])
      c.lineDashOffset = -t * 0.8
      for (let j = 0; j < P.n; j++) {
        if (!w.alive[j]) continue
        for (let s = 0; s < P.n; s++) {
          if (s === j || !w.alive[s]) continue
          const tr = w.trust[j * P.n + s]
          if (tr < 0.5) continue
          const d = Math.hypot(w.x[j] - w.x[s], w.y[j] - w.y[s])
          if (d > P.flareR) continue
          c.beginPath()
          c.moveTo(w.x[s] * SCALE, w.y[s] * SCALE)
          c.lineTo(w.x[j] * SCALE, w.y[j] * SCALE)
          c.strokeStyle = `rgba(150,175,210,${(tr - 0.5) * 0.42})`
          c.stroke()
        }
      }
      c.setLineDash([])
      c.lineDashOffset = 0

      // the wave
      if (w.wave) {
        const front = w.front0 + (t - roundT0) * P.waveSpeed
        const centerProj = (P.size / 2) * w.dirX + (P.size / 2) * w.dirY
        const off = (front - centerProj) * SCALE
        const bandW = P.waveDepth * SCALE
        const a = 0.2 * Math.min(1.6, w.waveSev)
        c.save()
        c.translate(SIDE / 2, SIDE / 2)
        c.rotate(Math.atan2(w.dirY, w.dirX))
        const g = c.createLinearGradient(off - bandW * 6, 0, off, 0)
        g.addColorStop(0, "rgba(150,40,32,0)")
        g.addColorStop(0.75, `rgba(180,52,40,${a * 0.5})`)
        g.addColorStop(1, `rgba(232,96,64,${a})`)
        c.fillStyle = g
        c.fillRect(off - bandW * 6, -SIDE, bandW * 6, SIDE * 2)
        // drifting streaks so the sweep reads as motion
        for (let k = 0; k < 7; k++) {
          const sy = ((k * 317 + t * 2.2) % (SIDE * 2)) - SIDE
          c.fillStyle = `rgba(240,120,86,${a * 0.35})`
          c.fillRect(off - bandW * 1.4, sy, bandW * 1.4, 1.2)
        }
        c.strokeStyle = `rgba(246,140,104,${0.45 * Math.min(1.6, w.waveSev)})`
        c.lineWidth = 1.4
        c.beginPath()
        c.moveTo(off, -SIDE)
        c.lineTo(off, SIDE)
        c.stroke()
        c.restore()
      }

      // flare rings
      rings = rings.filter((r) => t - r.t0 < 46)
      for (const r of rings) {
        const age = t - r.t0
        const u = Math.min(1, age / 40)
        const rad = u * P.flareR * SCALE
        const fade = 1 - age / 46
        c.beginPath()
        c.arc(r.x * SCALE, r.y * SCALE, rad, 0, 2 * Math.PI)
        c.strokeStyle = r.relay
          ? `rgba(206,214,230,${0.34 * fade})`
          : `rgba(248,198,112,${0.6 * fade})`
        c.lineWidth = r.relay ? 0.9 : 1.5
        c.stroke()
        if (!r.relay) {
          c.beginPath()
          c.arc(r.x * SCALE, r.y * SCALE, rad * 0.72, 0, 2 * Math.PI)
          c.strokeStyle = `rgba(248,198,112,${0.22 * fade})`
          c.lineWidth = 0.9
          c.stroke()
        }
      }

      // shelters closing, bodies struck, lights going out
      flashes = flashes.filter((f) => t - f.t0 < 36)
      for (const f of flashes) {
        const age = t - f.t0
        const x = f.x * SCALE
        const y = f.y * SCALE
        if (f.kind === 0) {
          const u = Math.min(1, age / 12)
          c.beginPath()
          c.arc(x, y, 10 - 6.5 * u, 0, 2 * Math.PI)
          c.strokeStyle = `rgba(198,218,242,${0.5 * (1 - u)})`
          c.lineWidth = 1
          c.stroke()
        } else if (f.kind === 1) {
          const u = Math.min(1, age / 18)
          c.beginPath()
          c.arc(x, y, 3 + 14 * u, 0, 2 * Math.PI)
          c.strokeStyle = `rgba(226,96,68,${0.7 * (1 - u)})`
          c.lineWidth = 1.5
          c.stroke()
        } else {
          const u = Math.min(1, age / 36)
          c.beginPath()
          c.arc(x, y, 4 + 28 * u, 0, 2 * Math.PI)
          c.strokeStyle = `rgba(240,214,206,${0.7 * (1 - u)})`
          c.lineWidth = 1.2
          c.stroke()
        }
      }

      // where each station has been drifting
      for (let i = 0; i < P.n; i++) {
        if (!w.alive[i]) continue
        c.beginPath()
        let started = false
        for (let s = 0; s < TRAIL; s++) {
          const o = i * TRAIL * 2 + ((trailAt + s) % TRAIL) * 2
          const tx = trail[o]
          if (tx < 0) {
            started = false
            continue
          }
          const ty = trail[o + 1]
          if (!started) {
            c.moveTo(tx * SCALE, ty * SCALE)
            started = true
          } else c.lineTo(tx * SCALE, ty * SCALE)
        }
        c.strokeStyle = "rgba(198,214,238,0.16)"
        c.lineWidth = 0.7
        c.stroke()
      }

      // stations
      for (let i = 0; i < P.n; i++) {
        const x = w.x[i] * SCALE
        const y = w.y[i] * SCALE
        if (!w.alive[i]) {
          c.beginPath()
          c.arc(x, y, 3.2, 0, 2 * Math.PI)
          c.strokeStyle = "rgba(122,134,156,0.3)"
          c.lineWidth = 0.7
          c.stroke()
          continue
        }
        const credit = meanInTrust(w, i)
        const breath = 1 + 0.09 * Math.sin((t + i * 53) * 0.05)
        const shel = w.sheltered[i]
        const glowR = (shel ? 5.5 : 7 + credit * 13) * breath
        const g = c.createRadialGradient(x, y, 0.5, x, y, glowR)
        g.addColorStop(0, `rgba(242,232,208,${(shel ? 0.12 : 0.2) + credit * 0.32})`)
        g.addColorStop(1, "rgba(242,232,208,0)")
        c.fillStyle = g
        c.beginPath()
        c.arc(x, y, glowR, 0, 2 * Math.PI)
        c.fill()
        // credit ring: radius and brightness are the trust it receives
        c.beginPath()
        c.arc(x, y, (3.2 + credit * 5) * breath, 0, 2 * Math.PI)
        c.strokeStyle = `rgba(232,224,202,${0.16 + credit * 0.46})`
        c.lineWidth = 0.9
        c.stroke()
        if (shel) {
          c.beginPath()
          c.arc(x, y, 2.2, 0, 2 * Math.PI)
          c.strokeStyle = "rgba(232,224,202,0.55)"
          c.lineWidth = 1.4
          c.stroke()
        }
        // audience trust under the action threshold
        if (audienceTrust(w, i) < P.actAt) {
          c.setLineDash([1.5, 3])
          c.beginPath()
          c.arc(x, y, 11 * breath, 0, 2 * Math.PI)
          c.strokeStyle = "rgba(214,118,88,0.55)"
          c.lineWidth = 0.9
          c.stroke()
          c.setLineDash([])
        }
        c.beginPath()
        c.arc(x, y, 1.8, 0, 2 * Math.PI)
        c.fillStyle = `rgba(246,240,222,${0.5 + credit * 0.5})`
        c.fill()
      }

      // the night's clock
      c.fillStyle = "rgba(150,170,200,0.10)"
      c.fillRect(0, 0, SIDE, 2.5)
      c.fillStyle = w.wave ? "rgba(232,96,64,0.6)" : "rgba(196,212,236,0.35)"
      c.fillRect(0, 0, SIDE * phase, 2.5)
    }

    const drawChart = () => {
      const cw = chart.width
      const ch = chart.height
      cctx.clearRect(0, 0, cw, ch)
      if (wolfTrace.length < 2) return
      const rounds = P.T / P.roundLen
      const xFor = (r: number) => (r / rounds) * (cw - 8) + 4
      // wave nights shaded
      for (const e of w.events) {
        if (e[1] !== "wave") continue
        const r = e[e.length - 1] as number
        cctx.fillStyle = "rgba(194,58,43,0.10)"
        cctx.fillRect(xFor(r), 0, Math.max(1, (cw - 8) / rounds), ch)
      }
      // the action threshold
      const yFor = (v: number) => ch - 4 - v * (ch - 8)
      cctx.strokeStyle = "rgba(150,170,200,0.35)"
      cctx.setLineDash([3, 4])
      cctx.beginPath()
      cctx.moveTo(4, yFor(P.actAt))
      cctx.lineTo(cw - 4, yFor(P.actAt))
      cctx.stroke()
      cctx.setLineDash([])
      // audience trust in the wolf
      cctx.beginPath()
      wolfTrace.forEach(([r, v], ix) => {
        const x = xFor(r)
        const y = yFor(v)
        if (ix === 0) cctx.moveTo(x, y)
        else cctx.lineTo(x, y)
      })
      cctx.strokeStyle = PAL.accent
      cctx.lineWidth = 1.6
      cctx.stroke()
      // wolf false flares marked
      for (const e of w.events) {
        if (e[1] === "flare" && e[2] === w.wolf && e[3] === 1 && e[5] === 0) {
          const r = e[e.length - 1] as number
          const x = xFor(r)
          cctx.beginPath()
          cctx.moveTo(x - 3, ch - 6)
          cctx.lineTo(x + 3, ch - 12)
          cctx.moveTo(x + 3, ch - 6)
          cctx.lineTo(x - 3, ch - 12)
          cctx.strokeStyle = PAL.accent
          cctx.lineWidth = 1.1
          cctx.stroke()
        }
      }
    }

    const frame = (nowMs: number) => {
      const dt = lastMs ? Math.min(0.1, (nowMs - lastMs) / 1000) : 0
      lastMs = nowMs
      if (!paused) {
        tickAcc += paceFor() * dt
        let k = Math.floor(tickAcc)
        tickAcc -= k
        const kMax = 40 * SPEEDS[speedIdx]
        if (k > kMax) k = kMax
        for (; k > 0; k--) tickOnce()
        consumeEvents()
        updateData()
        draw2()
        drawChart()
      }
      raf = requestAnimationFrame(frame)
    }

    // cohort base rates with the same kernel, in idle chunks
    const cohort = {
      rep: { deaths: 0, wasted: 0, alive: 0, n: 0 },
      flat: { deaths: 0, wasted: 0, alive: 0, n: 0 },
    }
    const COHORT_N = 40
    let coSeed = 1
    let coRep = true
    let coTimer = 0
    const cohortChunk = () => {
      if (coSeed > COHORT_N && !coRep) {
        coBody.innerHTML = (
          [
            ["reputation", cohort.rep],
            ["flat trust", cohort.flat],
          ] as const
        )
          .map(
            ([name, s]) =>
              `<tr><td>${name}</td><td>${s.n}</td><td>${s.deaths}</td><td>${s.wasted}</td><td>${(s.alive / s.n).toFixed(1)} / ${P.n}</td></tr>`
          )
          .join("")
        return
      }
      const wc = makeWorld(coSeed, coRep)
      if (!coRep) {
        wc.reputation = false
      }
      while (wc.t < P.T) step(wc)
      const s = coRep ? cohort.rep : cohort.flat
      s.n++
      s.deaths += wc.deaths
      s.alive += wc.alive.filter(Boolean).length
      const waveRound = new Set<number>()
      for (const e of wc.events) if (e[1] === "wave") waveRound.add(e[e.length - 1] as number)
      for (const e of wc.events) {
        if (e[1] === "shelter" && !waveRound.has(e[e.length - 1] as number)) s.wasted++
      }
      if (coRep && coSeed === COHORT_N) {
        coRep = false
        coSeed = 1
      } else {
        coSeed++
      }
      coTimer = window.setTimeout(cohortChunk, 30)
    }
    coTimer = window.setTimeout(cohortChunk, 400)

    reset(0)
    raf = requestAnimationFrame(frame)

    const onPause = () => {
      paused = !paused
      root.querySelector<HTMLElement>("[data-pause]")!.textContent = paused ? "Run" : "Pause"
    }
    const onReplay = () => reset(runIdx)
    const onNext = () => reset(runIdx + 1)
    const onSpeed = () => {
      speedIdx = (speedIdx + 1) % SPEEDS.length
      root.querySelector<HTMLElement>("[data-speed]")!.textContent = `Speed ${SPEEDS[speedIdx]}×`
    }
    root.querySelector("[data-pause]")!.addEventListener("click", onPause)
    root.querySelector("[data-replay]")!.addEventListener("click", onReplay)
    root.querySelector("[data-next]")!.addEventListener("click", onNext)
    root.querySelector("[data-speed]")!.addEventListener("click", onSpeed)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(coTimer)
      mo.disconnect()
    }
  }, [])

  return (
    <div ref={rootRef} className="twv-root">
      <div className="flex justify-between smallcaps text-[10.5px] mb-2 text-[var(--site-muted)]">
        <span>run <span data-k="run">1 / 1</span></span>
        <span>seed <span data-k="seed">58034</span></span>
      </div>
      <canvas
        data-stage
        width={SIDE}
        height={SIDE}
        className="w-full border border-[var(--site-line)]"
      />
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 smallcaps text-[10px] text-[var(--site-muted)]">
        <span>ring size and glow: trust received</span>
        <span>faint sweep: sensing radius, 7</span>
        <span>amber ring: flare</span>
        <span>pale ring: relay</span>
        <span>threads: trust at 0.5 or more</span>
        <span>red band: the wave</span>
        <span>contracted: sheltered</span>
        <span>dotted ring: audience trust under 0.34</span>
        <span>tail: where it has drifted</span>
        <span>hollow: dead</span>
      </div>

      <canvas data-chart width={1140} height={110} className="mt-6 w-full" />
      <div className="mt-1 flex gap-6 smallcaps text-[10px] text-[var(--site-muted)]">
        <span style={{ color: "var(--site-accent)" }}>trust in station <span data-k="wolfId">0</span>, its audience mean</span>
        <span>crosses: its false flares</span>
        <span>dashed: action threshold 0.34</span>
        <span>shaded: wave nights</span>
      </div>

      <div className="twv-tables mt-5 grid gap-6 md:grid-cols-3 md:justify-between">
        <table>
          <caption>State</caption>
          <tbody>
            <tr><td>t</td><td data-k="t">0</td></tr>
            <tr><td>night</td><td data-k="night">0</td></tr>
            <tr><td>wave</td><td data-k="wavecell">no</td></tr>
            <tr><td>alive</td><td data-k="alive">60 / 60</td></tr>
            <tr><td>deaths</td><td data-k="deaths">0</td></tr>
          </tbody>
        </table>
        <table>
          <caption>Station <span data-k="wolfId2"></span> ledger</caption>
          <tbody>
            <tr><td>error rate</td><td data-k="wolfEps">0.50</td></tr>
            <tr><td>false flares</td><td data-k="wolfFalse">0</td></tr>
            <tr><td>true detections</td><td data-k="wolfTrue">0</td></tr>
            <tr><td>trust received</td><td data-k="wolfTrust">0.500</td></tr>
            <tr><td>others, mean</td><td data-k="othersTrust">0.500</td></tr>
          </tbody>
        </table>
        <table>
          <caption>Nights</caption>
          <thead>
            <tr><th>night</th><th>wave</th><th>flares t/f</th><th>shelters</th><th>deaths</th></tr>
          </thead>
          <tbody data-nights></tbody>
        </table>
      </div>

      <div className="twv-tables mt-5 grid gap-6 md:grid-cols-2 md:justify-between">
        <table>
          <caption>Nights the discounted station detected truly, actual against branch</caption>
          <thead>
            <tr><th>night</th><th>trust received</th><th>deaths after flare</th><th>branch: deaths · relays</th></tr>
          </thead>
          <tbody data-branches></tbody>
        </table>
        <table>
          <caption>Base rates, seeds 1 to 40, full runs</caption>
          <thead>
            <tr><th>condition</th><th>runs</th><th>deaths</th><th>quiet-night shelters</th><th>alive at end</th></tr>
          </thead>
          <tbody data-cohort>
            <tr><td colSpan={5}>computing</td></tr>
          </tbody>
        </table>
      </div>

      <div className="twv-tables mt-5">
        <table>
          <caption>Parameters</caption>
          <tbody>
            <tr><td>stations</td><td>60</td><td>nights</td><td>50 &times; 480 ticks</td><td>wave chance</td><td>0.55</td></tr>
            <tr><td>wave speed / depth</td><td>0.32 / 8</td><td>severity</td><td>0.6 to 2.2</td><td>hit damage</td><td>0.18 &times; severity</td></tr>
            <tr><td>sense lead</td><td>7</td><td>flare reach</td><td>30</td><td>relay delay</td><td>8</td></tr>
            <tr><td>shelter prep</td><td>62</td><td>shelter cost</td><td>0.05</td><td>regen</td><td>0.038</td></tr>
            <tr><td>trust prior</td><td>0.5</td><td>act threshold</td><td>0.34</td><td>credit + / echo / &minus;</td><td>0.25 / 0.09 / 0.28</td></tr>
            <tr><td>relay vouch</td><td>0.1</td><td>error rates</td><td>0.02 to 0.07</td><td>one station</td><td>0.5</td></tr>
            <tr><td>drift, per night</td><td>up to 3.5</td><td>pull / push</td><td>0.6 / 1.5, around the prior</td><td>elbow room</td><td>6</td></tr>
            <tr><td>settlement</td><td>each night, per origin heard</td><td>credit</td><td>heard before safe, before hit</td><td>claims carry</td><td>the origin&apos;s name</td></tr>
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex gap-2">
        <button data-pause className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-4 py-2 text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">Pause</button>
        <button data-replay className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-4 py-2 text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">Replay</button>
        <button data-next className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-4 py-2 text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">Next run</button>
        <button data-speed className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-4 py-2 text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">Speed 1&times;</button>
      </div>
    </div>
  )
}
