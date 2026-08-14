"use client"

import { useEffect, useRef } from "react"

// The Told Place, severed: two societies from one seed, one law. In
// world B the danger channel of testimony is amputated: nobody can
// warn anybody. Belief is minted only by witnessing a death within
// sight; a warning heard is believed in full, so in A the story can
// outlive its witnesses. Deterministic: one seeded stream per world,
// three draws per agent per tick regardless of behavior, so the
// worlds are numerically identical until the first warning changes
// what somebody does.

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
  stormNest: 0,
  stormR: 22,
  firstOnset: 1200,
  season: 2500,
  stormLen: 200,
  stormDamage: 0.022,
  witnessR: 12,
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

function makeWorld(seed: number, tellDangerOn: boolean) {
  const rng = mulberry32(seed)
  const cap = P.nMax
  const w = {
    rng,
    t: 0,
    seed,
    tellDangerOn,
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
  const deathX: number[] = []
  const deathY: number[] = []
  for (let i = 0; i < w.cap; i++) {
    const r1 = w.rng()
    const r2 = w.rng()
    const r3 = w.rng()
    if (!w.alive[i]) continue
    w.age[i]++
    const grown = w.age[i] >= P.growTicks
    const nest = P.nests[w.home[i]]
    const sd = Math.hypot(w.x[i] - sx, w.y[i] - sy)

    // unconfirmed belief fades; belief is minted by witnessing death
    w.danger[i] *= P.dangerDecay

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
        deathX.push(w.x[i])
        deathY.push(w.y[i])
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
          if (w.tellDangerOn && w.danger[i] >= P.believeAt && w.danger[j] < 0.95) {
            // a warning heard is believed in full: retelling resets
            // the clock, so the story can outlive its witnesses
            w.danger[j] = 1
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
  // the witnesses: seeing a storm death within sight mints belief
  if (deathX.length) {
    for (let i = 0; i < w.cap; i++) {
      if (!w.alive[i]) continue
      for (let d = 0; d < deathX.length; d++) {
        if (Math.hypot(w.x[i] - deathX[d], w.y[i] - deathY[d]) < P.witnessR) {
          w.danger[i] = 1
          break
        }
      }
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

const TINTS = ["#d6d0c0", "#ccd6c4", "#d8ccc9", "#c7d1d8", "#d9d2b6"]
const SPEEDS = [1, 2, 4]
const PLATE = 520
const SC = PLATE / 100
const GUT = 100
const WIDE = PLATE * 2 + GUT

export default function SeveredToldPlace() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const stage = root.querySelector<HTMLCanvasElement>("canvas[data-stage]")!
    const chartD = root.querySelector<HTMLCanvasElement>("canvas[data-chart-d]")!
    const chartB = root.querySelector<HTMLCanvasElement>("canvas[data-chart-b]")!
    const sctx = stage.getContext("2d")!
    const dctx = chartD.getContext("2d")!
    const bctx = chartB.getContext("2d")!
    const trailA = document.createElement("canvas")
    const trailB = document.createElement("canvas")
    trailA.width = trailA.height = PLATE
    trailB.width = trailB.height = PLATE
    const taCtx = trailA.getContext("2d")!
    const tbCtx = trailB.getContext("2d")!
    const el = (k: string) => root.querySelector<HTMLElement>(`[data-k="${k}"]`)!

    let PAL = { cb: "#f0a58c", muted: "#cfe0d2" }
    const readPalette = () => {
      const cs = getComputedStyle(root)
      const g = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb
      PAL = { cb: g("--twv-cb", PAL.cb), muted: g("--site-muted", PAL.muted) }
    }
    readPalette()
    const mo = new MutationObserver(readPalette)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    let seed = 1
    let A = makeWorld(seed, true)
    let B = makeWorld(seed, false)
    let divT = -1
    let firstWarn = -1
    let edgesA: Array<{ x1: number; y1: number; x2: number; y2: number; kind: number; ttl: number }> = []
    let edgesB: typeof edgesA = []
    let deathTrace: Array<[number, number]> = []
    let belTrace: Array<[number, number]> = []
    let paused = false
    let speedIdx = 0
    let tickAcc = 0
    let lastMs = 0
    let raf = 0

    const reset = (s: number) => {
      seed = s
      A = makeWorld(seed, true)
      B = makeWorld(seed, false)
      divT = -1
      firstWarn = -1
      edgesA = []
      edgesB = []
      deathTrace = []
      belTrace = []
      tickAcc = 0
      taCtx.clearRect(0, 0, PLATE, PLATE)
      tbCtx.clearRect(0, 0, PLATE, PLATE)
      el("seed").textContent = String(seed)
    }

    const believers = (w: World) => {
      let b = 0
      for (let i = 0; i < w.cap; i++)
        if (w.alive[i] && w.danger[i] >= P.believeAt) b++
      return b
    }

    const collectEdges = (w: World, list: typeof edgesA, ox: number) => {
      for (const [i, j, kind] of w.tells) {
        list.push({
          x1: ox + w.x[i] * SC,
          y1: w.y[i] * SC,
          x2: ox + w.x[j] * SC,
          y2: w.y[j] * SC,
          kind,
          ttl: 40,
        })
      }
    }

    const tickOnce = () => {
      step(A)
      step(B)
      collectEdges(A, edgesA, 0)
      collectEdges(B, edgesB, PLATE + GUT)
      if (firstWarn < 0 && A.tellDanger > 0) firstWarn = A.t
      if (divT < 0) {
        for (let i = 0; i < A.cap; i++) {
          if (A.x[i] !== B.x[i] || A.y[i] !== B.y[i]) {
            divT = A.t
            break
          }
        }
      }
      if (A.t % 8 === 0) {
        deathTrace.push([A.deathsStorm, B.deathsStorm])
        belTrace.push([believers(A), believers(B)])
        if (deathTrace.length > 3000) {
          deathTrace.shift()
          belTrace.shift()
        }
      }
      const dep = (w: World, c: CanvasRenderingContext2D) => {
        c.fillStyle = "rgba(214,208,192,0.05)"
        for (let i = 0; i < w.cap; i++) {
          if (!w.alive[i] || w.mode[i] === MODE.REST) continue
          c.fillRect(w.x[i] * SC - 1.1, w.y[i] * SC - 1.1, 2.2, 2.2)
        }
      }
      dep(A, taCtx)
      dep(B, tbCtx)
    }

    const paceFor = () => 3 * SPEEDS[speedIdx] * 60

    const drawWorld = (w: World, trail: HTMLCanvasElement, tc: CanvasRenderingContext2D, ox: number, edges: typeof edgesA) => {
      const c = sctx
      const I = stormIntensity(w.t)
      c.save()
      c.beginPath()
      c.rect(ox, 0, PLATE, PLATE)
      c.clip()
      c.fillStyle = "#1d2740"
      c.fillRect(ox, 0, PLATE, PLATE)
      tc.fillStyle = "rgba(29,39,64,0.012)"
      tc.fillRect(0, 0, PLATE, PLATE)
      c.drawImage(trail, ox, 0)
      for (let k = 0; k < P.nests.length; k++) {
        c.beginPath()
        c.arc(ox + P.nests[k][0] * SC, P.nests[k][1] * SC, P.nestR * SC, 0, 2 * Math.PI)
        c.strokeStyle = "rgba(214,208,192,0.22)"
        c.lineWidth = 1
        c.stroke()
      }
      for (let k = 0; k < P.patches; k++) {
        const x = ox + w.px[k] * SC
        const y = w.py[k] * SC
        const r = 2.5 + (w.stock[k] / P.patchMax) * 6
        c.beginPath()
        c.moveTo(x, y - r)
        c.lineTo(x + r, y)
        c.lineTo(x, y + r)
        c.lineTo(x - r, y)
        c.closePath()
        c.strokeStyle = "rgba(214,208,192,0.45)"
        c.lineWidth = 1
        c.stroke()
      }
      if (I > 0) {
        const x = ox + P.nests[P.stormNest][0] * SC
        const y = P.nests[P.stormNest][1] * SC
        const R = P.stormR * SC
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
        c.lineWidth = 1.4
        c.stroke()
      }
      c.strokeStyle = "rgba(163,146,126,0.5)"
      c.lineWidth = 1
      const g0 = Math.max(0, w.graves.length - 600)
      for (let gi = g0; gi < w.graves.length; gi++) {
        const [gx, gy] = w.graves[gi]
        const x = ox + gx * SC
        const y = gy * SC
        c.beginPath()
        c.moveTo(x - 2, y - 2)
        c.lineTo(x + 2, y + 2)
        c.moveTo(x + 2, y - 2)
        c.lineTo(x - 2, y + 2)
        c.stroke()
      }
      for (const e of edges) {
        const a = e.ttl / 40
        c.beginPath()
        c.moveTo(e.x1, e.y1)
        c.lineTo(e.x2, e.y2)
        c.strokeStyle =
          e.kind === 1 ? `rgba(208,96,78,${0.85 * a})` : `rgba(214,208,192,${0.35 * a})`
        c.lineWidth = e.kind === 1 ? 1.3 : 0.7
        c.stroke()
        e.ttl--
      }
      for (let i = 0; i < w.cap; i++) {
        if (!w.alive[i]) continue
        const x = ox + w.x[i] * SC
        const y = w.y[i] * SC
        const child = w.age[i] < P.growTicks
        const r = child ? 1.4 : 2.0
        c.beginPath()
        c.arc(x, y, r, 0, 2 * Math.PI)
        c.globalAlpha = w.mode[i] === MODE.REST ? 0.45 : 1
        c.fillStyle = TINTS[w.home[i] % TINTS.length]
        c.fill()
        c.globalAlpha = 1
        if (w.mode[i] === MODE.EAT) {
          c.beginPath()
          c.arc(x, y, r + 2, 0, 2 * Math.PI)
          c.strokeStyle = "rgba(236,158,64,0.8)"
          c.lineWidth = 1
          c.stroke()
        }
      }
      c.restore()
      c.strokeStyle = "rgba(133,118,101,0.4)"
      c.lineWidth = 1
      c.strokeRect(ox + 0.5, 0.5, PLATE - 1, PLATE - 1)
    }

    const draw = () => {
      sctx.clearRect(0, 0, WIDE, PLATE)
      drawWorld(A, trailA, taCtx, 0, edgesA)
      drawWorld(B, trailB, tbCtx, PLATE + GUT, edgesB)
      edgesA = edgesA.filter((e) => e.ttl > 0)
      edgesB = edgesB.filter((e) => e.ttl > 0)
    }

    const drawTrace = (
      c: CanvasRenderingContext2D,
      cv: HTMLCanvasElement,
      trace: Array<[number, number]>,
      label: string,
      maxV: number
    ) => {
      const W = cv.width
      const H = cv.height
      c.clearRect(0, 0, W, H)
      c.strokeStyle = "rgba(133,118,101,0.35)"
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(0, H - 12)
      c.lineTo(W, H - 12)
      c.stroke()
      const maxN = 3000
      const t0 = A.t - trace.length * 8
      for (let si = 0; ; si++) {
        const ts = P.firstOnset + si * P.season
        if (ts > A.t) break
        if (ts < t0) continue
        const x = ((ts - t0) / 8 / maxN) * W
        c.strokeStyle = "rgba(194,58,43,0.45)"
        c.beginPath()
        c.moveTo(x, 8)
        c.lineTo(x, H - 12)
        c.stroke()
      }
      for (let s = 0; s < 2; s++) {
        c.strokeStyle = s === 0 ? "rgba(214,208,192,0.9)" : PAL.cb
        c.lineWidth = 1.4
        c.beginPath()
        for (let k = 0; k < trace.length; k++) {
          const x = (k / maxN) * W
          const y = H - 12 - (Math.min(trace[k][s], maxV) / maxV) * (H - 22)
          if (k === 0) c.moveTo(x, y)
          else c.lineTo(x, y)
        }
        c.stroke()
      }
      c.fillStyle = PAL.muted
      c.font = "10px ui-monospace, Menlo, monospace"
      c.fillText(label + " A", 6, 12)
      c.fillStyle = PAL.cb
      c.fillText(label + " B", 90, 12)
    }

    const updateData = () => {
      el("t").textContent = String(A.t)
      el("season").textContent = String(seasonIndex(A.t) + 1)
      el("i").textContent = stormIntensity(A.t).toFixed(2)
      el("divt").textContent = divT < 0 ? "–" : String(divT)
      el("warnt").textContent = firstWarn < 0 ? "–" : String(firstWarn)
      const rows: Array<[string, World]> = [
        ["a", A],
        ["b", B],
      ]
      for (const [pre, w] of rows) {
        el(pre + "-pop").textContent = String(w.n)
        el(pre + "-births").textContent = String(w.births)
        el(pre + "-dstorm").textContent = String(w.deathsStorm)
        el(pre + "-dstarve").textContent = String(w.deathsStarve)
        el(pre + "-bel").textContent = String(believers(w))
        el(pre + "-td").textContent = String(w.tellDanger)
        const sd = w.seasonDeaths.slice()
        const si = seasonIndex(w.t)
        while (sd.length <= si) sd.push(0)
        el(pre + "-seasons").textContent = sd.length ? sd.join(" · ") : "–"
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
        updateData()
        draw()
        drawTrace(dctx, chartD, deathTrace, "storm deaths", 80)
        drawTrace(bctx, chartB, belTrace, "believers", P.nMax)
      }
      raf = requestAnimationFrame(frame)
    }

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
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
      bPause.removeEventListener("click", onPause)
      bSeed.removeEventListener("click", onSeed)
      bSpeed.removeEventListener("click", onSpeed)
      bPlay.removeEventListener("click", onPlay)
    }
  }, [])

  return (
    <div ref={rootRef} className="twv-root">
      <div className="flex justify-between smallcaps text-[10.5px] mb-2">
        <span style={{ color: "var(--site-body)" }}>A &middot; warnings told</span>
        <span className="twv-cb">B &middot; warnings severed</span>
      </div>
      <div className="relative">
        <canvas
          data-stage
          width={WIDE}
          height={PLATE}
          aria-label="Two societies from one seed; in world B nobody can warn anybody about the storm site"
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
        data-chart-d
        width={1140}
        height={80}
        className="mt-2"
        aria-label="Cumulative storm deaths in each world"
      />
      <canvas
        data-chart-b
        width={1140}
        height={80}
        className="mt-2"
        aria-label="Believers in each world over time"
      />

      <div className="twv-tables mono mt-5 grid gap-6 md:grid-cols-2 md:justify-between">
        <table>
          <caption>state</caption>
          <tbody>
            <tr><td>t</td><td data-k="t">0</td></tr>
            <tr><td>season</td><td data-k="season">0</td></tr>
            <tr><td>storm intensity</td><td data-k="i">0.00</td></tr>
            <tr><td>first divergence t</td><td data-k="divt">&ndash;</td></tr>
            <tr><td>first warning t</td><td data-k="warnt">&ndash;</td></tr>
            <tr><td>seed</td><td data-k="seed">1</td></tr>
          </tbody>
        </table>

        <table>
          <caption>worlds</caption>
          <thead>
            <tr><th></th><th>A</th><th className="twv-cb">B</th></tr>
          </thead>
          <tbody>
            <tr><td>population</td><td data-k="a-pop">280</td><td data-k="b-pop" className="twv-cb">280</td></tr>
            <tr><td>births</td><td data-k="a-births">0</td><td data-k="b-births" className="twv-cb">0</td></tr>
            <tr><td>deaths, storm</td><td data-k="a-dstorm">0</td><td data-k="b-dstorm" className="twv-cb">0</td></tr>
            <tr><td>deaths, starvation</td><td data-k="a-dstarve">0</td><td data-k="b-dstarve" className="twv-cb">0</td></tr>
            <tr><td>believers</td><td data-k="a-bel">0</td><td data-k="b-bel" className="twv-cb">0</td></tr>
            <tr><td>warnings told</td><td data-k="a-td">0</td><td data-k="b-td" className="twv-cb">0</td></tr>
          </tbody>
        </table>
      </div>

      <div className="twv-tables mono mt-5">
        <table>
          <caption>storm deaths by season</caption>
          <tbody>
            <tr><td>A</td><td data-k="a-seasons">&ndash;</td></tr>
            <tr><td className="twv-cb">B</td><td data-k="b-seasons" className="twv-cb">&ndash;</td></tr>
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
              <td>tell p</td><td>0.05</td>
              <td>witness radius</td><td>12</td>
              <td>belief source</td><td>seen death</td>
              <td>warning heard</td><td>believed in full</td>
            </tr>
            <tr>
              <td>storm onset</td><td>1200</td>
              <td>season</td><td>2500</td>
              <td>length</td><td>200</td>
              <td>radius</td><td>22</td>
              <td>damage / tick</td><td>0.022</td>
              <td>avoid radius</td><td>24</td>
              <td>belief decay</td><td>0.99985</td>
            </tr>
            <tr>
              <td>world A</td><td>danger telling on</td>
              <td>world B</td><td>danger telling off</td>
              <td>food telling</td><td>on in both</td>
              <td>seeds</td><td>identical</td>
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
