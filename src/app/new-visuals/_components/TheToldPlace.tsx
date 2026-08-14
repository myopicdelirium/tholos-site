"use client"

import { useEffect, useRef } from "react"

// The Told Place: one society on one grid. Miniature ports of the
// corpus organs: place memory, testimony, avoidance belief with hop
// attenuation and decay, births, storm seasons. Deterministic: one
// seeded stream, three draws per agent per tick regardless of
// behavior, so any run replays exactly from its seed. The worn trails
// and pause animations are rendering; everything else is mechanism.

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
  size: 100,
  n0: 280,
  nMax: 520,
  nests: [
    [50, 50],
    [20, 22],
    [80, 24],
    [22, 80],
    [79, 77],
  ] as Array<[number, number]>,
  nestR: 3.5,
  jitter: 6.0,
  patches: 12,
  patchStock0: 200,
  patchMax: 260,
  regen: 0.6,
  speed: 0.5,
  wanderTurn: 0.35,
  eatGain: 0.06,
  eatTake: 1.0,
  eatR: 2.0,
  burnMove: 0.0011,
  burnRest: 0.00045,
  hungerAt: 0.55,
  fullAt: 0.92,
  restTicks: 90,
  memSlots: 4,
  memHorizon: 4000,
  rSocial: 4.0,
  tellP: 0.05,
  hopLoss: 0.95,
  stormNest: 0,
  stormR: 22,
  firstOnset: 1200,
  season: 2500,
  stormLen: 200,
  stormDamage: 0.022,
  feltR: 26,
  avoidR: 24,
  believeAt: 0.35,
  dangerDecay: 0.99985,
  birthE: 0.9,
  birthP: 0.1,
  childE: 0.5,
  growTicks: 300,
}

const MODE = { LOITER: 0, GO_FOOD: 1, EAT: 2, GO_HOME: 3, REST: 4, FLEE: 5 }

type World = ReturnType<typeof makeWorld>

function makeWorld(seed: number) {
  const rng = mulberry32(seed)
  const cap = P.nMax
  const w = {
    rng,
    t: 0,
    seed,
    n: P.n0,
    cap,
    x: new Float64Array(cap),
    y: new Float64Array(cap),
    h: new Float64Array(cap),
    energy: new Float64Array(cap),
    alive: new Uint8Array(cap),
    home: new Int32Array(cap),
    age: new Int32Array(cap),
    mode: new Uint8Array(cap),
    modeT: new Int32Array(cap),
    target: new Int32Array(cap),
    danger: new Float64Array(cap),
    memX: new Float64Array(cap * P.memSlots),
    memY: new Float64Array(cap * P.memSlots),
    memSeen: new Int32Array(cap * P.memSlots).fill(-1),
    memSrc: new Int32Array(cap * P.memSlots).fill(-1),
    px: new Float64Array(P.patches),
    py: new Float64Array(P.patches),
    stock: new Float64Array(P.patches),
    graves: [] as Array<[number, number, number, number]>,
    tells: [] as Array<[number, number, number]>,
    births: 0,
    deathsStorm: 0,
    deathsStarve: 0,
    tellFood: 0,
    tellDanger: 0,
    seasonDeaths: [] as number[],
  }
  for (let k = 0; k < P.patches; k++) {
    const nest = P.nests[k % P.nests.length]
    const ang = rng() * 2 * Math.PI
    const rad = 8 + rng() * 14
    w.px[k] = Math.min(96, Math.max(4, nest[0] + rad * Math.cos(ang)))
    w.py[k] = Math.min(96, Math.max(4, nest[1] + rad * Math.sin(ang)))
    w.stock[k] = P.patchStock0
  }
  for (let i = 0; i < P.n0; i++) {
    const nest = P.nests[i % P.nests.length]
    const ang = rng() * 2 * Math.PI
    const rad = Math.sqrt(rng()) * P.jitter
    w.x[i] = nest[0] + rad * Math.cos(ang)
    w.y[i] = nest[1] + rad * Math.sin(ang)
    w.h[i] = rng() * 2 * Math.PI
    w.energy[i] = 0.6 + rng() * 0.3
    w.alive[i] = 1
    w.home[i] = i % P.nests.length
    w.age[i] = P.growTicks + ((i * 37) % 900)
    w.mode[i] = 0
    w.target[i] = -1
  }
  return w
}

function stormIntensity(t: number) {
  if (t < P.firstOnset) return 0
  const u = (t - P.firstOnset) % P.season
  if (u >= P.stormLen) return 0
  if (u < 10) return (u + 1) / 10
  if (u > P.stormLen - 30) return (P.stormLen - u) / 30
  return 1
}
function seasonIndex(t: number) {
  if (t < P.firstOnset) return -1
  return Math.floor((t - P.firstOnset) / P.season)
}

function remember(w: World, i: number, k: number) {
  const base = i * P.memSlots
  let slot = -1
  let oldest = Infinity
  for (let s = 0; s < P.memSlots; s++) {
    const j = base + s
    if (w.memSeen[j] < 0) {
      slot = j
      break
    }
    if (Math.hypot(w.memX[j] - w.px[k], w.memY[j] - w.py[k]) < 1.5) {
      slot = j
      break
    }
    if (w.memSeen[j] < oldest) {
      oldest = w.memSeen[j]
      slot = j
    }
  }
  w.memX[slot] = w.px[k]
  w.memY[slot] = w.py[k]
  w.memSeen[slot] = w.t
  w.memSrc[slot] = -1
}

