#!/usr/bin/env python3
"""Retrodiction R1 — Milinski's sticklebacks, run on the real model.

Six immortal foragers, two feeders at a 5:1 productivity ratio, perception
spanning the world. At steady state our depleting patches deliver food-eaten =
food-regenerated, so per-capita intake at a feeder = productivity ÷ foragers there
— Milinski's non-depleting rate-sharing, reached by a different route. The
productivities are REVERSED at the midpoint to test re-tracking.

Two agents on the identical world, only the foraging rule differing:
  reward-rate (per-capita, congestion k=1.0) — the hypothesis
  greedy (raw food)                          — the null

Predictions are locked in docs/RETRODICTION_IFD_SPEC.md. Writes
public/runs/ifd_retrodiction.json (share-on-patch-A trajectory for both agents,
the ideal step, the reversal tick).

    python -m experiments.ifd_retrodiction
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

SIZE = 24
N_FISH = 6
N_RICH, N_POOR = 15, 3          # source-tile counts → 5:1 productivity, exactly
CA = (6, 12)                     # rich feeder (patch A), left end
CB = (18, 12)                    # poor feeder (patch B), right end
FLOOR = 0.06
RATIO = N_RICH / N_POOR          # 5.0
IDEAL_A = N_RICH / (N_RICH + N_POOR)   # 0.833 share on A when A is rich


def _nearest_tiles(center, n, size):
    cx, cy = center
    gy, gx = np.mgrid[0:size, 0:size]
    dx = np.minimum((gx - cx) % size, (cx - gx) % size)
    dy = np.minimum((gy - cy) % size, (cy - gy) % size)
    d2 = (dx * dx + dy * dy).ravel()
    idx = np.argsort(d2, kind="stable")[:n]
    ys, xs = np.divmod(idx, size)
    return list(zip(xs.tolist(), ys.tolist()))


def _set_feeders(veg, rich_left: bool):
    """Paint the two feeders; rich_left=True → A is the 15-tile feeder."""
    na, nb = (N_RICH, N_POOR) if rich_left else (N_POOR, N_RICH)
    mask = np.zeros((SIZE, SIZE), bool)
    for (x, y) in _nearest_tiles(CA, na, SIZE):
        mask[y, x] = True
    for (x, y) in _nearest_tiles(CB, nb, SIZE):
        mask[y, x] = True
    veg.source_mask = mask
    veg.quantity = np.where(mask, veg.capacity, 0.0)
    veg.centers = [CA, CB]


def _cfg(per_capita: bool, ticks: int, memory: bool = False):
    d = load_config("a3.yaml").to_dict()
    d["run"]["max_ticks"] = ticks
    d["run"]["stop_on_extinction"] = False
    d["logging"]["per_tick"] = False
    d["reproduction"]["enabled"] = False
    d["init"]["n_agents"] = N_FISH
    d["world"]["size"] = SIZE
    d["world"]["perception_radius"] = 12          # spans the tank: both feeders assessable
    d["actions"]["move_cost_per_tile"] = 0.003
    d["traits"]["exploration"]["init_mean"] = 0.10
    d["foraging"]["memory"]["enabled"] = bool(memory)          # R1b: intake-rate perception
    d["foraging"]["congestion"]["enabled"] = bool(per_capita)   # the ONE difference (R1)
    d["foraging"]["congestion"]["gain"] = 1.0                    # from theory, not fitted
    d["foraging"]["congestion"]["radius"] = 3
    d["fields"]["temperature"]["enabled"] = False
    d["fields"]["risk"]["enabled"] = False
    d["entities"]["predators"]["enabled"] = False
    d["entities"]["prey"]["enabled"] = False
    d["entities"]["water"].update({"sources": 12, "cluster_sigma": 6.0,
                                   "regen_per_tick": 0.5, "capacity": 1.0})
    d["entities"]["vegetation"].update({"regen_per_tick": 0.06, "capacity": 1.0})
    return Config(d, f"r1:{'percap' if per_capita else 'greedy'}")


def share_on_A(agents):
    ca = np.array(CA); cb = np.array(CB)
    na = 0; tot = 0
    for a in agents:
        if not a.alive:
            continue
        tot += 1
        da = min((a.x - ca[0]) % SIZE, (ca[0] - a.x) % SIZE) ** 2 + \
             min((a.y - ca[1]) % SIZE, (ca[1] - a.y) % SIZE) ** 2
        db = min((a.x - cb[0]) % SIZE, (cb[0] - a.x) % SIZE) ** 2 + \
             min((a.y - cb[1]) % SIZE, (cb[1] - a.y) % SIZE) ** 2
        na += 1 if da <= db else 0
    return na / max(tot, 1)


def run(per_capita, seed, ticks, reversal, memory=False):
    cfg = _cfg(per_capita, ticks, memory)
    sim = Simulation(cfg, seed, run_id=f"r1_{per_capita}_{seed}")
    world = sim.world; veg = world.vegetation
    _set_feeders(veg, rich_left=True)
    world._endowment_cache = None
    sim._spawn_founders()
    traj = []
    for t in range(ticks):
        if t == reversal:
            _set_feeders(veg, rich_left=False)      # swap the feeders
        for a in sim.agents:
            if a.alive:
                for nm in ("energy", "hydration"):
                    nd = a.state[nm]
                    if nd.value < FLOOR:
                        nd.value = FLOOR
        run_tick(world, sim.agents, cfg, sim.rng, sim.recorder)
        traj.append(share_on_A(sim.agents))
    return np.array(traj)


def mean_traj(per_capita, seeds, ticks, reversal, memory=False):
    return np.mean([run(per_capita, s, ticks, reversal, memory) for s in seeds], axis=0)


def steady(traj, lo, hi):
    return float(np.mean(traj[lo:hi]))


def main():
    ticks = 1600
    reversal = ticks // 2
    seeds = list(range(8))
    pc = mean_traj(True, seeds, ticks, reversal)                    # R1 per-capita (memory off)
    gr = mean_traj(False, seeds, ticks, reversal)                   # null: greedy
    rate = mean_traj(True, seeds, ticks, reversal, memory=True)     # R1b: rate-perceiving

    pre = (int(reversal * 0.6), reversal)          # steady window before reversal
    post = (int(reversal + reversal * 0.6), ticks) # steady window after reversal
    out = {
        "size": SIZE, "n_fish": N_FISH, "ratio": RATIO, "ideal_A": round(IDEAL_A, 3),
        "ticks": ticks, "reversal": reversal, "seeds": len(seeds), "stride": 4,
        "percap": [round(float(x), 3) for x in pc[::4]],
        "greedy": [round(float(x), 3) for x in gr[::4]],
        "rate": [round(float(x), 3) for x in rate[::4]],
        "summary": {
            "percap_rich_pre": round(steady(pc, *pre), 3),
            "percap_rich_post": round(1 - steady(pc, *post), 3),
            "greedy_rich_pre": round(steady(gr, *pre), 3),
            "greedy_rich_post": round(1 - steady(gr, *post), 3),
            "rate_rich_pre": round(steady(rate, *pre), 3),
            "rate_rich_post": round(1 - steady(rate, *post), 3),
        },
    }
    path = Path(__file__).resolve().parents[2] / "public" / "runs" / "ifd_retrodiction.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, separators=(",", ":")))
    s = out["summary"]
    print(f"ideal share on rich patch = {IDEAL_A:.3f}  (5:1)")
    print(f"R1  per-capita (mem off): rich share  pre {s['percap_rich_pre']:.2f}   post {s['percap_rich_post']:.2f}")
    print(f"    greedy null          : rich share  pre {s['greedy_rich_pre']:.2f}   post {s['greedy_rich_post']:.2f}")
    print(f"R1b rate-perceiving (mem): rich share  pre {s['rate_rich_pre']:.2f}   post {s['rate_rich_post']:.2f}")
    print(f"→ {path}")


if __name__ == "__main__":
    main()
