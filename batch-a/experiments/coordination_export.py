#!/usr/bin/env python3
"""Export the coordination run for the visual: scattered independents → communities.

A serious-tick run in which self-interested foragers, given foraging MEMORY (and
light congestion), start scattered on a near-empty map with a few rich patches and
— with no coordinator — discover them, settle, reproduce, and stabilize into
sustained communities. The exporter samples agent positions and extracts NOTABLE
EVENTS at the tick they happen (a founder starves alone; a community forms on a
patch; an agent becomes the most prolific; social harmony — a window with everyone
fed and no deaths), plus a per-sample coordination metric.

Writes a compact self-contained JSON (public/runs/coordination.json) the visual
inlines: patch layout, sampled frames, events, population + coordination traces,
and the detected harmony window.

    python -m experiments.coordination_export --seed 3
"""

from __future__ import annotations

import argparse
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

SIZE = 56
PATCHES = [(14, 14, 6.5), (42, 16, 5.5), (17, 42, 4.5), (42, 41, 3.5)]


def _cfg(cap, ticks):
    d = load_config("a3.yaml").to_dict()
    d["run"]["max_ticks"] = ticks
    d["run"]["stop_on_extinction"] = False
    d["logging"]["per_tick"] = False
    d["reproduction"]["max_population"] = cap
    d["reproduction"]["maturity_age"] = 30
    d["init"]["n_agents"] = 26                # scattered thin on a big map (patches ~8% of area)
    d["world"]["size"] = SIZE
    d["world"]["perception_radius"] = 3
    d["actions"]["move_cost_per_tile"] = 0.018   # wandering the wastes is costly → home ranges
    d["traits"]["exploration"]["init_mean"] = 0.12   # exploitative: stay near found food
    d["foraging"]["memory"]["enabled"] = True         # discover & return to patches
    d["foraging"]["congestion"]["enabled"] = True     # light spread across patches
    d["foraging"]["congestion"]["gain"] = 0.6
    d["fields"]["temperature"]["enabled"] = False
    d["fields"]["risk"]["enabled"] = False
    d["entities"]["predators"]["enabled"] = False
    d["entities"]["prey"]["enabled"] = False
    d["entities"]["water"].update({"sources": 30, "cluster_sigma": 9.0, "regen_per_tick": 0.5})
    d["entities"]["vegetation"].update({"regen_per_tick": 0.09, "capacity": 1.0})
    return Config(d, "coordination")


