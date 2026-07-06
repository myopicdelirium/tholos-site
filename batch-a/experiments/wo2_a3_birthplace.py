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


def _tail(series, frac):
    n = len(series)
    return series[-max(1, int(n * frac)):]


def _volatility_cv(series, frac=0.4):
    """CV of the steady-state population tail — the amended primary moderator."""
    tail = _tail(series, frac)
    m = statistics.mean(tail)
    if m <= 0 or len(tail) < 2:
        return 0.0
    return round(statistics.pstdev(tail) / m, 4)


def _oscillation_period(series, frac=0.4):
    """Dominant boom/bust period (ticks) via autocorrelation, or None if aperiodic."""
    tail = _tail(series, frac)
    n = len(tail)
    if n < 20:
        return None
    x = np.asarray(tail, float)
    x = x - x.mean()
    if np.allclose(x, 0.0):
        return None
    ac = np.correlate(x, x, mode="full")[n - 1:]
    ac = ac / ac[0]
    below = np.where(ac < 0.0)[0]           # skip the central lobe
    if below.size == 0:
        return None
    peak, peak_val = None, 0.0
    for lag in range(int(below[0]), n - 1):
        if ac[lag] > ac[lag - 1] and ac[lag] >= ac[lag + 1] and ac[lag] > peak_val:
            peak, peak_val = lag, ac[lag]
    return int(peak) if peak is not None else None


def _end_slope(series, frac=0.1):
    """Population drift (pop/tick) over the final `frac` of the run."""
    tail = _tail(series, frac)
    if len(tail) < 3:
        return 0.0
    x = np.arange(len(tail), dtype=float)
    return round(float(np.polyfit(x, np.asarray(tail, float), 1)[0]), 3)


def run_cell(cfg, seed, cap):
    """Run one (condition, ablation, seed) cell. Returns (summary_row, raw_panel).

    The raw panel (per-agent lifetime records + the full population series) is
    persisted per cell so the amended analyses — crash-robust stable-tick hazard,
    volatility recompute, survivor-trait *distribution* — run post-hoc without
    re-simulating. A 3000-tick cell is expensive; capture everything once.
    """
    sim = Simulation(cfg, seed, run_id=f"wo2_s{seed}")
    sim.run()
    agents = sim.agents
    endow = [a.metrics.birthplace_endowment for a in agents]
    surv = [a.metrics.ticks_alive for a in agents]
    trait = [a.traits.exploration for a in agents]
    off = [a.offspring_count for a in agents]
    series = sim.pop_series
    R_s = statistics.mean(_tail(series, 0.4))          # cycle-averaged carrying capacity
    end_slope = _end_slope(series)
    tail_len = max(1, int(len(series) * 0.1))
    censored = int(abs(end_slope) * tail_len > 0.05 * max(R_s, 1.0))  # not settled
    founders = [a.traits.exploration for a in agents if a.birth_tick == 0]
    survivors = [a.traits.exploration for a in agents if a.alive]

    row = {
        "n_agents": len(agents),
        "R_s": round(R_s, 1),
        "volatility_cv": _volatility_cv(series),        # amended primary moderator
        "osc_period": _oscillation_period(series),
        "end_slope": end_slope,
        "censored": censored,                            # R_s is a lower bound; drop from beta~R_s fit
        "cap_bound": int(R_s / cap > 0.9),
        "still_climbing": _still_growing(series),
        "beta_surv": _ols_slope(endow, surv),
        "beta_off": _ols_slope(endow, off),
        "interaction": _interaction(endow, trait, surv),
        "founder_trait": round(statistics.mean(founders), 4) if founders else None,
        "survivor_trait": round(statistics.mean(survivors), 4) if survivors else None,
    }
    panel = {
        "pop_series": series,
        "agents": [
            {"birth_tick": a.birth_tick, "survival_time": a.metrics.ticks_alive,
             "cause": a.cause_of_death, "alive": bool(a.alive),
             "endowment": round(a.metrics.birthplace_endowment, 6),
             "exploration": round(a.traits.exploration, 6),
             "offspring": a.offspring_count}
            for a in agents
        ],
    }
    return row, panel


def _cell_keys(conditions, ablations, seeds):
    return [(c, a, s) for c in conditions for a in ablations for s in seeds]


def _load_done(ckpt):
    done = {}
    if ckpt.exists():
        for line in ckpt.read_text().splitlines():
            if line.strip():
                r = json.loads(line)
                done[(r["condition"], r["ablation"], r["seed"])] = r
    return done


