"use client"

import { useEffect, useRef } from "react"

// The Severed Twin: two worlds, one seed, one law; world B has care
// amputated (the urge and the assistance physics together). Streams are
// consumed identically every tick regardless of behavior, so the worlds
// are numerically identical until care changes an action, which cannot
// happen before the storm.

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const P = {
  n: 200,
  size: 100,
  nests: [
    [50, 50],
    [22, 24],
    [78, 26],
    [24, 78],
    [77, 75],
  ] as Array<[number, number]>,
  jitter: 7.0,
  speed: 0.5,
  redraw: 0.06,
  homeDist: 16,
  homePull: 0.25,
  onset: 700,
  ramp: 12,
  hold: 1750,
  rampDown: 60,
  stormNest: 0,
  stormR: 24,
  snare: 0.93,
  damage: 0.011,
  gripI: 0.3,
  fleeAt: 0.12,
  fleeReach: 14,
  rHelp: 3.5,
  help: 1.0,
  cohereAt: 3.5,
  end: 2400,
}

type World = {
  care: boolean
  rng: () => number
  t: number
  x: Float64Array
  y: Float64Array
  h: Float64Array
  integ: Float64Array
  alive: Uint8Array
  home: Int32Array
  partner: Int32Array
  rescuing: Uint8Array
  assisted: Uint8Array
  bond: Float64Array
}

function makeWorld(seed: number, care: boolean): World {
  const rng = mulberry32(seed)
  const n = P.n
  const w: World = {
    care,
    rng,
    t: 0,
    x: new Float64Array(n),
    y: new Float64Array(n),
    h: new Float64Array(n),
    integ: new Float64Array(n),
    alive: new Uint8Array(n),
    home: new Int32Array(n),
    partner: new Int32Array(n),
    rescuing: new Uint8Array(n),
    assisted: new Uint8Array(n),
    bond: new Float64Array(n),
  }
  for (let i = 0; i < n; i++) {
    const nest = P.nests[(i >> 1) % P.nests.length]
    const ang = rng() * 2 * Math.PI
    const rad = Math.sqrt(rng()) * P.jitter
    w.x[i] = nest[0] + rad * Math.cos(ang)
    w.y[i] = nest[1] + rad * Math.sin(ang)
    w.h[i] = rng() * 2 * Math.PI
    w.integ[i] = 1.0
    w.alive[i] = 1
    w.home[i] = (i >> 1) % P.nests.length
    w.partner[i] = i % 2 === 0 ? i + 1 : i - 1
    // heterogeneity is initialization: one bond per pair, drawn once
    // at spawn. Fixed draws: every agent draws; the odd member adopts
    // its partner's.
    const b = rng()
    w.bond[i] = i % 2 === 0 ? b : w.bond[i - 1]
  }
  return w
}

function intensity(t: number) {
  if (t < P.onset) return 0
  const u = t - P.onset
  if (u < P.ramp) return (u + 1) / P.ramp
  if (u < P.hold - P.onset) return 1
  const d = u - (P.hold - P.onset)
  if (d < P.rampDown) return 1 - d / P.rampDown
  return 0
}

