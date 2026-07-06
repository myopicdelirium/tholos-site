"""WO-2 figure — selection (lead) + the birthplace-moderator disentanglement.

Two panels, stated as the result, not softened:
  A. SELECTION (the lead): per seed, founder→survivor exploration trait. Exploration
     is selected DOWN in almost every world; the poorest/most-volatile seed is the
     exception (scarcity favours exploring). Paired dots, connected.
  B. MODERATOR (secondary, weak): crash-robust hazard βₛ vs volatility, point shade
     by capacity, censored seeds open. The disentangling regression's standardized
     coefficients are annotated — birthplace is a weak, non-specific moderator.

Source: docs/diagnostics/wo2_full20/{wo2_checkpoint.jsonl, wo2_full20_analysis.json}.
Renders on partial data (labelled) so it can preview mid-grind.

    python -m viz.figures.wo2_selection_moderator
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

from .. import style

_DIAG = Path(__file__).resolve().parents[2] / "docs" / "diagnostics" / "wo2_full20"


def _load():
    rows = [json.loads(l) for l in (_DIAG / "wo2_checkpoint.jsonl").read_text().splitlines() if l.strip()]
    analysis = {}
    ap = _DIAG / "wo2_full20_analysis.json"
    if ap.exists():
        analysis = json.loads(ap.read_text())
    return rows, analysis


def build(out_dir: Path) -> Path:
    style.apply()
    rows, analysis = _load()
    ink, rust, water = style.color("ink"), style.color("rust"), style.color("water")

    # lead panel uses the clean world (uniform spawn, no ablation)
    base = [r for r in rows if r["ablation"] == "none" and r["condition"] == "uniform"]
    base = sorted(base, key=lambda r: r["R_s"])           # order seeds by capacity
    complete = len([r for r in rows]) >= 180

    fig = plt.figure(figsize=(10.2, 4.5))
    gs = fig.add_gridspec(1, 2, width_ratios=[1.15, 1.0], wspace=0.28,
                          left=0.075, right=0.965, top=0.80, bottom=0.16)

    # ── Panel A: selection — founder → survivor exploration per seed ──
    axA = fig.add_subplot(gs[0, 0])
    for i, r in enumerate(base):
        f, s = r.get("founder_trait"), r.get("survivor_trait")
        if f is None or s is None:
            continue
        down = s <= f
        c = ink if down else rust                          # rust = the exploration-up exception
        axA.plot([i, i], [f, s], color=style.rgba("ink", 0.25), lw=0.9, zorder=1)
        axA.scatter([i], [f], s=22, facecolor="none", edgecolor=style.rgba("ink", 0.5),
                    linewidths=0.9, zorder=2)              # founder (open)
        axA.scatter([i], [s], s=30, facecolor=c, edgecolor="none", zorder=3)  # survivor (filled)
    axA.axhline(np.mean([r["founder_trait"] for r in base if r.get("founder_trait") is not None]),
                color=style.rgba("ink", 0.3), lw=0.8, ls=(0, (3, 3)), zorder=0)
    axA.set_xlabel("seed  (ordered by carrying capacity →)", fontsize=8.5, fontfamily=style.MONO)
    axA.set_ylabel("exploration trait", fontsize=8.5, fontfamily=style.MONO)
    axA.set_xticks([])
    axA.text(0.02, 0.06, "open = founder mean · filled = survivor mean",
             transform=axA.transAxes, fontsize=7, fontfamily=style.MONO,
             color=style.rgba("ink", 0.55))
    axA.scatter([], [], s=30, facecolor=ink, edgecolor="none", label="selected down")
    axA.scatter([], [], s=30, facecolor=rust, edgecolor="none", label="selected up (scarcity)")
    axA.legend(loc="upper right", frameon=False, fontsize=7.5, labelcolor=style.rgba("ink", 0.75))

    # ── Panel B: moderator — crash-robust βₛ vs volatility ──
    axB = fig.add_subplot(gs[0, 1])
    mod = [r for r in rows if r["ablation"] == "none" and r.get("hazard_beta") is not None
           and r.get("volatility_cv") is not None]
    if mod:
        caps = np.array([r["R_s"] for r in mod], float)
        cmin, cmax = caps.min(), max(caps.max(), caps.min() + 1)
        for r in mod:
            cens = r.get("censored")
            shade = 0.25 + 0.6 * (r["R_s"] - cmin) / (cmax - cmin)   # darker = richer
            axB.scatter([r["volatility_cv"]], [r["hazard_beta"]], s=34,
                        facecolor=("none" if cens else style.rgba("ink", shade)),
                        edgecolor=style.rgba("ink", 0.55), linewidths=0.9, zorder=3)
        axB.axhline(0.0, color=style.rgba("ink", 0.3), lw=0.8, zorder=1)
    dis = analysis.get("disentangled", {})
    cvol, ccap = dis.get("std_coef_volatility"), dis.get("std_coef_capacity")
    if cvol is not None:
        axB.text(0.02, 0.06,
                 f"β ~ z(vol)+z(cap):  vol {cvol:+.2f} · cap {ccap:+.2f}",
                 transform=axB.transAxes, fontsize=7, fontfamily=style.MONO,
                 color=style.rgba("ink", 0.6))
    axB.text(0.02, 0.94, "shade = capacity · open = censored (unsettled)",
             transform=axB.transAxes, fontsize=7, fontfamily=style.MONO,
             va="top", color=style.rgba("ink", 0.55))
    axB.set_xlabel("volatility  (CV of steady-state population)", fontsize=8.5, fontfamily=style.MONO)
    axB.set_ylabel("crash-robust hazard βₛ  (protective)", fontsize=8.5, fontfamily=style.MONO)

    # ── titles (sober; the result stated) ──
    tag = "" if complete else "  · PARTIAL"
    fig.suptitle("WO-2 — exploration is selected down; birthplace is a weak moderator" + tag,
                 x=0.075, y=0.95, ha="left", fontsize=14.5, fontfamily=style.DISPLAY, color=ink)
    drift = analysis.get("selection", {}).get("survivor_trait_drift_median")
    sub = ("Survivors are less explorative than founders in almost every world "
           f"(median drift {drift}); the exception is the scarcest seed.")
    fig.text(0.075, 0.875, sub, ha="left", fontsize=8.5, fontfamily=style.BODY,
             color=style.rgba("ink", 0.62))

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "wo2_selection_moderator.svg"
    fig.savefig(path, format="svg", metadata={"Date": None})
    plt.close(fig)
    return path


if __name__ == "__main__":
    import sys
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public/figures")
    print("wrote", build(out))
