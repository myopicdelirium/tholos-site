"""B1 figure — the phase structure of terminal commitment.

Panel A: martyr rate (self-neglect while latched, median over seeds) as a
decay × slots matrix — the phase map. The grief-off baseline row and the
private-channel ablation cell sit beneath it: the two ways the death region is
erased (C4, C5).
Panel B: outcome composition of bereaved parents at slots=1 across decay —
died latched / released / alive-latched — the release-in-time boundary (C3).

Source: docs/diagnostics/b1_pilot/b1_checkpoint.jsonl. Partial-tolerant.

    python -m viz.figures.b1_phase
"""

from __future__ import annotations

import json
import statistics
from pathlib import Path

import matplotlib.pyplot as plt

from .. import style

_DIAG = Path(__file__).resolve().parents[2] / "docs" / "diagnostics" / "b1_pilot"
DECAYS = [0.002, 0.004, 0.012]
SLOTS = [1, 2, 3]


def _med(vals):
    vals = [v for v in vals if v is not None]
    return statistics.median(vals) if vals else None


def build(out_dir: Path) -> Path:
    style.apply()
    rows = [json.loads(l) for l in (_DIAG / "b1_checkpoint.jsonl").read_text().splitlines()
            if l.strip()]
    ink, rust, paper = style.color("ink"), style.color("rust"), style.color("paper")

    def cell(name):
        return [r for r in rows if r["cell"] == name]

    complete = len(rows) >= 104
    fig = plt.figure(figsize=(10.2, 5.2))
    gs = fig.add_gridspec(1, 2, width_ratios=[1.05, 1.0], wspace=0.30,
                          left=0.08, right=0.965, top=0.78, bottom=0.12)

    # ── Panel A: the phase matrix ──
    axA = fig.add_subplot(gs[0, 0])
    axA.set_xlim(-0.5, 2.5)
    axA.set_ylim(-2.1, 2.5)
    axA.axis("off")
    for i, d in enumerate(DECAYS):
        for j, s in enumerate(SLOTS):
            m = _med([r["martyr_selfneglect"] for r in cell(f"d{d}_s{s}")])
            x, y = j, 2 - i
            if m is None:
                axA.text(x, y, "·", ha="center", va="center", fontsize=12,
                         color=style.rgba("ink", 0.3))
                continue
            # rust saturation encodes the death region
            axA.add_patch(plt.Rectangle((x - 0.46, y - 0.42), 0.92, 0.84,
                                        facecolor=style.rgba("rust", 0.12 + 0.75 * m),
                                        edgecolor=style.rgba("ink", 0.25), lw=0.7))
            axA.text(x, y + 0.08, f"{m:.2f}", ha="center", va="center",
                     fontsize=15, fontfamily=style.DISPLAY,
                     color=(paper if m > 0.55 else ink))
            base = _med([r["nonb_selfneglect"] for r in cell(f"d{d}_s{s}")])
            if base is not None:
                axA.text(x, y - 0.27, f"base {base:.2f}", ha="center", va="center",
                         fontsize=6.5, fontfamily=style.MONO,
                         color=(style.rgba("paper", 0.85) if m > 0.55
                                else style.rgba("ink", 0.55)))
    for j, s in enumerate(SLOTS):
        axA.text(j, 2.62, f"slots {s}", ha="center", fontsize=8.5,
                 fontfamily=style.MONO, color=style.rgba("ink", 0.75))
    labels = ["slow\n(vigil ~1100t)", "mid\n(~550t)", "fast\n(~183t)"]
    for i, lab in enumerate(labels):
        axA.text(-0.72, 2 - i, lab, ha="right", va="center", fontsize=7.5,
                 fontfamily=style.MONO, color=style.rgba("ink", 0.75))
    axA.text(-0.72, 2.95, "latch decay", ha="right", fontsize=7.5,
             fontfamily=style.MONO, color=style.rgba("ink", 0.5))
    # ablation strip
    ab_y = -1.35
    for k, (name, lab) in enumerate([("baseline_s1", "grief OFF (s1)"),
                                     ("private_channel", "private channel (s1)")]):
        cr = cell(name)
        m = (_med([r["martyr_selfneglect"] for r in cr]) if name != "baseline_s1"
             else _med([r["nonb_selfneglect"] for r in cr]))
        x = 0.5 + k * 1.4
        if m is not None:
            axA.add_patch(plt.Rectangle((x - 0.46, ab_y - 0.42), 0.92, 0.84,
                                        facecolor=style.rgba("rust", 0.12 + 0.75 * m),
                                        edgecolor=style.rgba("ink", 0.25), lw=0.7))
            axA.text(x, ab_y + 0.06, f"{m:.2f}", ha="center", va="center",
                     fontsize=13, fontfamily=style.DISPLAY,
                     color=(paper if m > 0.55 else ink))
        axA.text(x, ab_y - 0.62, lab, ha="center", fontsize=7,
                 fontfamily=style.MONO, color=style.rgba("ink", 0.65))
    axA.text(1.0, -0.62, "ablations — the two erasures", ha="center", fontsize=7.5,
             fontfamily=style.MONO, color=style.rgba("ink", 0.5))
    axA.set_title("martyr rate among bereaved parents", fontsize=9,
                  fontfamily=style.MONO, color=style.rgba("ink", 0.75), pad=18)

    # ── Panel B: outcome composition at slots=1 across decay ──
    axB = fig.add_subplot(gs[0, 1])
    cats = [("died latched", style.rgba("rust", 0.85)),
            ("released", style.rgba("ink", 0.35)),
            ("alive latched", style.rgba("ink", 0.75))]
    xs = range(len(DECAYS))
    for i, d in enumerate(DECAYS):
        cr = cell(f"d{d}_s1")
        nb = sum(r["n_bereaved"] for r in cr)
        if nb == 0:
            continue
        died = sum(sum(r.get("died_latched", {}).values()) for r in cr)
        rel = sum(r["released"] for r in cr)
        alv = sum(r["alive_latched"] for r in cr)
        fr = [died / nb, rel / nb, alv / nb]
        bottom = 0.0
        for (lab, c), v in zip(cats, fr):
            axB.bar(i, v, bottom=bottom, width=0.6, color=c, linewidth=0)
            if v > 0.06:
                axB.text(i, bottom + v / 2, f"{v:.2f}", ha="center", va="center",
                         fontsize=7.5, fontfamily=style.MONO,
                         color=(paper if c == cats[0][1] else paper))
            bottom += v
    axB.set_xticks(list(xs))
    axB.set_xticklabels([f"decay {d}" for d in DECAYS], fontsize=8,
                        fontfamily=style.MONO)
    axB.set_ylim(0, 1.0)
    axB.set_ylabel("fraction of bereaved (slots=1)", fontsize=8.5,
                   fontfamily=style.MONO)
    from matplotlib.patches import Patch
    axB.legend(handles=[Patch(facecolor=c, label=lab) for lab, c in cats],
               frameon=False, fontsize=7.5, loc="upper right",
               labelcolor=style.rgba("ink", 0.75))

    tag = "" if complete else "  · PARTIAL"
    fig.suptitle("B1 — terminal commitment: the phase structure" + tag,
                 x=0.08, y=0.95, ha="left", fontsize=14.5,
                 fontfamily=style.DISPLAY, color=ink)
    fig.text(0.08, 0.87,
             "Deaths by self-neglect while grief holds the attention band; no death is scripted. "
             "Cell shade = martyr rate; 'base' = matched non-bereaved parents in the same worlds.",
             ha="left", fontsize=8.5, fontfamily=style.BODY, color=style.rgba("ink", 0.62))

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "b1_phase.svg"
    fig.savefig(path, format="svg", metadata={"Date": None})
    plt.close(fig)
    return path


if __name__ == "__main__":
    import sys
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public/figures")
    print("wrote", build(out))
