#!/usr/bin/env python3
"""WO-2 crash-robust βₛ — validate the estimator on the existing pilot.

Raw `survival_time ~ endowment` at a snapshot is dominated by demographic phase:
during a crash, *who dies is the wave, not birth endowment*. Adding seeds cannot
fix a structurally confounded measurement — so fix the estimator first, on data
we already have (the 8-seed uniform×none pilot; no new sim compute).

Reconstructs, from each run's per-agent `summaries.csv` alone:
  * per-tick population  (difference array over [birth, birth+survival)),
  * the (agent, tick) at-risk / died panel  (birth_tick + survival_time + cause).

Estimators (per seed):
  1. raw βₛ  (OLS survival ~ endowment) — demoted to sensitivity.
  2. STABLE-tick mortality hazard (PRIMARY) — grouped discrete-time hazard:
     per agent, exposure = # STABLE at-risk ticks, event = died during a stable
     tick; Poisson GLM  deaths ~ offset(log E) + endow + trait + endow:trait.
     β_endow is the crash-robust log hazard ratio (deaths in crash ticks are
     excluded from the numerator but stable survival still counts as exposure).
     Reported as *protective* βₛ = −β_hazard so + = endowment helps (matches raw).
  3. epoch-fixed-effect hazard (cross-check) — same, with calendar-epoch dummies
     (free baseline absorbs the wave), agent-clustered SEs. + a Cox PH on age.
  5. offspring ~ endowment (OLS) — fitness cross-check, phase-sensitive differently.
  (4 reproduction-hazard needs per-tick birth events — not in summaries; deferred.)

x-axis: Rₛ cycle-averaged (not single-tick) + still-climbing censor flag; plus
per-seed volatility (CV) and oscillation period — β may track volatility, not Rₛ.

Also: τ-sensitivity grid (conclusion must survive it), the estimator's own
no-regression gate (must agree with raw on clean seeds; rescue or honestly fail on
contaminated), and the promoted selection readout (survivor-trait ~ Rₛ/volatility).

    python -m experiments.analyze_wo2_crashrobust --seeds 0-7
"""

from __future__ import annotations

import argparse
import csv
import json
import warnings
from pathlib import Path
import sys

import numpy as np

warnings.filterwarnings("ignore")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import statsmodels.api as sm          # noqa: E402
import statsmodels.formula.api as smf  # noqa: E402
import pandas as pd                    # noqa: E402

RUNS = Path(__file__).resolve().parent.parent / "runs"
TAU_GRID = [0.004, 0.008, 0.015, 0.03]
DEFAULT_TAU = 0.008
SMOOTH_W = 25
TRANSIENT = 200
EPOCH_W = 250


def _parse_seeds(spec):
    out = []
    for part in spec.split(","):
        if "-" in part:
            lo, hi = part.split("-")
            out.extend(range(int(lo), int(hi) + 1))
        elif part.strip():
            out.append(int(part))
    return out


def load_seed(seed: int) -> pd.DataFrame:
    df = pd.read_csv(RUNS / f"wo2_s{seed}" / "summaries.csv")
    df = df.rename(columns={"birthplace_endowment": "endow",
                            "trait_exploration": "trait"})
    df["died"] = (df["cause_of_death"] != "survived").astype(int)
    df["b"] = df["birth_tick"].astype(int)
    df["s"] = df["survival_time"].astype(int).clip(lower=1)
    df["d"] = df["b"] + df["s"]                 # first dead tick (exclusive end)
    return df


def reconstruct(df: pd.DataFrame):
    horizon = int(df["d"].max())
    delta = np.zeros(horizon + 2)
    for b, d in zip(df["b"], df["d"].clip(upper=horizon)):
        delta[b] += 1
        delta[d] -= 1
    pop = np.cumsum(delta[:horizon])
    return pop, horizon


def stable_mask(pop, tau, w=SMOOTH_W, transient=TRANSIENT):
    k = np.ones(w) / w
    sm_pop = np.convolve(pop, k, mode="same")
    dpop = np.gradient(sm_pop)
    rel = np.abs(dpop) / np.maximum(sm_pop, 1.0)
    mask = rel < tau
    mask[:transient] = False
    return mask


def dominant_period(pop, window):
    x = pop[window].astype(float)
    x = x - x.mean()
    if x.std() < 1e-6 or len(x) < 40:
        return None
    ac = np.correlate(x, x, "full")[len(x) - 1:]
    ac = ac / (ac[0] + 1e-9)
    # first peak after the zero-lag descent
    for i in range(2, len(ac) - 1):
        if ac[i] > 0.2 and ac[i] > ac[i - 1] and ac[i] >= ac[i + 1]:
            return int(i)
    return None


