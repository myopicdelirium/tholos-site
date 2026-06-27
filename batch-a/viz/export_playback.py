#!/usr/bin/env python3
"""Export a run as a compact playback artifact for the web player (WO-V3).

Enforces the non-negotiable rule: the browser **replays logged data; it never
re-simulates.** Everything that determines *what happens* is produced here, in
Python, from a real run's logs (agent tracks, deaths, per-tick scalars) plus the
deterministically-rebuilt static fields. The player only computes pixels.

Pipeline: run the sim (writes logs) -> read its logs -> rebuild the world for the
static field grids -> write `<case>.json`. Re-exporting the same (config, seed,
ticks, stride) is byte-identical.

    python -m viz.export_playback --config a4.yaml --seed 1 \
        --ticks 1500 --stride 5 --out ../public/runs/a4.json

Schema (format_version 1): see `site/lib/playback.ts` for the matching loader.
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from batch_a.config import Config, load_config          # noqa: E402
from batch_a.environment.world import World              # noqa: E402
from batch_a.rng import RNGStreams                        # noqa: E402
from batch_a.sim import Simulation                        # noqa: E402

NEEDS = ["energy", "hydration", "temperature_comfort", "safety"]
ACTIONS = ["move", "drink", "eat", "rest", "flee"]
CAUSES = ["energy", "hydration", "temperature_comfort", "safety", "predation"]


def _u8_field(grid: np.ndarray) -> dict:
    """Quantize a [0,1] field to uint8 and base64-encode it."""
    q = np.clip(np.asarray(grid) * 255.0, 0, 255).astype(np.uint8)
    return {"w": int(q.shape[1]), "h": int(q.shape[0]),
            "data": base64.b64encode(q.tobytes()).decode("ascii")}


def _static_fields(config: Config, seed: int) -> dict:
    """Rebuild the world deterministically and dump its static field grids.

    This is the environment the run actually used (same seed, same config) — the
    exporter dumps it so the player can *render* it without ever evolving it.
    """
    world = World(config, RNGStreams(seed).environment)
    fields = {}
    if world.moisture is not None:
        fields["moisture"] = _u8_field(world.moisture.grid)
    if world.temperature is not None:
        fields["temperature"] = _u8_field(world.temperature.grid)  # base gradient
    if world.risk is not None:
        fields["risk"] = _u8_field(world.risk.grid)  # initial risk landscape
    # comfort band bounds travel as metadata so the player can shade the band
    tc = config.fields.temperature
    band = {"low": float(tc.comfort_low), "high": float(tc.comfort_high)} \
        if config.fields.temperature.enabled else None
    return fields, band


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


def _build_frames(run_dir: Path, stride: int, env: dict):
    """Stream ticks.csv into strided frames; bucket deaths into the next frame."""
    by_tick: dict[int, dict] = {}
    deaths_pending: list = []  # (cause_code, x, y) accumulated since last emitted
    frames = []
    max_tick = 0

    # group rows by tick (file is already tick-ordered, but be safe)
    rows_by_tick: dict[int, list] = {}
    with open(run_dir / "ticks.csv", newline="") as fh:
        for row in csv.DictReader(fh):
            t = int(row["tick"])
            rows_by_tick.setdefault(t, []).append(row)
            max_tick = max(max_tick, t)

    for t in range(max_tick + 1):
        rows = rows_by_tick.get(t, [])
        for row in rows:
            if row["alive"] == "0" and row.get("cause_of_death"):
                c = row["cause_of_death"]
                cc = CAUSES.index(c) if c in CAUSES else 0
                deaths_pending.append([int(row["x"]), int(row["y"]), cc])
        if t % stride != 0:
            continue
        agents = []
        for row in rows:
            if row["alive"] != "1":
                continue
            agents.append([
                int(row["x"]), int(row["y"]),
                int(round(float(row["need_energy"]) * 255)),
                int(round(float(row["need_hydration"]) * 255)),
                int(round(float(row["need_temperature_comfort"]) * 255)),
                int(round(float(row["need_safety"]) * 255)),
                ACTIONS.index(row["action"]) if row["action"] in ACTIONS else 0,
            ])
        e = env.get(t, {"drought": 0, "season": 0.0})
        frames.append({
            "t": t,
            "pop": len(agents),
            "season": round(e["season"], 4),
            "drought": e["drought"],
            "agents": agents,
            "deaths": deaths_pending,
        })
        deaths_pending = []
    return frames, max_tick


def export(config_name, seed, ticks, stride, out_path, run_id=None):
    config = load_config(config_name)
    d = config.to_dict()
    if ticks:
        d["run"]["max_ticks"] = int(ticks)
    config = Config(d, config_name)

    run_id = run_id or f"viz_{config.case}_s{seed}"
    sim = Simulation(config, seed, run_id=run_id)
    results = sim.run()
    run_dir = Path(results["out_dir"])

    env = _read_environment(run_dir)
    frames, max_tick = _build_frames(run_dir, stride, env)
    fields, band = _static_fields(config, seed)

    payload = {
        "format_version": 1,
        "case": config.case,
        "seed": int(seed),
        "git_commit": _git_commit(),
        "config_hash": config.env_hash(),
        "grid": int(config.world.size),
        "ticks": max_tick + 1,
        "stride": int(stride),
        "needs": NEEDS,
        "actions": ACTIONS,
        "causes": CAUSES,
        "comfort_band": band,
        "fields": fields,
        "frames": frames,
        "summary": {k: results[k] for k in (
            "extinct", "final_population", "peak_population", "total_births",
            "median_survival_time", "deaths_by_cause")},
    }

    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w") as fh:
        json.dump(payload, fh, separators=(",", ":"))
    kb = out.stat().st_size // 1024
    print(f"Wrote {out}  ({kb} KB, {len(frames)} frames, peak pop "
          f"{results['peak_population']}, extinct={results['extinct']})")
    return out


def _git_commit():
    import subprocess
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                              capture_output=True, text=True,
                              timeout=5).stdout.strip() or "unknown"
    except Exception:
        return "unknown"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--ticks", type=int, default=0, help="override max_ticks (0=config)")
    ap.add_argument("--stride", type=int, default=4)
    ap.add_argument("--out", required=True)
    ap.add_argument("--run-id", default=None)
    args = ap.parse_args()
    export(args.config, args.seed, args.ticks, args.stride, args.out, args.run_id)


if __name__ == "__main__":
    main()
