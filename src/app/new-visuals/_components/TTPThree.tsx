"use client"

import { useEffect, useRef } from "react"

// TTP-3: one parent, three children.
// Sim identical to the headless harness (ttp3_sim.js). Rendering only
// on top: satellite ground, follow camera, trails, memory marks, and
// severed-branch ghosts computed from the same deterministic kernel.

const P = {
  size: 64,
  home: [32, 44] as [number, number],
  patches: [
    [28, 48],
    [38, 47],
    [12, 20],
    [30, 10],
    [52, 18],
    [54, 44],
  ] as Array<[number, number]>,
  patchStock0: 60,
  patchMax: 80,
  regen: 0.05,
  eatR: 1.8,
  eatGain: 0.06,
  childEatGain: 0.05,
  grazeR: 1.6,
  speed: 0.5,
  childSpeed: 0.38,
  burnMove: 0.0011,
  burnRest: 0.00045,
  hungerAt: 0.55,
  fullAt: 0.92,
  restTicks: 90,
  attachR: 5,
  sightR: 6,
  noticeT: 160,
  homeSafeR: 5,
  homeKnownR: 12,
  exploreP: 0.0006,
  exploreDmin: 16,
  exploreDmax: 40,
  chainExploreP: 0.5,
  lostHomeT: 1200,
  homeCheckP: 0.08,
  searchGrow: 0.03,
  searchBite: 0.03,
  feedAt: 0.5,
  feedR: 2.5,
  feedRate: 0.003,
  feedEff: 0.9,
  stormR: 12,
  stormLen: 260,
  season: 2600,
  firstOnset: 900,
  stormDamage: 0.005,
  childDmg: 1.3,
  adultDmg: 0.7,
  shieldFrac: 0.5,
  actAtI: 0.08,
  escortR: 2.5,
  callR: 6.0,
  panicJitter: 1.9,
  freezeP: 0.3,
  shepherdPickR: 1.5,
  exitMargin: 4,
  T: 24000,
  branchH: 4000,
}

const M = {
  LOITER: 0, GO_FOOD: 1, EAT: 2, GO_HOME: 3, REST: 4,
  SEARCH: 5, SHEPHERD: 6, FLEE: 7,
  FOLLOW: 8, EXPLORE: 9, LOST: 10, SEEK_PARENT: 11,
} as const
const MNAME: Record<number, string> = {
  0: "loiter", 1: "go food", 2: "eat", 3: "go home", 4: "rest",
  5: "search", 6: "shepherd", 7: "flee",
  8: "follow", 9: "explore", 10: "lost", 11: "seek parent",
}

type Rng = { s: number }
type Ev = Array<string | number>

