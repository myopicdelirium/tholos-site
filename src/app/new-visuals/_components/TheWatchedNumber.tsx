"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"

// TWN: the phase model, replayed. This component runs no simulation.
// The replays are published as ciphertext: the site repository is
// public and the model is not, so each file is gzipped and encrypted
// with AES-256-GCM under a key derived from a passcode by PBKDF2. The
// passcode lives nowhere in this repository; a reader types it once.
// It plays per-tick recordings exported from registered runs of the
// phase-model repository by scripts/export_replay.py, each verified at
// export time to leave the run byte-identical. Seed, config digest and
// commit are displayed from the file. Rendering conventions:
// the ground is the 32x32 grid drawn as a printed plate: each cell is
// owned by its nearest resource site (torus distance), parcels are
// separated by hairline borders, and a parcel's tone is its site's
// recorded stock on a single dust-to-moss ramp. Gold belongs to the
// indicators and the attention resting on them; red to hazard and
// death; everything else is ink on paper. Gaze marks point at the
// attended site, up toward the board, or down at the commons.
// Motion between recorded ticks is linear interpolation.

type Replay = {
  kind: string
  phase: number
  arm: string
  index: number
  seed: string
  config_digest: string
  commit: string
  ticks: number
  header: {
    size: number
    n_agents_initial: number
    site_pos: Array<[number, number]>
    site_capacity: number
    exposed: boolean[]
  }
  trace: Record<string, number[]>
  final: Record<string, unknown>
  series: {
    pos: number[][]
    energy: number[][]
    gaze: number[][]
    att_commons: number[][]
    incoming_trust: number[][]
    child: number[][]
    role: number[][]
    site_stock: number[][]
    hazard_mask: number[]
  }
  neighbours: Record<string, number[]>
  events: {
    tells: Array<[number, number, number, number]>
    announces: Array<[number, number, number]>
    deaths: Array<[number, number, number]>
    births: Array<[number, number, number]>
  }
}

const RUNS: Array<{ file: string; twin: string; label: string }> = [
  { file: "pm-p3-capture.enc", twin: "pm-p3-off.enc", label: "phase 3 · capture · run 9" },
  { file: "pm-p3-off.enc", twin: "pm-p3-capture.enc", label: "phase 3 · redirection off · run 9" },
  { file: "pm-p2-redir.enc", twin: "pm-p2-off.enc", label: "phase 2 · redirection · run 4" },
  { file: "pm-p2-off.enc", twin: "pm-p2-redir.enc", label: "phase 2 · redirection off · run 4" },
  { file: "pm-p1-formation.enc", twin: "pm-p1-anarchic.enc", label: "phase 1 · formation · run 3" },
  { file: "pm-p1-anarchic.enc", twin: "pm-p1-formation.enc", label: "phase 1 · anarchic · run 3" },
]

const SPEEDS = [1, 4, 12]
const BASE_TPS = 30
const SIDE = 1000
const BOARD_H = 84
const IND_NAMES = ["provision", "mortality", "child survival"]

const PASS_KEY = "md-twn-access"

// The unlock lives outside React: sessionStorage is an external system,
// so it is read through a store rather than synced in an effect.
const passStore = {
  listeners: new Set<() => void>(),
  get(): string | null {
    try {
      return sessionStorage.getItem(PASS_KEY)
    } catch {
      return null
    }
  },
  set(v: string) {
    try {
      sessionStorage.setItem(PASS_KEY, v)
    } catch {}
    passStore.listeners.forEach((l) => l())
  },
  subscribe(l: () => void) {
    passStore.listeners.add(l)
    return () => {
      passStore.listeners.delete(l)
    }
  },
}

async function decryptReplay(buf: ArrayBuffer, pass: string): Promise<Replay> {
  const raw = new Uint8Array(buf)
  const salt = raw.slice(0, 16)
  const iv = raw.slice(16, 28)
  const body = raw.slice(28)
  const enc = new TextEncoder()
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2",
    false, ["deriveKey"])
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["decrypt"])
  const packed = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, body)
  const stream = new Blob([packed]).stream()
    .pipeThrough(new DecompressionStream("gzip"))
  const text = await new Response(stream).text()
  return JSON.parse(text) as Replay
}