function stepWorld(w: World) {
  const n = P.n
  const I = intensity(w.t)
  const sx = P.nests[P.stormNest][0]
  const sy = P.nests[P.stormNest][1]
  const inside = new Uint8Array(n)
  const gripped = new Uint8Array(n)
  const sd = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    sd[i] = Math.hypot(w.x[i] - sx, w.y[i] - sy)
    inside[i] = sd[i] < P.stormR ? 1 : 0
    gripped[i] = inside[i] && I > P.gripI ? 1 : 0
  }
  const near = new Uint8Array(n)
  if (w.care) {
    for (let i = 0; i < n; i++) {
      const p = w.partner[i]
      if (
        w.alive[i] &&
        w.alive[p] &&
        Math.hypot(w.x[i] - w.x[p], w.y[i] - w.y[p]) <= P.rHelp
      )
        near[i] = 1
    }
  }
  for (let i = 0; i < n; i++) {
    const r1 = w.rng()
    const r2 = w.rng()
    if (!w.alive[i]) continue
    if (r1 < P.redraw) w.h[i] = r2 * 2 * Math.PI
    let dx = Math.cos(w.h[i])
    let dy = Math.sin(w.h[i])
    const nest = P.nests[w.home[i]]
    const hd = Math.hypot(w.x[i] - nest[0], w.y[i] - nest[1])
    if (hd > P.homeDist) {
      dx = (1 - P.homePull) * dx + (P.homePull * (nest[0] - w.x[i])) / hd
      dy = (1 - P.homePull) * dy + (P.homePull * (nest[1] - w.y[i])) / hd
    }
    {
      const p = w.partner[i]
      if (w.alive[p]) {
        const pd = Math.hypot(w.x[p] - w.x[i], w.y[p] - w.y[i])
        if (pd > P.cohereAt) {
          const pull = 0.15 + 0.5 * w.bond[i]
          dx = (1 - pull) * dx + (pull * (w.x[p] - w.x[i])) / pd
          dy = (1 - pull) * dy + (pull * (w.y[p] - w.y[i])) / pd
        }
      }
    }
    const danger = I * Math.max(0, 1 - sd[i] / (P.stormR + P.fleeReach))
    if (danger > P.fleeAt && sd[i] > 1e-9) {
      dx = (w.x[i] - sx) / sd[i]
      dy = (w.y[i] - sy) / sd[i]
    }
    w.rescuing[i] = 0
    if (w.care && w.integ[i] > 0.48 - 0.34 * w.bond[i]) {
      // the urge; the wager is refused below the floor
      const p = w.partner[i]
      if (w.alive[p] && gripped[p]) {
        const pd = Math.hypot(w.x[p] - w.x[i], w.y[p] - w.y[i])
        if (pd > P.rHelp) {
          dx = (w.x[p] - w.x[i]) / pd
          dy = (w.y[p] - w.y[i]) / pd
          w.rescuing[i] = 1
        } else if (sd[i] > 1e-9) {
          dx = (w.x[i] - sx) / sd[i]
          dy = (w.y[i] - sy) / sd[i]
          w.rescuing[i] = 1
        }
      }
    }
    const nm = Math.hypot(dx, dy) || 1
    let v = P.speed
    w.assisted[i] = 0
    if (inside[i]) {
      let sn = P.snare * I
      if (near[i]) {
        sn *= 1 - P.help
        if (I > 0) w.assisted[i] = 1
      }
      v *= Math.max(0.02, 1 - sn)
    }
    w.x[i] = Math.min(P.size, Math.max(0, w.x[i] + (dx / nm) * v))
    w.y[i] = Math.min(P.size, Math.max(0, w.y[i] + (dy / nm) * v))
    if (inside[i]) {
      w.integ[i] -= P.damage * I
      if (w.integ[i] <= 0) w.alive[i] = 0
    }
  }
  w.t++
}

const GEO = { plateW: 460, plateH: 460, top: 40, ax: 20, gx: 480, bx: 660, scale: 4.6 }
const SPEEDS = [1, 2, 4]

