#!/usr/bin/env python3
"""Does the substrate already show the invisible hand? — an Ideal Free Distribution probe.

Real coordination has a falsifiable signature: self-interested foragers with only
local information distribute across patches IN PROPORTION to patch productivity,
until per-capita payoff equalizes and no one can do better by moving (Fretwell &
Lucas 1970). This probe measures that on the EXISTING Batch A rules — no new
mechanism — because depletion may already be the hidden hand: a crowded patch is
eaten down, its local richness falls, and marginal foragers drift elsewhere.

Stage: vegetation is the single patchy contested resource (several distinct
patches of unequal size → unequal productivity). Water is ubiquitous, temperature
and predators off — so foraging is the only pressure and death does not confound
the distribution. Patches = vegetation source clusters (Voronoi by center).

  matching slope : occupancy_p ~ productivity_p across patches (IFD predicts > 0, R² high)
  ablation       : --blind sets perception_radius 0 (can't perceive relative richness)
                   → the matching must collapse if it was coordination, not co-location.

    python -m experiments.ifd_probe --seed 0
    python -m experiments.ifd_probe --seed 0 --blind
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from batch_a.config import Config, load_config          # noqa: E402
from batch_a.environment.entities import toroidal_delta  # noqa: E402
from batch_a.scheduler import run_tick                    # noqa: E402
from batch_a.sim import Simulation                        # noqa: E402


SIZE = 48
# engineered patches (cx, cy, radius): area ∝ r² sets productivity in a KNOWN ratio,
# well separated so each is its own Voronoi cell — the stickleback-feeder design.
PATCHES = [(12, 12, 7.0), (36, 12, 5.0), (12, 36, 3.5), (36, 36, 2.2)]


def _stage(blind: bool, cap: int, ticks: int, memory: bool = False):
    d = load_config("a3.yaml").to_dict()
    d["run"]["max_ticks"] = ticks
    d["run"]["stop_on_extinction"] = False
    d["logging"]["per_tick"] = False
    d["reproduction"]["max_population"] = cap
    d["init"]["n_agents"] = 40
    d["world"]["size"] = SIZE
    d["world"]["perception_radius"] = 0 if blind else 3
    d["foraging"]["memory"]["enabled"] = bool(memory)   # coordination mechanism
    # isolate foraging: veg is the patchy resource; water everywhere; no heat/threat
    d["fields"]["temperature"]["enabled"] = False
    d["fields"]["risk"]["enabled"] = False
    d["entities"]["predators"]["enabled"] = False
    d["entities"]["prey"]["enabled"] = False
    d["entities"]["water"].update({"sources": 30, "cluster_sigma": 8.0,
                                   "regen_per_tick": 0.5, "capacity": 1.0})
    d["entities"]["vegetation"].update({"regen_per_tick": 0.08, "capacity": 1.0})
    return Config(d, f"ifd:{'blind' if blind else 'sighted'}")


def _engineer(veg, size):
    """Replace the vegetation field with the fixed unequal-productivity patches."""
    gy, gx = np.mgrid[0:size, 0:size]
    mask = np.zeros((size, size), bool)
    centers = []
    for (cx, cy, rad) in PATCHES:
        ddx = np.minimum((gx - cx) % size, (cx - gx) % size)
        ddy = np.minimum((gy - cy) % size, (cy - gy) % size)
        mask |= (ddx * ddx + ddy * ddy) <= rad * rad
        centers.append((cx, cy))
    veg.source_mask = mask
    veg.quantity = np.where(mask, veg.capacity, 0.0)
    veg.centers = centers


def _assign_patches(centers, size):
    """Voronoi label for every tile by nearest (toroidal) vegetation center."""
    cx = np.array([c[0] for c in centers])
    cy = np.array([c[1] for c in centers])
    gy, gx = np.mgrid[0:size, 0:size]
    best = np.full((size, size), -1, int)
    bestd = np.full((size, size), 1e9)
    for p in range(len(centers)):
        ddx = np.minimum((gx - cx[p]) % size, (cx[p] - gx) % size)
        ddy = np.minimum((gy - cy[p]) % size, (cy[p] - gy) % size)
        dist = ddx * ddx + ddy * ddy
        m = dist < bestd
        best[m] = p
        bestd[m] = dist[m]
    return best


def run(seed: int, blind: bool, cap: int = 250, ticks: int = 1500, memory: bool = False):
    cfg = _stage(blind, cap, ticks, memory)
    tag = "blind" if blind else ("mem" if memory else "sighted")
    sim = Simulation(cfg, seed, run_id=f"ifd_{tag}_{seed}")
    world = sim.world
    size = world.size
    veg = world.vegetation
    _engineer(veg, size)                 # fixed unequal patches
    world._endowment_cache = None        # spawn/endowment must see the new field
    sim._spawn_founders()
    centers = veg.centers
    label = _assign_patches(centers, size)

    # productivity_p = regenerating source tiles in patch p (× regen = throughput)
    src = veg.source_mask
    n_patches = len(centers)
    productivity = np.array([int(src[label == p].sum()) for p in range(n_patches)],
                            float) * veg.regen_per_tick

    occ = np.zeros(n_patches)
    intake_num = np.zeros(n_patches)     # summed realized energy on-patch (proxy)
    intake_den = np.zeros(n_patches)
    start = int(ticks * 0.6)
    samples = 0
    for t in range(ticks):
        run_tick(world, sim.agents, cfg, sim.rng, sim.recorder)
        if t >= start:
            samples += 1
            for a in sim.agents:
                if not a.alive:
                    continue
                p = label[a.y % size, a.x % size]
                occ[p] += 1
                # standing veg the agent sits on = realized foraging opportunity
                intake_num[p] += veg.available(a.x, a.y)
                intake_den[p] += 1

    occ_share = occ / max(occ.sum(), 1)
    prod_share = productivity / max(productivity.sum(), 1e-9)
    keep = productivity > 0
    slope = float(np.polyfit(prod_share[keep], occ_share[keep], 1)[0]) if keep.sum() >= 3 else None
    r = (float(np.corrcoef(prod_share[keep], occ_share[keep])[0, 1])
         if keep.sum() >= 3 and prod_share[keep].std() > 1e-9 else None)
    # payoff equalization: CV of per-capita standing resource across occupied patches
    occupied = intake_den > 0
    percap = intake_num[occupied] / intake_den[occupied]
    payoff_cv = float(percap.std() / percap.mean()) if percap.mean() > 1e-9 else None
    # the sharp IFD signal: agents-per-unit-productivity should be EQUAL everywhere
    app = occ[keep] / productivity[keep]
    app_cv = float(app.std() / app.mean()) if app.mean() > 1e-9 else None
    alive = sum(a.alive for a in sim.agents)

    return {
        "mode": tag, "seed": seed, "n_patches": n_patches,
        "final_pop": alive, "samples": samples,
        "productivity": [round(x, 2) for x in productivity],
        "occupancy_share": [round(x, 3) for x in occ_share],
        "matching_slope": None if slope is None else round(slope, 2),
        "matching_r": None if r is None else round(r, 2),
        "agents_per_prod_cv": None if app_cv is None else round(app_cv, 3),
        "payoff_cv": None if payoff_cv is None else round(payoff_cv, 3),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--blind", action="store_true")
    ap.add_argument("--memory", action="store_true")
    ap.add_argument("--ticks", type=int, default=1500)
    args = ap.parse_args()
    out = run(args.seed, args.blind, ticks=args.ticks, memory=args.memory)
    print(json.dumps(out))


if __name__ == "__main__":
    main()


def diagnostic(seed, cap, ticks):
    """Per-patch standing food vs occupancy — is it a perception limit or density?"""
    cfg = _stage(False, cap, ticks)
    sim = Simulation(cfg, seed, run_id=f"ifd_diag_{seed}")
    world = sim.world; size = world.size; veg = world.vegetation
    _engineer(veg, size); world._endowment_cache = None; sim._spawn_founders()
    label = _assign_patches(veg.centers, size)
    n = len(veg.centers)
    prod = np.array([int(veg.source_mask[label == p].sum()) for p in range(n)], float) * veg.regen_per_tick
    occ = np.zeros(n); food = np.zeros(n); samp = 0
    start = int(ticks * 0.6)
    for t in range(ticks):
        run_tick(world, sim.agents, cfg, sim.rng, sim.recorder)
        if t >= start:
            samp += 1
            for a in sim.agents:
                if a.alive:
                    occ[label[a.y % size, a.x % size]] += 1
            food += np.array([veg.quantity[label == p].sum() for p in range(n)])
    occ /= samp; food /= samp
    percap = occ / np.maximum(prod, 1e-9)
    print(f"cap={cap} pop={sum(a.alive for a in sim.agents)}")
    for p in range(n):
        print(f"  patch{p} prod={prod[p]:5.2f} agents={occ[p]:5.1f} standing_food={food[p]:6.1f} agents/prod={percap[p]:.2f}")
