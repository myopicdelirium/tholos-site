#!/usr/bin/env python3
"""WO-1 — A1 diagnostic: is survival *learned* or *scripted*? (§9.1)

A 2×2 factorial on the single-agent A1 case:

    learning ∈ {on, frozen}   ×   gradient ∈ {on, off}

- learning frozen  = `learning.enabled: false` (Q-gains never update).
- gradient off     = `fields.moisture.enabled: false` (no moisture field, so no
  gradient cue toward water; water sources still exist).

Reading:
  * If (frozen, on) survives like (on, on) → survival is the scripted
    gradient-following policy, not within-lifetime learning → A1 is "scripted".
  * If survival collapses when learning is frozen → learning carries it.
  * If (·, off) dies regardless → navigation depends on the gradient.

Reports fraction-surviving and median survival time with a percentile bootstrap
CI, across >= 20 seeds per cell. Diagnostics are diagnostics: nulls reported
honestly, nothing tuned to rescue a result.

    python -m experiments.wo1_a1_diagnostic --seeds 0-19
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from batch_a.config import Config, load_config          # noqa: E402
from batch_a.metrics import bootstrap_ci                 # noqa: E402
from batch_a.sim import Simulation                        # noqa: E402

CELLS = [
    ("learn_on__grad_on", True, True),
    ("learn_frozen__grad_on", False, True),
    ("learn_on__grad_off", True, False),
    ("learn_frozen__grad_off", False, False),
]


def _parse_seeds(spec):
    out = []
    for part in spec.split(","):
        if "-" in part:
            lo, hi = part.split("-")
            out.extend(range(int(lo), int(hi) + 1))
        elif part.strip():
            out.append(int(part))
    return out


def run(seeds, out_dir, max_ticks):
    base = load_config("a1.yaml").to_dict()
    base["run"]["max_ticks"] = max_ticks
    base["logging"]["per_tick"] = False  # diagnostic: only need the outcome

    rows = []
    summary = []
    for name, learn, grad in CELLS:
        d = json.loads(json.dumps(base))
        d["learning"]["enabled"] = learn
        d["fields"]["moisture"]["enabled"] = grad
        cfg = Config(d, f"wo1:{name}")

        surv_times, survived = [], []
        for seed in seeds:
            res = Simulation(cfg, seed, run_id=f"wo1_{name}_s{seed}").run()
            st = res["median_survival_time"]  # single agent → its survival time
            alive = not res["extinct"]
            surv_times.append(st)
            survived.append(1 if alive else 0)
            rows.append({"cell": name, "learning": learn, "gradient": grad,
                         "seed": seed, "survival_time": st, "survived": int(alive)})

        ci = bootstrap_ci(surv_times)
        frac = sum(survived) / len(survived)
        summary.append({"cell": name, "learning": learn, "gradient": grad,
                        "n": len(seeds), "frac_survived": round(frac, 3),
                        "median_survival": ci["median"],
                        "ci_low": round(ci["ci_low"], 1) if ci["ci_low"] else None,
                        "ci_high": round(ci["ci_high"], 1) if ci["ci_high"] else None})
        print(f"{name:26} learn={str(learn):5} grad={str(grad):5} | "
              f"survived {frac*100:5.1f}%  median_surv {ci['median']:.0f} "
              f"[{ci['ci_low']:.0f}, {ci['ci_high']:.0f}]  (n={len(seeds)})")

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    with open(out / "wo1_a1_runs.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    with open(out / "wo1_a1_summary.json", "w") as fh:
        json.dump(summary, fh, indent=2)
    print(f"\nWrote {out}/wo1_a1_runs.csv and wo1_a1_summary.json")
    return summary


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", default="0-19")
    ap.add_argument("--max-ticks", type=int, default=1500)
    ap.add_argument("--out", default="experiments/results")
    args = ap.parse_args()
    run(_parse_seeds(args.seeds), args.out, args.max_ticks)


if __name__ == "__main__":
    main()