function bestMemory(w: World, i: number) {
  const base = i * P.memSlots
  const sx = P.nests[P.stormNest][0]
  const sy = P.nests[P.stormNest][1]
  let best = -1
  let bd = Infinity
  for (let s = 0; s < P.memSlots; s++) {
    const j = base + s
    if (w.memSeen[j] < 0 || w.t - w.memSeen[j] > P.memHorizon) continue
    if (
      w.danger[i] >= P.believeAt &&
      Math.hypot(w.memX[j] - sx, w.memY[j] - sy) < P.avoidR
    )
      continue
    const d = Math.hypot(w.memX[j] - w.x[i], w.memY[j] - w.y[i])
    if (d < bd) {
      bd = d
      best = j
    }
  }
  return best
}

function step(w: World) {
  const I = stormIntensity(w.t)
  const sx = P.nests[P.stormNest][0]
  const sy = P.nests[P.stormNest][1]
  w.tells = []
  for (let k = 0; k < P.patches; k++) {
    w.stock[k] = Math.min(P.patchMax, w.stock[k] + P.regen)
  }
  const cells = new Map<number, number[]>()
  for (let i = 0; i < w.cap; i++) {
    if (!w.alive[i]) continue
    const key = ((w.x[i] / 5) | 0) * 64 + ((w.y[i] / 5) | 0)
    let arr = cells.get(key)
    if (!arr) {
      arr = []
      cells.set(key, arr)
    }
    arr.push(i)
  }
  const born: number[] = []
  for (let i = 0; i < w.cap; i++) {
    const r1 = w.rng()
    const r2 = w.rng()
    const r3 = w.rng()
    if (!w.alive[i]) continue
    w.age[i]++
    const grown = w.age[i] >= P.growTicks
    const nest = P.nests[w.home[i]]
    const sd = Math.hypot(w.x[i] - sx, w.y[i] - sy)

    w.danger[i] *= P.dangerDecay
    if (I > 0.3 && sd < P.feltR) w.danger[i] = 1

    if (I > 0.2 && sd < P.stormR + 10) {
      w.mode[i] = MODE.FLEE
    } else if (w.mode[i] === MODE.FLEE) {
      w.mode[i] = MODE.LOITER
    }
    if (w.mode[i] !== MODE.FLEE) {
      if (w.mode[i] === MODE.EAT) {
        const k = w.target[i]
        if (w.energy[i] >= P.fullAt || k < 0 || w.stock[k] < 1) {
          w.mode[i] = w.energy[i] >= P.fullAt ? MODE.GO_HOME : MODE.LOITER
          w.target[i] = -1
        }
      } else if (w.mode[i] === MODE.REST) {
        w.modeT[i]--
        if (w.modeT[i] <= 0) w.mode[i] = MODE.LOITER
      } else if (w.energy[i] < P.hungerAt) {
        if (w.mode[i] !== MODE.GO_FOOD) {
          w.mode[i] = MODE.GO_FOOD
          w.target[i] = -1
        }
      } else if (w.energy[i] >= P.fullAt && w.mode[i] !== MODE.GO_HOME) {
        const hd = Math.hypot(w.x[i] - nest[0], w.y[i] - nest[1])
        if (hd > P.nestR) w.mode[i] = MODE.GO_HOME
        else {
          w.mode[i] = MODE.REST
          w.modeT[i] = (P.restTicks * (0.7 + 0.6 * r3)) | 0
        }
      }
    }

    for (let k = 0; k < P.patches; k++) {
      if (
        Math.hypot(w.px[k] - w.x[i], w.py[k] - w.y[i]) < 6 &&
        w.stock[k] > 5
      )
        remember(w, i, k)
    }

    let dx = 0
    let dy = 0
    let moving = true
    let arrivedFood = -1
    if (w.mode[i] === MODE.FLEE) {
      const d = Math.max(sd, 1e-9)
      dx = (w.x[i] - sx) / d
      dy = (w.y[i] - sy) / d
    } else if (w.mode[i] === MODE.GO_FOOD) {
      let k = -1
      let bd = Infinity
      for (let q = 0; q < P.patches; q++) {
        if (w.stock[q] < 5) continue
        if (
          w.danger[i] >= P.believeAt &&
          Math.hypot(w.px[q] - sx, w.py[q] - sy) < P.avoidR
        )
          continue
        const d = Math.hypot(w.px[q] - w.x[i], w.py[q] - w.y[i])
        if (d < 12 && d < bd) {
          bd = d
          k = q
        }
      }
      if (k >= 0) {
        if (bd < P.eatR) {
          arrivedFood = k
        } else {
          dx = (w.px[k] - w.x[i]) / bd
          dy = (w.py[k] - w.y[i]) / bd
        }
        w.target[i] = k
      } else {
        const m = bestMemory(w, i)
        if (m >= 0) {
          const d = Math.hypot(w.memX[m] - w.x[i], w.memY[m] - w.y[i])
          if (d < 2.5) {
            w.memSeen[m] = -1
          } else {
            dx = (w.memX[m] - w.x[i]) / d
            dy = (w.memY[m] - w.y[i]) / d
          }
        } else {
          if (r1 < 0.1) w.h[i] += (r2 - 0.5) * 2 * Math.PI * P.wanderTurn * 2
          dx = Math.cos(w.h[i])
          dy = Math.sin(w.h[i])
        }
      }
    } else if (w.mode[i] === MODE.GO_HOME) {
      const hd = Math.hypot(w.x[i] - nest[0], w.y[i] - nest[1])
      if (hd < P.nestR) {
        w.mode[i] = MODE.REST
        w.modeT[i] = (P.restTicks * (0.7 + 0.6 * r3)) | 0
        moving = false
      } else {
        dx = (nest[0] - w.x[i]) / hd
        dy = (nest[1] - w.y[i]) / hd
      }
    } else if (w.mode[i] === MODE.REST || w.mode[i] === MODE.EAT) {
      moving = false
    } else {
      const hd = Math.hypot(w.x[i] - nest[0], w.y[i] - nest[1])
      if (hd > 10) {
        dx = (nest[0] - w.x[i]) / hd
        dy = (nest[1] - w.y[i]) / hd
      } else {
        if (r1 < 0.06) w.h[i] += (r2 - 0.5) * 2 * Math.PI * P.wanderTurn
        dx = Math.cos(w.h[i]) * 0.5
        dy = Math.sin(w.h[i]) * 0.5
      }
    }

    if (
      w.mode[i] !== MODE.FLEE &&
      w.danger[i] >= P.believeAt &&
      sd < P.avoidR &&
      sd > 1e-9
    ) {
      dx = (w.x[i] - sx) / sd
      dy = (w.y[i] - sy) / sd
    }

    if (arrivedFood >= 0) {
      w.mode[i] = MODE.EAT
      moving = false
    }
    if (w.mode[i] === MODE.EAT && w.target[i] >= 0 && w.stock[w.target[i]] >= 1) {
      w.energy[i] = Math.min(1, w.energy[i] + P.eatGain)
      w.stock[w.target[i]] -= P.eatTake
    }

    if (moving) {
      const nm = Math.hypot(dx, dy) || 1
      const v = P.speed * (grown ? 1 : 0.7)
      w.x[i] = Math.min(P.size, Math.max(0, w.x[i] + (dx / nm) * v))
      w.y[i] = Math.min(P.size, Math.max(0, w.y[i] + (dy / nm) * v))
      w.h[i] = Math.atan2(dy, dx)
      w.energy[i] -= P.burnMove
    } else {
      w.energy[i] -= P.burnRest
    }

    if (I > 0 && sd < P.stormR) {
      w.energy[i] -= P.stormDamage * I
      if (w.energy[i] <= 0) {
        w.alive[i] = 0
        w.n--
        w.graves.push([w.x[i], w.y[i], w.t, 1])
        w.deathsStorm++
        const si = seasonIndex(w.t)
        while (w.seasonDeaths.length <= si) w.seasonDeaths.push(0)
        w.seasonDeaths[si]++
        continue
      }
    }
    if (w.energy[i] <= 0) {
      w.alive[i] = 0
      w.n--
      w.graves.push([w.x[i], w.y[i], w.t, 0])
      w.deathsStarve++
      continue
    }

    if (r1 < P.tellP) {
      const key = ((w.x[i] / 5) | 0) * 64 + ((w.y[i] / 5) | 0)
      const arr = cells.get(key)
      if (arr && arr.length > 1) {
        const j = arr[(r2 * arr.length) | 0]
        if (
          j !== i &&
          w.alive[j] &&
          Math.hypot(w.x[j] - w.x[i], w.y[j] - w.y[i]) <= P.rSocial
        ) {
          const m = bestMemory(w, i)
          if (m >= 0) {
            const bj = j * P.memSlots
            let slot = -1
            let oldest = Infinity
            let dup = false
            for (let s = 0; s < P.memSlots; s++) {
              const q = bj + s
              if (
                w.memSeen[q] >= 0 &&
                Math.hypot(w.memX[q] - w.memX[m], w.memY[q] - w.memY[m]) < 1.5
              ) {
                dup = true
                break
              }
              if (w.memSeen[q] < 0) {
                if (slot < 0) slot = q
              } else if (w.memSeen[q] < oldest) {
                oldest = w.memSeen[q]
                if (slot < 0 || w.memSeen[slot] >= 0) slot = q
              }
            }
            if (!dup && slot >= 0) {
              w.memX[slot] = w.memX[m]
              w.memY[slot] = w.memY[m]
              w.memSeen[slot] = w.memSeen[m]
              w.memSrc[slot] = i
              w.tellFood++
              w.tells.push([i, j, 0])
            }
          }
          if (w.danger[i] >= P.believeAt && w.danger[j] < w.danger[i] * P.hopLoss) {
            w.danger[j] = w.danger[i] * P.hopLoss
            w.tellDanger++
            w.tells.push([i, j, 1])
          }
        }
      }
    }

    if (
      w.mode[i] === MODE.REST &&
      grown &&
      w.energy[i] > P.birthE &&
      w.n < P.nMax &&
      r3 < P.birthP / P.restTicks
    ) {
      born.push(i)
    }
  }
  for (const parent of born) {
    let slot = -1
    for (let q = 0; q < w.cap; q++)
      if (!w.alive[q]) {
        slot = q
        break
      }
    if (slot < 0) break
    w.alive[slot] = 1
    w.n++
    w.x[slot] = w.x[parent]
    w.y[slot] = w.y[parent]
    w.h[slot] = w.h[parent]
    w.energy[slot] = P.childE
    w.energy[parent] -= 0.25
    w.home[slot] = w.home[parent]
    w.age[slot] = 0
    w.mode[slot] = MODE.LOITER
    w.target[slot] = -1
    w.danger[slot] = 0
    const b = slot * P.memSlots
    for (let s = 0; s < P.memSlots; s++) w.memSeen[b + s] = -1
    w.graves.length = Math.min(w.graves.length, 600)
    w.births++
  }
  w.t++
}

