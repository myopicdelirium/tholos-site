"""WO-3 figure — one world, two regimes: attrition becomes crashes.

The Fano numbers made "individual vs demographic" quantitative; this makes it
legible. For a single seed, per-tick deaths over time (stem heights) beneath the
population trace, A3 above A4. A3: a steady low hum of deaths, population flat.
A4: long quiet stretches punctuated by tall death spikes that coincide with the
population's cliffs — the signature of synchronized crashes.

Source: docs/diagnostics/wo3_full20/wo3_raster_s<seed>.json (from
experiments.export_wo3_raster — the verified same run as the checkpoint).

    python -m viz.figures.wo3_death_raster [seed]
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

from .. import style

_DIAG = Path(__file__).resolve().parents[2] / "docs" / "diagnostics" / "wo3_full20"
_DEFAULT_SEED = 13


def _find(seed):
    p = _DIAG / f"wo3_raster_s{seed}.json"
    return p if p.exists() else None


def _cause_color(cause):
    # semantic death colors from tokens (death.<cause>), rust fallback
    try:
        return style.T["palette"]["death"][cause]
    except Exception:
        return style.color("rust")


def build(out_dir: Path, seed: int = _DEFAULT_SEED) -> Path:
    style.apply()
    data = json.loads(_find(seed).read_text())
    ink = style.color("ink")

    fig, axes = plt.subplots(2, 1, figsize=(10.2, 5.6), sharex=True)
    fig.subplots_adjust(left=0.08, right=0.965, top=0.80, bottom=0.10, hspace=0.28)

    for ax, case in zip(axes, ("a3", "a4")):
        c = data[case]
        pop = np.asarray(c["pop"], float)
        t = np.arange(len(pop))
        deaths = c["deaths_by_cause"]
        # population trace (right axis)
        axp = ax.twinx()
        axp.plot(t, pop, color=style.rgba("ink", 0.75), lw=1.1, zorder=3)
        axp.set_ylabel("population", fontsize=8, fontfamily=style.MONO,
                       color=style.rgba("ink", 0.7))
        axp.set_ylim(0, max(pop.max() * 1.08, 1))
        axp.grid(False)
        # deaths as stacked stems per cause (left axis)
        bottom = np.zeros(len(t))
        for cause, series in deaths.items():
            s = np.asarray(series[:len(t)], float)
            if s.sum() == 0:
                continue
            ax.bar(t, s, bottom=bottom, width=1.0, color=_cause_color(cause),
                   alpha=0.85, linewidth=0, zorder=2, rasterized=True)  # dense layer → raster
            bottom += s
        ax.set_ylabel("deaths / tick", fontsize=8, fontfamily=style.MONO)
        ax.set_ylim(0, max(bottom.max() * 1.1, 1))
        ax.grid(axis="y", visible=False)
        label = "A3 — stationary" if case == "a3" else "A4 — non-stationary"
        ax.text(0.008, 0.9, f"{label}   Fano {c['fano']}   drawdown {c['max_drawdown']}",
                transform=ax.transAxes, fontsize=8.5, fontfamily=style.MONO,
                color=ink, va="top")
    axes[-1].set_xlabel("tick", fontsize=8.5, fontfamily=style.MONO)

    fig.suptitle(f"WO-3 — one world (seed {seed}): steady attrition vs synchronized crashes",
                 x=0.08, y=0.945, ha="left", fontsize=14, fontfamily=style.DISPLAY, color=ink)
    fig.text(0.08, 0.865,
             "Same world under both regimes. Bars = deaths per tick (stacked by cause); "
             "line = population. A3 settles flat under a steady death hum; A4 never settles — "
             "it oscillates, with deaths bursting through the down-phases (Fano ≈ 5 vs 2).",
             ha="left", fontsize=8.5, fontfamily=style.BODY, color=style.rgba("ink", 0.62))

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "wo3_death_raster.svg"
    # rasterized bar layer embeds at this dpi; text/line/axes stay vector
    fig.savefig(path, format="svg", dpi=150, metadata={"Date": None})
    plt.close(fig)
    return path


if __name__ == "__main__":
    import sys
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else _DEFAULT_SEED
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public/figures")
    print("wrote", build(out, seed))
