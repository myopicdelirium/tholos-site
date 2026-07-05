#!/usr/bin/env python3
"""WO-2 (amended) — birthplace × trait, within-world design, cap 2000.

Per the WO-2/WO-3 amendment: cap 400 homogenizes worlds, so run at a non-binding
cap (2000) and analyze *within* each world, then relate the within-world
birthplace slope to that world's carrying capacity.

Per (condition, ablation, seed) on A3:
  * run at cap 2000, >= 3000 ticks, stop_on_extinction off;
  * within-world slopes from per-agent outcomes (computed in memory, no CSV):
      beta_surv = OLS(survival_time ~ birthplace_endowment)
      beta_off  = OLS(offspring     ~ birthplace_endowment)
      interaction coef of survival ~ endowment * trait_exploration
  * per-seed capacity R_s = mean population over the last 40% (cycle-averaged);
  * flags: cap_bound (R_s/cap > .9), still_climbing (end-slope);
  * selection: founder vs survivor mean trait (drift).

Headline (across seeds, per cell): OLS(beta_surv ~ R_s). Prediction: negative —
birthplace matters in poor worlds, not rich ones.

Checkpointed (resume after container restarts). Diagnostics reported as they come.

    python -m experiments.wo2_a3_birthplace \
        --seeds 0-19 --conditions uniform,born_rich,born_poor \
        --ablations none,freeze_learning,freeze_traits --cap 2000 --ticks 3000
"""

from __future__ import annotations

import argparse
import csv
import json
import statistics
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from batch_a.config import Config, load_config          # noqa: E402
from batch_a.metrics import bootstrap_ci                 # noqa: E402
from batch_a.sim import Simulation                        # noqa: E402

