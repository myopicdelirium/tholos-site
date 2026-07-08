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

# Crash-robust stable-tick hazard (amended PRIMARY βₛ) is computed inline from the
# in-memory panel so only scalars are persisted — the ephemeral container can't
# keep gigabyte per-agent panels, and the small checkpoint must survive restarts.
# Optional deps: degrade to raw βₛ (sensitivity) when statsmodels/pandas absent,
# keeping the runner turnkey on a bare `pip install -e batch-a`.
try:
    import warnings
    warnings.filterwarnings("ignore")
    import statsmodels.api as sm
    import statsmodels.formula.api as smf
    import pandas as pd
    _HAVE_STATS = True
except Exception:                                        # pragma: no cover
    _HAVE_STATS = False

_TAU = 0.008        # stable-tick threshold (validated default, analyze_wo2_crashrobust)
_SMOOTH_W = 25
_TRANSIENT = 200

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


def _zscore(x):
    x = np.asarray(x, float)
    sd = x.std()
    return (x - x.mean()) / sd if sd > 1e-9 else x * 0.0


def _stable_mask(pop):
    """Ticks where population is quiescent (|d pop|/pop < τ) — crash ticks excluded."""
    k = np.ones(_SMOOTH_W) / _SMOOTH_W
    sm_pop = np.convolve(pop, k, mode="same")
    rel = np.abs(np.gradient(sm_pop)) / np.maximum(sm_pop, 1.0)
    mask = rel < _TAU
    mask[:_TRANSIENT] = False
    return mask


def _trait_hist(vals, bins=10):
    """Compact [0,1] trait distribution (persist the shape, not every agent)."""
    if not vals:
        return None
    h, _ = np.histogram(np.asarray(vals, float), bins=bins, range=(0.0, 1.0))
    return [int(c) for c in h]


def _crash_robust(agents, pop_series):
    """Amended PRIMARY βₛ: grouped stable-tick mortality hazard (+ Cox-on-age cross-check).

    Per agent: exposure = # STABLE at-risk ticks, event = died during a stable tick;
    Poisson GLM deaths ~ offset(log E) + endow + trait + endow:trait. Deaths in crash
    ticks leave the numerator (the wave) but stable survival still counts as exposure.
    Returns protective βₛ (+ = endowment helps), matching the raw sign. Ported from the
    pilot-validated analyze_wo2_crashrobust; consumes the in-memory panel, persists scalars.
    """
    if not _HAVE_STATS or len(pop_series) < _TRANSIENT + 50:
        return None, None, None, 0, 0
    pop = np.asarray(pop_series, float)
    horizon = len(pop)
    mask = _stable_mask(pop)
    b = np.array([a["birth_tick"] for a in agents], int)
    s = np.clip(np.array([a["survival_time"] for a in agents], int), 1, None)
    d = np.clip(b + s, 0, horizon)
    died = np.array([a["cause"] is not None for a in agents], bool)
    stable_prefix = np.concatenate([[0], np.cumsum(mask.astype(int))])
    E = stable_prefix[d] - stable_prefix[b]                 # stable at-risk ticks
    died_stable = died & mask[np.clip(d - 1, 0, horizon - 1)]
    sub = pd.DataFrame({
        "deaths": died_stable.astype(int),
        "logE": np.log(np.maximum(E, 1e-9)),
        "endow": _zscore([a["endowment"] for a in agents]),
        "trait": _zscore([a["exploration"] for a in agents]),
        "E": E,
    })
    sub = sub[sub["E"] > 0]
    if sub["deaths"].sum() < 5 or len(sub) < 30:
        return None, None, None, len(sub), int(sub["deaths"].sum())
    try:
        res = smf.glm("deaths ~ endow + trait + endow:trait", data=sub,
                      family=sm.families.Poisson(), offset=sub["logE"]).fit(cov_type="HC0")
        hb, hse = -float(res.params["endow"]), float(res.bse["endow"])
    except Exception:
        hb, hse = None, None
    cox = None
    try:
        dd = [(a, sv, dead) for a, sv, dead in
              zip(agents, s, died) if sv > 0]
        exog = pd.DataFrame({"endow": _zscore([a["endowment"] for a, _, _ in dd]),
                             "trait": _zscore([a["exploration"] for a, _, _ in dd])})
        cres = sm.PHReg(np.array([sv for _, sv, _ in dd], float), exog,
                        status=np.array([int(x) for _, _, x in dd])).fit()
        cox = -float(cres.params[0])
    except Exception:
        cox = None
    return (None if hb is None else round(hb, 4),
            None if hse is None else round(hse, 4),
            None if cox is None else round(cox, 4),
            len(sub), int(sub["deaths"].sum()))


