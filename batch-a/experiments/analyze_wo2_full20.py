#!/usr/bin/env python3
"""WO-2 full-20 readout — disentangle volatility from capacity; read the selection lead.

The pilot found crash-robust βₛ tracks VOLATILITY (r=0.81) more than mean capacity
(r=−0.23), but at n≈7 the two co-vary. The collinearity gate said the seed space is
SEPARABLE, so the whole reason to go to n=20 is to put BOTH moderators in one model
and see which survives — a multiple regression the per-cell runner summary never does.

Reads the checkpoint (docs/diagnostics/wo2_full20/wo2_checkpoint.jsonl) and, per cell
and pooled, on the UNCENSORED seeds:
  * marginal:  βₛ ~ volatility  and  βₛ ~ R_s   (correlations, as the pilot reported);
  * DISENTANGLED: standardized βₛ ~ z(volatility) + z(R_s) in one model — the
    coefficient that stays large is the real moderator;
  * SELECTION (the promoted lead): survivor−founder trait drift, and survivor trait
    ~ volatility / R_s;
  * ABLATION decomposition: none vs freeze_learning vs freeze_traits — how much of the
    selection signal needs heritable traits vs within-life learning.
Writes a markdown readout + a json. Primary β = crash-robust hazard_beta (raw is
sensitivity). Runs on partial data too (fewer seeds) so it can preview mid-grind.

    python -m experiments.analyze_wo2_full20
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import statistics
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def _z(x):
    x = np.asarray(x, float)
    sd = x.std()
    return (x - x.mean()) / sd if sd > 1e-9 else x * 0.0


def _corr(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float)
    if x.size < 3 or x.std() < 1e-9 or y.std() < 1e-9:
        return None
    return round(float(np.corrcoef(x, y)[0, 1]), 2)


def _multi(beta, vol, rs):
    """Standardized β ~ z(vol) + z(rs). Returns (coef_vol, coef_rs, R2) or Nones."""
    if len(beta) < 5:
        return None, None, None
    y = _z(beta)
    X = np.column_stack([np.ones(len(y)), _z(vol), _z(rs)])
    coef, *_ = np.linalg.lstsq(X, y, rcond=None)
    yhat = X @ coef
    ss_res = float(((y - yhat) ** 2).sum())
    ss_tot = float(((y - y.mean()) ** 2).sum())
    r2 = 1 - ss_res / ss_tot if ss_tot > 1e-9 else None
    return round(float(coef[1]), 3), round(float(coef[2]), 3), (round(r2, 2) if r2 is not None else None)


def _bkey(rows):
    return "hazard_beta" if any(r.get("hazard_beta") is not None for r in rows) else "beta_surv"


def _cell(rows, cond, abl):
    return [r for r in rows if r["condition"] == cond and r["ablation"] == abl]


def analyze(rows):
    bkey = _bkey(rows)
    conds = list(dict.fromkeys(r["condition"] for r in rows))
    abls = list(dict.fromkeys(r["ablation"] for r in rows))

    # pooled over conditions, ablation = none (the clean world) — the disentanglement
    base = [r for r in rows if r["ablation"] == "none"
            and r.get(bkey) is not None and not r.get("censored")
            and r.get("volatility_cv") is not None]
    beta = [r[bkey] for r in base]
    vol = [r["volatility_cv"] for r in base]
    rs = [r["R_s"] for r in base]
    marg_vol, marg_rs = _corr(beta, vol), _corr(beta, rs)
    cvol, crs, r2 = _multi(beta, vol, rs)

    st = [r["survivor_trait"] for r in base if r.get("survivor_trait") is not None]
    st_vol = _corr([r["survivor_trait"] for r in base if r.get("survivor_trait") is not None],
                   [r["volatility_cv"] for r in base if r.get("survivor_trait") is not None])
    st_rs = _corr([r["survivor_trait"] for r in base if r.get("survivor_trait") is not None],
                  [r["R_s"] for r in base if r.get("survivor_trait") is not None])

    # ablation decomposition of the selection drift (per ablation, pooled conditions)
    abl_drift = {}
    for abl in abls:
        cell = [r for r in rows if r["ablation"] == abl
                and r.get("survivor_trait") is not None and r.get("founder_trait") is not None]
        drift = [r["survivor_trait"] - r["founder_trait"] for r in cell]
        abl_drift[abl] = {"n": len(drift),
                          "drift_median": round(statistics.median(drift), 4) if drift else None}

    return {
        "primary_beta": bkey,
        "n_seeds_uncensored_base": len(base),
        "beta_vs_volatility_marginal_r": marg_vol,
        "beta_vs_capacity_marginal_r": marg_rs,
        "disentangled": {"std_coef_volatility": cvol, "std_coef_capacity": crs, "R2": r2},
        "selection": {
            "survivor_trait_drift_median": abl_drift.get("none", {}).get("drift_median"),
            "survivor_trait_vs_volatility_r": st_vol,
            "survivor_trait_vs_capacity_r": st_rs,
        },
        "ablation_drift": abl_drift,
        "n_total_cells": len(rows),
        "conditions": conds, "ablations": abls,
    }


def _verdict(a):
    d = a["disentangled"]
    cv, cr = d["std_coef_volatility"], d["std_coef_capacity"]
    if cv is None:
        return "insufficient uncensored seeds for the disentangling regression — grind further."
    if abs(cv) >= 0.3 and abs(cv) > 1.6 * abs(cr):
        return (f"VOLATILITY is the moderator: with both in one model its standardized "
                f"coefficient ({cv:+.2f}) dominates capacity's ({cr:+.2f}). The pilot's "
                f"β~volatility was not a capacity confound — n=20 separated them.")
    if abs(cr) >= 0.3 and abs(cr) > 1.6 * abs(cv):
        return (f"CAPACITY is the moderator ({cr:+.2f} vs volatility {cv:+.2f}) — the "
                f"pilot's volatility signal was tracking capacity after all.")
    return (f"neither moderator dominates once both are in the model "
            f"(volatility {cv:+.2f}, capacity {cr:+.2f}) — birthplace is a weak, "
            f"non-specific moderator; lead with the selection result.")


def write_readout(a, out_dir, complete):
    verdict = _verdict(a)
    d, s = a["disentangled"], a["selection"]
    status = "COMPLETE" if complete else f"PARTIAL ({a['n_total_cells']} cells so far)"
    md = f"""# WO-2 full-20 — birthplace moderator + selection ({status})

