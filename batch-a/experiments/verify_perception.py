#!/usr/bin/env python3
"""Acceptance bar for a fast (vectorized) perception path — no-regression check.

WHAT THIS PROVES, EXACTLY: that a candidate perception implementation produces a
**bit-identical full tick stream** to the current (scalar) reference. That is
*no regression from current behaviour* — NOT that the science is correct. Both
impls descend from the same source and can agree while both being wrong. A green
result here must never be read as validating the model; it only licenses swapping
the fast path in without changing what the sim does.

The bar (per the WO-2/WO-3 amendment review) is boundary-stressing + full-horizon,
because divergence is cumulative — a short easy run can pass while a long one
drifts. Each case targets a specific way a batch path could silently diverge:
  * wrap_edge : size-10 grid, radius 2 → most agents' Moore windows STRADDLE the
                x/y=0 seam every tick (window is 5 wide on a 10-wide torus), so a
                wrong (clamped / non-wrapping) gather diverges immediately — the
                seam is crossed, not merely approached.
  * tie       : water+vegetation saturated to a flat capacity plateau across the
                whole grid (huge cluster_sigma, regen ≥ cap) → every window's
                argmax is an N-way tie, forcing the first-in-scan-order tie-break
                to match the scalar '>' scan exactly; veg and prey cue strengths
                also tie (exercises the '>=' food-cue pick).
  * rich      : a resource-rich world (fills any cap) at the full horizon.
  * poor      : a resource-poor world (plateaus below cap) at the full horizon —
                tighter dynamics amplify any cumulative float drift.
Each runs the reference and the candidate and hashes the per-tick, per-agent
stream (excluding the run_id column). Any single differing bit fails the case.

    # once perception.impl='vectorized' exists:
    python -m experiments.verify_perception --candidate vectorized --ticks 3000

Until then, --candidate scalar diffs scalar-vs-scalar (identity must hold; proves
the harness itself).
"""

from __future__ import annotations

import argparse
import csv
import hashlib
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from batch_a.config import Config, load_config          # noqa: E402
from batch_a.sim import Simulation                        # noqa: E402

# (name, base_case, seed, overrides) — seeds 0/2 are rich/poor per WO-4.
CASES = [
    ("wrap_edge", "a3.yaml", 1, {
        "world": {"size": 10, "perception_radius": 2},
        "init": {"n_agents": 40}, "reproduction": {"max_population": 200}}),
    ("tie", "a3.yaml", 3, {
        "world": {"size": 16, "perception_radius": 2},
        "init": {"n_agents": 40}, "reproduction": {"max_population": 400},
        "entities": {
            "water": {"cluster_sigma": 100.0, "regen_per_tick": 1.0},
            "vegetation": {"cluster_sigma": 100.0, "regen_per_tick": 1.0}}}),
    ("rich", "a3.yaml", 0, {"reproduction": {"max_population": 1000}}),
    ("poor", "a3.yaml", 2, {"reproduction": {"max_population": 1000}}),
]


def _apply(base, override):
    import json
    out = json.loads(json.dumps(base))
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _apply(out[k], v)
        else:
            out[k] = v
    return out


def _run_hash(base_case, seed, ticks, impl, overrides, tag):
    d = load_config(base_case).to_dict()
    d["run"]["max_ticks"] = ticks
    d["run"]["stop_on_extinction"] = False
    d["logging"]["per_tick"] = True            # need the full stream to diff
    d.setdefault("perception", {})["impl"] = impl
    d = _apply(d, overrides)
    sim = Simulation(Config(d, f"verify:{tag}:{impl}"), seed, run_id=f"verify_{tag}_{impl}")
    out = Path(sim.run()["out_dir"]) / "ticks.csv"
    h = hashlib.sha256()
    with open(out, newline="") as fh:
        for row in csv.reader(fh):
            h.update((",".join(row[1:]) + "\n").encode())  # drop run_id (col 0)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidate", default="scalar",
                    help="perception.impl to test against the scalar reference")
    ap.add_argument("--ticks", type=int, default=3000)
    ap.add_argument("--cases", default="wrap_edge,tie,rich,poor")
    args = ap.parse_args()
    wanted = set(args.cases.split(","))

    all_ok = True
    for name, base_case, seed, ov in CASES:
        if name not in wanted:
            continue
        ref = _run_hash(base_case, seed, args.ticks, "scalar", ov, name)
        cand = _run_hash(base_case, seed, args.ticks, args.candidate, ov, name)
        ok = ref == cand
        all_ok &= ok
        print(f"{name:10} ({args.ticks}t)  {'PASS' if ok else 'FAIL'}  "
              f"ref={ref[:16]} cand={cand[:16]}")
    print("\n" + ("ALL PASS — no regression from scalar (NOT a correctness proof)."
                  if all_ok else "FAIL — candidate diverges from scalar; do not trust it."))
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