def run(seeds, conditions, ablations, cap, ticks, out_dir, impl="vectorized"):
    base = load_config("a3.yaml").to_dict()
    base["run"]["max_ticks"] = ticks
    base["run"]["stop_on_extinction"] = False
    base["logging"]["per_tick"] = False
    base["reproduction"]["max_population"] = cap
    base.setdefault("perception", {})["impl"] = impl   # proven bit-identical fast path

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    panels = out / "panels"
    panels.mkdir(exist_ok=True)
    ckpt = out / "wo2_checkpoint.jsonl"
    done = _load_done(ckpt)

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
                res, panel = run_cell(cfg, seed, cap)
                row = {"condition": cond, "ablation": abl, "seed": seed,
                       "impl": impl, **res}
                # panel first, then checkpoint — a checkpointed cell always has its raw.
                with open(panels / f"{cond}__{abl}__s{seed}.json", "w") as fh:
                    json.dump(panel, fh)
                with open(ckpt, "a") as fh:
                    fh.write(json.dumps(row) + "\n")
                rows.append(row)
                bs = "na" if res["beta_surv"] is None else f"{res['beta_surv']:.0f}"
                print(f"  {cond:10} {abl:15} s{seed:<2} | R_s={res['R_s']:>6.0f} "
                      f"cv={res['volatility_cv']:.3f} cens={res['censored']} "
                      f"cap_bound={res['cap_bound']} beta_surv={bs}", flush=True)

    # ── across-seed headline: beta_surv ~ R_s, per cell (censored seeds excluded) ──
    summary = []
    for cond in conditions:
        for abl in ablations:
            cell = [r for r in rows if r["condition"] == cond and r["ablation"] == abl
                    and r["beta_surv"] is not None]
            uncens = [r for r in cell if not r.get("censored")]  # R_s trustworthy only if settled
            Rs = [r["R_s"] for r in uncens]
            betas_fit = [r["beta_surv"] for r in uncens]
            betas_all = [r["beta_surv"] for r in cell]
            vols = [r.get("volatility_cv") for r in uncens if r.get("volatility_cv") is not None]
            slope_cap = _ols_slope(Rs, betas_fit) if len(uncens) >= 3 else None
            slope_vol = (_ols_slope(vols, betas_fit)
                         if len(vols) == len(betas_fit) and len(vols) >= 3 else None)
            drift = [r["survivor_trait"] - r["founder_trait"] for r in cell
                     if r["survivor_trait"] is not None and r["founder_trait"] is not None]
            b_ci = bootstrap_ci(betas_all)
            summary.append({
                "condition": cond, "ablation": abl,
                "n_seeds": len(cell), "n_uncensored": len(uncens),
                "beta_surv_median": b_ci["median"],
                "beta_surv_ci": [b_ci["ci_low"], b_ci["ci_high"]],
                "beta_vs_capacity_slope": slope_cap,     # uncensored only
                "beta_vs_volatility_slope": slope_vol,   # the amended primary moderator
                "trait_drift_median": round(statistics.median(drift), 4) if drift else None,
                "cap_bound_seeds": sum(r["cap_bound"] for r in cell),
                "censored_seeds": sum(1 for r in cell if r.get("censored")),
            })
            print(f"{cond:10} {abl:15} | n={len(cell):2} (uncens {len(uncens):2}) "
                  f"beta_surv~endow median={b_ci['median']} "
                  f"| beta~cap slope={slope_cap} beta~vol slope={slope_vol} "
                  f"| trait_drift={summary[-1]['trait_drift_median']}")

    fieldnames = list(dict.fromkeys(k for r in rows for k in r))  # stable superset
    with open(out / "wo2_a3_runs.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fieldnames)
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
    ap.add_argument("--out", default="experiments/results/wo2_full20")
    ap.add_argument("--impl", default="vectorized", choices=["vectorized", "scalar"])
    ap.add_argument("--check-complete", action="store_true",
                    help="exit 0 iff every (condition, ablation, seed) cell is checkpointed "
                         "(for the resume-loop guard); runs nothing.")
    args = ap.parse_args()
    seeds = _parse_seeds(args.seeds)
    conditions = args.conditions.split(",")
    ablations = args.ablations.split(",")

    if args.check_complete:
        done = _load_done(Path(args.out) / "wo2_checkpoint.jsonl")
        missing = [k for k in _cell_keys(conditions, ablations, seeds) if k not in done]
        print(f"complete: {len(missing) == 0} ({len(missing)} cells remaining)")
        sys.exit(0 if not missing else 1)

    run(seeds, conditions, ablations, args.cap, args.ticks, args.out, args.impl)


if __name__ == "__main__":
    main()