def run_cell(cfg, seed, cap):
    """Run one (condition, ablation, seed) cell → one self-sufficient summary row.

    The heavy per-agent panel is built and consumed IN MEMORY here — the crash-robust
    stable-tick hazard (amended primary βₛ) is fitted at cell end and only its scalar
    coefficient is kept. Nothing per-agent is persisted (a 3000-tick cell's panel is
    megabytes; the checkpoint has to survive container restarts via git). Distributions
    that matter are kept as compact histograms.
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

    panel = [{"birth_tick": a.birth_tick, "survival_time": a.metrics.ticks_alive,
              "cause": a.cause_of_death, "endowment": a.metrics.birthplace_endowment,
              "exploration": a.traits.exploration} for a in agents]
    hb, hse, cox, n_stable, n_deaths = _crash_robust(panel, series)

    return {
        "n_agents": len(agents),
        "R_s": round(R_s, 1),
        "volatility_cv": _volatility_cv(series),        # amended primary moderator
        "osc_period": _oscillation_period(series),
        "end_slope": end_slope,
        "censored": censored,                            # R_s is a lower bound; drop from beta~R_s fit
        "cap_bound": int(R_s / cap > 0.9),
        "still_climbing": _still_growing(series),
        "hazard_beta": hb,                               # PRIMARY: crash-robust stable-tick hazard
        "hazard_se": hse,
        "cox_age_beta": cox,                             # cross-check (different baseline)
        "n_stable_agents": n_stable, "n_stable_deaths": n_deaths,
        "beta_surv": _ols_slope(endow, surv),           # raw → demoted to sensitivity
        "beta_off": _ols_slope(endow, off),
        "interaction": _interaction(endow, trait, surv),
        "founder_trait": round(statistics.mean(founders), 4) if founders else None,
        "survivor_trait": round(statistics.mean(survivors), 4) if survivors else None,
        "survivor_trait_hist": _trait_hist(survivors),  # selection distribution (headline)
        "founder_trait_hist": _trait_hist(founders),
    }


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
    ckpt = out / "wo2_checkpoint.jsonl"
    done = _load_done(ckpt)
    if not _HAVE_STATS:
        print("  [warn] statsmodels/pandas absent → crash-robust hazard_beta=None "
              "(raw beta_surv only). Install the analysis deps for the primary estimator.",
              flush=True)

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
                row = {"condition": cond, "ablation": abl, "seed": seed,
                       "impl": impl, **res}
                with open(ckpt, "a") as fh:                # checkpoint is self-sufficient (scalars only)
                    fh.write(json.dumps(row) + "\n")
                rows.append(row)
                hb = "na" if res["hazard_beta"] is None else f"{res['hazard_beta']:+.3f}"
                print(f"  {cond:10} {abl:15} s{seed:<2} | R_s={res['R_s']:>6.0f} "
                      f"cv={res['volatility_cv']:.3f} cens={res['censored']} "
                      f"hazard_beta={hb}", flush=True)

    # ── across-seed headline: crash-robust βₛ ~ moderator, per cell (censored excluded) ──
    # Primary = hazard_beta (falls back to raw beta_surv only if the analysis deps were
    # missing). x-fit is on uncensored seeds; both volatility (amended primary) and R_s.
    summary = []
    for cond in conditions:
        for abl in ablations:
            full = [r for r in rows if r["condition"] == cond and r["ablation"] == abl]
            bkey = "hazard_beta" if any(r.get("hazard_beta") is not None for r in full) else "beta_surv"
            cell = [r for r in full if r.get(bkey) is not None]
            uncens = [r for r in cell if not r.get("censored")]  # R_s/βₛ trustworthy only if settled
            betas_all = [r[bkey] for r in cell]
            betas_fit = [r[bkey] for r in uncens]
            Rs = [r["R_s"] for r in uncens]
            vols = [r.get("volatility_cv") for r in uncens]
            slope_cap = _ols_slope(Rs, betas_fit) if len(uncens) >= 3 else None
            slope_vol = (_ols_slope(vols, betas_fit)
                         if all(v is not None for v in vols) and len(vols) >= 3 else None)
            drift = [r["survivor_trait"] - r["founder_trait"] for r in cell
                     if r["survivor_trait"] is not None and r["founder_trait"] is not None]
            b_ci = bootstrap_ci(betas_all)
            summary.append({
                "condition": cond, "ablation": abl,
                "primary_beta": bkey,
                "n_seeds": len(cell), "n_uncensored": len(uncens),
                "beta_median": b_ci["median"],
                "beta_ci": [b_ci["ci_low"], b_ci["ci_high"]],
                "beta_vs_capacity_slope": slope_cap,     # uncensored only
                "beta_vs_volatility_slope": slope_vol,   # the amended primary moderator
                "trait_drift_median": round(statistics.median(drift), 4) if drift else None,
                "cap_bound_seeds": sum(r["cap_bound"] for r in cell),
                "censored_seeds": sum(1 for r in cell if r.get("censored")),
            })
            print(f"{cond:10} {abl:15} | {bkey} n={len(cell):2} (uncens {len(uncens):2}) "
                  f"median={b_ci['median']} "
                  f"| ~cap slope={slope_cap} ~vol slope={slope_vol} "
                  f"| trait_drift={summary[-1]['trait_drift_median']}")

    # flat CSV of scalar columns (list-valued histograms live in the jsonl checkpoint)
    skip = {"survivor_trait_hist", "founder_trait_hist"}
    fieldnames = [k for k in dict.fromkeys(k for r in rows for k in r) if k not in skip]
    with open(out / "wo2_a3_runs.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
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
    ap.add_argument("--out", default="docs/diagnostics/wo2_full20")  # tracked → survives restarts
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