type World = {
  rng: Rng
  seed: number
  care: boolean
  t: number
  x: Float64Array
  y: Float64Array
  E: Float64Array
  alive: boolean[]
  mode: Int32Array
  age: Int32Array
  restLeft: Int32Array
  tgtX: Float64Array
  tgtY: Float64Array
  tgtOn: boolean[]
  seenX: Float64Array
  seenY: Float64Array
  seenT: Int32Array
  pSeenX: Float64Array
  pSeenY: Float64Array
  hungry: boolean[]
  lostAt: Int32Array
  stock: Float64Array
  stormX: number
  stormY: number
  stormSev: number
  searchEp: { t0: number; E0: number; child: number } | null
  shepEp: { t0: number; dmg0: number } | null
  fed: Float64Array
  dmg: Float64Array
  dmgShield: number
  lastDmgT: Int32Array
  deathT: Int32Array
  deathBy: string[]
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

function makeWorld(seed: number, care: boolean): World {
  const w: World = {
    rng: makeRng(seed),
    seed,
    care,
    t: 0,
    x: new Float64Array(4),
    y: new Float64Array(4),
    E: new Float64Array(4),
    alive: [true, true, true, true],
    mode: new Int32Array(4),
    age: new Int32Array(4),
    restLeft: new Int32Array(4),
    tgtX: new Float64Array(4),
    tgtY: new Float64Array(4),
    tgtOn: [false, false, false, false],
    seenX: new Float64Array(4),
    seenY: new Float64Array(4),
    seenT: new Int32Array(4),
    pSeenX: new Float64Array(4),
    pSeenY: new Float64Array(4),
    hungry: [false, false, false, false],
    lostAt: new Int32Array(4).fill(-1),
    stock: Float64Array.from(P.patches.map(() => P.patchStock0)),
    stormX: -100,
    stormY: -100,
    stormSev: 1,
    searchEp: null,
    shepEp: null,
    fed: new Float64Array(4),
    dmg: new Float64Array(4),
    dmgShield: 0,
    lastDmgT: new Int32Array(4).fill(-1000000),
    deathT: new Int32Array(4).fill(-1),
    deathBy: ["", "", "", ""],
    events: [],
  }
  w.x[0] = P.home[0]
  w.y[0] = P.home[1]
  w.E[0] = 0.85
  w.mode[0] = M.LOITER
  const offs = [
    [-1.5, 1.2],
    [1.4, 1.0],
    [0.2, -1.6],
  ]
  for (let i = 1; i < 4; i++) {
    w.x[i] = P.home[0] + offs[i - 1][0]
    w.y[i] = P.home[1] + offs[i - 1][1]
    w.E[i] = 0.5 + 0.05 * i
    w.age[i] = (i - 1) * 150
    w.mode[i] = M.LOITER
    w.seenX[i] = w.x[i]
    w.seenY[i] = w.y[i]
    w.seenT[i] = 0
    w.pSeenX[i] = w.x[0]
    w.pSeenY[i] = w.y[0]
  }
  return w
}

function cloneWorld(w: World): World {
  const c = {} as Record<string, unknown>
  for (const k of Object.keys(w) as Array<keyof World>) {
    const v = w[k]
    if (v instanceof Float64Array || v instanceof Int32Array) c[k] = v.slice()
    else if (Array.isArray(v)) c[k] = v.slice()
    else if (k === "rng") c[k] = { s: (v as Rng).s }
    else if (v && typeof v === "object") c[k] = { ...(v as object) }
    else c[k] = v
  }
  return c as World
}

function stormIntensity(w: World) {
  const t = w.t - P.firstOnset
  if (t < 0) return 0
  const ph = t % P.season
  if (ph >= P.stormLen) return 0
  const u = ph / P.stormLen
  return u < 0.25 ? u / 0.25 : u > 0.75 ? (1 - u) / 0.25 : 1
}

function dist(w: World, i: number, j: number) {
  return Math.hypot(w.x[i] - w.x[j], w.y[i] - w.y[j])
}

function moveToward(w: World, i: number, tx: number, ty: number, sp: number, jx: number, jy: number) {
  const dx = tx - w.x[i]
  const dy = ty - w.y[i]
  const L = Math.hypot(dx, dy)
  const s = Math.min(sp, L)
  if (L > 1e-9) {
    w.x[i] += (dx / L) * s + (jx - 0.5) * 0.12
    w.y[i] += (dy / L) * s + (jy - 0.5) * 0.12
  }
  w.x[i] = Math.max(0.5, Math.min(P.size - 0.5, w.x[i]))
  w.y[i] = Math.max(0.5, Math.min(P.size - 0.5, w.y[i]))
  w.E[i] -= P.burnMove
}

function nearestPatch(w: World, i: number) {
  let best = -1
  let bd = Infinity
  for (let k = 0; k < P.patches.length; k++) {
    if (w.stock[k] < 2) continue
    const d = Math.hypot(w.x[i] - P.patches[k][0], w.y[i] - P.patches[k][1])
    if (d < bd) {
      bd = d
      best = k
    }
  }
  return best
}

function inStorm(w: World, i: number, I: number) {
  if (I <= 0) return 0
  const d = Math.hypot(w.x[i] - w.stormX, w.y[i] - w.stormY)
  return d < P.stormR ? I : 0
}

function distHome(w: World, i: number) {
  return Math.hypot(w.x[i] - P.home[0], w.y[i] - P.home[1])
}

function missingChild(w: World) {
  for (let j = 1; j < 4; j++) {
    if (!w.alive[j]) continue
    if (w.t - w.seenT[j] <= P.noticeT) continue
    if (dist(w, 0, j) < P.sightR) continue
    const believedHome =
      Math.hypot(w.seenX[j] - P.home[0], w.seenY[j] - P.home[1]) < P.homeSafeR
    const canSeeBelief =
      Math.hypot(w.x[0] - w.seenX[j], w.y[0] - w.seenY[j]) < P.sightR
    if (believedHome && !canSeeBelief) continue
    return j
  }
  return -1
}

function shepherdTarget(w: World) {
  let best = -1
  let bd = Infinity
  let bx = 0
  let by = 0
  for (let j = 1; j < 4; j++) {
    if (!w.alive[j]) continue
    const visible = dist(w, 0, j) < P.sightR
    let jx: number, jy: number
    if (visible) {
      jx = w.x[j]
      jy = w.y[j]
    } else if (w.t - w.seenT[j] <= P.noticeT) {
      jx = w.seenX[j]
      jy = w.seenY[j]
    } else continue
    const dc = Math.hypot(jx - w.stormX, jy - w.stormY)
    if (dc >= P.stormR) continue
    if (dc < bd) {
      bd = dc
      best = j
      bx = jx
      by = jy
    }
  }
  return best < 0 ? null : { j: best, x: bx, y: by }
}

function endShepEp(w: World) {
  if (w.shepEp) {
    w.events.push([w.t, "shepherd_end", +(w.dmg[0] - w.shepEp.dmg0).toFixed(3), w.shepEp.t0])
    w.shepEp = null
  }
}

function endSearchEp(w: World, found: boolean) {
  if (w.searchEp) {
    if (found) {
      w.events.push([
        w.t, "reunion", w.searchEp.child, +w.E[0].toFixed(3),
        w.t - w.searchEp.t0, +w.searchEp.E0.toFixed(3),
      ])
    }
    w.searchEp = null
  }
}

function stepParent(w: World, I: number, d1: number, d2: number, d3: number, d4: number, d5: number) {
  const i = 0

  if (w.care && I >= P.actAtI) {
    const tgt = shepherdTarget(w)
    if (tgt) {
      if (w.mode[i] !== M.SHEPHERD) {
        w.events.push([w.t, "shepherd_start"])
        w.shepEp = { t0: w.t, dmg0: w.dmg[0] }
      }
      w.mode[i] = M.SHEPHERD
      let leading = false
      for (let j = 1; j < 4; j++) {
        if (w.alive[j] && dist(w, i, j) < P.escortR && inStorm(w, j, I) > 0) {
          leading = true
          break
        }
      }
      if (!leading && dist(w, i, tgt.j) > P.shepherdPickR) {
        moveToward(w, i, tgt.x, tgt.y, P.speed, d1, d2)
      } else {
        const dx = w.x[i] - w.stormX
        const dy = w.y[i] - w.stormY
        const L = Math.hypot(dx, dy) || 1
        moveToward(w, i, w.x[i] + (dx / L) * 8, w.y[i] + (dy / L) * 8, P.childSpeed, d1, d2)
      }
      return
    }
  }
  if (w.mode[i] === M.SHEPHERD) {
    endShepEp(w)
    w.mode[i] = M.LOITER
  }

  if (w.care) {
    const miss = missingChild(w)
    if (miss >= 0) {
      if (w.mode[i] !== M.SEARCH) {
        if (!w.searchEp) {
          w.searchEp = { t0: w.t, E0: w.E[i], child: miss }
          w.events.push([w.t, "search_start", miss, +w.E[i].toFixed(3)])
        }
        w.tgtOn[i] = false
      }
      w.mode[i] = M.SEARCH
      const k = nearestPatch(w, i)
      if (k >= 0 && w.E[i] < P.fullAt &&
          Math.hypot(w.x[i] - P.patches[k][0], w.y[i] - P.patches[k][1]) < P.eatR) {
        w.E[i] = Math.min(1, w.E[i] + P.searchBite)
        w.stock[k] = Math.max(0, w.stock[k] - 0.5)
        return
      }
      if (!w.tgtOn[i] || Math.hypot(w.tgtX[i] - w.x[i], w.tgtY[i] - w.y[i]) < 1) {
        if (d5 < P.homeCheckP) {
          w.tgtX[i] = P.home[0]
          w.tgtY[i] = P.home[1]
        } else {
          const ang = d3 * Math.PI * 2
          const grow = Math.min(14, (w.t - (w.searchEp ? w.searchEp.t0 : w.t)) * P.searchGrow)
          const rad = d4 * (12 + grow)
          w.tgtX[i] = Math.max(1, Math.min(P.size - 1, w.seenX[miss] + rad * Math.cos(ang)))
          w.tgtY[i] = Math.max(1, Math.min(P.size - 1, w.seenY[miss] + rad * Math.sin(ang)))
        }
        w.tgtOn[i] = true
      }
      moveToward(w, i, w.tgtX[i], w.tgtY[i], P.speed, d1, d2)
      return
    }
    if (w.mode[i] === M.SEARCH) {
      endSearchEp(w, true)
      w.mode[i] = M.LOITER
      w.tgtOn[i] = false
    }
  }

  if (I >= P.actAtI &&
      Math.hypot(w.x[i] - w.stormX, w.y[i] - w.stormY) < P.stormR + P.exitMargin) {
    w.mode[i] = M.FLEE
    const dx = w.x[i] - w.stormX
    const dy = w.y[i] - w.stormY
    const L = Math.hypot(dx, dy) || 1
    moveToward(w, i, w.x[i] + (dx / L) * 8, w.y[i] + (dy / L) * 8, P.speed, d1, d2)
    return
  }
  if (w.mode[i] === M.FLEE) w.mode[i] = M.LOITER

  if (w.mode[i] === M.REST) {
    w.E[i] -= P.burnRest
    if (--w.restLeft[i] <= 0) w.mode[i] = M.LOITER
    return
  }
  if (w.mode[i] === M.EAT) {
    const k = nearestPatch(w, i)
    if (k < 0 || Math.hypot(w.x[i] - P.patches[k][0], w.y[i] - P.patches[k][1]) > P.eatR) {
      w.mode[i] = M.GO_FOOD
    } else {
      w.E[i] = Math.min(1, w.E[i] + P.eatGain)
      w.stock[k] = Math.max(0, w.stock[k] - 1)
      w.E[i] -= P.burnRest
      if (w.E[i] >= P.fullAt) w.mode[i] = M.GO_HOME
      return
    }
  }
  if (w.mode[i] === M.GO_FOOD) {
    const k = nearestPatch(w, i)
    if (k < 0) {
      w.mode[i] = M.LOITER
    } else if (Math.hypot(w.x[i] - P.patches[k][0], w.y[i] - P.patches[k][1]) <= P.eatR) {
      w.mode[i] = M.EAT
    } else {
      moveToward(w, i, P.patches[k][0], P.patches[k][1], P.speed, d1, d2)
      return
    }
  }
  if (w.mode[i] === M.GO_HOME) {
    if (distHome(w, i) < 2) {
      w.mode[i] = M.REST
      w.restLeft[i] = P.restTicks
    } else {
      moveToward(w, i, P.home[0], P.home[1], P.speed, d1, d2)
      return
    }
  }
  if (w.mode[i] === M.LOITER) {
    if (w.E[i] < P.hungerAt) {
      w.mode[i] = M.GO_FOOD
      return
    }
    if (d5 < 0.02) {
      w.tgtX[i] = P.home[0] + (d3 - 0.5) * 6
      w.tgtY[i] = P.home[1] + (d4 - 0.5) * 6
      w.tgtOn[i] = true
    }
    if (w.tgtOn[i]) {
      moveToward(w, i, w.tgtX[i], w.tgtY[i], P.speed * 0.5, d1, d2)
      if (Math.hypot(w.tgtX[i] - w.x[i], w.tgtY[i] - w.y[i]) < 0.8) w.tgtOn[i] = false
    } else {
      w.E[i] -= P.burnRest
    }
  }
}

function stepChild(w: World, i: number, I: number, d1: number, d2: number, d3: number, d4: number, d5: number) {
  const pAlive = w.alive[0]
  const dp = pAlive ? dist(w, 0, i) : Infinity

  if (I >= P.actAtI && inStorm(w, i, I) > 0) {
    if (pAlive && dp < P.escortR) {
      w.mode[i] = M.SEEK_PARENT
      const dx = w.x[i] - w.stormX
      const dy = w.y[i] - w.stormY
      const L = Math.hypot(dx, dy) || 1
      moveToward(w, i, w.x[i] + (dx / L) * 8, w.y[i] + (dy / L) * 8, P.childSpeed, d1, d2)
    } else if (pAlive && dp < P.callR) {
      w.mode[i] = M.SEEK_PARENT
      moveToward(w, i, w.x[0], w.y[0], P.childSpeed, d1, d2)
    } else {
      w.mode[i] = M.FLEE
      if (d5 < P.freezeP) {
        w.E[i] -= P.burnRest
        return
      }
      const dx = w.x[i] - w.stormX
      const dy = w.y[i] - w.stormY
      const base = Math.atan2(dy, dx)
      const ang = base + (d3 - 0.5) * 2 * P.panicJitter
      moveToward(
        w, i,
        w.x[i] + Math.cos(ang) * 8,
        w.y[i] + Math.sin(ang) * 8,
        P.childSpeed * 0.8, d1, d2
      )
    }
    return
  }
  if (w.mode[i] === M.SEEK_PARENT || w.mode[i] === M.FLEE) w.mode[i] = M.LOITER

  if (w.E[i] < 0.45) w.hungry[i] = true
  if (w.E[i] >= 0.75) w.hungry[i] = false
  if (w.hungry[i]) {
    const k = nearestPatch(w, i)
    if (k >= 0) {
      const d = Math.hypot(w.x[i] - P.patches[k][0], w.y[i] - P.patches[k][1])
      if (d < P.grazeR) {
        w.mode[i] = M.EAT
        w.E[i] = Math.min(1, w.E[i] + P.childEatGain)
        w.stock[k] = Math.max(0, w.stock[k] - 0.7)
        return
      }
      w.mode[i] = M.GO_FOOD
      moveToward(w, i, P.patches[k][0], P.patches[k][1], P.childSpeed, d1, d2)
      return
    }
  }

  if (w.mode[i] === M.EXPLORE) {
    moveToward(w, i, w.tgtX[i], w.tgtY[i], P.childSpeed, d1, d2)
    if (Math.hypot(w.tgtX[i] - w.x[i], w.tgtY[i] - w.y[i]) < 1) {
      if (pAlive && dp >= P.sightR && d5 < P.chainExploreP) {
        const ang = d3 * Math.PI * 2
        const rad = 8 + d4 * 14
        w.tgtX[i] = Math.max(1, Math.min(P.size - 1, w.x[i] + rad * Math.cos(ang)))
        w.tgtY[i] = Math.max(1, Math.min(P.size - 1, w.y[i] + rad * Math.sin(ang)))
        return
      }
      w.tgtOn[i] = false
      if (!pAlive || dp < P.sightR || distHome(w, i) < P.homeKnownR) {
        w.mode[i] = M.LOITER
      } else {
        w.mode[i] = M.LOST
        w.lostAt[i] = w.t
        w.events.push([w.t, "lost", i])
      }
    }
    return
  }

  if (w.mode[i] === M.LOST) {
    if ((pAlive && dp < P.sightR) || distHome(w, i) < P.homeKnownR) {
      w.mode[i] = M.LOITER
      w.lostAt[i] = -1
      w.tgtOn[i] = false
    } else if (!pAlive) {
      moveToward(w, i, P.home[0], P.home[1], P.childSpeed * 0.8, d1, d2)
    } else if (w.t - w.lostAt[i] > P.lostHomeT) {
      moveToward(w, i, P.home[0], P.home[1], P.childSpeed * 0.8, d1, d2)
    } else {
      if (!w.tgtOn[i] || Math.hypot(w.tgtX[i] - w.x[i], w.tgtY[i] - w.y[i]) < 1) {
        w.pSeenX[i] = Math.max(2, Math.min(P.size - 2, w.pSeenX[i] + (d5 - 0.5) * 6))
        w.pSeenY[i] = Math.max(2, Math.min(P.size - 2, w.pSeenY[i] + (d1 - 0.5) * 6))
        const ang = d3 * Math.PI * 2
        const rad = d4 * 16
        w.tgtX[i] = Math.max(2, Math.min(P.size - 2, w.pSeenX[i] + rad * Math.cos(ang)))
        w.tgtY[i] = Math.max(2, Math.min(P.size - 2, w.pSeenY[i] + rad * Math.sin(ang)))
        w.tgtOn[i] = true
      }
      moveToward(w, i, w.tgtX[i], w.tgtY[i], P.childSpeed * 0.8, d1, d2)
    }
    return
  }

  if (pAlive && dp > P.attachR) {
    if (dp < P.sightR) {
      w.mode[i] = M.FOLLOW
      const k = nearestPatch(w, i)
      if (k >= 0 && w.E[i] < 0.8 &&
          Math.hypot(w.x[i] - P.patches[k][0], w.y[i] - P.patches[k][1]) < P.grazeR) {
        w.E[i] = Math.min(1, w.E[i] + P.childEatGain)
        w.stock[k] = Math.max(0, w.stock[k] - 0.7)
        return
      }
      moveToward(w, i, w.x[0], w.y[0], P.childSpeed, d1, d2)
      return
    }
    if (distHome(w, i) >= P.homeKnownR) {
      w.mode[i] = M.LOST
      w.lostAt[i] = w.t
      w.events.push([w.t, "lost", i])
      return
    }
    if (distHome(w, i) > 2.5) {
      w.mode[i] = M.LOITER
      moveToward(w, i, P.home[0], P.home[1], P.childSpeed * 0.8, d1, d2)
      return
    }
  }
  if (!pAlive && distHome(w, i) > 4) {
    w.mode[i] = M.LOITER
    moveToward(w, i, P.home[0], P.home[1], P.childSpeed * 0.8, d1, d2)
    return
  }

  if (d5 < P.exploreP) {
    const ang = d3 * Math.PI * 2
    const rad = P.exploreDmin + d4 * (P.exploreDmax - P.exploreDmin)
    w.tgtX[i] = Math.max(1, Math.min(P.size - 1, w.x[i] + rad * Math.cos(ang)))
    w.tgtY[i] = Math.max(1, Math.min(P.size - 1, w.y[i] + rad * Math.sin(ang)))
    w.mode[i] = M.EXPLORE
    w.events.push([w.t, "explore", i])
    return
  }
  w.mode[i] = M.LOITER
  const k = nearestPatch(w, i)
  if (k >= 0 && w.E[i] < 0.8) {
    const d = Math.hypot(w.x[i] - P.patches[k][0], w.y[i] - P.patches[k][1])
    if (d < P.grazeR) {
      w.E[i] = Math.min(1, w.E[i] + P.childEatGain)
      w.stock[k] = Math.max(0, w.stock[k] - 0.7)
      w.E[i] -= P.burnRest
      return
    }
  }
  w.E[i] -= P.burnRest
}

function step(w: World) {
  const ts = w.t - P.firstOnset
  if (ts >= 0 && ts % P.season === 0) {
    const a = draw(w.rng)
    const b = draw(w.rng)
    const c = draw(w.rng)
    w.stormX = 8 + a * (P.size - 16)
    w.stormY = 8 + b * (P.size - 16)
    w.stormSev = 0.6 + 1.6 * c * c * c
    w.events.push([w.t, "storm_season", +w.stormX.toFixed(1), +w.stormY.toFixed(1), +w.stormSev.toFixed(2)])
  }
  const I = stormIntensity(w)

  for (let k = 0; k < w.stock.length; k++)
    w.stock[k] = Math.min(P.patchMax, w.stock[k] + P.regen)

  for (let i = 1; i < 4; i++) {
    if (!w.alive[i] || !w.alive[0]) continue
    if (dist(w, 0, i) < P.sightR) {
      w.seenX[i] = w.x[i]
      w.seenY[i] = w.y[i]
      w.seenT[i] = w.t
      w.pSeenX[i] = w.x[0]
      w.pSeenY[i] = w.y[0]
    }
  }

  for (let i = 0; i < 4; i++) {
    const d1 = draw(w.rng), d2 = draw(w.rng), d3 = draw(w.rng)
    const d4 = draw(w.rng), d5 = draw(w.rng), d6 = draw(w.rng)
    void d6
    if (!w.alive[i]) continue
    const Ii = inStorm(w, i, I)
    if (Ii > 0) {
      let dmg = P.stormDamage * w.stormSev * Ii * (i > 0 ? P.childDmg : P.adultDmg)
      if (i > 0 && w.care && w.alive[0] && dist(w, 0, i) < P.escortR) {
        const sh = dmg * P.shieldFrac
        dmg -= sh
        w.E[0] -= sh
        w.dmg[0] += sh
        w.dmgShield += sh
        w.lastDmgT[0] = w.t
      }
      w.E[i] -= dmg
      w.dmg[i] += dmg
      w.lastDmgT[i] = w.t
    }

    if (i === 0) stepParent(w, I, d1, d2, d3, d4, d5)
    else stepChild(w, i, I, d1, d2, d3, d4, d5)

    if (w.E[i] <= 0) {
      w.alive[i] = false
      w.deathT[i] = w.t
      w.deathBy[i] = w.t - w.lastDmgT[i] < 10 ? "storm" : "starve"
      w.events.push([
        w.t, "death", i, w.deathBy[i],
        i > 0 ? (w.alive[0] ? +dist(w, 0, i).toFixed(1) : -1) : -2,
      ])
    }
  }

  if (w.care && w.alive[0]) {
    for (let i = 1; i < 4; i++) {
      if (!w.alive[i]) continue
      if (w.E[i] < P.feedAt && dist(w, 0, i) < P.feedR && w.E[0] > 0.02) {
        const r = Math.min(P.feedRate, w.E[0] - 0.01)
        w.E[0] -= r
        w.E[i] = Math.min(1, w.E[i] + r * P.feedEff)
        w.fed[i] += r
      }
    }
  }

  for (let i = 1; i < 4; i++) if (w.alive[i]) w.age[i]++
  w.t++
}

// runs found by scanning seeds for the full sequence: a deep search
// (reunion at or below 0.18 energy, at least 0.28 spent searching),
// then a fatal shepherding episode with all three children alive after
// it, where the same-tick severed branch has the parent alive and at
// least one child dead. Placeholder until the scan completes.
const RUNS: number[] = [910]

const SPEEDS = [1, 4, 16]
const SIDE = 1000
const SCALE = SIDE / P.size

export default function TTPThree() {
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
    const evBody = root.querySelector<HTMLElement>("[data-events]")!
    const brBody = root.querySelector<HTMLElement>("[data-branches]")!
    const coBody = root.querySelector<HTMLElement>("[data-cohort]")!

    let PAL = { ink: "#ece4d0", accent: "#f6b545", ca: "#a8d4e2", cb: "#f0a58c", muted: "#cfe0d2" }
    const readPalette = () => {
      const cs = getComputedStyle(root)
      const g = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb
      PAL = {
        ink: g("--site-ink", PAL.ink),
        accent: g("--site-accent", PAL.accent),
        ca: g("--twv-ca", PAL.ca),
        cb: g("--twv-cb", PAL.cb),
        muted: g("--site-muted", PAL.muted),
      }
    }
    readPalette()
    const mo = new MutationObserver(readPalette)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    const buildGround = (s: number) => {
      const rr = makeRng((s ^ 0x9e3779b9) >>> 0)
      const R = () => draw(rr)
      gctx.clearRect(0, 0, SIDE, SIDE)
      gctx.fillStyle = "#2f4a2a"
      gctx.fillRect(0, 0, SIDE, SIDE)
      for (let b = 0; b < 22; b++) {
        const bx = R() * SIDE
        const by = R() * SIDE
        const br = 40 + R() * 110
        const kind = R()
        const q1 = R() * Math.PI * 2
        const q2 = R() * Math.PI * 2
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
      for (let cl = 0; cl < 560; cl++) {
        const ccx = R() * SIDE
        const ccy = R() * SIDE
        const crowd = 6 + Math.floor(R() * 13)
        const tone = R()
        for (let m = 0; m < crowd; m++) {
          const x = ccx + (R() + R() - 1) * 10
          const y = ccy + (R() + R() - 1) * 10
          const sz = 1.4 + R() * 2.2
          gctx.fillStyle = "rgba(14,26,14,0.3)"
          gctx.beginPath()
          gctx.arc(x + 0.9, y + 1.1, sz * 0.62, 0, 2 * Math.PI)
          gctx.fill()
          gctx.fillStyle =
            tone < 0.5
              ? `rgba(74,112,54,${0.3 + R() * 0.14})`
              : tone < 0.82
                ? `rgba(54,88,44,${0.32 + R() * 0.14})`
                : `rgba(104,132,62,${0.26 + R() * 0.12})`
          gctx.beginPath()
          gctx.arc(x, y, sz * 0.58, 0, 2 * Math.PI)
          gctx.fill()
        }
      }
      for (let k = 0; k < 3200; k++) {
        const x = R() * SIDE
        const y = R() * SIDE
        const sz = 0.7 + R() * 1.4
        const g = R()
        gctx.fillStyle =
          g < 0.6 ? "rgba(112,140,74,0.18)" : "rgba(148,152,84,0.13)"
        gctx.fillRect(x, y, sz, sz)
      }
      // the waterhole by the homestead
      const cx = (P.home[0] - 3.4) * SCALE
      const cy = (P.home[1] - 2.2) * SCALE
      const base = 2.4 * SCALE
      const p1 = R() * Math.PI * 2
      const p2 = R() * Math.PI * 2
      const p3 = R() * Math.PI * 2
      const shore = (th: number) =>
        base *
        (1 +
          0.28 * Math.sin(3 * th + p1) +
          0.16 * Math.sin(5 * th + p2) +
          0.1 * Math.sin(7 * th + p3))
      for (let d = 0; d < 280; d++) {
        const th = R() * Math.PI * 2
        const rad = shore(th) + R() * R() * 40
        gctx.fillStyle = `rgba(64,110,52,${Math.max(0.05, 0.5 - 0.4 * Math.min(1, (rad - base) / 44))})`
        const sz = 1.2 + R() * 2.4
        gctx.fillRect(cx + rad * Math.cos(th), cy + rad * Math.sin(th), sz, sz)
      }
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
      // the homestead
      const hx = P.home[0] * SCALE
      const hy = P.home[1] * SCALE
      const houses = [
        [-8, -4, 11, 8],
        [6, -9, 8, 7],
        [-2, 7, 9, 7],
      ]
      for (const [ox, oy, ww, hh] of houses) {
        gctx.fillStyle = "rgba(180,168,146,0.85)"
        gctx.fillRect(hx + ox, hy + oy, ww, hh)
        gctx.strokeStyle = "rgba(22,36,22,0.55)"
        gctx.lineWidth = 0.8
        gctx.strokeRect(hx + ox, hy + oy, ww, hh)
      }
    }

    // ---- run state ----
    let runIdx = 0
    let w = makeWorld(RUNS[0], true)
    let evAt = 0
    const TRAIL = 320
    const trail = new Float32Array(4 * TRAIL * 2).fill(-1)
    let trailAt = 0
    const histStep = 8
    const histE: number[][] = [[], [], [], []]
    const histT: number[] = []
    type Branch = {
      t0: number
      path: Array<[number, number]>
      parentAlive: boolean
      kidsAlive: number
      kidsActual: number
      done: boolean
    }
    let branches: Branch[] = []
    let cam = { x: P.home[0], y: P.home[1], z: 1.6 }
    let paused = false
    let speedIdx = 0
    let tickAcc = 0
    let lastMs = 0
    let raf = 0

    const reset = (idx: number) => {
      runIdx = ((idx % RUNS.length) + RUNS.length) % RUNS.length
      w = makeWorld(RUNS[runIdx], true)
      evAt = 0
      trail.fill(-1)
      trailAt = 0
      histE.forEach((h) => (h.length = 0))
      histT.length = 0
      branches = []
      cam = { x: P.home[0], y: P.home[1], z: 1.6 }
      tickAcc = 0
      evBody.innerHTML = ""
      brBody.innerHTML = ""
      buildGround(RUNS[runIdx])
      el("seed").textContent = String(RUNS[runIdx])
      el("run").textContent = `${runIdx + 1} / ${RUNS.length}`
    }

    // branch at a shepherd start: sever care, replay the same kernel
    const computeBranch = (t0: number) => {
      // rerun to t0 for a clean state (cheap: small world)
      const at = makeWorld(RUNS[runIdx], true)
      while (at.t < t0 && at.alive.some(Boolean)) step(at)
      const b = cloneWorld(at)
      b.care = false
      const path: Array<[number, number]> = []
      const H = P.stormLen + 600
      while (b.t < t0 + H && b.alive.some(Boolean)) {
        step(b)
        if (b.alive[0] && b.t % 3 === 0) path.push([b.x[0], b.y[0]])
      }
      const br: Branch = {
        t0,
        path,
        parentAlive: b.alive[0],
        kidsAlive: [1, 2, 3].filter((i) => b.alive[i]).length,
        kidsActual: -1,
        done: false,
      }
      branches.push(br)
      if (branches.length > 6) branches.shift()
    }

    const fmtE = (v: number) => v.toFixed(2)

    const consumeEvents = () => {
      for (; evAt < w.events.length; evAt++) {
        const e = w.events[evAt]
        const kind = e[1]
        if (kind === "shepherd_start") {
          const last = branches[branches.length - 1]
          if (!last || (e[0] as number) - last.t0 > 120) computeBranch(e[0] as number)
        }
        if (kind === "death" && e[2] === 0) {
          const br = branches[branches.length - 1]
          if (br && !br.done) {
            br.kidsActual = [1, 2, 3].filter((i) => w.alive[i]).length
            br.done = true
            const tr = document.createElement("tr")
            tr.innerHTML =
              `<td>${br.t0}</td><td>dead · ${br.kidsActual}</td>` +
              `<td>${br.parentAlive ? "alive" : "dead"} · ${br.kidsAlive}</td>` +
              `<td>${w.dmg[0].toFixed(3)}</td>`
            brBody.prepend(tr)
            while (brBody.children.length > 6) brBody.removeChild(brBody.lastChild!)
          }
        }
        if (kind === "shepherd_end") {
          // close the latest branch row with the actual outcome so far
          const br = branches[branches.length - 1]
          const dmgEp = e[2] as number
          if (br && !br.done && ((e[0] as number) - br.t0 > 60 || dmgEp > 0.02)) {
            br.kidsActual = [1, 2, 3].filter((i) => w.alive[i]).length
            br.done = true
            const tr = document.createElement("tr")
            tr.innerHTML =
              `<td>${br.t0}</td><td>${w.alive[0] ? "alive" : "dead"} · ${br.kidsActual}</td>` +
              `<td>${br.parentAlive ? "alive" : "dead"} · ${br.kidsAlive}</td>` +
              `<td>${dmgEp.toFixed(3)}</td>`
            brBody.prepend(tr)
            while (brBody.children.length > 6) brBody.removeChild(brBody.lastChild!)
          }
        }
        let row: string | null = null
        if (kind === "lost") row = `<td>${e[0]}</td><td>lost</td><td>child ${e[2]}</td><td></td>`
        if (kind === "search_start")
          row = `<td>${e[0]}</td><td>search</td><td>child ${e[2]}</td><td>E ${fmtE(e[3] as number)}</td>`
        if (kind === "reunion")
          row = `<td>${e[0]}</td><td>reunion</td><td>child ${e[2]}</td><td>${e[4]} t · E ${fmtE(e[3] as number)}</td>`
        if (kind === "storm_season")
          row = `<td>${e[0]}</td><td>storm</td><td>${e[2]}, ${e[3]}</td><td>sev ${e[4]}</td>`
        if (kind === "death")
          row = `<td>${e[0]}</td><td>death</td><td>${e[2] === 0 ? "parent" : `child ${e[2]}`}</td><td>${e[3]}</td>`
        if (row) {
          const tr = document.createElement("tr")
          tr.innerHTML = row
          evBody.prepend(tr)
          while (evBody.children.length > 9) evBody.removeChild(evBody.lastChild!)
        }
      }
    }

    const tickOnce = () => {
      if (w.t >= P.T || !w.alive.some(Boolean)) return
      step(w)
      const at = (trailAt % TRAIL) * 2
      for (let i = 0; i < 4; i++) {
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
      if (w.t % histStep === 0) {
        histT.push(w.t)
        for (let i = 0; i < 4; i++) histE[i].push(w.alive[i] ? w.E[i] : 0)
      }
    }

    const paceFor = () => 12 * SPEEDS[speedIdx]

    const updateData = () => {
      const I = stormIntensity(w)
      el("t").textContent = String(w.t)
      el("season").textContent = String(
        w.t < P.firstOnset ? 0 : Math.floor((w.t - P.firstOnset) / P.season) + 1
      )
      el("sev").textContent = w.t < P.firstOnset ? "0.00" : w.stormSev.toFixed(2)
      el("I").textContent = I.toFixed(2)
      const names = ["p", "c1", "c2", "c3"]
      for (let i = 0; i < 4; i++) {
        el(`${names[i]}E`).textContent = w.alive[i] ? fmtE(w.E[i]) : "dead"
        el(`${names[i]}m`).textContent = w.alive[i] ? MNAME[w.mode[i]] : w.deathBy[i]
      }
      el("fed").textContent = (w.fed[1] + w.fed[2] + w.fed[3]).toFixed(2)
      el("dmg").textContent = w.dmg[0].toFixed(2)
      el("shield").textContent = w.dmgShield.toFixed(2)
    }

    const draw2 = () => {
      const c = sctx
      const I = stormIntensity(w)
      // camera follows the living family and the search marks
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      let any = false
      for (let i = 0; i < 4; i++) {
        if (!w.alive[i]) continue
        any = true
        minX = Math.min(minX, w.x[i])
        minY = Math.min(minY, w.y[i])
        maxX = Math.max(maxX, w.x[i])
        maxY = Math.max(maxY, w.y[i])
      }
      if (!any) {
        minX = P.home[0] - 10
        maxX = P.home[0] + 10
        minY = P.home[1] - 10
        maxY = P.home[1] + 10
      }
      if (w.searchEp) {
        const j = w.searchEp.child
        minX = Math.min(minX, w.seenX[j])
        maxX = Math.max(maxX, w.seenX[j])
        minY = Math.min(minY, w.seenY[j])
        maxY = Math.max(maxY, w.seenY[j])
      }
      if (I > 0) {
        minX = Math.min(minX, w.stormX - P.stormR)
        maxX = Math.max(maxX, w.stormX + P.stormR)
        minY = Math.min(minY, w.stormY - P.stormR)
        maxY = Math.max(maxY, w.stormY + P.stormR)
      }
      const pad = 9
      const span = Math.max(maxX - minX, maxY - minY) + pad * 2
      const zT = Math.max(1, Math.min(2.6, P.size / span))
      const cxT = (minX + maxX) / 2
      const cyT = (minY + maxY) / 2
      cam.z += (zT - cam.z) * 0.03
      cam.x += (cxT - cam.x) * 0.05
      cam.y += (cyT - cam.y) * 0.05
      const vh = SIDE / (2 * cam.z)
      const camPX = Math.max(vh, Math.min(SIDE - vh, cam.x * SCALE))
      const camPY = Math.max(vh, Math.min(SIDE - vh, cam.y * SCALE))
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.clearRect(0, 0, SIDE, SIDE)
      c.setTransform(cam.z, 0, 0, cam.z, SIDE / 2 - camPX * cam.z, SIDE / 2 - camPY * cam.z)
      c.drawImage(ground, 0, 0)
      // field parcels
      for (let k = 0; k < P.patches.length; k++) {
        const x = P.patches[k][0] * SCALE
        const y = P.patches[k][1] * SCALE
        const frac = w.stock[k] / P.patchMax
        for (let r = 0; r < 2; r++) {
          for (let q = 0; q < 3; q++) {
            const px = x - 14 + q * 10
            const py = y - 9 + r * 10
            const on = frac > (r * 3 + q + 0.5) / 6
            c.fillStyle = on ? "rgba(179,162,118,0.34)" : "rgba(179,162,118,0.08)"
            c.fillRect(px, py, 8, 7)
          }
        }
      }
      // trails
      for (let i = 3; i >= 0; i--) {
        c.beginPath()
        let started = false
        for (let s = 0; s < TRAIL; s++) {
          const idx = ((trailAt + s) % TRAIL) * 2 + i * TRAIL * 2
          const tx = trail[idx]
          const ty = trail[idx + 1]
          if (tx < 0) {
            started = false
            continue
          }
          if (!started) {
            c.moveTo(tx * SCALE, ty * SCALE)
            started = true
          } else c.lineTo(tx * SCALE, ty * SCALE)
        }
        c.strokeStyle = i === 0 ? "rgba(224,218,200,0.4)" : "rgba(224,218,200,0.18)"
        c.lineWidth = i === 0 ? 1.1 / cam.z : 0.7 / cam.z
        c.stroke()
      }
      // severed-branch ghost paths
      for (const br of branches) {
        if (br.path.length < 2) continue
        c.beginPath()
        c.setLineDash([3 / cam.z, 4 / cam.z])
        c.moveTo(br.path[0][0] * SCALE, br.path[0][1] * SCALE)
        for (const [bx, by] of br.path) c.lineTo(bx * SCALE, by * SCALE)
        c.strokeStyle = "rgba(214,208,192,0.3)"
        c.lineWidth = 0.9 / cam.z
        c.stroke()
        c.setLineDash([])
      }
      // storm
      if (I > 0) {
        const x = w.stormX * SCALE
        const y = w.stormY * SCALE
        const R = P.stormR * SCALE
        const a = I * Math.min(1, w.stormSev / 1.4)
        const gr = c.createRadialGradient(x, y, R * 0.15, x, y, R)
        gr.addColorStop(0, `rgba(194,58,43,${0.34 * a})`)
        gr.addColorStop(1, `rgba(194,58,43,${0.06 * a})`)
        c.beginPath()
        c.arc(x, y, R, 0, 2 * Math.PI)
        c.fillStyle = gr
        c.fill()
        c.beginPath()
        c.arc(x, y, R, 0, 2 * Math.PI)
        c.strokeStyle = `rgba(194,58,43,${0.25 + 0.5 * I})`
        c.lineWidth = 1.6 / cam.z
        c.stroke()
      }
      // graves
      for (let i = 0; i < 4; i++) {
        if (w.alive[i] || w.deathT[i] < 0) continue
        // final trail position approximates the grave
      }
      // sight threads
      c.lineWidth = 0.6 / cam.z
      for (let i = 1; i < 4; i++) {
        if (!w.alive[i] || !w.alive[0]) continue
        if (dist(w, 0, i) < P.sightR) {
          c.beginPath()
          c.moveTo(w.x[0] * SCALE, w.y[0] * SCALE)
          c.lineTo(w.x[i] * SCALE, w.y[i] * SCALE)
          c.strokeStyle = "rgba(214,208,192,0.22)"
          c.stroke()
        }
      }
      // during a search: the parent's remembered position of the child
      if (w.searchEp && w.alive[0]) {
        const j = w.searchEp.child
        const x = w.seenX[j] * SCALE
        const y = w.seenY[j] * SCALE
        c.beginPath()
        c.moveTo(x - 4 / cam.z, y)
        c.lineTo(x + 4 / cam.z, y)
        c.moveTo(x, y - 4 / cam.z)
        c.lineTo(x, y + 4 / cam.z)
        c.strokeStyle = "rgba(236,158,64,0.7)"
        c.lineWidth = 1 / cam.z
        c.stroke()
      }
      // a lost child's remembered position of the parent
      for (let i = 1; i < 4; i++) {
        if (!w.alive[i] || w.mode[i] !== M.LOST) continue
        const x = w.pSeenX[i] * SCALE
        const y = w.pSeenY[i] * SCALE
        c.beginPath()
        c.arc(x, y, 3.2 / cam.z, 0, 2 * Math.PI)
        c.strokeStyle = "rgba(214,208,192,0.45)"
        c.lineWidth = 0.8 / cam.z
        c.stroke()
      }
      // the family
      for (let i = 3; i >= 0; i--) {
        if (!w.alive[i]) continue
        const x = w.x[i] * SCALE
        const y = w.y[i] * SCALE
        const r = (i === 0 ? 2.4 : 1.7) / Math.sqrt(cam.z)
        c.beginPath()
        c.arc(x, y, r, 0, 2 * Math.PI)
        c.fillStyle = i === 0 ? "rgba(240,235,220,0.95)" : "rgba(224,218,200,0.9)"
        c.fill()
        if (i === 0) {
          c.beginPath()
          c.arc(x, y, r + 1.6 / cam.z, 0, 2 * Math.PI)
          c.strokeStyle = "rgba(240,235,220,0.35)"
          c.lineWidth = 0.7 / cam.z
          c.stroke()
        }
      }
      c.setTransform(1, 0, 0, 1, 0, 0)
    }

    const drawChart = () => {
      const cw = chart.width
      const ch = chart.height
      cctx.clearRect(0, 0, cw, ch)
      if (histT.length < 2) return
      const t0 = histT[0]
      const t1 = histT[histT.length - 1]
      const xFor = (t: number) => ((t - t0) / Math.max(1, t1 - t0)) * (cw - 8) + 4
      // storm season bands
      for (const e of w.events) {
        if (e[1] !== "storm_season") continue
        const ts = e[0] as number
        if (ts + P.stormLen < t0) continue
        const x0 = xFor(Math.max(t0, ts))
        const x1 = xFor(Math.min(t1, ts + P.stormLen))
        cctx.fillStyle = "rgba(194,58,43,0.12)"
        cctx.fillRect(x0, 0, Math.max(1, x1 - x0), ch)
      }
      const cols = [PAL.ink, PAL.ca, PAL.cb, PAL.accent]
      for (let i = 0; i < 4; i++) {
        cctx.beginPath()
        let started = false
        for (let s = 0; s < histT.length; s++) {
          const v = histE[i][s]
          if (v <= 0) {
            started = false
            continue
          }
          const x = xFor(histT[s])
          const y = ch - 4 - v * (ch - 8)
          if (!started) {
            cctx.moveTo(x, y)
            started = true
          } else cctx.lineTo(x, y)
        }
        cctx.strokeStyle = cols[i]
        cctx.lineWidth = i === 0 ? 1.6 : 1
        cctx.globalAlpha = i === 0 ? 0.95 : 0.8
        cctx.stroke()
        cctx.globalAlpha = 1
      }
      // deaths
      for (let i = 0; i < 4; i++) {
        if (w.deathT[i] < 0 || w.deathT[i] < t0) continue
        const x = xFor(w.deathT[i])
        cctx.beginPath()
        cctx.moveTo(x - 3, ch - 6)
        cctx.lineTo(x + 3, ch - 12)
        cctx.moveTo(x + 3, ch - 6)
        cctx.lineTo(x - 3, ch - 12)
        cctx.strokeStyle = cols[i]
        cctx.lineWidth = 1.2
        cctx.stroke()
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

    // cohort base rates, computed in idle chunks with the same kernel
    const cohort = {
      care: { pDead: 0, near: 0, far: 0, orphan: 0, kidDead: 0, n: 0 },
      severed: { pDead: 0, near: 0, far: 0, orphan: 0, kidDead: 0, n: 0 },
    }
    const COHORT_N = 100
    let coSeed = 1
    let coCare = true
    let coTimer = 0
    const cohortChunk = () => {
      if (coSeed > COHORT_N && !coCare) {
        const rows = [
          ["condition", "runs", "parent deaths", "child deaths", "beside parent", "apart", "orphaned"],
        ]
        for (const [name, s] of [
          ["care intact", cohort.care],
          ["care severed", cohort.severed],
        ] as const) {
          rows.push([
            name, String(s.n), String(s.pDead), String(s.kidDead),
            String(s.near), String(s.far), String(s.orphan),
          ])
        }
        coBody.innerHTML = rows
          .slice(1)
          .map(
            (r) =>
              `<tr>${r.map((v, ix) => (ix === 0 ? `<td>${v}</td>` : `<td>${v}</td>`)).join("")}</tr>`
          )
          .join("")
        return
      }
      const wc = makeWorld(coSeed, coCare)
      while (wc.t < P.T && wc.alive.some(Boolean)) step(wc)
      const s = coCare ? cohort.care : cohort.severed
      s.n++
      if (!wc.alive[0]) s.pDead++
      s.kidDead += [1, 2, 3].filter((i) => !wc.alive[i]).length
      for (const e of wc.events) {
        if (e[1] !== "death" || e[2] === 0 || e[3] !== "storm") continue
        const dp = e[4] as number
        if (dp < 0) s.orphan++
        else if (dp <= P.callR + 2) s.near++
        else s.far++
      }
      if (coCare && coSeed === COHORT_N) {
        coCare = false
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
        <span>seed <span data-k="seed">1</span></span>
      </div>
      <canvas
        data-stage
        width={SIDE}
        height={SIDE}
        className="w-full border border-[var(--site-line)]"
      />
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 smallcaps text-[10px] text-[var(--site-muted)]">
        <span>large point: parent</span>
        <span>small points: children</span>
        <span>cross: parent&apos;s memory of the missing child</span>
        <span>ring: a lost child&apos;s memory of the parent</span>
        <span>dashed line: severed branch, same tick, care off</span>
      </div>

      <canvas data-chart width={1140} height={110} className="mt-6 w-full" />
      <div className="mt-1 flex gap-6 smallcaps text-[10px] text-[var(--site-muted)]">
        <span style={{ color: "var(--site-ink)" }}>parent</span>
        <span style={{ color: "var(--twv-ca)" }}>child 1</span>
        <span style={{ color: "var(--twv-cb)" }}>child 2</span>
        <span style={{ color: "var(--site-accent)" }}>child 3</span>
        <span>shaded: storm seasons</span>
      </div>

      <div className="twv-tables mt-5 grid gap-6 md:grid-cols-3 md:justify-between">
        <table>
          <caption>State</caption>
          <tbody>
            <tr><td>t</td><td data-k="t">0</td></tr>
            <tr><td>season</td><td data-k="season">0</td></tr>
            <tr><td>storm severity</td><td data-k="sev">0.00</td></tr>
            <tr><td>storm intensity</td><td data-k="I">0.00</td></tr>
            <tr><td>energy given</td><td data-k="fed">0.00</td></tr>
            <tr><td>parent damage</td><td data-k="dmg">0.00</td></tr>
            <tr><td>of it shielding</td><td data-k="shield">0.00</td></tr>
          </tbody>
        </table>
        <table>
          <caption>Family</caption>
          <thead>
            <tr><th></th><th>energy</th><th>state</th></tr>
          </thead>
          <tbody>
            <tr><td>parent</td><td data-k="pE">0.85</td><td data-k="pm">loiter</td></tr>
            <tr><td>child 1</td><td data-k="c1E">0.55</td><td data-k="c1m">loiter</td></tr>
            <tr><td>child 2</td><td data-k="c2E">0.60</td><td data-k="c2m">loiter</td></tr>
            <tr><td>child 3</td><td data-k="c3E">0.65</td><td data-k="c3m">loiter</td></tr>
          </tbody>
        </table>
        <table>
          <caption>Events</caption>
          <thead>
            <tr><th>t</th><th>event</th><th>who</th><th></th></tr>
          </thead>
          <tbody data-events></tbody>
        </table>
      </div>

      <div className="twv-tables mt-5 grid gap-6 md:grid-cols-2 md:justify-between">
        <table>
          <caption>Shepherding, actual against severed branch</caption>
          <thead>
            <tr><th>t</th><th>actual: parent · children</th><th>severed: parent · children</th><th>damage</th></tr>
          </thead>
          <tbody data-branches></tbody>
        </table>
        <table>
          <caption>Base rates, seeds 1 to 100, full runs</caption>
          <thead>
            <tr><th>condition</th><th>runs</th><th>parent deaths</th><th>child deaths</th><th>beside parent</th><th>apart</th><th>orphaned</th></tr>
          </thead>
          <tbody data-cohort>
            <tr><td colSpan={7}>computing</td></tr>
          </tbody>
        </table>
      </div>

      <div className="twv-tables mt-5">
        <table>
          <caption>Parameters</caption>
          <tbody>
            <tr><td>world</td><td>64 &times; 64</td><td>speed adult / child</td><td>0.5 / 0.38</td><td>sight radius</td><td>6</td></tr>
            <tr><td>notice delay</td><td>160</td><td>lost, then home after</td><td>1200</td><td>explore range</td><td>16 to 40</td></tr>
            <tr><td>storm radius</td><td>12</td><td>storm damage</td><td>0.005 &times; severity</td><td>severity range</td><td>0.6 to 2.2</td></tr>
            <tr><td>child / adult damage</td><td>1.3 / 0.7</td><td>shield fraction</td><td>0.5</td><td>panic freeze</td><td>0.3</td></tr>
            <tr><td>escort / call radius</td><td>2.5 / 6</td><td>feed rate</td><td>0.003</td><td>season length</td><td>2600</td></tr>
            <tr><td>search floor</td><td>none</td><td>shepherd floor</td><td>none</td><td>run length</td><td>24000</td></tr>
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