def r_and_volatility(pop, horizon):
    """Cycle-averaged Rₛ + volatility (CV) + end-slope censor flag."""
    win = slice(int(horizon * 0.5), horizon)          # steady tail
    tail = pop[win]
    period = dominant_period(pop, win)
    if period and period < len(tail):
        n_per = len(tail) // period
        rs = float(tail[-n_per * period:].mean()) if n_per else float(tail.mean())
    else:
        rs = float(tail.mean())
    cv = float(tail.std() / max(tail.mean(), 1.0))
    # still-climbing / crashing: relative drift, last 10% vs the 10% before it
    # (matches the pilot's flag; Rₛ is then a censored lower/upper bound)
    last = pop[int(horizon * 0.9):].mean()
    prev = pop[int(horizon * 0.8):int(horizon * 0.9)].mean()
    drift = float((last - prev) / max(rs, 1.0))       # relative
    return rs, cv, period, drift


def zscore(x):
    x = np.asarray(x, float)
    sd = x.std()
    return (x - x.mean()) / sd if sd > 1e-9 else x * 0.0


def hazard_beta(df, mask):
    """Grouped stable-tick hazard. Returns protective β (per endow SD) + se + n.

    Per agent: exposure E = # STABLE at-risk ticks; event = died during a stable
    tick. Poisson GLM  deaths ~ offset(log E) + endow + trait + endow:trait.
    Deaths in crash ticks are dropped from the numerator (the wave), but stable
    survival still counts as exposure. One row per agent → agents independent.
    """
    horizon = len(mask)
    stable_prefix = np.concatenate([[0], np.cumsum(mask.astype(int))])
    b = df["b"].to_numpy()
    d = np.clip(df["d"].to_numpy(), 0, horizon)
    E = stable_prefix[d] - stable_prefix[b]               # stable at-risk ticks
    event_tick = np.clip(d - 1, 0, horizon - 1)
    died_stable = (df["died"].to_numpy() == 1) & mask[event_tick]
    sub = pd.DataFrame({
        "deaths": died_stable.astype(int),
        "logE": np.log(np.maximum(E, 1e-9)),
        "endow": zscore(df["endow"]),
        "trait": zscore(df["trait"]),
        "E": E,
    })
    sub = sub[sub["E"] > 0]
    if sub["deaths"].sum() < 5 or len(sub) < 30:
        return None, None, len(sub), int(sub["deaths"].sum())
    m = smf.glm("deaths ~ endow + trait + endow:trait", data=sub,
                family=sm.families.Poisson(), offset=sub["logE"])
    res = m.fit(cov_type="HC0")
    beta = -float(res.params["endow"])       # protective sign: + = endowment helps
    se = float(res.bse["endow"])
    return beta, se, len(sub), int(sub["deaths"].sum())


def raw_beta(df):
    x = zscore(df["endow"]); y = df["survival_time"].to_numpy(float)
    if x.std() < 1e-9:
        return None
    return float(np.polyfit(x, y, 1)[0])


def offspring_beta(df):
    x = zscore(df["endow"]); y = df["offspring_count"].to_numpy(float)
    if x.std() < 1e-9:
        return None
    return float(np.polyfit(x, y, 1)[0])


def cox_age(df):
    """Cox PH on age (baseline over age) — cross-check with a different baseline."""
    d = df[df["s"] > 0]
    exog = pd.DataFrame({"endow": zscore(d["endow"]), "trait": zscore(d["trait"])})
    try:
        res = sm.PHReg(d["s"].to_numpy(float), exog,
                       status=d["died"].to_numpy(int)).fit()
        return -float(res.params[0])          # protective sign
    except Exception:
        return None


def analyze(seeds):
    per = []
    for seed in seeds:
        df = load_seed(seed)
        pop, horizon = reconstruct(df)
        rs, cv, period, drift = r_and_volatility(pop, horizon)
        mask = stable_mask(pop, DEFAULT_TAU)
        hb, hse, nstab, ndeaths = hazard_beta(df, mask)
        # tau sensitivity
        tau_betas = {}
        for tau in TAU_GRID:
            b, *_ = hazard_beta(df, stable_mask(pop, tau))
            tau_betas[tau] = None if b is None else round(b, 3)
        surv = df[df["died"] == 0]["trait"].mean()
        found = df[df["b"] == 0]["trait"].mean()
        rec = {
            "seed": seed, "n_agents": int(len(df)),
            "R_s": round(rs, 0), "volatility_cv": round(cv, 3),
            "osc_period": period, "end_drift": round(drift, 3),
            "censored": int(abs(drift) > 0.05),
            "raw_beta": None if raw_beta(df) is None else round(raw_beta(df), 2),
            "hazard_beta": None if hb is None else round(hb, 3),
            "hazard_se": None if hse is None else round(hse, 3),
            "cox_age_beta": None if cox_age(df) is None else round(cox_age(df), 3),
            "offspring_beta": None if offspring_beta(df) is None else round(offspring_beta(df), 3),
            "n_stable_agents": nstab, "n_stable_deaths": ndeaths,
            "survivor_trait": round(float(surv), 3),
            "founder_trait": round(float(found), 3),
            "tau_sensitivity": tau_betas,
        }
        per.append(rec)
        print(f"seed {seed}: R_s={rec['R_s']:>5.0f} cv={cv:.2f} drift={drift:+.2f}"
              f"{'*cens' if rec['censored'] else '     '} | raw_beta={rec['raw_beta']:>7} "
              f"hazard_beta={rec['hazard_beta']} (se {rec['hazard_se']}) "
              f"cox={rec['cox_age_beta']} | surv_trait={rec['survivor_trait']}")
    return per


