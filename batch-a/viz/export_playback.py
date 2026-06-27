#!/usr/bin/env python3
"""Export a run as a playback artifact for the web player (WO-V3, schema v2).

Non-negotiable rule: the browser **replays logged data; it never re-simulates.**
Everything that determines *what happens* is produced here, in Python, from a
real run's logs. The player only computes pixels.

Schema v2 splits a light **manifest** (renders immediately — population trace,
cap line, water cells, comfort band) from the heavy **frames** payload
(per-agent tracks with stable ids, traits, age; per-tick predators; birth/death
events). This is the progressive-load contract in the build spec.

    python -m viz.export_playback --config a4.yaml --seed 3 \
        --ticks 1500 --stride 5 --out ../public/runs/a4

Writes `<out>.manifest.json` and `<out>.frames.json`. Matching loader:
`site/lib/playback.ts`.
"""

from __future__ import annotations

import argparse
import csv
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from batch_a.config import Config, load_config          # noqa: E402
from batch_a.environment.world import World              # noqa: E402
from batch_a.rng import RNGStreams                        # noqa: E402
from batch_a.sim import Simulation                        # noqa: E402

FORMAT_VERSION = 2
NEEDS = ["energy", "hydration", "temperature_comfort", "safety"]
ACTIONS = ["move", "drink", "eat", "rest", "flee"]
CAUSES = ["energy", "hydration", "temperature_comfort", "safety", "predation"]


def _git_commit():
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                              capture_output=True, text=True,
                              timeout=5).stdout.strip() or "unknown"
    except Exception:
        return "unknown"


def _substrate(config: Config, seed: int):
    """Static, structural environment, rebuilt deterministically from the run.

    Returns water source cells and the comfort-band grid rows — *structure*,
    not field gradients (the locked aesthetic renders survey-plate structure).
    """
    world = World(config, RNGStreams(seed).environment)
    water_cells = []
    if world.water is not None:
        ys, xs = np.where(world.water.source_mask)
        water_cells = [[int(x), int(y)] for x, y in zip(xs, ys)]

    comfort_band = None
    tc = config.fields.temperature
    if config.fields.temperature.enabled:
        size = world.size
        lo, hi = float(tc.low), float(tc.high)
        span = (hi - lo) or 1.0
        # temperature is a linear gradient along y; invert for the band rows
        y_low = (float(tc.comfort_low) - lo) / span * (size - 1)
        y_high = (float(tc.comfort_high) - lo) / span * (size - 1)
        comfort_band = {
            "yLow": round(min(y_low, y_high), 2),
            "yHigh": round(max(y_low, y_high), 2),
            "label": "COMFORT BAND",
        }
    return water_cells, comfort_band


def _read_environment(run_dir: Path) -> dict:
    env = {}
    path = run_dir / "environment.csv"
    if not path.exists():
        return env
    with open(path, newline="") as fh:
        for row in csv.DictReader(fh):
            env[int(row["tick"])] = {
                "drought": int(float(row.get("in_drought", 0))),
                "season": float(row.get("season_phase", 0.0)),
            }
    return env


def _read_fauna(run_dir: Path) -> dict:
    """tick -> list of [x, y] predator positions."""
    fauna: dict[int, list] = {}
    path = run_dir / "fauna.csv"
    if not path.exists():
        return fauna
    with open(path, newline="") as fh:
        for row in csv.DictReader(fh):
            if row.get("kind") != "predator":
                continue
            fauna.setdefault(int(row["tick"]), []).append(
                [int(row["x"]), int(row["y"])])
    return fauna


