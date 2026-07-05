"""A1 figure — the learning × gradient 2×2 (WO-1).

The result, not softened: freezing learning moves A1 survival by ZERO; killing
the gradient is what collapses it. A1 learning is decorative for survival — the
case is a reactive baseline. The figure makes "rows identical / columns differ"
legible without reading the numbers.

Source: docs/diagnostics/wo1_a1_{summary.json,runs.csv} (committed WO-1 data).
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

import matplotlib.pyplot as plt

from .. import style

_DIAG = Path(__file__).resolve().parents[2] / "docs" / "diagnostics"

# 2×2 layout: row = learning {on, frozen}; col = gradient {on, off}
CELLS = {
    (0, 0): "learn_on__grad_on",
    (0, 1): "learn_on__grad_off",
    (1, 0): "learn_frozen__grad_on",
    (1, 1): "learn_frozen__grad_off",
}


def _load():
    with open(_DIAG / "wo1_a1_summary.json") as fh:
        summ = {c["cell"]: c for c in json.load(fh)}
    runs: dict[str, list] = {}
    with open(_DIAG / "wo1_a1_runs.csv") as fh:
        for r in csv.DictReader(fh):
            runs.setdefault(r["cell"], []).append(float(r["survival_time"]))
    return summ, runs


def build(out_dir: Path) -> Path:
    style.apply()
    summ, runs = _load()
    ink = style.color("ink")
    rust = style.color("rust")
    paper = style.color("paper")

    fig = plt.figure(figsize=(10.2, 4.4))
    gs = fig.add_gridspec(2, 3, width_ratios=[1, 1, 1.7],
                          hspace=0.55, wspace=0.5,
                          left=0.10, right=0.975, top=0.80, bottom=0.14)

    # ── Panel 1: the 2×2 rate matrix ──
    for (row, col), cell in CELLS.items():
        ax = fig.add_subplot(gs[row, col])
        s = summ[cell]
        frac = s["frac_survived"]
        grad_on = col == 0
        c = ink if grad_on else rust
        ax.barh([0], [1.0], height=0.62, color=style.rgba("ink", 0.06),
                edgecolor="none")                       # track
        ax.barh([0], [frac], height=0.62, color=c, edgecolor="none")
        ax.text(0.5, 0.86, f"{frac * 100:.0f}%", ha="center", va="center",
                fontsize=17, fontfamily=style.DISPLAY, color=c)
        ax.text(0.5, -0.9, f"median {s['median_survival']:.0f} ticks",
                ha="center", va="center", fontsize=7.5, fontfamily=style.MONO,
                color=style.rgba("ink", 0.6))
        ax.set_xlim(0, 1)
        ax.set_ylim(-1.3, 1.3)
        ax.set_xticks([])
        ax.set_yticks([])
        ax.grid(False)
        for sp in ax.spines.values():
            sp.set_visible(False)

    # matrix headers
    fig.text(0.055, 0.615, "learning\non", ha="right", va="center", fontsize=8.5,
             fontfamily=style.MONO, color=style.rgba("ink", 0.75))
    fig.text(0.055, 0.30, "learning\nfrozen", ha="right", va="center", fontsize=8.5,
             fontfamily=style.MONO, color=style.rgba("ink", 0.75))
    fig.text(0.175, 0.845, "gradient on", ha="center", fontsize=8.5,
             fontfamily=style.MONO, color=style.rgba("ink", 0.75))
    fig.text(0.365, 0.845, "gradient off", ha="center", fontsize=8.5,
             fontfamily=style.MONO, color=rust)

    # ── Panel 2: the decisive contrast (distributions) ──
    ax = fig.add_subplot(gs[:, 2])
    lanes = [("grad_on", 1, "gradient on"), ("grad_off", 0, "gradient off")]
    for key, y0, label in lanes:
        for learn, dy, marker, face in [
            ("learn_on", 0.16, "o", ink),
            ("learn_frozen", -0.16, "o", "none"),
        ]:
            cell = f"{learn}__{key}"
            times = runs[cell]
            # deterministic vertical spread of stacked seeds (no RNG → same SVG)
            buckets: dict[float, int] = {}
            xs, ys = [], []
            for t in times:
                k = round(t)
                i = buckets.get(k, 0)
                buckets[k] = i + 1
                xs.append(t)
                ys.append(y0 + dy + (i - 3) * 0.035)
            edge = ink if face == "none" else "none"
            ax.scatter(xs, ys, s=26, marker=marker, facecolor=face,
                       edgecolor=(rust if (key == "grad_off" and face == "none") else edge),
                       linewidths=0.9, zorder=3,
                       color=None if face == "none" else face)
        ax.text(-40, y0, label, ha="right", va="center", fontsize=8.5,
                fontfamily=style.MONO,
                color=(ink if key == "grad_on" else rust))

    ax.axvline(1500, color=style.rgba("ink", 0.25), lw=0.8, ls=(0, (3, 3)), zorder=1)
    ax.text(1480, 1.62, "survived", ha="right", va="bottom", fontsize=7,
            fontfamily=style.MONO, color=style.rgba("ink", 0.5))
    ax.text(100, -0.62, "thirst death", ha="center", va="top", fontsize=7,
            fontfamily=style.MONO, color=style.rgba("rust", 0.8))
    ax.set_xlim(-60, 1620)
    ax.set_ylim(-0.85, 1.75)
    ax.set_yticks([])
    ax.set_xlabel("survival time (ticks)", fontsize=8.5, fontfamily=style.MONO)
    ax.grid(axis="y", visible=False)

    # legend (filled = learning on, open = learning frozen)
    ax.scatter([], [], s=26, marker="o", facecolor=ink, edgecolor="none",
               label="learning on")
    ax.scatter([], [], s=26, marker="o", facecolor="none", edgecolor=ink,
               linewidths=0.9, label="learning frozen")
    ax.legend(loc="lower right", frameon=False, fontsize=7.5, handletextpad=0.4,
              labelcolor=style.rgba("ink", 0.75))

    # ── title ──
    fig.suptitle("A1 — learning is parasitic on the gradient", x=0.10, y=0.955,
                 ha="left", fontsize=15, fontfamily=style.DISPLAY, color=ink)
    fig.text(0.10, 0.885,
             "Freezing learning moves survival by zero (rows identical); removing the "
             "gradient collapses it (columns differ).",
             ha="left", fontsize=8.5, fontfamily=style.BODY,
             color=style.rgba("ink", 0.62))

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "a1_learning_gradient_2x2.svg"
    # strip the embedded date so regeneration is byte-identical (deterministic)
    fig.savefig(path, format="svg", metadata={"Date": None})
    plt.close(fig)
    return path
