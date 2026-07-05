"""Experiment driver: seed sweeps + cross-seed aggregation (§8.3, §8.4).

Runs a case (optionally across spawn conditions and the §1 ablations) over many
seeds, then aggregates per the paper's discipline: median across seeds with a
percentile bootstrap CI. Writes a tidy results table per experiment.

    python experiments/run_experiment.py --config a2.yaml --seeds 0-19 \
        --conditions uniform,born_rich,born_poor --ablations none,freeze_learning,freeze_traits

This is the surface on which the A2 claim becomes testable:
    survival ~ birthplace_endowment × exploration_trait
with learning-frozen and trait-frozen runs as controls.
"""

from __future__ import annotations

import argparse
import copy
import csv
import json
from pathlib import Path

# Allow running as a script from the repo root.
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from batch_a.config import Config, load_config          # noqa: E402
from batch_a.metrics import bootstrap_ci                 # noqa: E402
from batch_a.sim import Simulation                        # noqa: E402

_ABLATIONS = {
    "none": {},
    "freeze_learning": {"learning": {"enabled": False}},
    "freeze_traits": {"traits": {"fix_identical": True}},
}


def _parse_seeds(spec):
    out = []
    for part in spec.split(","):
        if "-" in part:
            lo, hi = part.split("-")
            out.extend(range(int(lo), int(hi) + 1))
        elif part.strip():
            out.append(int(part))
    return out


def _apply(base: dict, override: dict) -> dict:
    out = copy.deepcopy(base)
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _apply(out[k], v)
        else:
            out[k] = v
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--seeds", default="0-9")
    ap.add_argument("--conditions", default="uniform",
                    help="comma list of spawn modes")
    ap.add_argument("--ablations", default="none",
                    help="comma list of: none,freeze_learning,freeze_traits")
    ap.add_argument("--out", default="experiments/results")
    args = ap.parse_args()

    base_cfg = load_config(args.config).to_dict()
    seeds = _parse_seeds(args.seeds)
    conditions = args.conditions.split(",")
    ablations = args.ablations.split(",")

    rows = []
    agg_rows = []
    for cond in conditions:
        for abl in ablations:
            cfg_dict = _apply(base_cfg, {"init": {"spawn_mode": cond}})
            cfg_dict = _apply(cfg_dict, _ABLATIONS[abl])
            cfg = Config(cfg_dict, f"{args.config}:{cond}:{abl}")

            cell = {"final_population": [], "median_survival_time": [],
                    "total_births": [], "extinct": []}
            for seed in seeds:
                rid = f"{cfg_dict['case']}_{cond}_{abl}_s{seed}"
                res = Simulation(cfg, seed, run_id=rid).run()
                rows.append({"condition": cond, "ablation": abl, "seed": seed,
                             **{k: res[k] for k in cell}})
                for k in cell:
                    cell[k].append(res[k])
                print(f"{cond:10} {abl:15} seed {seed:>3}: "
                      f"pop={res['final_population']:>4} "
                      f"births={res['total_births']:>4} "
                      f"surv={res['median_survival_time']:.0f} "
                      f"extinct={res['extinct']}")

            for metric, vals in cell.items():
                if metric == "extinct":
                    agg_rows.append({"condition": cond, "ablation": abl,
                                     "metric": "extinction_rate",
                                     "median": sum(vals) / len(vals),
                                     "ci_low": None, "ci_high": None,
                                     "n": len(vals)})
                else:
                    ci = bootstrap_ci(vals)
                    agg_rows.append({"condition": cond, "ablation": abl,
                                     "metric": metric, **ci})

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = Path(args.config).stem
    _write_csv(out_dir / f"{stem}_runs.csv", rows)
    _write_csv(out_dir / f"{stem}_aggregate.csv", agg_rows)
    with open(out_dir / f"{stem}_aggregate.json", "w") as fh:
        json.dump(agg_rows, fh, indent=2)
    print(f"\nWrote {out_dir}/{stem}_runs.csv and {stem}_aggregate.csv")


def _write_csv(path, rows):
    if not rows:
        return
    with open(path, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)


if __name__ == "__main__":
    main()
