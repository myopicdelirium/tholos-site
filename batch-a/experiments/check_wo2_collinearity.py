#!/usr/bin/env python3
"""WO-2 collinearity check — can the full-20 sweep separate volatility from R_s?

The crash-robust pilot found βₛ tracks volatility, not mean capacity — but at
n=7 the two are correlated, so a naive n=20 on the current generator would only
tighten the confound. This asks the prior question, on data we already have:
does the seed space contain OFF-DIAGONAL worlds (stable-poor and volatile-rich)
that break the capacity↔volatility diagonal?

  SEPARABLE  → the generator already disentangles them; run the full 20 as amended.
  COLLINEAR  → add a volatility-at-fixed-capacity axis (regen/drain sweep) first.

No new sim compute — reads `docs/diagnostics/wo2_crashrobust_pilot.json`.

    python -m experiments.check_wo2_collinearity
"""

from __future__ import annotations

import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import matplotlib.pyplot as plt          # noqa: E402
from viz import style                     # noqa: E402

DIAG = Path(__file__).resolve().parent.parent / "docs" / "diagnostics"


def quadrant(rs, cv, rmed, cvmed):
    rich = rs > rmed
    volatile = cv > cvmed
    # on-diagonal = capacity and volatility co-vary (rich↔stable, poor↔volatile)
    if (rich and not volatile) or (not rich and volatile):
        return "on-diagonal"
    return "off-diagonal"   # stable-poor or volatile-rich — the disentanglers


def main():
    data = json.load(open(DIAG / "wo2_crashrobust_pilot.json"))
    seeds = [r for r in data["per_seed"] if not r["censored"]]
    rs = np.array([r["R_s"] for r in seeds], float)
    cv = np.array([r["volatility_cv"] for r in seeds], float)
    rmed, cvmed = float(np.median(rs)), float(np.median(cv))
    corr = float(np.corrcoef(rs, cv)[0, 1])
    slope, intercept = np.polyfit(rs, cv, 1)

    rows = []
    for r in seeds:
        q = quadrant(r["R_s"], r["volatility_cv"], rmed, cvmed)
        rows.append({"seed": r["seed"], "R_s": r["R_s"],
                     "volatility_cv": r["volatility_cv"], "osc_period": r["osc_period"],
                     "quadrant": q})
    off = [r["seed"] for r in rows if r["quadrant"] == "off-diagonal"]

    separable = abs(corr) < 0.7 and len(off) >= 2
    verdict = "SEPARABLE" if separable else "COLLINEAR"

    for r in rows:
        print(f"seed {r['seed']}: R_s={r['R_s']:>6.0f} cv={r['volatility_cv']:.3f} "
              f"→ {r['quadrant']}")
    print(f"\ncorr(R_s, volatility) = {corr:+.2f}  |  off-diagonal seeds = {off}")
    print(f"VERDICT: {verdict} — " + (
        "generator already disentangles capacity and volatility; run full 20 as amended."
        if separable else
        "add a volatility-at-fixed-capacity axis (regen/drain sweep) before full 20."))

    # ── the plane plot ──
    style.apply()
    ink, rust, water = style.color("ink"), style.color("rust"), style.color("water")
    fig, ax = plt.subplots(figsize=(6.2, 5.0))
    xline = np.array([rs.min(), rs.max()])
    ax.plot(xline, slope * xline + intercept, color=style.rgba("ink", 0.3),
            lw=1, ls=(0, (4, 4)), zorder=1)
    ax.axvline(rmed, color=style.rgba("ink", 0.12), lw=0.8)
    ax.axhline(cvmed, color=style.rgba("ink", 0.12), lw=0.8)
    for r in rows:
        off_d = r["quadrant"] == "off-diagonal"
        ax.scatter(r["R_s"], r["volatility_cv"], s=90,
                   facecolor=(rust if off_d else "none"),
                   edgecolor=(rust if off_d else ink), linewidths=1.4, zorder=3)
        ax.annotate(f"s{r['seed']}", (r["R_s"], r["volatility_cv"]),
                    textcoords="offset points", xytext=(7, 4), fontsize=8,
                    fontfamily=style.MONO, color=style.rgba("ink", 0.7))
    ax.set_xlabel("carrying capacity  R_s", fontfamily=style.MONO, fontsize=9)
    ax.set_ylabel("volatility  (CV of steady-state pop)", fontfamily=style.MONO, fontsize=9)
    ax.set_title(f"Capacity × volatility — {verdict}  (r={corr:+.2f})",
                 fontfamily=style.DISPLAY, fontsize=13, color=ink, loc="left")
    ax.scatter([], [], s=90, facecolor="none", edgecolor=ink, linewidths=1.4,
               label="on-diagonal")
    ax.scatter([], [], s=90, facecolor=rust, edgecolor=rust, linewidths=1.4,
               label="off-diagonal (disentangler)")
    ax.legend(frameon=False, fontsize=8, loc="upper right",
              labelcolor=style.rgba("ink", 0.75))
    fig.tight_layout()
    plane = DIAG / "wo2_collinearity_plane.svg"
    fig.savefig(plane, format="svg", metadata={"Date": None})
    plt.close(fig)

    out = {"n": len(seeds), "corr_Rs_volatility": round(corr, 3),
           "off_diagonal_seeds": off, "verdict": verdict, "per_seed": rows}
    json.dump(out, open(DIAG / "wo2_collinearity.json", "w"), indent=2)
    import csv
    with open(DIAG / "wo2_collinearity.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)
    print(f"\nWrote {DIAG}/wo2_collinearity.{{json,csv}} + wo2_collinearity_plane.svg")


if __name__ == "__main__":
    main()
