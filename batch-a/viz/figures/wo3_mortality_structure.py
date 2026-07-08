"""WO-3 figure — mortality structure: individual attrition vs demographic crashes.

Two panels:
  A. DEATH CLUSTERING: per seed, Fano factor of per-tick deaths in A3 vs A4,
     paired by seed (lines). Fano ≈ 1 (dashed) = independent Poisson attrition;
     above = synchronized crashes. Shows where fragility lives.
  B. A3-INHERITANCE: A4 crash severity (max drawdown) vs the same seed's A3
     oscillation amplitude. The regression line + r annotated — is A4 fragility
     inherited from the world's intrinsic instability, or created by
     non-stationarity?

Source: docs/diagnostics/wo3_full20/wo3_checkpoint.jsonl (+ wo3_summary.json).
Renders on partial data (labelled) for mid-grind preview.

    python -m viz.figures.wo3_mortality_structure
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

from .. import style

_DIAG = Path(__file__).resolve().parents[2] / "docs" / "diagnostics" / "wo3_full20"


def _load():
    rows = [json.loads(l) for l in (_DIAG / "wo3_checkpoint.jsonl").read_text().splitlines()
            if l.strip()]
    summary = {}
    sp = _DIAG / "wo3_summary.json"
    if sp.exists():
        summary = json.loads(sp.read_text())
    return rows, summary


def build(out_dir: Path) -> Path:
    style.apply()
    rows, summary = _load()
    ink, rust = style.color("ink"), style.color("rust")
    c_a3, c_a4 = style.case_color("A3"), style.case_color("A4")

    a3 = {r["seed"]: r for r in rows if r["case"] == "a3"}
    a4 = {r["seed"]: r for r in rows if r["case"] == "a4"}
    paired = sorted(set(a3) & set(a4))
    complete = len(rows) >= 40

    fig = plt.figure(figsize=(10.2, 4.5))
    gs = fig.add_gridspec(1, 2, width_ratios=[1.0, 1.0], wspace=0.30,
                          left=0.08, right=0.965, top=0.80, bottom=0.16)

    # ── Panel A: paired Fano, A3 → A4 ──
    axA = fig.add_subplot(gs[0, 0])
    for s in paired:
        f3, f4 = a3[s].get("fano_deaths"), a4[s].get("fano_deaths")
        if f3 is None or f4 is None:
            continue
        axA.plot([0, 1], [f3, f4], color=style.rgba("ink", 0.22), lw=0.9, zorder=1)
        axA.scatter([0], [f3], s=30, facecolor=c_a3, edgecolor="none", zorder=3)
        axA.scatter([1], [f4], s=30, facecolor=c_a4, edgecolor="none", zorder=3)
    axA.axhline(1.0, color=style.rgba("ink", 0.35), lw=0.8, ls=(0, (3, 3)), zorder=0)
    axA.text(1.03, 1.0, "Poisson\n(independent)", fontsize=7, fontfamily=style.MONO,
             va="center", color=style.rgba("ink", 0.55))
    axA.set_xlim(-0.35, 1.55)
    axA.set_xticks([0, 1])
    axA.set_xticklabels(["A3 (stationary)", "A4 (non-stationary)"],
                        fontsize=8.5, fontfamily=style.MONO)
    axA.set_yscale("log")
    axA.set_ylabel("Fano factor of per-tick deaths  (log)", fontsize=8.5,
                   fontfamily=style.MONO)

    # ── Panel B: A4 severity ~ A3 oscillation ──
    axB = fig.add_subplot(gs[0, 1])
    xs = [a3[s]["osc_amplitude"] for s in paired]
    ys = [a4[s]["max_drawdown"] for s in paired]
    ext = [bool(a4[s]["extinct"]) for s in paired]
    for x, y, e in zip(xs, ys, ext):
        axB.scatter([x], [y], s=34,
                    facecolor=(rust if e else style.rgba("ink", 0.75)),
                    edgecolor="none", zorder=3)
    if len(xs) >= 3 and float(np.std(xs)) > 1e-9:
        slope, intercept = np.polyfit(xs, ys, 1)
        r = float(np.corrcoef(xs, ys)[0, 1])
        xl = np.array([min(xs), max(xs)])
        axB.plot(xl, slope * xl + intercept, color=style.rgba("ink", 0.35),
                 lw=1.0, ls=(0, (4, 4)), zorder=1)
        axB.text(0.02, 0.94, f"r = {r:+.2f}  (n={len(xs)})",
                 transform=axB.transAxes, fontsize=8, fontfamily=style.MONO,
                 color=style.rgba("ink", 0.7), va="top")
    axB.scatter([], [], s=34, facecolor=rust, label="extinct under A4")
    axB.legend(loc="lower right", frameon=False, fontsize=7.5,
               labelcolor=style.rgba("ink", 0.75))
    axB.set_xlabel("A3 oscillation amplitude  (p95−p5)/mean", fontsize=8.5,
                   fontfamily=style.MONO)
    axB.set_ylabel("A4 max drawdown  (crash severity)", fontsize=8.5,
                   fontfamily=style.MONO)

    tag = "" if complete else "  · PARTIAL"
    fig.suptitle("WO-3 — mortality structure: attrition vs demographic crashes" + tag,
                 x=0.08, y=0.95, ha="left", fontsize=14.5,
                 fontfamily=style.DISPLAY, color=ink)
    inherit = (summary.get("inheritance") or {}).get("reading", "")
    if inherit:
        fig.text(0.08, 0.875, inherit, ha="left", fontsize=8.5,
                 fontfamily=style.BODY, color=style.rgba("ink", 0.62))

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "wo3_mortality_structure.svg"
    fig.savefig(path, format="svg", metadata={"Date": None})
    plt.close(fig)
    return path


if __name__ == "__main__":
    import sys
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public/figures")
    print("wrote", build(out))