ABLATIONS = {
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


def _apply(base, override):
    out = json.loads(json.dumps(base))
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _apply(out[k], v)
        else:
            out[k] = v
    return out


def _ols_slope(x, y):
    x = np.asarray(x, float)
    y = np.asarray(y, float)
    if x.size < 3 or x.std() < 1e-9:
        return None
    return float(np.polyfit(x, y, 1)[0])


def _interaction(endow, trait, surv):
    """Coef on endowment*trait in survival ~ 1 + endow + trait + endow*trait."""
    endow = np.asarray(endow, float)
    trait = np.asarray(trait, float)
    surv = np.asarray(surv, float)
    if endow.size < 8 or endow.std() < 1e-9 or trait.std() < 1e-9:
        return None
    X = np.column_stack([np.ones_like(endow), endow, trait, endow * trait])
    coef, *_ = np.linalg.lstsq(X, surv, rcond=None)
    return float(coef[3])


def _still_growing(series):
    n = len(series)
    if n < 20:
        return 0.0
    return round(statistics.mean(series[-n // 10:]) - statistics.mean(series[-n // 5:-n // 10]), 1)


def run_cell(cfg, seed, cap):
    sim = Simulation(cfg, seed, run_id=f"wo2_s{seed}")
    sim.run()
    agents = sim.agents
    endow = [a.metrics.birthplace_endowment for a in agents]
    surv = [a.metrics.ticks_alive for a in agents]
    trait = [a.traits.exploration for a in agents]
    off = [a.offspring_count for a in agents]
    R_s = statistics.mean(sim.pop_series[-max(1, int(len(sim.pop_series) * 0.4)):])
    founders = [a.traits.exploration for a in agents if a.birth_tick == 0]
    survivors = [a.traits.exploration for a in agents if a.alive]
    return {
        "n_agents": len(agents),
        "R_s": round(R_s, 1),
        "cap_bound": int(R_s / cap > 0.9),
        "still_climbing": _still_growing(sim.pop_series),
        "beta_surv": _ols_slope(endow, surv),
        "beta_off": _ols_slope(endow, off),
        "interaction": _interaction(endow, trait, surv),
        "founder_trait": round(statistics.mean(founders), 4) if founders else None,
        "survivor_trait": round(statistics.mean(survivors), 4) if survivors else None,
    }


def run(seeds, conditions, ablations, cap, ticks, out_dir):
    base = load_config("a3.yaml").to_dict()
    base["run"]["max_ticks"] = ticks
    base["run"]["stop_on_extinction"] = False
    base["logging"]["per_tick"] = False
    base["reproduction"]["max_population"] = cap

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    ckpt = out / "wo2_checkpoint.jsonl"
    done = {}
    if ckpt.exists():
        for line in ckpt.read_text().splitlines():
            if line.strip():
                r = json.loads(line)
                done[(r["condition"], r["ablation"], r["seed"])] = r

    rows = []
    for cond in conditions:
        for abl in ablations:
            d = _apply(base, {"init": {"spawn_mode": cond}})
            d = _apply(d, ABLATIONS[abl])
            cfg = Config(d, f"wo2:{cond}:{abl}")
            for seed in seeds:
                key = (cond, abl, seed)
                if key in done:
                    rows.append(done[key])
                    continue
                res = run_cell(cfg, seed, cap)
                row = {"condition": cond, "ablation": abl, "seed": seed, **res}
                with open(ckpt, "a") as fh:
                    fh.write(json.dumps(row) + "\n")
                rows.append(row)
                print(f"  {cond:10} {abl:15} s{seed:<2} | R_s={res['R_s']:>6.0f} "
                      f"cap_bound={res['cap_bound']} beta_surv="
                      f"{'na' if res['beta_surv'] is None else f'{res[\"beta_surv\"]:.0f}'}",
                      flush=True)

    # ── across-seed headline: beta_surv ~ R_s, per cell ──
    summary = []
    for cond in conditions:
        for abl in ablations:
            cell = [r for r in rows if r["condition"] == cond and r["ablation"] == abl
                    and r["beta_surv"] is not None]
            Rs = [r["R_s"] for r in cell]
            betas = [r["beta_surv"] for r in cell]
            slope = _ols_slope(Rs, betas) if len(cell) >= 3 else None
            drift = [r["survivor_trait"] - r["founder_trait"] for r in cell
                     if r["survivor_trait"] is not None and r["founder_trait"] is not None]
            b_ci = bootstrap_ci(betas)
            summary.append({
                "condition": cond, "ablation": abl, "n_seeds": len(cell),
                "beta_surv_median": b_ci["median"],
                "beta_surv_ci": [b_ci["ci_low"], b_ci["ci_high"]],
                "beta_vs_capacity_slope": slope,
                "trait_drift_median": round(statistics.median(drift), 4) if drift else None,
                "cap_bound_seeds": sum(r["cap_bound"] for r in cell),
                "still_climbing_seeds": sum(1 for r in cell if abs(r["still_climbing"]) > 3),
            })
            print(f"{cond:10} {abl:15} | n={len(cell):2} "
                  f"beta_surv~endow median={b_ci['median']} "
                  f"| beta~capacity slope={slope} "
                  f"| trait_drift={summary[-1]['trait_drift_median']} "
                  f"| cap_bound={summary[-1]['cap_bound_seeds']}")

    with open(out / "wo2_a3_runs.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    with open(out / "wo2_a3_summary.json", "w") as fh:
        json.dump(summary, fh, indent=2)
    print(f"\nWrote {out}/wo2_a3_runs.csv and wo2_a3_summary.json")
    return summary


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", default="0-19")
    ap.add_argument("--conditions", default="uniform,born_rich,born_poor")
    ap.add_argument("--ablations", default="none,freeze_learning,freeze_traits")
    ap.add_argument("--cap", type=int, default=2000)
    ap.add_argument("--ticks", type=int, default=3000)
    ap.add_argument("--out", default="experiments/results")
    args = ap.parse_args()
    run(_parse_seeds(args.seeds), args.conditions.split(","),
        args.ablations.split(","), args.cap, args.ticks, args.out)


if __name__ == "__main__":
    main()