const SPEEDS = [1, 4, 16]
const SCALE = 10
const SIDE = 1000

export default function TheToldPlace() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const stage = root.querySelector<HTMLCanvasElement>("canvas[data-stage]")!
    const chart = root.querySelector<HTMLCanvasElement>("canvas[data-chart]")!
    const sctx = stage.getContext("2d")!
    const cctx = chart.getContext("2d")!
    const trail = document.createElement("canvas")
    trail.width = SIDE
    trail.height = SIDE
    const tctx = trail.getContext("2d")!
    const ground = document.createElement("canvas")
    ground.width = SIDE
    ground.height = SIDE
    const gctx = ground.getContext("2d")!
    // dwellings: rendering derived from rest statistics, no mechanism.
    // cell size 0.8 world units; a footprint forms after enough rest
    // ticks accumulate in a cell and decays to ruin when unused.
    const CELL = 0.8
    const dwell = new Map<number, { level: number; last: number }>()

    const buildGround = (s: number) => {
      const rr = mulberry32((s ^ 0x9e3779b9) >>> 0)
      gctx.clearRect(0, 0, SIDE, SIDE)
      gctx.fillStyle = "#2f4a2a"
      gctx.fillRect(0, 0, SIDE, SIDE)
      // landcover mosaic: irregular stands of forest, meadow, dry grass
      for (let b = 0; b < 26; b++) {
        const bx = rr() * SIDE
        const by = rr() * SIDE
        const br = 40 + rr() * 110
        const kind = rr()
        const q1 = rr() * Math.PI * 2
        const q2 = rr() * Math.PI * 2
        gctx.beginPath()
        for (let a = 0; a <= 40; a++) {
          const th = (a / 40) * Math.PI * 2
          const rad =
            br *
            (1 +
              0.35 * Math.sin(2 * th + q1) +
              0.22 * Math.sin(5 * th + q2) +
              0.12 * Math.sin(9 * th + q1 + q2))
          const x = bx + rad * Math.cos(th)
          const y = by + rad * Math.sin(th)
          if (a === 0) gctx.moveTo(x, y)
          else gctx.lineTo(x, y)
        }
        gctx.closePath()
        gctx.fillStyle =
          kind < 0.4
            ? "rgba(26,48,24,0.28)"
            : kind < 0.72
              ? "rgba(116,148,74,0.14)"
              : "rgba(148,150,82,0.11)"
        gctx.fill()
      }
      // canopy: clumped crowns that cast shadow, so cover reads as trees
      for (let cl = 0; cl < 620; cl++) {
        const ccx = rr() * SIDE
        const ccy = rr() * SIDE
        const crowd = 6 + Math.floor(rr() * 13)
        const tone = rr()
        for (let m = 0; m < crowd; m++) {
          const x = ccx + (rr() + rr() - 1) * 10
          const y = ccy + (rr() + rr() - 1) * 10
          const sz = 1.4 + rr() * 2.2
          gctx.fillStyle = "rgba(14,26,14,0.3)"
          gctx.beginPath()
          gctx.arc(x + 0.9, y + 1.1, sz * 0.62, 0, 2 * Math.PI)
          gctx.fill()
          gctx.fillStyle =
            tone < 0.5
              ? `rgba(74,112,54,${0.3 + rr() * 0.14})`
              : tone < 0.82
                ? `rgba(54,88,44,${0.32 + rr() * 0.14})`
                : `rgba(104,132,62,${0.26 + rr() * 0.12})`
          gctx.beginPath()
          gctx.arc(x, y, sz * 0.58, 0, 2 * Math.PI)
          gctx.fill()
        }
      }
      // loose scrub between the stands
      for (let k = 0; k < 3600; k++) {
        const x = rr() * SIDE
        const y = rr() * SIDE
        const sz = 0.7 + rr() * 1.4
        const g = rr()
        gctx.fillStyle =
          g < 0.6 ? "rgba(112,140,74,0.18)" : "rgba(148,152,84,0.13)"
        gctx.fillRect(x, y, sz, sz)
      }
      // the river: enters northwest, strings three settlements, leaves southeast
      const RIV: Array<[number, number]> = [
        [-60, 0.16 * SIDE],
        [P.nests[1][0] * SCALE, P.nests[1][1] * SCALE],
        [P.nests[0][0] * SCALE, P.nests[0][1] * SCALE],
        [P.nests[4][0] * SCALE, P.nests[4][1] * SCALE],
        [SIDE + 60, 0.94 * SIDE],
      ]
      const crv = (a: number, b: number, c: number, d: number, u: number) =>
        0.5 *
        (2 * b +
          (-a + c) * u +
          (2 * a - 5 * b + 4 * c - d) * u * u +
          (-a + 3 * b - 3 * c + d) * u * u * u)
      const rp: Array<[number, number]> = []
      for (let i = 0; i < RIV.length - 1; i++) {
        const p0 = RIV[Math.max(0, i - 1)]
        const p1 = RIV[i]
        const p2 = RIV[i + 1]
        const p3 = RIV[Math.min(RIV.length - 1, i + 2)]
        for (let a = 0; a < 44; a++) {
          const u = a / 44
          rp.push([
            crv(p0[0], p1[0], p2[0], p3[0], u),
            crv(p0[1], p1[1], p2[1], p3[1], u),
          ])
        }
      }
      const mph = rr() * Math.PI * 2
      const mp2 = rr() * Math.PI * 2
      const rpts = rp.map(([x, y], i) => {
        const j = Math.min(rp.length - 1, i + 1)
        const dx = rp[j][0] - x
        const dy = rp[j][1] - y
        const L = Math.hypot(dx, dy) || 1
        const off = 13 * Math.sin(i * 0.055 + mph) + 5 * Math.sin(i * 0.16 + mp2)
        return [x - (dy / L) * off, y + (dx / L) * off] as [number, number]
      })
      // riparian growth hugging the banks
      for (const [x, y] of rpts) {
        for (let d = 0; d < 3; d++) {
          const th = rr() * Math.PI * 2
          const rad = 8 + rr() * rr() * 22
          gctx.fillStyle = `rgba(64,110,52,${Math.max(0.06, 0.4 - rad * 0.012)})`
          const sz = 1.2 + rr() * 2
          gctx.fillRect(x + rad * Math.cos(th), y + rad * Math.sin(th), sz, sz)
        }
      }
      gctx.lineJoin = "round"
      gctx.lineCap = "round"
      for (let i = 1; i < rpts.length; i++) {
        gctx.strokeStyle = "#2a5d84"
        gctx.lineWidth = 7.5 + 6 * (i / rpts.length)
        gctx.beginPath()
        gctx.moveTo(rpts[i - 1][0], rpts[i - 1][1])
        gctx.lineTo(rpts[i][0], rpts[i][1])
        gctx.stroke()
      }
      gctx.strokeStyle = "rgba(88,150,196,0.5)"
      gctx.lineWidth = 3
      gctx.beginPath()
      for (let i = 0; i < rpts.length; i++) {
        if (i === 0) gctx.moveTo(rpts[i][0], rpts[i][1])
        else gctx.lineTo(rpts[i][0], rpts[i][1])
      }
      gctx.stroke()
      // each nest is a waterhole with greenery, irregular by seed
      for (let k = 0; k < P.nests.length; k++) {
        const cx = P.nests[k][0] * SCALE
        const cy = P.nests[k][1] * SCALE
        const base = P.nestR * SCALE * 1.15
        const p1 = rr() * Math.PI * 2
        const p2 = rr() * Math.PI * 2
        const p3 = rr() * Math.PI * 2
        const shore = (th: number) =>
          base *
          (1 +
            0.28 * Math.sin(3 * th + p1) +
            0.16 * Math.sin(5 * th + p2) +
            0.1 * Math.sin(7 * th + p3))
        // greenery halo first, densest at the shore
        for (let d = 0; d < 340; d++) {
          const th = rr() * Math.PI * 2
          const rad = shore(th) + rr() * rr() * 46
          gctx.fillStyle = `rgba(64,110,52,${0.5 - 0.4 * Math.min(1, (rad - base) / 50)})`
          const sz = 1.2 + rr() * 2.4
          gctx.fillRect(cx + rad * Math.cos(th), cy + rad * Math.sin(th), sz, sz)
        }
        // water
        gctx.beginPath()
        for (let a = 0; a <= 64; a++) {
          const th = (a / 64) * Math.PI * 2
          const rad = shore(th)
          const x = cx + rad * Math.cos(th)
          const y = cy + rad * Math.sin(th)
          if (a === 0) gctx.moveTo(x, y)
          else gctx.lineTo(x, y)
        }
        gctx.closePath()
        gctx.fillStyle = "#2a5d84"
        gctx.fill()
        gctx.beginPath()
        for (let a = 0; a <= 48; a++) {
          const th = (a / 48) * Math.PI * 2
          const rad = shore(th) * 0.55
          const x = cx - base * 0.1 + rad * Math.cos(th)
          const y = cy - base * 0.12 + rad * Math.sin(th)
          if (a === 0) gctx.moveTo(x, y)
          else gctx.lineTo(x, y)
        }
        gctx.closePath()
        gctx.fillStyle = "rgba(88,150,196,0.75)"
        gctx.fill()
      }
    }
    const el = (k: string) => root.querySelector<HTMLElement>(`[data-k="${k}"]`)!
    const seasonRow = root.querySelector<HTMLElement>("[data-seasons]")!

    let PAL = { accent: "#f6b545", cb: "#f0a58c", muted: "#cfe0d2" }
    const readPalette = () => {
      const cs = getComputedStyle(root)
      const g = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb
      PAL = {
        accent: g("--site-accent", PAL.accent),
        cb: g("--twv-cb", PAL.cb),
        muted: g("--site-muted", PAL.muted),
      }
    }
    readPalette()
    const mo = new MutationObserver(readPalette)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    let seed = 1
    let w = makeWorld(seed)
    let edges: Array<{ x1: number; y1: number; x2: number; y2: number; kind: number; ttl: number }> = []
    let popTrace: Array<[number, number]> = []
    let selected = -1
    const histLen = 200
    const hist = new Float32Array(P.nMax * histLen * 2)
    let histAt = 0
    let paused = false
    let speedIdx = 0
    let tickAcc = 0
    let lastMs = 0
    let raf = 0

    const reset = (s: number) => {
      seed = s
      w = makeWorld(seed)
      edges = []
      popTrace = []
      selected = -1
      tickAcc = 0
      tctx.clearRect(0, 0, SIDE, SIDE)
      dwell.clear()
      buildGround(s)
      el("seed").textContent = String(seed)
    }

    const believers = () => {
      let b = 0
      for (let i = 0; i < w.cap; i++)
        if (w.alive[i] && w.danger[i] >= P.believeAt) b++
      return b
    }

    const tickOnce = () => {
      step(w)
      for (const [i, j, kind] of w.tells) {
        edges.push({
          x1: w.x[i] * SCALE,
          y1: w.y[i] * SCALE,
          x2: w.x[j] * SCALE,
          y2: w.y[j] * SCALE,
          kind,
          ttl: 30,
        })
      }
      if (w.t % 2 === 0) {
        const at = (histAt % histLen) * 2
        for (let i = 0; i < w.cap; i++) {
          hist[i * histLen * 2 + at] = w.x[i]
          hist[i * histLen * 2 + at + 1] = w.y[i]
        }
        histAt++
      }
      if (w.t % 8 === 0) popTrace.push([w.n, believers()])
      if (popTrace.length > 2400) popTrace.shift()
      // roads wear in only under purposeful travel; loitering leaves
      // no mark, so villages read as lanes and junctions, not glow
      tctx.fillStyle = "rgba(196,182,148,0.055)"
      for (let i = 0; i < w.cap; i++) {
        if (!w.alive[i]) continue
        const m = w.mode[i]
        if (m !== MODE.GO_FOOD && m !== MODE.GO_HOME) continue
        tctx.fillRect(w.x[i] * SCALE - 0.6, w.y[i] * SCALE - 0.6, 1.2, 1.2)
      }
      // roads fade by disuse, per tick so pacing cannot change them
      tctx.save()
      tctx.globalCompositeOperation = "destination-out"
      tctx.fillStyle = "rgba(0,0,0,0.004)"
      tctx.fillRect(0, 0, SIDE, SIDE)
      tctx.restore()
      for (const e of edges) e.ttl--
      // dwellings accrue where agents rest
      for (let i = 0; i < w.cap; i++) {
        if (!w.alive[i] || w.mode[i] !== MODE.REST) continue
        const key = ((w.x[i] / CELL) | 0) * 4096 + ((w.y[i] / CELL) | 0)
        const d = dwell.get(key)
        if (d) {
          d.level = Math.min(4000, d.level + 1)
          d.last = w.t
        } else {
          dwell.set(key, { level: 1, last: w.t })
        }
      }
    }

    const paceFor = () => 12 * SPEEDS[speedIdx]

    const draw = () => {
      const c = sctx
      const I = stormIntensity(w.t)
      c.drawImage(ground, 0, 0)
      // fields: parcel quilts at the patches, fill tracks stock
      for (let k = 0; k < P.patches; k++) {
        const x = w.px[k] * SCALE
        const y = w.py[k] * SCALE
        const frac = w.stock[k] / P.patchMax
        for (let r = 0; r < 2; r++) {
          for (let q = 0; q < 3; q++) {
            const px = x - 14 + q * 10
            const py = y - 9 + r * 10
            const on = frac > (r * 3 + q + 0.5) / 6
            c.fillStyle = on
              ? "rgba(179,162,118,0.34)"
              : "rgba(179,162,118,0.08)"
            c.fillRect(px, py, 8, 7)
          }
        }
      }
      // roads
      c.drawImage(trail, 0, 0)
      // dwellings and ruins
      for (const [key, d] of dwell) {
        if (d.level < 240) continue
        const age = w.t - d.last
        if (age > 12000) {
          dwell.delete(key)
          continue
        }
        const cx = ((key / 4096) | 0) * CELL * SCALE + 4
        const cy = (key % 4096) * CELL * SCALE + 4
        const sz = 4 + Math.min(2.5, d.level / 1600)
        const ruin = age > 3000
        const alpha = ruin ? Math.max(0.12, 0.55 - (age - 3000) / 16000) : 0.85
        c.fillStyle = `rgba(180,168,146,${alpha})`
        c.fillRect(cx - sz / 2, cy - sz / 2, sz, sz * 0.78)
        if (!ruin) {
          c.strokeStyle = "rgba(22,36,22,0.55)"
          c.lineWidth = 0.6
          c.strokeRect(cx - sz / 2, cy - sz / 2, sz, sz * 0.78)
        }
      }
      // graves
      c.strokeStyle = "rgba(163,146,126,0.4)"
      c.lineWidth = 0.8
      const g0 = Math.max(0, w.graves.length - 600)
      for (let gi = g0; gi < w.graves.length; gi++) {
        const [gx, gy] = w.graves[gi]
        const x = gx * SCALE
        const y = gy * SCALE
        c.beginPath()
        c.moveTo(x - 1.8, y - 1.8)
        c.lineTo(x + 1.8, y + 1.8)
        c.moveTo(x + 1.8, y - 1.8)
        c.lineTo(x - 1.8, y + 1.8)
        c.stroke()
      }
      // a steady warm point where someone is home; no cycle, no flash
      for (let i = 0; i < w.cap; i++) {
        if (!w.alive[i] || w.mode[i] !== MODE.REST) continue
        const x = w.x[i] * SCALE
        const y = w.y[i] * SCALE
        c.fillStyle = "rgba(244,196,110,0.55)"
        c.fillRect(x - 0.9, y - 0.9, 1.8, 1.8)
      }
      // storm
      if (I > 0) {
        const x = P.nests[P.stormNest][0] * SCALE
        const y = P.nests[P.stormNest][1] * SCALE
        const R = P.stormR * SCALE
        const gr = c.createRadialGradient(x, y, R * 0.15, x, y, R)
        gr.addColorStop(0, `rgba(194,58,43,${0.32 * I})`)
        gr.addColorStop(1, `rgba(194,58,43,${0.05 * I})`)
        c.beginPath()
        c.arc(x, y, R, 0, 2 * Math.PI)
        c.fillStyle = gr
        c.fill()
        c.beginPath()
        c.arc(x, y, R, 0, 2 * Math.PI)
        c.strokeStyle = `rgba(194,58,43,${0.25 + 0.5 * I})`
        c.lineWidth = 1.6
        c.stroke()
      }
      // testimony
      for (const e of edges) {
        const a = Math.max(0, e.ttl / 30)
        c.beginPath()
        c.moveTo(e.x1, e.y1)
        c.lineTo(e.x2, e.y2)
        c.strokeStyle =
          e.kind === 1
            ? `rgba(208,96,78,${0.7 * a})`
            : `rgba(214,208,192,${0.28 * a})`
        c.lineWidth = e.kind === 1 ? 1.1 : 0.6
        c.stroke()
      }
      edges = edges.filter((e) => e.ttl > 0)
      // the living, as motes; the resting are indoors
      for (let i = 0; i < w.cap; i++) {
        if (!w.alive[i] || w.mode[i] === MODE.REST) continue
        const x = w.x[i] * SCALE
        const y = w.y[i] * SCALE
        const child = w.age[i] < P.growTicks
        c.beginPath()
        c.arc(x, y, child ? 0.8 : 1.15, 0, 2 * Math.PI)
        c.fillStyle = "rgba(224,218,200,0.9)"
        c.fill()
        if (w.mode[i] === MODE.EAT) {
          c.fillStyle = "rgba(236,158,64,0.6)"
          c.fillRect(x - 0.8, y - 0.8, 1.6, 1.6)
        }
      }
      // selected life
      if (selected >= 0 && w.alive[selected]) {
        const i = selected
        const x = w.x[i] * SCALE
        const y = w.y[i] * SCALE
        c.beginPath()
        const nSamp = Math.min(histAt, histLen)
        for (let s = 0; s < nSamp; s++) {
          const at = ((histAt - 1 - s + histLen) % histLen) * 2
          const hx = hist[i * histLen * 2 + at] * SCALE
          const hy = hist[i * histLen * 2 + at + 1] * SCALE
          if (s === 0) c.moveTo(hx, hy)
          else c.lineTo(hx, hy)
        }
        c.strokeStyle = "rgba(236,158,64,0.65)"
        c.lineWidth = 1.2
        c.stroke()
        c.beginPath()
        c.arc(x, y, 5.4, 0, 2 * Math.PI)
        c.strokeStyle = "#ec9e40"
        c.lineWidth = 1.6
        c.stroke()
        const base = i * P.memSlots
        for (let s = 0; s < P.memSlots; s++) {
          if (w.memSeen[base + s] < 0) continue
          c.beginPath()
          c.arc(w.memX[base + s] * SCALE, w.memY[base + s] * SCALE, 7, 0, 2 * Math.PI)
          c.strokeStyle = "rgba(236,158,64,0.45)"
          c.lineWidth = 1
          c.stroke()
        }
      } else if (selected >= 0) {
        selected = -1
      }
    }

    const drawChart = () => {
      const c = cctx
      const W = chart.width
      const H = chart.height
      c.clearRect(0, 0, W, H)
      c.strokeStyle = "rgba(133,118,101,0.35)"
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(0, H - 14)
      c.lineTo(W, H - 14)
      c.stroke()
      const maxN = 2400
      const yFor = (v: number) => H - 14 - (v / P.nMax) * (H - 24)
      // storm season markers across the window
      const t0 = w.t - popTrace.length * 8
      for (let si = 0; ; si++) {
        const ts = P.firstOnset + si * P.season
        if (ts > w.t) break
        if (ts < t0) continue
        const x = ((ts - t0) / 8 / maxN) * W
        c.strokeStyle = "rgba(194,58,43,0.5)"
        c.beginPath()
        c.moveTo(x, 8)
        c.lineTo(x, H - 14)
        c.stroke()
      }
      for (let s = 0; s < 2; s++) {
        c.strokeStyle = s === 0 ? "rgba(214,208,192,0.9)" : PAL.cb
        c.lineWidth = 1.4
        c.beginPath()
        for (let k = 0; k < popTrace.length; k++) {
          const x = (k / maxN) * W
          const y = yFor(popTrace[k][s])
          if (k === 0) c.moveTo(x, y)
          else c.lineTo(x, y)
        }
        c.stroke()
      }
      c.fillStyle = PAL.muted
      c.font = "10px ui-monospace, Menlo, monospace"
      c.fillText("population", 6, 12)
      c.fillStyle = PAL.cb
      c.fillText("believers", 76, 12)
    }

    const updateData = () => {
      el("t").textContent = String(w.t)
      el("season").textContent = String(seasonIndex(w.t) + 1)
      el("i").textContent = stormIntensity(w.t).toFixed(2)
      el("pop").textContent = String(w.n)
      el("births").textContent = String(w.births)
      el("dstorm").textContent = String(w.deathsStorm)
      el("dstarve").textContent = String(w.deathsStarve)
      el("bel").textContent = String(believers())
      el("tf").textContent = String(w.tellFood)
      el("td").textContent = String(w.tellDanger)
      let stock = 0
      for (let k = 0; k < P.patches; k++) stock += w.stock[k]
      el("stock").textContent = String(Math.round(stock))
      const sd = w.seasonDeaths.slice()
      const si = seasonIndex(w.t)
      while (sd.length <= si) sd.push(0)
      seasonRow.textContent = sd.length ? sd.join(" · ") : "–"
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
        updateData()
        draw()
        drawChart()
      }
      raf = requestAnimationFrame(frame)
    }

    const onClick = (ev: MouseEvent) => {
      const r = stage.getBoundingClientRect()
      const mx = ((ev.clientX - r.left) / r.width) * SIDE
      const my = ((ev.clientY - r.top) / r.height) * SIDE
      let best = -1
      let bd = 14
      for (let i = 0; i < w.cap; i++) {
        if (!w.alive[i]) continue
        const d = Math.hypot(w.x[i] * SCALE - mx, w.y[i] * SCALE - my)
        if (d < bd) {
          bd = d
          best = i
        }
      }
      selected = best
    }
    stage.addEventListener("click", onClick)

    const bPause = root.querySelector<HTMLButtonElement>("[data-pause]")!
    const bSeed = root.querySelector<HTMLButtonElement>("[data-newseed]")!
    const bSpeed = root.querySelector<HTMLButtonElement>("[data-speed]")!
    const cover = root.querySelector<HTMLElement>("[data-cover]")!
    const bPlay = root.querySelector<HTMLButtonElement>("[data-play]")!
    const onPause = () => {
      paused = !paused
      bPause.textContent = paused ? "Run" : "Pause"
    }
    const onSeed = () => {
      reset(1 + Math.floor(Math.random() * 9999))
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
    updateData()
    draw()
    drawChart()
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
      stage.removeEventListener("click", onClick)
      bPause.removeEventListener("click", onPause)
      bSeed.removeEventListener("click", onSeed)
      bSpeed.removeEventListener("click", onSpeed)
      bPlay.removeEventListener("click", onPlay)
    }
  }, [])

  return (
    <div ref={rootRef} className="twv-root">
      <div className="relative">
        <canvas
          data-stage
          width={SIDE}
          height={SIDE}
          aria-label="One simulated settlement: nests, food patches, worn trails, storm seasons, graves, and testimony passing between agents"
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
      <canvas
        data-chart
        width={1140}
        height={90}
        className="mt-2"
        aria-label="Population and count of agents holding the danger belief over time"
      />

      <div className="twv-tables mono mt-5 grid gap-6 md:grid-cols-3 md:justify-between">
        <table>
          <caption>state</caption>
          <tbody>
            <tr><td>t</td><td data-k="t">0</td></tr>
            <tr><td>season</td><td data-k="season">0</td></tr>
            <tr><td>storm intensity</td><td data-k="i">0.00</td></tr>
            <tr><td>population</td><td data-k="pop">280</td></tr>
            <tr><td>food stock</td><td data-k="stock">0</td></tr>
            <tr><td>seed</td><td data-k="seed">1</td></tr>
          </tbody>
        </table>

        <table>
          <caption>ledger</caption>
          <tbody>
            <tr><td>births</td><td data-k="births">0</td></tr>
            <tr><td>deaths, storm</td><td data-k="dstorm" className="twv-cb">0</td></tr>
            <tr><td>deaths, starvation</td><td data-k="dstarve">0</td></tr>
            <tr><td>believers</td><td data-k="bel" className="twv-cb">0</td></tr>
            <tr><td>tells, food</td><td data-k="tf">0</td></tr>
            <tr><td>tells, danger</td><td data-k="td" className="twv-cb">0</td></tr>
          </tbody>
        </table>

        <table>
          <caption>storm deaths by season</caption>
          <tbody>
            <tr><td data-seasons className="twv-cb">&ndash;</td></tr>
          </tbody>
        </table>
      </div>

      <div className="twv-tables mono mt-5">
        <table>
          <caption>parameters</caption>
          <tbody>
            <tr>
              <td>n0</td><td>280</td>
              <td>nests</td><td>5</td>
              <td>patches</td><td>12</td>
              <td>regen / tick</td><td>0.6</td>
              <td>mem slots</td><td>4</td>
              <td>mem horizon</td><td>4000</td>
              <td>tell p</td><td>0.05</td>
              <td>hop loss</td><td>0.95</td>
            </tr>
            <tr>
              <td>storm onset</td><td>1200</td>
              <td>season</td><td>2500</td>
              <td>length</td><td>200</td>
              <td>radius</td><td>22</td>
              <td>damage / tick</td><td>0.022</td>
              <td>felt radius</td><td>26</td>
              <td>avoid radius</td><td>24</td>
              <td>belief decay</td><td>0.99985</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-[var(--site-line)] pt-4">
        <button data-pause className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-4 py-2 text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">Pause</button>
        <button data-newseed className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-4 py-2 text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">New seed</button>
        <button data-speed className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-4 py-2 text-[10px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">Speed 1&times;</button>
      </div>
    </div>
  )
}