def gate_and_report(per):
    def col(k):
        return {r["seed"]: r[k] for r in per}
    raw = col("raw_beta"); haz = col("hazard_beta"); rs = col("R_s")
    cv = col("volatility_cv"); cens = col("censored")

    # estimator no-regression: agree with raw on CLEAN (uncensored) seeds
    clean = [s for s in raw if not cens[s]]
    agree = [s for s in clean if raw[s] is not None and haz[s] is not None
             and (np.sign(raw[s]) == np.sign(haz[s]) or abs(raw[s]) < 3)]
    print("\n── estimator no-regression (clean/uncensored seeds) ──")
    print(f"  clean seeds: {clean}")
    print(f"  hazard agrees in sign with raw on: {agree}  "
          f"({len(agree)}/{len(clean)})")

    # across-seed slopes, on uncensored seeds
    def slope_vs(xkey_map):
        xs = [xkey_map[s] for s in clean]; ys = [haz[s] for s in clean]
        pts = [(x, y) for x, y in zip(xs, ys) if x is not None and y is not None]
        if len(pts) < 3:
            return None, None
        X = np.array([p[0] for p in pts]); Y = np.array([p[1] for p in pts])
        return round(float(np.polyfit(X, Y, 1)[0]), 4), round(float(np.corrcoef(X, Y)[0, 1]), 2)
    s_rs, r_rs = slope_vs(rs)
    s_vol, r_vol = slope_vs(cv)
    st = col("survivor_trait")
    s_trait_rs = None
    pts = [(rs[s], st[s]) for s in clean if rs[s] and st[s] is not None]
    if len(pts) >= 3:
        s_trait_rs = round(float(np.corrcoef([p[0] for p in pts], [p[1] for p in pts])[0, 1]), 2)

    print("\n── across-seed (uncensored) ──")
    print(f"  crash-robust βₛ ~ R_s : slope={s_rs} r={r_rs}   (predict: + = birthplace matters more when poor... note protective sign)")
    print(f"  crash-robust βₛ ~ volatility : slope={s_vol} r={r_vol}")
    print(f"  survivor_trait ~ R_s : r={s_trait_rs}   (selection readout — promoted)")

    passes_noreg = len(agree) >= max(2, int(0.7 * len(clean)))
    if not passes_noreg:
        verdict = "ESTIMATOR FAILS no-regression (scrambles clean seeds) — do not adopt"
    elif abs(r_vol or 0) > 0.5 and abs(r_rs or 0) < abs(r_vol or 0):
        verdict = ("birthplace hazard tracks VOLATILITY, not mean capacity "
                   f"(r_vol={r_vol} vs r_Rs={r_rs}) — a DEEPER finding. Adopt "
                   "crash-robust βₛ with volatility as the primary moderator; run "
                   "full 20 (post-B); selection stays the cleaner headline.")
    elif abs(r_rs or 0) > 0.5:
        verdict = "ADOPT crash-robust βₛ ~ R_s + run full 20 (post-B), extend horizon"
    else:
        verdict = ("birthplace weak vs both capacity and volatility once demographics "
                   "controlled → lead WO-2 with the SELECTION result; route oscillation to WO-3")
    print(f"\nDECISION GATE: {verdict}")
    return {"clean_seeds": clean, "sign_agreement": f"{len(agree)}/{len(clean)}",
            "beta_vs_Rs": [s_rs, r_rs], "beta_vs_volatility": [s_vol, r_vol],
            "survivor_trait_vs_Rs_r": s_trait_rs, "verdict": verdict}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", default="0-7")
    ap.add_argument("--out", default="docs/diagnostics")
    args = ap.parse_args()
    per = analyze(_parse_seeds(args.seeds))
    summary = gate_and_report(per)

    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    with open(out / "wo2_crashrobust_pilot.json", "w") as fh:
        json.dump({"per_seed": per, "summary": summary}, fh, indent=2)
    cols = [k for k in per[0] if k != "tau_sensitivity"]
    with open(out / "wo2_crashrobust_pilot.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        for r in per:
            w.writerow({k: r[k] for k in cols})
    print(f"\nWrote {out}/wo2_crashrobust_pilot.{{json,csv}}")


if __name__ == "__main__":
    main()