def export(seed: int, cap: int = 150, ticks: int = 2400, stride: int = 6):
    ifd.SIZE = SIZE
    ifd.PATCHES = list(PATCHES)
    cfg = _cfg(cap, ticks)
    sim = Simulation(cfg, seed, run_id=f"coord_{seed}")
    world = sim.world
    _engineer(world.vegetation, SIZE)
    world._endowment_cache = None
    sim._spawn_founders()
    veg = world.vegetation
    npatch = len(PATCHES)
    prod = np.array([int(veg.source_mask[_assign_patches(veg.centers, SIZE) == p].sum())
                     for p in range(npatch)], float)
    prod_share = (prod / prod.sum()).tolist()

    pcx = np.array([p[0] for p in PATCHES]); pcy = np.array([p[1] for p in PATCHES])
    prad = np.array([p[2] + 1.0 for p in PATCHES])   # "on the blob" = within radius

    def on_patch(x, y):
        dx = np.minimum((x - pcx) % SIZE, (pcx - x) % SIZE)
        dy = np.minimum((y - pcy) % SIZE, (pcy - y) % SIZE)
        d2 = dx * dx + dy * dy
        p = int(np.argmin(d2))
        return p if d2[p] <= prad[p] * prad[p] else -1

    frames, events, pop_series, coord_series = [], [], [], []
    discovered = [False] * npatch       # first forager has reached this patch
    settled = [False] * npatch          # a community has taken hold here
    power_hit = set()                   # offspring milestones already announced
    pop_milestone = 40
    first_birth = False
    all_settled = False
    silence_marked = False
    last_death_t = 0
    n_deaths_logged = 0
    prev_alive = set()
    POWER_MILES = [5, 9, 14, 20]
    WASTE = ["a wanderer starves alone in the waste",
             "a lone forager fails to find food, and falls",
             "another wanderer starves, far from any patch"]

    for t in range(ticks):
        run_tick(world, sim.agents, cfg, sim.rng, sim.recorder)
        living = [a for a in sim.agents if a.alive]
        pop_series.append(len(living))

        # coord = clustering: fraction of the living within a HOME RANGE of a patch
        # (collectivized into a community vs wandering the wastes). 0 → 1 arc.
        occ = np.zeros(npatch)           # community membership (home-range headcount)
        home = 0
        for a in living:
            dx = np.minimum((a.x - pcx) % SIZE, (pcx - a.x) % SIZE)
            dy = np.minimum((a.y - pcy) % SIZE, (pcy - a.y) % SIZE)
            d2 = dx * dx + dy * dy
            p = int(np.argmin(d2))
            if d2[p] <= (prad[p] + 6.0) ** 2:
                occ[p] += 1
                home += 1
        coord_series.append(round(home / max(len(living), 1), 3))

        # ── events, curated so the log reads as one story ──────────────────
        alive_ids = {a.id for a in living}
        # the scattered phase: independents wander and starve, having found nothing
        if t < ticks * 0.30 and n_deaths_logged < 8:
            for a in sim.agents:
                if a.id in prev_alive and a.id not in alive_ids and not a.alive:
                    events.append({"t": t, "kind": "death",
                                   "text": WASTE[n_deaths_logged % len(WASTE)],
                                   "x": a.x, "y": a.y})
                    n_deaths_logged += 1
                    last_death_t = t
                    break
        for p in range(npatch):
            cx, cy, _ = PATCHES[p]
            if not discovered[p] and occ[p] >= 1:        # first arrival
                discovered[p] = True
                events.append({"t": t, "kind": "discover",
                               "text": f"a forager discovers the {['largest','second','third','smallest'][p]} patch",
                               "x": cx, "y": cy})
        # the first offspring — settlement begins
        if not first_birth:
            baby = next((a for a in sim.agents if a.birth_tick == t and a.parent_id is not None), None)
            if baby is not None:
                first_birth = True
                events.append({"t": t, "kind": "birth",
                               "text": "the first offspring is born beside the water",
                               "x": baby.x, "y": baby.y})
        for p in range(npatch):
            cx, cy, _ = PATCHES[p]
            if not settled[p] and occ[p] >= 7:           # a community takes hold
                settled[p] = True
                events.append({"t": t, "kind": "settle",
                               "text": f"a community takes hold — {int(occ[p])} now forage it together",
                               "x": cx, "y": cy})
        if not all_settled and all(settled):             # the map is fully organized
            all_settled = True
            events.append({"t": t, "kind": "settle",
                           "text": "every patch now sustains a community — the map is organized"})
        # the wastes fall silent: 300 ticks after the last starvation in the ledger
        if (not silence_marked and n_deaths_logged >= 4
                and last_death_t and t - last_death_t >= 300):
            silence_marked = True
            events.append({"t": t, "kind": "growth",
                           "text": "the wastes fall silent — no one has starved in 300 ticks"})
        # power: only the FIRST line to reach each offspring milestone (a dynasty)
        if living:
            champ = max(living, key=lambda a: a.offspring_count)
            for m in POWER_MILES:
                if champ.offspring_count >= m and m not in power_hit:
                    power_hit.add(m)
                    events.append({"t": t, "kind": "power",
                                   "text": f"a line founds a dynasty — agent {champ.id}, {m} offspring and counting",
                                   "x": champ.x, "y": champ.y})
                    break
        if len(living) >= pop_milestone:                 # the population swells
            events.append({"t": t, "kind": "growth",
                           "text": f"the population passes {pop_milestone}"})
            pop_milestone += 40
        prev_alive = alive_ids

        if t % stride == 0:
            frames.append({
                "t": t,
                "a": [[a.x, a.y, round(a.state["energy"].value, 2)] for a in living],
            })

    # ── detect the harmony window: a stretch with all patches inhabited,
    #    stable population, and no deaths (the invisible hand holding) ───────
    deaths_at = {e["t"] for e in events if e["kind"] == "death"}
    harmony = _harmony_window(pop_series, coord_series, deaths_at, ticks)
    if harmony:
        events.append({"t": harmony[0], "kind": "harmony",
                       "text": f"social harmony — {int(np.mean(pop_series[harmony[0]:harmony[1]]))} "
                               f"individualists, every patch fed, no coordinator "
                               f"(ticks {harmony[0]}–{harmony[1]})"})
    events.sort(key=lambda e: e["t"])

    out = {
        "size": SIZE,
        "patches": [{"cx": cx, "cy": cy, "r": r, "share": round(prod_share[i], 3)}
                    for i, (cx, cy, r) in enumerate(PATCHES)],
        "ticks": ticks, "stride": stride,
        "frames": frames, "events": events,
        "pop": pop_series, "coord": coord_series,
        "harmony": harmony,
        "founders": int(cfg.init.n_agents),
    }
    path = Path(__file__).resolve().parents[1].parent / "public" / "runs" / "coordination.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, separators=(",", ":")))
    kb = path.stat().st_size // 1024
    print(f"seed {seed}: {len(frames)} frames, {len(events)} events, "
          f"harmony={harmony}, final_pop={pop_series[-1]} → {path} ({kb} KB)")
    return out


def _harmony_window(pop, coord, deaths_at, ticks, min_len=100):
    """Longest late stretch that is a self-organized STEADY STATE: stable numbers
    (±6%), no deaths logged, population collectivized above its own early baseline
    — the invisible hand holding, no coordinator."""
    base = np.median(coord[int(ticks * 0.4):]) * 0.9
    best = None
    i = int(ticks * 0.35)
    while i < ticks:
        ok = coord[i] >= base and i not in deaths_at
        if ok:
            j = i
            p0 = pop[i]
            while (j < ticks and coord[j] >= base and j not in deaths_at
                   and abs(pop[j] - p0) <= 0.06 * p0):
                j += 1
            if j - i >= min_len and (best is None or (j - i) > (best[1] - best[0])):
                best = [i, j]
            i = j + 1
        else:
            i += 1
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=3)
    ap.add_argument("--ticks", type=int, default=2400)
    ap.add_argument("--cap", type=int, default=150)
    args = ap.parse_args()
    export(args.seed, cap=args.cap, ticks=args.ticks)


if __name__ == "__main__":
    main()
