#!/usr/bin/env python3
"""WO-3 (amended) — mortality structure: individual attrition vs demographic crashes.

The question A4 raises: is fragility *individual* (agents die independently, a
Poisson trickle) or *demographic* (synchronized crashes that take a cohort at
once)? And how much of A4's fragility is INHERITED from the world's intrinsic A3
oscillation vs. produced by A4's added non-stationarity (seasons, mobile fauna,
drought)?

Per (case ∈ {a3, a4}, seed) at cap 2000, 3000 ticks (common horizon for a fair
A3↔A4 comparison), vectorized. All computed in memory from the run — only scalars
are persisted, so the checkpoint survives container restarts (see the WO-2 runner
note). Instruments:

  * DEATH-CLUSTERING (individual vs demographic):
      - fano   = Var/Mean of per-tick total deaths over the post-transient tail.
                 ≈1 → independent Poisson attrition; ≫1 → synchronized crashes.
      - burst_share = fraction of all deaths falling in the 5% burstiest ticks.
      - max_drawdown = deepest peak→trough population drop (÷peak) in the tail
                 → A4 "crash severity", the fragility magnitude.
      - per-cause fano + cause composition (does non-stationarity change the killer?).
  * A3-INHERITANCE (paired by seed, across seeds present in both cases):
      A4 crash severity ~ that seed's A3 oscillation amplitude (same stable-epoch
      instrument as WO-2). High r → A4 fragility is inherited from A3 oscillation;
      low r → A4's non-stationarity is the driver.

    python -m experiments.wo3_a4_mortality --seeds 0-19 --impl vectorized
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
from batch_a.sim import Simulation                        # noqa: E402

_TRANSIENT = 200        # ticks discarded as burn-in (matches the crash-robust instrument)
CASES = ["a3", "a4"]


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


def _tail(arr, frac=0.4):
    n = len(arr)
    return arr[-max(1, int(n * frac)):]


def _fano(counts):
    """Var/Mean of a count series — the burstiness / clustering index."""
    x = np.asarray(counts, float)
    m = x.mean()
    return round(float(x.var() / m), 3) if m > 1e-9 else None


def _burst_share(counts, k=0.05):
    """Share of all events falling in the k-fraction burstiest ticks."""
    x = np.sort(np.asarray(counts, float))[::-1]
    tot = x.sum()
    if tot <= 0:
        return None
    top = max(1, int(len(x) * k))
    return round(float(x[:top].sum() / tot), 3)


def _max_drawdown(pop):
    """Deepest peak→trough fractional population drop over the series."""
    x = np.asarray(pop, float)
    if x.size == 0:
        return 0.0
    run_max = np.maximum.accumulate(x)
    dd = (run_max - x) / np.maximum(run_max, 1.0)
    return round(float(dd.max()), 3)


def _osc_amplitude(pop_tail):
    """Relative oscillation amplitude (p95−p5)/mean over the steady tail."""
    x = np.asarray(pop_tail, float)
    m = x.mean()
    if m <= 1e-9 or x.size < 5:
        return 0.0
    return round(float((np.percentile(x, 95) - np.percentile(x, 5)) / m), 4)


def _volatility_cv(pop_tail):
    x = np.asarray(pop_tail, float)
    m = x.mean()
    return round(float(x.std() / m), 4) if m > 1e-9 else 0.0


def _dominant_period(pop_tail):
    x = np.asarray(pop_tail, float)
    x = x - x.mean()
    if x.std() < 1e-6 or len(x) < 40:
        return None
    ac = np.correlate(x, x, "full")[len(x) - 1:]
    ac = ac / (ac[0] + 1e-9)
    for i in range(2, len(ac) - 1):
        if ac[i] > 0.2 and ac[i] > ac[i - 1] and ac[i] >= ac[i + 1]:
            return int(i)
    return None


def run_cell(cfg, seed, cap):
    """One (case, seed) cell → a self-sufficient scalar summary row.

    Reads the per-tick population and the per-tick deaths-by-cause series straight
    from the run (both are recorded every tick regardless of per_tick logging), and
    reduces them to burstiness / crash-severity scalars in memory.
    """
    sim = Simulation(cfg, seed, run_id=f"wo3_{cfg.case}_s{seed}")
    sim.run()
    pop = sim.pop_series
    deaths = sim.recorder.death_series          # [{tick, total, <cause>: n}, ...]
    horizon = len(pop)

    post = slice(_TRANSIENT, horizon)
    pop_post = pop[post]
    d_total = [d["total"] for d in deaths[_TRANSIENT:horizon]]
    causes = sorted({k for d in deaths for k in d if k not in ("tick", "total")})
    cause_counts = {c: sum(d.get(c, 0) for d in deaths) for c in causes}
    total_deaths = sum(cause_counts.values())
    dominant = max(cause_counts, key=cause_counts.get) if cause_counts else None
    cause_share = {c: round(cause_counts[c] / total_deaths, 4)
                   for c in causes} if total_deaths else {}
    # per-cause burstiness for the dominant killer
    dom_fano = _fano([d.get(dominant, 0) for d in deaths[_TRANSIENT:horizon]]) if dominant else None

    tail = _tail(pop, 0.4)
    R_s = round(statistics.mean(tail), 1)

    return {
        "n_agents": len(sim.agents),
        "final_pop": pop[-1] if pop else 0,
        "extinct": int((pop[-1] if pop else 0) == 0),
        "R_s": R_s,
        "volatility_cv": _volatility_cv(tail),
        "osc_amplitude": _osc_amplitude(tail),           # A3-inheritance instrument
        "osc_period": _dominant_period(tail),
        "total_deaths": total_deaths,
        "fano_deaths": _fano(d_total),                   # individual vs demographic
        "burst_share_5pct": _burst_share(d_total),       # synchronization
        "max_drawdown": _max_drawdown(pop_post),         # crash severity (A4 fragility)
        "dominant_cause": dominant,
        "dominant_cause_fano": dom_fano,
        "cause_share": cause_share,                      # dict → jsonl only (excluded from CSV)
    }


def _load_done(ckpt):
    done = {}
    if ckpt.exists():
        for line in ckpt.read_text().splitlines():
            if line.strip():
                r = json.loads(line)
                done[(r["case"], r["seed"])] = r
    return done


def _cell_keys(cases, seeds):
    return [(c, s) for c in cases for s in seeds]


def _ols(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float)
    if x.size < 3 or x.std() < 1e-9:
        return None, None
    slope = float(np.polyfit(x, y, 1)[0])
    r = float(np.corrcoef(x, y)[0, 1])
    return round(slope, 4), round(r, 2)


def run(seeds, cases, cap, ticks, out_dir, impl="vectorized"):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    ckpt = out / "wo3_checkpoint.jsonl"
    done = _load_done(ckpt)

    rows = []
    for case in cases:
        base = load_config(f"{case}.yaml").to_dict()
        base["run"]["max_ticks"] = ticks          # common horizon across cases
        base["run"]["stop_on_extinction"] = False
        base["logging"]["per_tick"] = False
        base["reproduction"]["max_population"] = cap
        base.setdefault("perception", {})["impl"] = impl
        for seed in seeds:
            key = (case, seed)
            if key in done:
                rows.append(done[key])
                continue
            res = run_cell(Config(base, f"wo3:{case}"), seed, cap)
            row = {"case": case, "seed": seed, "impl": impl, "ticks": ticks, **res}
            with open(ckpt, "a") as fh:
                fh.write(json.dumps(row) + "\n")
            rows.append(row)
            print(f"  {case} s{seed:<2} | R_s={res['R_s']:>6.0f} "
                  f"fano={res['fano_deaths']} drawdown={res['max_drawdown']} "
                  f"dom={res['dominant_cause']}", flush=True)

    summary = _analyze(rows, cases)
    with open(out / "wo3_summary.json", "w") as fh:
        json.dump(summary, fh, indent=2)
    skip = {"cause_share"}
    fields = [k for k in dict.fromkeys(k for r in rows for k in r) if k not in skip]
    with open(out / "wo3_runs.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"\nWrote {out}/wo3_runs.csv and wo3_summary.json")
    return summary


def _analyze(rows, cases):
    def med(vals):
        vals = [v for v in vals if v is not None]
        return round(statistics.median(vals), 3) if vals else None

    per_case = {}
    for case in cases:
        cell = [r for r in rows if r["case"] == case]
        if not cell:
            continue
        per_case[case] = {
            "n": len(cell),
            "median_fano": med([r["fano_deaths"] for r in cell]),
            "median_burst_share": med([r["burst_share_5pct"] for r in cell]),
            "median_max_drawdown": med([r["max_drawdown"] for r in cell]),
            "median_volatility": med([r["volatility_cv"] for r in cell]),
            "extinct_seeds": sum(r["extinct"] for r in cell),
            "dominant_causes": _tally([r["dominant_cause"] for r in cell]),
        }

    # A3-inheritance: pair by seed, regress A4 severity ~ A3 oscillation amplitude
    inherit = None
    if "a3" in cases and "a4" in cases:
        a3 = {r["seed"]: r for r in rows if r["case"] == "a3"}
        a4 = {r["seed"]: r for r in rows if r["case"] == "a4"}
        paired = sorted(set(a3) & set(a4))
        if len(paired) >= 3:
            amp = [a3[s]["osc_amplitude"] for s in paired]
            vol = [a3[s]["volatility_cv"] for s in paired]
            sev = [a4[s]["max_drawdown"] for s in paired]
            fano3 = [a3[s]["fano_deaths"] for s in paired]
            fano4 = [a4[s]["fano_deaths"] for s in paired]
            s_amp, r_amp = _ols(amp, sev)
            s_vol, r_vol = _ols(vol, sev)
            s_fano, r_fano = _ols(
                [f for f, g in zip(fano3, fano4) if f is not None and g is not None],
                [g for f, g in zip(fano3, fano4) if f is not None and g is not None])
            inherit = {
                "n_paired": len(paired),
                "a4_drawdown_vs_a3_oscamp": {"slope": s_amp, "r": r_amp},
                "a4_drawdown_vs_a3_volatility": {"slope": s_vol, "r": r_vol},
                "a4_fano_vs_a3_fano": {"slope": s_fano, "r": r_fano},
                "reading": _inherit_reading(r_amp),
            }

    print("\n── per case ──")
    for case, s in per_case.items():
        print(f"  {case}: fano={s['median_fano']} burst5%={s['median_burst_share']} "
              f"drawdown={s['median_max_drawdown']} extinct={s['extinct_seeds']}/{s['n']} "
              f"| killers={s['dominant_causes']}")
    if inherit:
        print("\n── A3-inheritance (A4 crash severity ~ A3 oscillation) ──")
        print(f"  paired seeds: {inherit['n_paired']}")
        print(f"  A4 drawdown ~ A3 osc-amp : r={inherit['a4_drawdown_vs_a3_oscamp']['r']}")
        print(f"  A4 drawdown ~ A3 volatility: r={inherit['a4_drawdown_vs_a3_volatility']['r']}")
        print(f"  → {inherit['reading']}")
    return {"per_case": per_case, "inheritance": inherit}


def _tally(items):
    out = {}
    for it in items:
        if it is not None:
            out[it] = out.get(it, 0) + 1
    return dict(sorted(out.items(), key=lambda kv: -kv[1]))


def _inherit_reading(r_amp):
    if r_amp is None:
        return "insufficient paired seeds"
    if r_amp >= 0.5:
        return ("A4 crash severity RISES with A3 oscillation — fragility is largely "
                "INHERITED from the world's intrinsic instability, not created by "
                "non-stationarity")
    if r_amp <= -0.5:
        return ("A4 crash severity FALLS as A3 oscillation rises — inverse: the worlds "
                "that oscillate under A3 are the more robust under A4. A4 fragility is "
                "not the inherited A3 instability")
    return ("A4 crash severity is weakly related to A3 oscillation — A4's non-stationarity "
            "(seasons/fauna/drought) is the driver, not the inherited world")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", default="0-19")
    ap.add_argument("--cases", default="a3,a4")
    ap.add_argument("--cap", type=int, default=2000)
    ap.add_argument("--ticks", type=int, default=3000)
    ap.add_argument("--out", default="docs/diagnostics/wo3_full20")  # tracked → survives restarts
    ap.add_argument("--impl", default="vectorized", choices=["vectorized", "scalar"])
    ap.add_argument("--check-complete", action="store_true")
    args = ap.parse_args()
    seeds = _parse_seeds(args.seeds)
    cases = args.cases.split(",")

    if args.check_complete:
        done = _load_done(Path(args.out) / "wo3_checkpoint.jsonl")
        missing = [k for k in _cell_keys(cases, seeds) if k not in done]
        print(f"complete: {len(missing) == 0} ({len(missing)} cells remaining)")
        sys.exit(0 if not missing else 1)

    run(seeds, cases, args.cap, args.ticks, args.out, args.impl)


if __name__ == "__main__":
    main()