def _build(run_dir: Path, stride: int, env: dict, fauna: dict):
    """Stream ticks.csv into: full per-tick population series + strided frames
    with agent tracks (stable ids), and birth/death events bucketed to frames."""
    rows_by_tick: dict[int, list] = {}
    max_tick = 0
    first_seen: dict[int, int] = {}
    with open(run_dir / "ticks.csv", newline="") as fh:
        for row in csv.DictReader(fh):
            t = int(row["tick"])
            rows_by_tick.setdefault(t, []).append(row)
            max_tick = max(max_tick, t)

    population = [0] * (max_tick + 1)
    frames = []
    pending_deaths: list = []
    pending_births: list = []

    for t in range(max_tick + 1):
        rows = rows_by_tick.get(t, [])
        alive_rows = [r for r in rows if r["alive"] == "1"]
        population[t] = len(alive_rows)

        for r in rows:
            aid = int(r["agent_id"])
            if aid not in first_seen:
                first_seen[aid] = t
                if t > 0:  # founders (t==0) aren't births
                    pending_births.append([aid, int(r["x"]), int(r["y"])])
            if r["alive"] == "0" and r.get("cause_of_death"):
                c = r["cause_of_death"]
                pending_deaths.append(
                    [aid, int(r["x"]), int(r["y"]),
                     CAUSES.index(c) if c in CAUSES else 0])

        if t % stride != 0:
            continue

        agents = []
        for r in alive_rows:
            aid = int(r["agent_id"])
            agents.append([
                aid, int(r["x"]), int(r["y"]),
                int(round(float(r["need_energy"]) * 255)),
                int(round(float(r["need_hydration"]) * 255)),
                int(round(float(r["need_temperature_comfort"]) * 255)),
                int(round(float(r["need_safety"]) * 255)),
                int(round(float(r["trait_exploration"]) * 255)),
                t - first_seen[aid],  # age in ticks
            ])
        e = env.get(t, {"drought": 0, "season": 0.0})
        frames.append({
            "t": t,
            "season": round(e["season"], 4),
            "drought": e["drought"],
            "agents": agents,
            "predators": fauna.get(t, []),
            "births": pending_births,
            "deaths": pending_deaths,
        })
        pending_births = []
        pending_deaths = []

    return population, frames, max_tick


def export(config_name, seed, ticks, stride, out_stem, run_id=None):
    config = load_config(config_name)
    d = config.to_dict()
    if ticks:
        d["run"]["max_ticks"] = int(ticks)
    config = Config(d, config_name)

    run_id = run_id or f"viz_{config.case}_s{seed}"
    results = Simulation(config, seed, run_id=run_id).run()
    run_dir = Path(results["out_dir"])

    env = _read_environment(run_dir)
    fauna = _read_fauna(run_dir)
    population, frames, max_tick = _build(run_dir, stride, env, fauna)
    water_cells, comfort_band = _substrate(config, seed)

    common = {
        "format_version": FORMAT_VERSION,
        "case": config.case,
        "seed": int(seed),
        "git_commit": _git_commit(),
        "config_hash": config.env_hash(),
    }

    manifest = {
        **common,
        "grid": int(config.world.size),
        "ticks": max_tick + 1,
        "stride": int(stride),
        "frameCount": len(frames),
        "cap": int(config.reproduction.max_population),
        "population": population,
        "waterCells": water_cells,
        "comfortBand": comfort_band,
        "needs": NEEDS,
        "actions": ACTIONS,
        "causes": CAUSES,
        "stressThreshold": 64,  # uint8 need level (~0.25) below which an agent is stressed
        "framesUrl": Path(out_stem).name + ".frames.json",
        "summary": {k: results[k] for k in (
            "extinct", "final_population", "peak_population", "total_births",
            "median_survival_time", "deaths_by_cause")},
    }
    payload = {**common, "frames": frames}

    out = Path(out_stem)
    out.parent.mkdir(parents=True, exist_ok=True)
    man_path = out.with_suffix(".manifest.json")
    frm_path = Path(str(out) + ".frames.json")
    with open(man_path, "w") as fh:
        json.dump(manifest, fh, separators=(",", ":"))
    with open(frm_path, "w") as fh:
        json.dump(payload, fh, separators=(",", ":"))

    mk = man_path.stat().st_size // 1024
    fk = frm_path.stat().st_size // 1024
    print(f"Wrote {man_path.name} ({mk} KB) + {frm_path.name} ({fk} KB) · "
          f"{len(frames)} frames · peak {results['peak_population']} · "
          f"extinct={results['extinct']}")
    return man_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--ticks", type=int, default=0)
    ap.add_argument("--stride", type=int, default=4)
    ap.add_argument("--out", required=True, help="output stem (no extension)")
    ap.add_argument("--run-id", default=None)
    args = ap.parse_args()
    export(args.config, args.seed, args.ticks, args.stride, args.out, args.run_id)


if __name__ == "__main__":
    main()
