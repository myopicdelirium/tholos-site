#!/usr/bin/env python3
"""WO-4 — A3 population cap: real carrying capacity, or an artifact?

Runs the A3 stationary ecology at several `reproduction.max_population` caps and
asks whether the steady-state population *tracks the cap* (the cap is the binding
ceiling → "carrying capacity" is an artifact, A3 is too easy, and WO-2's
birthplace/selection results mean little) or *plateaus below it* (a real
resource-limited carrying capacity → competition is real).

Steady-state = median per-tick population over the last 40% of the run.
Saturation  = steady / cap. If saturation stays ≈ 1 as the cap rises, the cap is
binding. If steady flattens at some absolute number (saturation falls as the cap
rises), the limit is ecological.

    python -m experiments.wo4_a3_cap --caps 400,800,1500 --seeds 0-9

Diagnostics are diagnostics — reported as they come, no world-tuning.
"""

from __future__ import annotations

import argparse
import csv
import json
import statistics
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from batch_a.config import Config, load_config          # noqa: E402
from batch_a.metrics import bootstrap_ci                 # noqa: E402
from batch_a.sim import Simulation                        # noqa: E402


def _parse_seeds(spec):
    out = []
    for part in spec.split(","):
        if "-" in part:
            lo, hi = part.split("-")
            out.extend(range(int(lo), int(hi) + 1))
        elif part.strip():
            out.append(int(part))
    return out


def _steady(series, frac=0.4):
    tail = series[-max(1, int(len(series) * frac)):]
    return statistics.median(tail) if tail else 0


def _still_growing(series):
    """Positive → population still climbing at the end (not yet saturated)."""
    n = len(series)
    if n < 20:
        return 0.0
    last = statistics.mean(series[-n // 10:])
    prev = statistics.mean(series[-n // 5:-n // 10])
    return round(last - prev, 1)


def run(caps, seeds, ticks, out_dir):
    base = load_config("a3.yaml").to_dict()
    base["run"]["max_ticks"] = ticks
    base["run"]["stop_on_extinction"] = False
    base["logging"]["per_tick"] = False

    rows, summary = [], []
    for cap in caps:
        d = json.loads(json.dumps(base))
        d["reproduction"]["max_population"] = cap
        cfg = Config(d, f"wo4:cap{cap}")

        steadies, sats, peaks, growing = [], [], [], []
        for seed in seeds:
            sim = Simulation(cfg, seed, run_id=f"wo4_cap{cap}_s{seed}")
            res = sim.run()
            st = _steady(sim.pop_series)
            steadies.append(st)
            sats.append(st / cap)
            peaks.append(res["peak_population"])
            growing.append(_still_growing(sim.pop_series))
            rows.append({"cap": cap, "seed": seed, "steady": st,
                         "saturation": round(st / cap, 3),
                         "peak": res["peak_population"],
                         "final": res["final_population"],
                         "still_growing": _still_growing(sim.pop_series)})

        ci = bootstrap_ci(steadies)
        summary.append({
            "cap": cap, "n": len(seeds),
            "steady_median": ci["median"],
            "steady_ci": [round(ci["ci_low"], 0), round(ci["ci_high"], 0)],
            "saturation_median": round(statistics.median(sats), 3),
            "peak_median": statistics.median(peaks),
            "still_growing_median": round(statistics.median(growing), 1),
        })
        print(f"cap {cap:>4} | steady {ci['median']:>6.0f} "
              f"[{ci['ci_low']:.0f},{ci['ci_high']:.0f}]  "
              f"saturation {statistics.median(sats):.2f}  "
              f"peak {statistics.median(peaks):.0f}  "
              f"end-slope {statistics.median(growing):+.1f}  (n={len(seeds)})")

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    with open(out / "wo4_a3_cap_runs.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    with open(out / "wo4_a3_cap_summary.json", "w") as fh:
        json.dump(summary, fh, indent=2)

    # verdict
    sats = [s["saturation_median"] for s in summary]
    print("\nVERDICT:", "cap is BINDING (saturation stays high as cap rises) — "
          "carrying capacity is an artifact"
          if min(sats) > 0.85 else
          "steady population PLATEAUS below higher caps — real ecological limit"
          if max(sats) - min(sats) > 0.25 else
          "ambiguous — inspect the numbers")
    print(f"Wrote {out}/wo4_a3_cap_runs.csv and wo4_a3_cap_summary.json")
    return summary


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--caps", default="400,800,1500")
    ap.add_argument("--seeds", default="0-9")
    ap.add_argument("--ticks", type=int, default=1500)
    ap.add_argument("--out", default="experiments/results")
    args = ap.parse_args()
    caps = [int(c) for c in args.caps.split(",")]
    run(caps, _parse_seeds(args.seeds), args.ticks, args.out)


if __name__ == "__main__":
    main()
