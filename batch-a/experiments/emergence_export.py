#!/usr/bin/env python3
"""Export the C2′ emergence result for a visual: the coordination landscape and
the evolutionary path that walks away from its peak.

Two datasets over the SAME axis — the heritable crowd-gene g_crowd:

  landscape : a fixed immortal flock in which EVERY agent is hand-set to the same
              g_crowd. Measures the matching correlation the flock achieves at that
              gene value. The peak sits at NEGATIVE g_crowd (avoid crowds = the
              Ideal Free Distribution, r≈1); it collapses as g_crowd goes positive
              (herding). This is the coordination *available* at each gene value.

  trajectory: one real evolutionary run (births, deaths, selection, mutation),
              founders blind (g_crowd≈0). Samples the population-mean g_crowd and
              the live matching r over time. The population walks toward POSITIVE
              g_crowd — away from the coordinated peak — because the individually
              optimal move is toward food, which is toward others.

Writes public/runs/emergence.json.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from batch_a.config import Config, load_config          # noqa: E402
from batch_a.scheduler import run_tick                    # noqa: E402
from batch_a.sim import Simulation                        # noqa: E402
from experiments.ifd_probe import _engineer, _assign_patches   # noqa: E402
import experiments.ifd_probe as ifd                       # noqa: E402

SIZE = 44
PATCHES = [(12, 12, 6.0), (32, 13, 4.6), (13, 32, 3.4), (32, 32, 2.2)]
FLOOR = 0.06


def _base(ticks):
    d = load_config("a3.yaml").to_dict()
    d["run"]["max_ticks"] = ticks
    d["run"]["stop_on_extinction"] = False
    d["logging"]["per_tick"] = False
    d["world"]["size"] = SIZE
    d["world"]["perception_radius"] = 12
    d["actions"]["move_cost_per_tile"] = 0.004
    d["traits"]["exploration"]["init_mean"] = 0.12
    d["fields"]["temperature"]["enabled"] = False
    d["fields"]["risk"]["enabled"] = False
    d["entities"]["predators"]["enabled"] = False
    d["entities"]["prey"]["enabled"] = False
    d["entities"]["water"].update({"sources": 26, "cluster_sigma": 9.0,
                                   "regen_per_tick": 0.5, "capacity": 1.0})
    return d


# ---------------------------------------------------------------------------
def _landscape_cfg(g_crowd, ticks):
    d = _base(ticks)
    d["reproduction"]["enabled"] = False
    d["init"]["n_agents"] = 44
    d["traits"]["fix_identical"] = True
    fp = d["traits"]["forage_policy"]
    fp.update({"enabled": True, "density_radius": 3, "density_norm": 8.0})
    fp["g_food"].update({"init_mean": 1.0, "init_sd": 0.0, "mutation_sd": 0.0})
    fp["g_crowd"].update({"init_mean": float(g_crowd), "init_sd": 0.0, "mutation_sd": 0.0})
    d["entities"]["vegetation"].update({"regen_per_tick": 0.06, "capacity": 1.0})
    return Config(d, f"land:{g_crowd}")


def landscape_point(g_crowd, seeds=(0, 1, 2), ticks=800):
    ifd.SIZE = SIZE; ifd.PATCHES = list(PATCHES)
    rs = []
    for seed in seeds:
        cfg = _landscape_cfg(g_crowd, ticks)
        sim = Simulation(cfg, seed, run_id=f"land_{g_crowd}_{seed}")
        world = sim.world; veg = world.vegetation
        _engineer(veg, SIZE); world._endowment_cache = None; sim._spawn_founders()
        label = _assign_patches(veg.centers, SIZE); n = len(PATCHES)
        prod = np.array([int(veg.source_mask[label == p].sum()) for p in range(n)], float)
        occ = np.zeros(n); start = int(ticks * 0.55)
        for t in range(ticks):
            for a in sim.agents:
                if a.alive:
                    for nm in ("energy", "hydration"):
                        nd = a.state[nm]
                        if nd.value < FLOOR:
                            nd.value = FLOOR
            run_tick(world, sim.agents, cfg, sim.rng, sim.recorder)
            if t >= start:
                for a in sim.agents:
                    if a.alive:
                        occ[label[a.y % SIZE, a.x % SIZE]] += 1
        ps = prod / prod.sum(); os_ = occ / max(occ.sum(), 1)
        rs.append(float(np.corrcoef(ps, os_)[0, 1]))
    return float(np.mean(rs))


# ---------------------------------------------------------------------------
def _traj_cfg(ticks):
    d = _base(ticks)
    d["reproduction"]["enabled"] = True
    d["reproduction"]["max_population"] = 250
    d["reproduction"]["maturity_age"] = 25
    d["init"]["n_agents"] = 70
    fp = d["traits"]["forage_policy"]
    fp.update({"enabled": True, "density_radius": 3, "density_norm": 8.0})
    fp["g_food"].update({"init_mean": 1.0, "init_sd": 0.4, "mutation_sd": 0.08})
    fp["g_crowd"].update({"init_mean": 0.0, "init_sd": 0.4, "mutation_sd": 0.08})
    d["entities"]["vegetation"].update({"regen_per_tick": 0.02, "capacity": 1.0})
    return Config(d, "traj")


def trajectory(seed=1, ticks=5000, sample=60):
    ifd.SIZE = SIZE; ifd.PATCHES = list(PATCHES)
    cfg = _traj_cfg(ticks)
    sim = Simulation(cfg, seed, run_id=f"traj_{seed}")
    world = sim.world; veg = world.vegetation
    _engineer(veg, SIZE); world._endowment_cache = None; sim._spawn_founders()
    label = _assign_patches(veg.centers, SIZE); n = len(PATCHES)
    prod = np.array([int(veg.source_mask[label == p].sum()) for p in range(n)], float)
    ema = np.zeros(n); pts = []
    for t in range(ticks):
        run_tick(world, sim.agents, cfg, sim.rng, sim.recorder)
        living = [a for a in sim.agents if a.alive]
        if not living:
            break
        occ = np.zeros(n)
        for a in living:
            occ[label[a.y % SIZE, a.x % SIZE]] += 1
        ema = 0.97 * ema + 0.03 * occ
        if t % sample == 0:
            gc = float(np.mean([a.traits.g_crowd for a in living]))
            r = float(np.corrcoef(prod, ema)[0, 1]) if ema.std() > 1e-9 else 0.0
            pts.append({"t": t, "gc": round(gc, 3), "r": round(r, 3), "pop": len(living)})
    return pts


def main():
    gvals = [-2.5, -2.0, -1.5, -1.0, -0.6, -0.3, 0.0, 0.3, 0.6, 1.0, 1.5, 2.0]
    print("landscape:")
    land = []
    for g in gvals:
        r = landscape_point(g)
        land.append({"gc": g, "r": round(r, 3)})
        print(f"  g_crowd {g:+.1f} -> r {r:+.2f}")
    print("trajectory:")
    traj = trajectory()
    print(f"  {len(traj)} samples, g_crowd {traj[0]['gc']:+.2f} -> {traj[-1]['gc']:+.2f}, "
          f"r {traj[0]['r']:+.2f} -> {traj[-1]['r']:+.2f}")
    peak = max(land, key=lambda p: p["r"])
    out = {"landscape": land, "trajectory": traj,
           "peak": peak, "greedy_r": next(p["r"] for p in land if p["gc"] == 0.0)}
    path = Path(__file__).resolve().parents[2] / "public" / "runs" / "emergence.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, separators=(",", ":")))
    print(f"peak r {peak['r']} at g_crowd {peak['gc']}; greedy r {out['greedy_r']}")
    print(f"→ {path}")


if __name__ == "__main__":
    main()