export default function SeveredTwin() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const stage = root.querySelector<HTMLCanvasElement>("canvas[data-stage]")!
    const popC = root.querySelector<HTMLCanvasElement>("canvas[data-pop]")!
    const spark = root.querySelector<HTMLCanvasElement>("canvas[data-spark]")!
    const sctx = stage.getContext("2d")!
    const pctx = popC.getContext("2d")!
    const kctx = spark.getContext("2d")!
    const el = (k: string) => root.querySelector<HTMLElement>(`[data-k="${k}"]`)!
    const runrows = root.querySelector<HTMLElement>("[data-runrows]")!

    let PAL = { plate: "#1d2740", accent: "#f6b545", ca: "#a8d4e2", cb: "#f0a58c", muted: "#cfe0d2" }
    const readPalette = () => {
      const cs = getComputedStyle(root)
      const g = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb
      PAL = {
        plate: g("--twv-plate", PAL.plate),
        accent: g("--site-accent", PAL.accent),
        ca: g("--twv-ca", PAL.ca),
        cb: g("--twv-cb", PAL.cb),
        muted: g("--site-muted", PAL.muted),
      }
    }
    readPalette()
    const mo = new MutationObserver(readPalette)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    let seed = 1
    let A = makeWorld(seed, true)
    let B = makeWorld(seed, false)
    let snapped = new Uint8Array(P.n)
    let snaps: Array<{ i: number; kind: string }> = []
    let flashes: Array<{ i: number; kind: string; ttl: number }> = []
    let divTrace: number[] = []
    let popTrace: Array<[number, number]> = []
    let divT = -1
    let paused = false
    let speedIdx = 0
    let logged = false
    let freezeUntil = 0
    let tickAcc = 0
    let lastMs = 0
    let raf = 0

    const reset = (s: number) => {
      seed = s
      A = makeWorld(seed, true)
      B = makeWorld(seed, false)
      snapped = new Uint8Array(P.n)
      snaps = []
      flashes = []
      divTrace = []
      popTrace = []
      divT = -1
      freezeUntil = 0
      tickAcc = 0
      logged = false
      el("seed").textContent = String(seed)
    }

    const stats = () => {
      let aliveA = 0
      let aliveB = 0
      let dv = 0
      let both = 0
      let mx = 0
      const cls: Record<string, [number, number]> = {
        aa: [0, 0],
        ad: [0, 0],
        da: [0, 0],
        dd: [0, 0],
      }
      for (let i = 0; i < P.n; i++) {
        const a = A.alive[i]
        const b = B.alive[i]
        if (a) aliveA++
        if (b) aliveB++
        const k = a ? (b ? "aa" : "ad") : b ? "da" : "dd"
        cls[k][0]++
        cls[k][1] += A.bond[i]
        if (a && b) {
          const d = Math.hypot(A.x[i] - B.x[i], A.y[i] - B.y[i])
          dv += d
          both++
          if (d > mx) mx = d
        }
      }
      return { aliveA, aliveB, cls, mean: both ? dv / both : 0, max: mx }
    }

    const tickOnce = () => {
      stepWorld(A)
      stepWorld(B)
      for (let i = 0; i < P.n; i++) {
        if (!snapped[i] && A.alive[i] !== B.alive[i]) {
          snapped[i] = 1
          const kind = A.alive[i] ? "ad" : "da"
          snaps.push({ i, kind })
          flashes.push({ i, kind, ttl: 46 })
        }
      }
      if (A.t % 4 === 0) {
        const s = stats()
        divTrace.push(s.mean)
        popTrace.push([s.aliveA, s.aliveB])
        if (divT < 0 && s.max > 0) divT = A.t
      }
    }

    const paceFor = (t: number) => {
      const s = SPEEDS[speedIdx]
      if (t < P.onset - 80) return 7 * s
      if (t < P.onset + 140) return 2 * s
      if (t < P.hold + P.rampDown) return 3 * s
      return 5 * s
    }

    const apos = (w: World, i: number, plateX: number): [number, number] => [
      plateX + w.x[i] * GEO.scale,
      GEO.top + w.y[i] * GEO.scale,
    ]

    const drawWorld = (w: World, plateX: number) => {
      const c = sctx
      c.save()
      c.beginPath()
      c.roundRect(plateX, GEO.top, GEO.plateW, GEO.plateH, 6)
      c.fillStyle = PAL.plate
      c.fill()
      c.clip()
      for (let k = 0; k < P.nests.length; k++) {
        const nx = plateX + P.nests[k][0] * GEO.scale
        const ny = GEO.top + P.nests[k][1] * GEO.scale
        c.beginPath()
        c.arc(nx, ny, 3.2 * GEO.scale, 0, 2 * Math.PI)
        c.strokeStyle = "rgba(214,208,192,0.16)"
        c.lineWidth = 1
        c.stroke()
      }
      const I = intensity(w.t)
      if (I > 0) {
        const cx = plateX + P.nests[P.stormNest][0] * GEO.scale
        const cy = GEO.top + P.nests[P.stormNest][1] * GEO.scale
        const R = P.stormR * GEO.scale
        const gr = c.createRadialGradient(cx, cy, R * 0.15, cx, cy, R)
        gr.addColorStop(0, `rgba(194,58,43,${0.34 * I})`)
        gr.addColorStop(1, `rgba(194,58,43,${0.05 * I})`)
        c.beginPath()
        c.arc(cx, cy, R, 0, 2 * Math.PI)
        c.fillStyle = gr
        c.fill()
        c.beginPath()
        c.arc(cx, cy, R, 0, 2 * Math.PI)
        c.strokeStyle = `rgba(194,58,43,${0.28 + 0.5 * I})`
        c.lineWidth = 1.4
        c.stroke()
      }
      c.strokeStyle = "rgba(163,146,126,0.55)"
      c.lineWidth = 1
      for (let i = 0; i < P.n; i++) {
        if (w.alive[i]) continue
        const [x, y] = apos(w, i, plateX)
        c.beginPath()
        c.moveTo(x - 2.6, y - 2.6)
        c.lineTo(x + 2.6, y + 2.6)
        c.moveTo(x + 2.6, y - 2.6)
        c.lineTo(x - 2.6, y + 2.6)
        c.stroke()
      }
      for (let i = 0; i < P.n; i++) {
        if (!w.alive[i]) continue
        const [x, y] = apos(w, i, plateX)
        if (w.assisted[i]) {
          c.beginPath()
          c.arc(x, y, 2.6, 0, 2 * Math.PI)
          c.fillStyle = "#ec9e40"
          c.fill()
        } else {
          c.beginPath()
          c.arc(x, y, 2.2, 0, 2 * Math.PI)
          c.fillStyle = "rgba(214,208,192,0.92)"
          c.fill()
        }
        if (w.rescuing[i]) {
          c.beginPath()
          c.arc(x, y, 4.6, 0, 2 * Math.PI)
          c.strokeStyle = "#ec9e40"
          c.lineWidth = 1.1
          c.stroke()
        }
      }
      c.restore()
      c.beginPath()
      c.roundRect(plateX, GEO.top, GEO.plateW, GEO.plateH, 6)
      c.strokeStyle = "rgba(133,118,101,0.4)"
      c.lineWidth = 1
      c.stroke()
    }

    const draw = () => {
      const c = sctx
      c.clearRect(0, 0, stage.width, stage.height)
      for (let i = 0; i < P.n; i++) {
        if (!A.alive[i] || !B.alive[i]) continue
        const d = Math.hypot(A.x[i] - B.x[i], A.y[i] - B.y[i])
        if (d < 1.2) continue
        const [x1, y1] = apos(A, i, GEO.ax)
        const [x2, y2] = apos(B, i, GEO.bx)
        c.beginPath()
        c.moveTo(x1, y1)
        c.lineTo(x2, y2)
        c.strokeStyle = `rgba(133,118,101,${Math.min(0.4, d / 34)})`
        c.lineWidth = 0.7
        c.stroke()
      }
      drawWorld(A, GEO.ax)
      drawWorld(B, GEO.bx)
      for (const f of flashes) {
        const a = f.ttl / 46
        const [x1, y1] = apos(A, f.i, GEO.ax)
        const [x2, y2] = apos(B, f.i, GEO.bx)
        c.beginPath()
        c.moveTo(x1, y1)
        c.lineTo(x2, y2)
        c.strokeStyle = f.kind === "ad" ? PAL.ca : PAL.cb
        c.globalAlpha = 0.75 * a
        c.lineWidth = 1.4
        c.stroke()
        c.globalAlpha = 1
        f.ttl--
      }
      flashes = flashes.filter((f) => f.ttl > 0)
      const gcx = (GEO.gx + GEO.bx) / 2
      let ys = GEO.top + 18
      let yp = GEO.top + 18
      for (const s of snaps) {
        if (s.kind === "ad") {
          c.strokeStyle = PAL.ca
          c.beginPath()
          c.moveTo(gcx - 42, ys)
          c.lineTo(gcx - 14, ys)
          c.lineWidth = 2
          c.stroke()
          ys += 6
        } else {
          c.strokeStyle = PAL.cb
          c.beginPath()
          c.moveTo(gcx + 14, yp)
          c.lineTo(gcx + 42, yp)
          c.lineWidth = 2
          c.stroke()
          yp += 6
        }
      }
    }

    const drawPop = () => {
      const c = pctx
      const W = popC.width
      const H = popC.height
      c.clearRect(0, 0, W, H)
      c.strokeStyle = "rgba(133,118,101,0.35)"
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(0, H - 14)
      c.lineTo(W, H - 14)
      c.stroke()
      const maxT = P.end / 4
      const lo = 120
      const hi = 200
      const ox = ((P.onset / 4) / maxT) * W
      c.strokeStyle = PAL.cb
      c.beginPath()
      c.moveTo(ox, 8)
      c.lineTo(ox, H - 14)
      c.stroke()
      const yFor = (v: number) => H - 14 - ((Math.max(lo, v) - lo) / (hi - lo)) * (H - 24)
      for (let s = 0; s < 2; s++) {
        c.strokeStyle = s === 0 ? PAL.ca : PAL.cb
        c.lineWidth = 1.4
        c.beginPath()
        for (let k = 0; k < popTrace.length; k++) {
          const x = (k / maxT) * W
          const y = yFor(popTrace[k][s])
          if (k === 0) c.moveTo(x, y)
          else c.lineTo(x, y)
        }
        c.stroke()
      }
      c.fillStyle = PAL.muted
      c.font = `10px ${getComputedStyle(document.body).fontFamily}`
      c.fillText("alive", 6, 12)
      c.fillText("200", W - 24, yFor(200) + 3)
      c.fillText("120", W - 24, yFor(120) + 3)
      if (popTrace.length) {
        const last = popTrace[popTrace.length - 1]
        const x = Math.min((popTrace.length / maxT) * W + 6, W - 46)
        c.fillStyle = PAL.ca
        c.fillText(String(last[0]), x, yFor(last[0]) + 3)
        c.fillStyle = PAL.cb
        c.fillText(String(last[1]), x, yFor(last[1]) + 11)
      }
    }

    const drawSpark = () => {
      const c = kctx
      const W = spark.width
      const H = spark.height
      c.clearRect(0, 0, W, H)
      c.strokeStyle = "rgba(133,118,101,0.35)"
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(0, H - 12)
      c.lineTo(W, H - 12)
      c.stroke()
      const maxT = P.end / 4
      const maxV = 26
      const ox = ((P.onset / 4) / maxT) * W
      c.strokeStyle = PAL.cb
      c.beginPath()
      c.moveTo(ox, 8)
      c.lineTo(ox, H - 12)
      c.stroke()
      c.strokeStyle = PAL.muted
      c.lineWidth = 1.4
      c.beginPath()
      for (let k = 0; k < divTrace.length; k++) {
        const x = (k / maxT) * W
        const y = H - 12 - Math.min(1, divTrace[k] / maxV) * (H - 22)
        if (k === 0) c.moveTo(x, y)
        else c.lineTo(x, y)
      }
      c.stroke()
      c.fillStyle = PAL.muted
      c.font = `10px ${getComputedStyle(document.body).fontFamily}`
      c.fillText("mean twin separation", 6, 12)
      c.fillText(`t=${P.onset}`, ox + 5, 12)
    }

    const updateData = () => {
      const s = stats()
      el("t").textContent = String(A.t)
      el("i").textContent = intensity(A.t).toFixed(2)
      el("a").textContent = String(s.aliveA)
      el("b").textContent = String(s.aliveB)
      const net = s.aliveA - s.aliveB
      el("net").textContent = (net >= 0 ? "+" : "") + net
      el("sep").textContent = s.mean.toFixed(6)
      el("max").textContent = s.max.toFixed(6)
      el("divt").textContent = divT < 0 ? "–" : String(divT)
      const rows: Array<[string, string]> = [
        ["aa", "f-aa"],
        ["ad", "f-ad"],
        ["da", "f-da"],
        ["dd", "f-dd"],
      ]
      for (const [k, id] of rows) {
        const [nCls, bSum] = s.cls[k]
        el(id).textContent = String(nCls)
        el(id + "-b").textContent = nCls ? (bSum / nCls).toFixed(2) : "–"
      }
      return s
    }

    const logRun = (s: ReturnType<typeof stats>) => {
      const tr = document.createElement("tr")
      const net = s.aliveA - s.aliveB
      const cells = [
        String(seed),
        String(s.aliveA),
        String(s.aliveB),
        (net >= 0 ? "+" : "") + net,
        String(s.cls.ad[0]),
        String(s.cls.da[0]),
        divT < 0 ? "–" : String(divT),
      ]
      for (let k = 0; k < cells.length; k++) {
        const td = document.createElement("td")
        td.textContent = cells[k]
        if (k === 4) td.className = "twv-ca"
        if (k === 5) td.className = "twv-cb"
        tr.appendChild(td)
      }
      runrows.insertBefore(tr, runrows.firstChild)
      while (runrows.children.length > 10) runrows.removeChild(runrows.lastChild!)
    }

    const frame = (nowMs: number) => {
      const dt = lastMs ? Math.min(0.1, (nowMs - lastMs) / 1000) : 0
      lastMs = nowMs
      if (!paused) {
        if (A.t >= P.end) {
          if (freezeUntil === 0) {
            const s = updateData()
            if (!logged) {
              logRun(s)
              logged = true
            }
            freezeUntil = nowMs + 7000
          } else if (nowMs >= freezeUntil) {
            reset(seed + 1)
          }
        } else {
          tickAcc += paceFor(A.t) * 60 * dt
          let k = Math.floor(tickAcc)
          tickAcc -= k
          for (; k > 0 && A.t < P.end; k--) tickOnce()
          updateData()
        }
        draw()
        drawPop()
        drawSpark()
      }
      raf = requestAnimationFrame(frame)
    }

    const bPause = root.querySelector<HTMLButtonElement>("[data-pause]")!
    const bRestart = root.querySelector<HTMLButtonElement>("[data-restart]")!
    const bSeed = root.querySelector<HTMLButtonElement>("[data-newseed]")!
    const bSpeed = root.querySelector<HTMLButtonElement>("[data-speed]")!
    const cover = root.querySelector<HTMLElement>("[data-cover]")!
    const bPlay = root.querySelector<HTMLButtonElement>("[data-play]")!

    const onPause = () => {
      paused = !paused
      bPause.textContent = paused ? "Run" : "Pause"
    }
    const onRestart = () => {
      reset(seed)
      draw()
      drawPop()
      drawSpark()
      updateData()
    }
    const onSeed = () => {
      reset(1 + Math.floor(Math.random() * 9999))
      draw()
      drawPop()
      drawSpark()
      updateData()
    }
    const onSpeed = () => {
      speedIdx = (speedIdx + 1) % SPEEDS.length
      bSpeed.textContent = `Speed ${SPEEDS[speedIdx]}×`
    }
    const onPlay = () => {
      cover.hidden = true
      paused = false
      bPause.textContent = "Pause"
    }
    bPause.addEventListener("click", onPause)
    bRestart.addEventListener("click", onRestart)
    bSeed.addEventListener("click", onSeed)
    bSpeed.addEventListener("click", onSpeed)
    bPlay.addEventListener("click", onPlay)

    reset(1)
    const reduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) {
      paused = true
      bPause.textContent = "Run"
      cover.hidden = false
    }
    draw()
    drawPop()
    drawSpark()
    updateData()
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
      bPause.removeEventListener("click", onPause)
      bRestart.removeEventListener("click", onRestart)
      bSeed.removeEventListener("click", onSeed)
      bSpeed.removeEventListener("click", onSpeed)
      bPlay.removeEventListener("click", onPlay)
    }
  }, [])

  return (
    <div ref={rootRef} className="twv-root">
      <style>{`
        .twv-root {
          --twv-plate: #1d2740;
          --twv-ca: #a8d4e2;
          --twv-cb: #f0a58c;
        }
        [data-theme="evening"] .twv-root { --twv-ca: #7fb3c9; --twv-cb: #d0604e; }
        [data-theme="noon"] .twv-root { --twv-ca: #00394F; --twv-cb: #C23A2B; }
        .twv-root canvas { display: block; width: 100%; height: auto; }
        .twv-cover[hidden] { display: none; }
        .twv-cover {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .twv-tables { font-variant-numeric: tabular-nums; }
        .twv-tables table { border-collapse: collapse; font-size: 11px; color: var(--site-body); }
        .twv-tables caption {
          text-align: left; font-size: 10px; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--site-accent); padding-bottom: 6px;
        }
        .twv-tables th, .twv-tables td {
          padding: 3px 10px 3px 0; text-align: right; font-weight: 400; white-space: nowrap;
        }
        .twv-tables th { color: var(--site-muted); font-size: 10px; letter-spacing: 0.08em; }
        .twv-tables td:first-child, .twv-tables th:first-child { text-align: left; padding-right: 16px; }
        .twv-tables tbody tr { border-top: 1px solid var(--site-line); }
        .twv-tables thead tr { border-bottom: 1px solid var(--site-line); }
        .twv-ca { color: var(--twv-ca); }
        .twv-cb { color: var(--twv-cb); }
        .twv-cm { color: var(--site-muted); }
      `}</style>

      <div className="flex justify-between smallcaps text-[10.5px] mb-2">
        <span className="twv-ca">A &middot; care 1</span>
        <span className="twv-cb">B &middot; care 0</span>
      </div>
      <div className="relative">
        <canvas
          data-stage
          width={1140}
          height={540}
          aria-label="Two simulated worlds from one seed, world A with care, world B without; lines join each agent to its counterfactual twin"
        />
        <div className="twv-cover" data-cover hidden>
          <button
            data-play
            className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-bg)] px-6 py-3 text-[11px] text-[var(--site-ink)]"
          >
            Run
          </button>
        </div>
      </div>
      <canvas data-pop width={1140} height={80} className="mt-2" aria-label="Living population of each world over time" />
      <canvas data-spark width={1140} height={70} className="mt-2" aria-label="Mean separation between twin agents over time" />

      <div className="twv-tables mt-5 grid gap-6 md:grid-cols-3 md:justify-between">
        <table>
          <caption>state</caption>
          <tbody>
            <tr><td>t</td><td data-k="t">0</td></tr>
            <tr><td>storm intensity</td><td data-k="i">0.00</td></tr>
            <tr><td>alive A</td><td data-k="a" className="twv-ca">200</td></tr>
            <tr><td>alive B</td><td data-k="b" className="twv-cb">200</td></tr>
            <tr><td>alive A &minus; alive B</td><td data-k="net">0</td></tr>
            <tr><td>mean twin separation</td><td data-k="sep">0.000000</td></tr>
            <tr><td>max twin separation</td><td data-k="max">0.000000</td></tr>
            <tr><td>first divergence t</td><td data-k="divt" className="twv-cm">&ndash;</td></tr>
          </tbody>
        </table>

        <table>
          <caption>twin fates</caption>
          <thead>
            <tr><th>A / B</th><th>n</th><th>mean bond</th></tr>
          </thead>
          <tbody>
            <tr><td>alive / alive</td><td data-k="f-aa">200</td><td data-k="f-aa-b">&ndash;</td></tr>
            <tr className="twv-ca"><td>alive / dead</td><td data-k="f-ad">0</td><td data-k="f-ad-b">&ndash;</td></tr>
            <tr className="twv-cb"><td>dead / alive</td><td data-k="f-da">0</td><td data-k="f-da-b">&ndash;</td></tr>
            <tr><td>dead / dead</td><td data-k="f-dd">0</td><td data-k="f-dd-b">&ndash;</td></tr>
          </tbody>
        </table>

        <table>
          <caption>completed runs</caption>
          <thead>
            <tr>
              <th>seed</th><th>alive A</th><th>alive B</th><th>A&minus;B</th>
              <th className="twv-ca">a/d</th><th className="twv-cb">d/a</th><th>div t</th>
            </tr>
          </thead>
          <tbody data-runrows />
        </table>
      </div>

      <div className="twv-tables mt-5">
        <table>
          <caption>parameters</caption>
          <tbody>
            <tr>
              <td>n</td><td>200</td>
              <td>pairs</td><td>100</td>
              <td>storm onset</td><td>700</td>
              <td>storm radius</td><td>24</td>
              <td>snare</td><td>0.93</td>
              <td>damage / tick</td><td>0.011</td>
              <td>r_help</td><td>3.5</td>
              <td>bond</td><td>U(0,1) per pair</td>
              <td>seed</td><td data-k="seed">1</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-[var(--site-line)] pt-4">
        <button data-pause className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-4 py-2 text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">Pause</button>
        <button data-restart className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-4 py-2 text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">Restart</button>
        <button data-newseed className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-4 py-2 text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">New seed</button>
        <button data-speed className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-4 py-2 text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">Speed 1&times;</button>
      </div>
    </div>
  )
}