export default function TheWatchedNumber() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const pass = useSyncExternalStore(
    passStore.subscribe,
    passStore.get,
    () => null,
  )
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!pass) return
    const root = rootRef.current
    if (!root) return
    const stage = root.querySelector<HTMLCanvasElement>("[data-stage]")!
    const chartA = root.querySelector<HTMLCanvasElement>("[data-chart-a]")!
    const chartB = root.querySelector<HTMLCanvasElement>("[data-chart-b]")!
    const sctx = stage.getContext("2d")!
    const caCtx = chartA.getContext("2d")!
    const cbCtx = chartB.getContext("2d")!
    const el = (k: string) => root.querySelector<HTMLElement>(`[data-k="${k}"]`)!

    let PAL = { ink: "#ece4d0", accent: "#f6b545", muted: "#cfe0d2", line: "#5b6b62" }
    const readPalette = () => {
      const cs = getComputedStyle(root)
      const g = (n: string, f: string) => cs.getPropertyValue(n).trim() || f
      PAL = {
        ink: g("--site-ink", PAL.ink),
        accent: g("--site-accent", PAL.accent),
        muted: g("--site-muted", PAL.muted),
        line: g("--site-line", PAL.line),
      }
    }
    readPalette()
    const mo = new MutationObserver(readPalette)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    // ---- state -------------------------------------------------------------
    let rep: Replay | null = null
    let twin: Replay | null = null
    let runIdx = 0
    let CELL = 0
    let owner: Int32Array | null = null // grid cell -> owning site
    const quilt = document.createElement("canvas")
    quilt.width = SIDE
    quilt.height = SIDE
    const qctx = quilt.getContext("2d")!
    let quiltTick = -1
    let t = 0 // fractional replay tick
    let paused = false
    let speedIdx = 0
    let lastMs = 0
    let raf = 0
    let dead: Array<{ x: number; y: number; at: number }> = []
    let arcs: Array<{ x1: number; y1: number; x2: number; y2: number; t0: number; kind: number }> = []
    let evAt = { tells: 0, announces: 0, deaths: 0 }
    let announcePulse = 0 // decaying pulse on the board

    // stock ramp: pale dust at zero through dry gold-green to deep moss
    const RAMP: Array<[number, number, number]> = [
      [214, 203, 178], [168, 163, 123], [110, 128, 92], [74, 96, 70],
    ]
    const ramp = (v: number) => {
      const u = Math.max(0, Math.min(0.999, v)) * (RAMP.length - 1)
      const i = Math.floor(u)
      const f = u - i
      const a = RAMP[i]
      const b = RAMP[i + 1]
      return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * f) + "," +
        Math.round(a[1] + (b[1] - a[1]) * f) + "," +
        Math.round(a[2] + (b[2] - a[2]) * f) + ")"
    }

    const wrap = (d: number, size: number) => {
      // shortest signed torus delta
      if (d > size / 2) return d - size
      if (d < -size / 2) return d + size
      return d
    }

    const buildStatics = () => {
      if (!rep) return
      const size = rep.header.size
      CELL = SIDE / size
      owner = new Int32Array(size * size)
      const sp = rep.header.site_pos
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          let best = 0
          let bd = Infinity
          for (let s = 0; s < sp.length; s++) {
            const dr = Math.abs(wrap(r - sp[s][0], size))
            const dc = Math.abs(wrap(c - sp[s][1], size))
            const d = dr + dc
            if (d < bd || (d === bd && s < best)) {
              bd = d
              best = s
            }
          }
          owner[r * size + c] = best
        }
      }
      quiltTick = -1
    }

    const drawQuilt = (tick: number) => {
      if (!rep || !owner) return
      const size = rep.header.size
      const stock = rep.series.site_stock[tick]
      const haz = rep.series.hazard_mask[tick]
      qctx.fillStyle = "#e7e0cf"
      qctx.fillRect(0, 0, SIDE, SIDE)
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const s = owner[r * size + c]
          const v = stock[s] / 255
          // one sequential ramp: a parcel's tone is its site's stock,
          // nothing else. Per-cell jitter is print grain, seeded by index.
          const jig = ((((r * 73 + c * 151) * 2654435761) >>> 24) / 255 - 0.5) * 0.05
          qctx.fillStyle = ramp(v + jig)
          qctx.fillRect(c * CELL, r * CELL, CELL + 0.5, CELL + 0.5)
        }
      }
      // parcel boundaries: only where ownership changes hands
      qctx.strokeStyle = "rgba(43,37,28,0.5)"
      qctx.lineWidth = 0.75
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const s = owner[r * size + c]
          if (owner[r * size + ((c + 1) % size)] !== s && c + 1 < size) {
            qctx.beginPath()
            qctx.moveTo((c + 1) * CELL, r * CELL)
            qctx.lineTo((c + 1) * CELL, (r + 1) * CELL)
            qctx.stroke()
          }
          if (owner[((r + 1) % size) * size + c] !== s && r + 1 < size) {
            qctx.beginPath()
            qctx.moveTo(c * CELL, (r + 1) * CELL)
            qctx.lineTo((c + 1) * CELL, (r + 1) * CELL)
            qctx.stroke()
          }
        }
      }
      // a parcel under hazard: fine red hatching, a condemned plot
      if (haz) {
        qctx.strokeStyle = "rgba(165,52,38,0.4)"
        qctx.lineWidth = 0.7
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (!(haz & (1 << owner[r * size + c]))) continue
            const x = c * CELL
            const y = r * CELL
            qctx.beginPath()
            qctx.moveTo(x, y + CELL)
            qctx.lineTo(x + CELL, y)
            qctx.stroke()
          }
        }
      }
      // cracks: static pattern revealed as the commons falls
      const commons = rep.trace.commons[tick]
      const crack = 1 - commons
      if (crack > 0.25) {
        qctx.strokeStyle = `rgba(43,37,28,${(crack - 0.25) * 0.4})`
        qctx.lineWidth = 1
        for (let k = 0; k < 40; k++) {
          const x = ((k * 2654435761) % SIDE)
          const y = ((k * 1597334677) % SIDE)
          qctx.beginPath()
          qctx.moveTo(x, y)
          qctx.lineTo(x + ((k * 73) % 60) - 30, y + ((k * 37) % 60) - 30)
          qctx.stroke()
        }
      }
    }

    const posOf = (tick: number, i: number): [number, number] | null => {
      if (!rep) return null
      const p = rep.series.pos[tick][i]
      if (p === undefined || p < 0) return null
      const size = rep.header.size
      return [Math.floor(p / size), p % size]
    }

    // interpolated screen position with torus-aware stepping
    const screenPos = (tick: number, frac: number, i: number): [number, number] | null => {
      if (!rep) return null
      const a = posOf(tick, i)
      if (!a) return null
      const b = posOf(Math.min(rep.ticks - 1, tick + 1), i) || a
      const size = rep.header.size
      const dr = wrap(b[0] - a[0], size)
      const dc = wrap(b[1] - a[1], size)
      const r = a[0] + dr * frac
      const c = a[1] + dc * frac
      const ox = ((((i * 2654435761) >>> 8) % 100) / 100 - 0.5) * CELL * 0.55
      const oy = ((((i * 1597334677) >>> 8) % 100) / 100 - 0.5) * CELL * 0.55
      return [
        ((c + size) % size) * CELL + CELL / 2 + ox,
        ((r + size) % size) * CELL + CELL / 2 + oy + BOARD_H,
      ]
    }

    const siteScreen = (s: number): [number, number] => {
      const sp = rep!.header.site_pos[s]
      return [sp[1] * CELL + CELL / 2, sp[0] * CELL + CELL / 2 + BOARD_H]
    }

    const consumeEvents = (tick: number) => {
      if (!rep) return
      const ev = rep.events
      while (evAt.tells < ev.tells.length && ev.tells[evAt.tells][0] <= tick) {
        const [tt, teller, site] = ev.tells[evAt.tells]
        const from = posOf(tt, teller)
        if (from) {
          const [sr, sc] = [from[0], from[1]]
          const to = rep.header.site_pos[site]
          arcs.push({
            x1: sc * CELL + CELL / 2, y1: sr * CELL + CELL / 2 + BOARD_H,
            x2: to[1] * CELL + CELL / 2, y2: to[0] * CELL + CELL / 2 + BOARD_H,
            t0: tt, kind: 0,
          })
        }
        evAt.tells++
      }
      while (evAt.announces < ev.announces.length && ev.announces[evAt.announces][0] <= tick) {
        announcePulse = Math.min(1, announcePulse + 0.12)
        const [at, gov] = ev.announces[evAt.announces]
        const from = posOf(at, gov)
        if (from && Math.floor(at / 16) % 2 === 0 && arcs.length < 400) {
          arcs.push({
            x1: from[1] * CELL + CELL / 2, y1: from[0] * CELL + CELL / 2 + BOARD_H,
            x2: SIDE / 2, y2: BOARD_H * 0.55,
            t0: at, kind: 1,
          })
        }
        evAt.announces++
      }
      while (evAt.deaths < ev.deaths.length && ev.deaths[evAt.deaths][0] <= tick) {
        const [dt, aid] = ev.deaths[evAt.deaths]
        const p = posOf(Math.max(0, dt - 1), aid)
        if (p) dead.push({ x: p[1] * CELL + CELL / 2, y: p[0] * CELL + CELL / 2 + BOARD_H, at: dt })
        evAt.deaths++
      }
    }

    const draw = () => {
      if (!rep) return
      const c = sctx
      const tick = Math.min(rep.ticks - 1, Math.floor(t))
      const frac = Math.min(1, t - tick)
      c.clearRect(0, 0, SIDE, SIDE + BOARD_H)

      // ---- the board --------------------------------------------------------
      c.fillStyle = "#efe9da"
      c.fillRect(0, 0, SIDE, BOARD_H)
      c.strokeStyle = "rgba(43,37,28,0.55)"
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(0, BOARD_H - 0.5)
      c.lineTo(SIDE, BOARD_H - 0.5)
      c.stroke()
      const attInd = rep.trace.attention_indicators_exposed
        ? rep.trace.attention_indicators_exposed[tick]
        : 0
      // the attention resting on the board, drawn as a measured line,
      // not a glow: width is the exposed populace's indicator attention
      if (attInd > 0.001) {
        c.fillStyle = "rgba(178,128,44,0.9)"
        c.fillRect(0, BOARD_H - 3, SIDE * Math.min(1, attInd * 5), 2.4)
      }
      const inds = [
        rep.trace.ind_provision ? rep.trace.ind_provision[tick] : null,
        rep.trace.ind_mortality ? 1 - Math.min(1, rep.trace.ind_mortality[tick] * 200) : null,
        rep.trace.ind_child_survival ? rep.trace.ind_child_survival[tick] : null,
      ]
      const bw = 220
      c.font = `10px ${getComputedStyle(document.body).fontFamily}`
      inds.forEach((v, i) => {
        const x0 = SIDE / 2 + (i - 1) * (bw + 50) - bw / 2
        c.fillStyle = "rgba(43,37,28,0.75)"
        c.fillText(IND_NAMES[i], x0, 22)
        c.strokeStyle = "rgba(43,37,28,0.5)"
        c.lineWidth = 0.75
        c.strokeRect(x0 + 0.5, 30.5, bw, 18)
        if (v === null) return
        const vv = Math.max(0, Math.min(1, v))
        c.fillStyle = i === 0 ? "rgba(178,128,44,0.9)" : "rgba(43,37,28,0.35)"
        c.fillRect(x0 + 1.5, 31.5, (bw - 2) * vv, 16)
        c.fillStyle = "rgba(43,37,28,0.8)"
        c.fillText(vv.toFixed(2), x0 + bw + 8, 44)
      })
      announcePulse *= 0.94

      // ---- the land ---------------------------------------------------------
      if (quiltTick !== tick >> 2) {
        drawQuilt(tick)
        quiltTick = tick >> 2
      }
      c.drawImage(quilt, 0, BOARD_H)

      // attention light on the land: warm luminance where site attention
      // and commons attention actually rest this tick
      const gaze = rep.series.gaze[tick]
      const nSites = rep.header.site_pos.length
      const siteAtt = new Float32Array(nSites)
      let commonsWatchers = 0
      for (let i = 0; i < gaze.length; i++) {
        if (rep.series.pos[tick][i] < 0) continue
        const gz = gaze[i]
        if (gz >= 1 && gz <= nSites) siteAtt[gz - 1]++
        if (gz === 25) commonsWatchers++
      }
      // attention on the land: a fine ring around a site, weight in its
      // opacity. Measured marks, not light bloom.
      for (let s = 0; s < nSites; s++) {
        if (siteAtt[s] === 0) continue
        const [sx, sy] = siteScreen(s)
        c.beginPath()
        c.arc(sx, sy, 12 + Math.min(10, siteAtt[s]), 0, 2 * Math.PI)
        c.strokeStyle = `rgba(43,37,28,${Math.min(0.5, 0.1 + siteAtt[s] * 0.03)})`
        c.lineWidth = 0.9
        c.stroke()
      }
      void commonsWatchers

      // site markers with stock gauges
      const stock = rep.series.site_stock[tick]
      const hazNow = rep.series.hazard_mask[tick]
      for (let s = 0; s < nSites; s++) {
        const [sx, sy] = siteScreen(s)
        const v = stock[s] / 255
        void v
        c.save()
        c.translate(sx, sy)
        c.rotate(Math.PI / 4)
        c.strokeStyle = "rgba(43,37,28,0.85)"
        c.lineWidth = 1.1
        c.strokeRect(-3.2, -3.2, 6.4, 6.4)
        c.restore()
        if (hazNow & (1 << s)) {
          c.beginPath()
          c.arc(sx, sy, 8.5, 0, 2 * Math.PI)
          c.strokeStyle = `rgba(165,52,38,${0.5 + 0.25 * Math.sin(t * 0.35)})`
          c.lineWidth = 1.2
          c.stroke()
        }
      }

      // ---- event arcs -------------------------------------------------------
      arcs = arcs.filter((a) => t - a.t0 < 14)
      for (const a of arcs) {
        const age = (t - a.t0) / 14
        c.beginPath()
        c.moveTo(a.x1, a.y1)
        const mx = (a.x1 + a.x2) / 2
        const my = (a.y1 + a.y2) / 2 - 26
        c.quadraticCurveTo(mx, my, a.x2, a.y2)
        c.strokeStyle = a.kind === 0
          ? `rgba(43,37,28,${0.35 * (1 - age)})`
          : `rgba(178,128,44,${0.4 * (1 - age)})`
        c.lineWidth = a.kind === 0 ? 0.7 : 0.9
        c.stroke()
      }

      // ---- the dead ---------------------------------------------------------
      dead = dead.filter((d) => t - d.at < 220)
      for (const d of dead) {
        const age = (t - d.at) / 220
        c.strokeStyle = `rgba(120,44,34,${0.65 * (1 - age)})`
        c.lineWidth = 1.1
        c.beginPath()
        c.moveTo(d.x - 4, d.y)
        c.lineTo(d.x + 4, d.y)
        c.moveTo(d.x, d.y - 4)
        c.lineTo(d.x, d.y + 4)
        c.stroke()
      }

      // ---- the people -------------------------------------------------------
      const energy = rep.series.energy[tick]
      const role = rep.series.role[tick]
      const child = rep.series.child[tick]
      const inc = rep.series.incoming_trust[tick]
      const attc = rep.series.att_commons[tick]
      for (let i = 0; i < rep.series.pos[tick].length; i++) {
        const sp = screenPos(tick, frac, i)
        if (!sp) continue
        const [x, y] = sp
        const e = energy[i] / 255
        const isSig = role[i] === 1
        const isGov = role[i] === 2
        const r = (child[i] ? 2.1 : 3.1) * (isGov ? 1.15 : 1)
        const bob = Math.sin((t * 0.9 + i * 37) % (Math.PI * 2)) * 0.6
        // gaze first, under the body: a fine ink tick toward the object
        const gz = gaze[i]
        if (gz >= 1 && gz <= nSites) {
          const [tx, ty] = siteScreen(gz - 1)
          const dx = tx - x
          const dy = ty - y
          const L = Math.hypot(dx, dy) || 1
          c.beginPath()
          c.moveTo(x + (dx / L) * (r + 1), y + bob + (dy / L) * (r + 1))
          c.lineTo(x + (dx / L) * (r + 7.5), y + bob + (dy / L) * (r + 7.5))
          c.strokeStyle = "rgba(43,37,28,0.65)"
          c.lineWidth = 1
          c.stroke()
        } else if (gz >= 26) {
          // an eye on the board: gold, the only color attention gets
          c.beginPath()
          c.moveTo(x, y + bob - r - 1)
          c.lineTo(x, y + bob - r - 6.5)
          c.moveTo(x - 2, y + bob - r - 4.5)
          c.lineTo(x, y + bob - r - 6.5)
          c.lineTo(x + 2, y + bob - r - 4.5)
          c.strokeStyle = "rgba(178,128,44,0.95)"
          c.lineWidth = 1.1
          c.stroke()
        } else if (gz === 25) {
          // watching the commons: a bar grounded beneath the body
          c.beginPath()
          c.moveTo(x - 3.2, y + bob + r + 2.5)
          c.lineTo(x + 3.2, y + bob + r + 2.5)
          c.strokeStyle = "rgba(43,37,28,0.8)"
          c.lineWidth = 1.4
          c.stroke()
        }
        // body: ink point. Populace filled, signallers hollow,
        // governors carry a second ring. Energy is the ink's weight.
        const alpha = 0.35 + e * 0.6
        c.beginPath()
        c.arc(x, y + bob, r, 0, 2 * Math.PI)
        if (isSig) {
          c.strokeStyle = `rgba(43,37,28,${alpha})`
          c.lineWidth = 1.3
          c.stroke()
        } else {
          c.fillStyle = `rgba(43,37,28,${alpha})`
          c.fill()
        }
        if (isGov) {
          c.beginPath()
          c.arc(x, y + bob, r + 2.2, 0, 2 * Math.PI)
          c.strokeStyle = `rgba(43,37,28,${0.5 + e * 0.3})`
          c.lineWidth = 0.9
          c.stroke()
        }
        // trust received: a hairline halo ring, wider with credit
        const cred = inc[i] / 255
        if (cred > 0.1) {
          c.beginPath()
          c.arc(x, y + bob, r + 4 + cred * 5, 0, 2 * Math.PI)
          c.strokeStyle = `rgba(43,37,28,${0.12 + cred * 0.2})`
          c.lineWidth = 0.7
          c.stroke()
        }
        void attc
      }

      // progress: the run's clock along the bottom edge
      c.fillStyle = "rgba(43,37,28,0.12)"
      c.fillRect(0, SIDE + BOARD_H - 2.5, SIDE, 2.5)
      c.fillStyle = "rgba(43,37,28,0.55)"
      c.fillRect(0, SIDE + BOARD_H - 2.5, SIDE * (tick / (rep.ticks - 1)), 2.5)
    }

    // ---- charts -------------------------------------------------------------
    const series = (r: Replay, key: string) => r.trace[key] || null
    const smooth = (vals: number[] | null, win: number) => {
      if (!vals) return null
      const out = new Array(vals.length)
      let acc = 0
      for (let i = 0; i < vals.length; i++) {
        acc += vals[i]
        if (i >= win) acc -= vals[i - win]
        out[i] = acc / Math.min(i + 1, win)
      }
      return out
    }
    const drawLine = (
      ctx: CanvasRenderingContext2D, vals: number[] | null, color: string,
      w: number, h: number, dash: number[] | null, maxLen: number, norm: number
    ) => {
      if (!vals) return
      ctx.beginPath()
      if (dash) ctx.setLineDash(dash)
      for (let i = 0; i < vals.length; i++) {
        const x = (i / Math.max(1, maxLen - 1)) * (w - 8) + 4
        const y = h - 4 - Math.max(0, Math.min(1, vals[i] / norm)) * (h - 8)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = color
      ctx.lineWidth = 1.4
      ctx.stroke()
      ctx.setLineDash([])
    }

    const drawCharts = () => {
      if (!rep) return
      const rp = rep
      const tick = Math.min(rep.ticks - 1, Math.floor(t))
      const w = chartA.width
      const h = chartA.height
      const maxLen = rep.ticks
      // A: the scissors. The watched number against the world it stands for.
      caCtx.clearRect(0, 0, w, h)
      caCtx.fillStyle = "#efe9da"
      caCtx.fillRect(0, 0, w, h)
      caCtx.strokeStyle = "rgba(43,37,28,0.35)"
      caCtx.strokeRect(0.5, 0.5, w - 1, h - 1)
      drawLine(caCtx, series(rep, "commons"), "rgba(110,128,92,0.95)", w, h, null, maxLen, 1)
      drawLine(caCtx, series(rep, "ind_provision"), "rgba(178,128,44,0.95)", w, h, null, maxLen, 1)
      if (twin) {
        drawLine(caCtx, series(twin, "commons"), "rgba(110,128,92,0.45)", w, h, [3, 4], maxLen, 1)
        drawLine(caCtx, series(twin, "ind_provision"), "rgba(178,128,44,0.45)", w, h, [3, 4], maxLen, 1)
      }
      caCtx.strokeStyle = "rgba(120,110,95,0.6)"
      caCtx.beginPath()
      const px = (tick / Math.max(1, maxLen - 1)) * (w - 8) + 4
      caCtx.moveTo(px, 0)
      caCtx.lineTo(px, h)
      caCtx.stroke()
      // B: where attention rests, as three self-scaled strips
      cbCtx.clearRect(0, 0, w, h)
      cbCtx.fillStyle = "#efe9da"
      cbCtx.fillRect(0, 0, w, h)
      cbCtx.strokeStyle = "rgba(43,37,28,0.35)"
      cbCtx.strokeRect(0.5, 0.5, w - 1, h - 1)
      const strips: Array<[string, string, string]> = [
        ["attention_commons_populace", "rgba(110,128,92,0.95)", "populace on the commons"],
        ["attention_commons_office", "rgba(43,37,28,0.6)", "the office on the commons"],
        ["attention_indicators_exposed", "rgba(178,128,44,0.95)", "populace on the indicators"],
      ]
      const sh = h / strips.length
      cbCtx.font = `9px ${getComputedStyle(document.body).fontFamily}`
      strips.forEach(([key, color, label], si) => {
        const vals = smooth(series(rp, key), 31)
        const y0 = si * sh
        if (si > 0) {
          cbCtx.strokeStyle = "rgba(43,37,28,0.2)"
          cbCtx.beginPath()
          cbCtx.moveTo(0, y0 + 0.5)
          cbCtx.lineTo(w, y0 + 0.5)
          cbCtx.stroke()
        }
        if (vals) {
          let vmax = 0
          for (const v of vals) if (v > vmax) vmax = v
          if (vmax <= 0) vmax = 1
          cbCtx.beginPath()
          for (let i = 0; i < vals.length; i++) {
            const x = (i / Math.max(1, maxLen - 1)) * (w - 8) + 4
            const y = y0 + sh - 3 - (vals[i] / vmax) * (sh - 12)
            if (i === 0) cbCtx.moveTo(x, y)
            else cbCtx.lineTo(x, y)
          }
          cbCtx.strokeStyle = color
          cbCtx.lineWidth = 1.2
          cbCtx.stroke()
          cbCtx.fillStyle = "rgba(43,37,28,0.7)"
          cbCtx.fillText(`${label}   peak ${vmax.toFixed(3)}`, 6, y0 + 11)
        }
      })
      cbCtx.strokeStyle = "rgba(120,110,95,0.6)"
      cbCtx.beginPath()
      cbCtx.moveTo(px, 0)
      cbCtx.lineTo(px, h)
      cbCtx.stroke()
    }

    const updateData = () => {
      if (!rep) return
      const tick = Math.min(rep.ticks - 1, Math.floor(t))
      el("t").textContent = String(tick)
      el("alive").textContent = String(rep.trace.alive[tick])
      el("commons").textContent = rep.trace.commons[tick].toFixed(3)
      el("prov").textContent = rep.trace.ind_provision
        ? rep.trace.ind_provision[tick].toFixed(3) : "–"
      el("attpop").textContent = rep.trace.attention_commons_populace[tick].toFixed(4)
      el("attoff").textContent = rep.trace.attention_commons_office[tick].toFixed(3)
      el("attind").textContent = rep.trace.attention_indicators_exposed
        ? rep.trace.attention_indicators_exposed[tick].toFixed(3) : "–"
      el("govtrust").textContent = rep.trace.governor_trust
        ? rep.trace.governor_trust[tick].toFixed(3) : "–"
      const gr = rep.trace.gov_repair
      const gd = rep.trace.gov_distribute
      if (gr && gd) {
        let rsum = 0
        let dsum = 0
        for (let i = Math.max(0, tick - 100); i <= tick; i++) {
          rsum += gr[i]
          dsum += gd[i]
        }
        el("effort").textContent = `${rsum} / ${dsum}`
      } else el("effort").textContent = "–"
    }

    const frame = (nowMs: number) => {
      const dt = lastMs ? Math.min(0.1, (nowMs - lastMs) / 1000) : 0
      lastMs = nowMs
      if (!paused && rep) {
        t = Math.min(rep.ticks - 1 + 0.999, t + BASE_TPS * SPEEDS[speedIdx] * dt)
        consumeEvents(Math.floor(t))
        draw()
        drawCharts()
        updateData()
      }
      raf = requestAnimationFrame(frame)
    }

    const loadRun = async (idx: number) => {
      runIdx = ((idx % RUNS.length) + RUNS.length) % RUNS.length
      const meta = RUNS[runIdx]
      el("run").textContent = meta.label
      el("seed").textContent = "loading"
      const [a, b] = await Promise.all([
        fetch(`/research/replays/${meta.file}`)
          .then((r) => r.arrayBuffer())
          .then((x) => decryptReplay(x, pass!)),
        fetch(`/research/replays/${meta.twin}`)
          .then((r) => r.arrayBuffer())
          .then((x) => decryptReplay(x, pass!)),
      ])
      rep = a
      twin = b
      t = 0
      dead = []
      arcs = []
      evAt = { tells: 0, announces: 0, deaths: 0 }
      announcePulse = 0
      buildStatics()
      el("seed").textContent = rep.seed
      el("digest").textContent = rep.config_digest
      el("commit").textContent = rep.commit.slice(0, 12)
      el("ticksTotal").textContent = String(rep.ticks)
    }

    loadRun(0)
    raf = requestAnimationFrame(frame)

    const onPause = () => {
      paused = !paused
      root.querySelector<HTMLElement>("[data-pause]")!.textContent = paused ? "Run" : "Pause"
    }
    const onReplay = () => {
      t = 0
      dead = []
      arcs = []
      evAt = { tells: 0, announces: 0, deaths: 0 }
    }
    const onNext = () => loadRun(runIdx + 1)
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
      mo.disconnect()
    }
  }, [pass])

  if (!pass) {
    return (
      <div className="twv-root">
        <form
          className="max-w-sm"
          onSubmit={async (e) => {
            e.preventDefault()
            const el = (e.currentTarget.elements.namedItem("code") as HTMLInputElement)
            const v = el.value.trim()
            try {
              const buf = await fetch("/research/replays/pm-p1-formation.enc")
                .then((r) => r.arrayBuffer())
              await decryptReplay(buf, v)
              setFailed(false)
              passStore.set(v)
            } catch {
              setFailed(true)
            }
          }}
        >
          <div className="smallcaps text-[11px] text-[var(--site-muted)]">
            The runs are published as ciphertext
          </div>
          <label
            htmlFor="twn-code"
            className="mt-6 block text-[11px] uppercase tracking-[0.32em] text-[var(--site-muted)]"
          >
            Access code
          </label>
          <input
            id="twn-code"
            name="code"
            type="password"
            autoComplete="off"
            className="mt-2 w-full border border-[var(--site-line)] bg-transparent px-3 py-2 text-[var(--site-ink)] outline-none focus:border-[var(--site-accent)]"
          />
          <button
            type="submit"
            className="smallcaps mt-4 rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-5 py-2 text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)]"
          >
            Open
          </button>
          {failed ? (
            <div className="mt-3 text-[12px] text-[var(--site-body)]">
              That code does not decrypt the runs.
            </div>
          ) : null}
        </form>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="twv-root">
      <div className="flex justify-between smallcaps text-[10.5px] mb-2 text-[var(--site-muted)]">
        <span data-k="run">loading</span>
        <span>seed <span data-k="seed">–</span></span>
      </div>
      <canvas
        data-stage
        width={SIDE}
        height={SIDE + BOARD_H}
        className="w-full border border-[var(--site-line)]"
      />
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 smallcaps text-[10px] text-[var(--site-muted)]">
        <span>parcel tone: the owning site&apos;s stock, dust to moss</span>
        <span>filled point: populace</span>
        <span>hollow point: signaller</span>
        <span>double ring: in office</span>
        <span>ink weight: energy</span>
        <span>tick toward a site: gaze</span>
        <span>gold arrow up: gaze at the board</span>
        <span>bar beneath: gaze at the commons</span>
        <span>outer hairline: trust received</span>
        <span>red hatching: hazard</span>
        <span>red cross: a death</span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <canvas data-chart-a width={560} height={120} className="w-full" />
          <div className="mt-1 flex gap-5 smallcaps text-[10px] text-[var(--site-muted)]">
            <span style={{ color: "rgb(178,128,44)" }}>the indicator, provision</span>
            <span style={{ color: "rgb(110,128,92)" }}>the commons</span>
            <span>dashed: the twin arm</span>
          </div>
        </div>
        <div>
          <canvas data-chart-b width={560} height={150} className="w-full" />
          <div className="mt-1 flex gap-5 smallcaps text-[10px] text-[var(--site-muted)]">
            <span>each strip scaled to its own peak</span>
            <span>rolling mean, 31 ticks</span>
          </div>
        </div>
      </div>

      <div className="twv-tables mt-5 grid gap-6 md:grid-cols-3 md:justify-between">
        <table>
          <caption>State</caption>
          <tbody>
            <tr><td>tick</td><td><span data-k="t">0</span> / <span data-k="ticksTotal">–</span></td></tr>
            <tr><td>alive</td><td data-k="alive">–</td></tr>
            <tr><td>commons</td><td data-k="commons">–</td></tr>
            <tr><td>indicator, provision</td><td data-k="prov">–</td></tr>
            <tr><td>trust in the office</td><td data-k="govtrust">–</td></tr>
          </tbody>
        </table>
        <table>
          <caption>Attention</caption>
          <tbody>
            <tr><td>populace on the commons</td><td data-k="attpop">–</td></tr>
            <tr><td>the office on the commons</td><td data-k="attoff">–</td></tr>
            <tr><td>populace on the indicators</td><td data-k="attind">–</td></tr>
            <tr><td>office effort, repair / distribute, last 100</td><td data-k="effort">–</td></tr>
          </tbody>
        </table>
        <table>
          <caption>Registered results, all runs</caption>
          <tbody>
            <tr><td>formation survival</td><td>0.996 vs 0.795</td></tr>
            <tr><td>formation commons</td><td>0.894 vs 0.527</td></tr>
            <tr><td>trust edges</td><td>156 vs 22</td></tr>
            <tr><td>populace attention on the commons</td><td>0.0014</td></tr>
            <tr><td>capture, commons at end, run 9</td><td>0.306 vs 0.893</td></tr>
          </tbody>
        </table>
      </div>

      <div className="twv-tables mt-5">
        <table>
          <caption>Provenance</caption>
          <tbody>
            <tr>
              <td>replayed, not simulated</td>
              <td>exported per tick from registered runs</td>
              <td>fidelity</td>
              <td>instrumented run byte-identical to the frozen engine</td>
              <td>config digest</td>
              <td data-k="digest">–</td>
              <td>commit</td>
              <td data-k="commit">–</td>
            </tr>
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