Primary βₛ = **{a['primary_beta']}** (crash-robust stable-tick hazard; raw = sensitivity).
Disentangling regression on **{a['n_seeds_uncensored_base']}** uncensored `ablation=none` seeds.

## Disentangling volatility from capacity (the point of n=20)
| relation | value |
|---|---|
| βₛ ~ volatility (marginal r) | {a['beta_vs_volatility_marginal_r']} |
| βₛ ~ capacity R_s (marginal r) | {a['beta_vs_capacity_marginal_r']} |
| **βₛ ~ z(volatility) + z(capacity)** — std coef volatility | **{d['std_coef_volatility']}** |
| — std coef capacity | {d['std_coef_capacity']} |
| model R² | {d['R2']} |

**{verdict}**

## Selection (promoted lead)
- survivor−founder trait drift (median, clean world): **{s['survivor_trait_drift_median']}**
- survivor trait ~ volatility: r={s['survivor_trait_vs_volatility_r']} · ~ capacity: r={s['survivor_trait_vs_capacity_r']}

## Ablation decomposition (trait drift)
| ablation | n | drift median |
|---|---|---|
""" + "\n".join(
        f"| {abl} | {v['n']} | {v['drift_median']} |" for abl, v in a["ablation_drift"].items()
    ) + f"""

Reproduce: `python -m experiments.analyze_wo2_full20`. Source: `wo2_full20/wo2_checkpoint.jsonl`.
Bit-identical fast path (perception.impl=vectorized) — no-regression vs scalar, not a correctness proof.
"""
    Path(out_dir, "wo2_full20_read.md").write_text(md)
    Path(out_dir, "wo2_full20_analysis.json").write_text(json.dumps({**a, "verdict": verdict}, indent=2))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ckpt", default="docs/diagnostics/wo2_full20/wo2_checkpoint.jsonl")
    ap.add_argument("--out", default="docs/diagnostics/wo2_full20")
    args = ap.parse_args()
    p = Path(args.ckpt)
    if not p.exists():
        print(f"no checkpoint at {p}")
        sys.exit(1)
    rows = [json.loads(l) for l in p.read_text().splitlines() if l.strip()]
    a = analyze(rows)
    complete = len(rows) >= 180
    write_readout(a, args.out, complete)
    print(f"[{'COMPLETE' if complete else f'PARTIAL {len(rows)}/180'}] "
          f"primary={a['primary_beta']} | disentangled vol={a['disentangled']['std_coef_volatility']} "
          f"cap={a['disentangled']['std_coef_capacity']}")
    print(_verdict(a))
    print(f"Wrote {args.out}/wo2_full20_read.md + wo2_full20_analysis.json")


if __name__ == "__main__":
    main()
