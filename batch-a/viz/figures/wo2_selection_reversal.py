"""WO-2 figure — the selection reversal: learning flips what evolution favours.

The program's headline interaction, drawn directly: per seed, the survivor−founder
exploration drift with learning ON vs learning FROZEN. Same seed = same world
(environment stream is separate from agent streams), so each line is one world
under two regimes. With learning, exploration is selected down; freeze learning
and selection reverses. freeze_traits (mechanical zero) drawn as the control rail.

Source: docs/diagnostics/wo2_full20/wo2_checkpoint.jsonl (uniform condition).

    python -m viz.figures.wo2_selection_reversal
"""

from __future__ import annotations

import json
import statistics
from pathlib import Path

import matplotlib.pyplot as plt

from .. import style

_DIAG = Path(__file__).resolve().parents[2] / "docs" / "diagnostics" / "wo2_full20"
COLS = [("none", 0.0, "learning on"),
        ("freeze_learning", 1.0, "learning frozen"),
        ("freeze_traits", 2.0, "traits frozen\n(control)")]


def _drift(rows, cond, abl):
    out = {}
    for r in rows:
        if (r["condition"] == cond and r["ablation"] == abl
                and r.get("survivor_trait") is not None
                and r.get("founder_trait") is not None):
            out[r["seed"]] = r["survivor_trait"] - r["founder_trait"]
    return out


def build(out_dir: Path) -> Path:
    style.apply()
    rows = [json.loads(l) for l in (_DIAG / "wo2_checkpoint.jsonl").read_text().splitlines()
            if l.strip()]
    ink, rust = style.color("ink"), style.color("rust")

    drifts = {abl: _drift(rows, "uniform", abl) for abl, _, _ in COLS}
    seeds = sorted(set(drifts["none"]) & set(drifts["freeze_learning"]))

    fig, ax = plt.subplots(figsize=(7.4, 4.8))
    fig.subplots_adjust(left=0.11, right=0.965, top=0.78, bottom=0.12)

    # per-seed lines across the two live regimes; control column as dots only
    for s in seeds:
        y0, y1 = drifts["none"][s], drifts["freeze_learning"][s]
        reversed_ = (y0 < 0) and (y1 > 0)
        ax.plot([0, 1], [y0, y1],
                color=style.rgba("rust", 0.5) if reversed_ else style.rgba("ink", 0.18),
                lw=1.0 if reversed_ else 0.8, zorder=2)
        ax.scatter([0], [y0], s=24, facecolor=ink, edgecolor="none", zorder=3)
        ax.scatter([1], [y1], s=24,
                   facecolor=(rust if y1 > 0 else ink), edgecolor="none", zorder=3)
    for s, v in drifts["freeze_traits"].items():
        ax.scatter([2], [v], s=18, facecolor="none",
                   edgecolor=style.rgba("ink", 0.45), linewidths=0.8, zorder=3)

    # per-column medians
    for abl, x, _ in COLS:
        vals = list(drifts[abl].values())
        if vals:
            med = statistics.median(vals)
            ax.plot([x - 0.13, x + 0.13], [med, med], color=ink, lw=2.2, zorder=4)
            ax.annotate(f"{med:+.2f}", (x + 0.16, med), fontsize=9,
                        fontfamily=style.MONO, color=ink, va="center")

    ax.axhline(0.0, color=style.rgba("ink", 0.35), lw=0.8, ls=(0, (3, 3)), zorder=1)
    ax.set_xlim(-0.45, 2.55)
    ax.set_xticks([x for _, x, _ in COLS])
    ax.set_xticklabels([lbl for _, _, lbl in COLS], fontsize=9, fontfamily=style.MONO)
    ax.set_ylabel("survivor − founder exploration (drift)", fontsize=8.5,
                  fontfamily=style.MONO)

    fig.suptitle("WO-2 — learning reverses selection on exploration",
                 x=0.11, y=0.94, ha="left", fontsize=14.5,
                 fontfamily=style.DISPLAY, color=ink)
    n_rev = sum(1 for s in seeds
                if drifts["none"][s] < 0 and drifts["freeze_learning"][s] > 0)
    fig.text(0.11, 0.845,
             f"Each line is one world under two regimes (same seed). "
             f"{n_rev}/{len(seeds)} worlds flip sign when learning is frozen.",
             ha="left", fontsize=8.5, fontfamily=style.BODY,
             color=style.rgba("ink", 0.62))

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "wo2_selection_reversal.svg"
    fig.savefig(path, format="svg", metadata={"Date": None})
    plt.close(fig)
    return path


if __name__ == "__main__":
    import sys
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public/figures")
    print("wrote", build(out))
