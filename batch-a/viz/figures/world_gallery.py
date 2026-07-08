"""World gallery — capacity is a property of the world, made visible.

Twenty procedurally generated A3 worlds (the exact worlds of the full-20 —
same seeds, same environment stream), each drawn as its resource-endowment
field and ordered by the capacity the run actually measured (cycle-averaged
R̂_s from the WO-2 checkpoint). The gradient from sparse-and-scattered to
dense-and-clustered IS the moderator axis the disentangling regression found.

World build only — no simulation; endowment is the t=0 field (§5 scalar).

    python -m viz.figures.world_gallery
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

from .. import style

_DIAG = Path(__file__).resolve().parents[2] / "docs" / "diagnostics" / "wo2_full20"


def _worlds(seeds):
    import sys
    root = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(root))
    from batch_a.config import load_config
    from batch_a.environment.world import World
    from batch_a.rng import RNGStreams
    cfg = load_config("a3.yaml")
    out = {}
    for s in seeds:
        out[s] = World(cfg, RNGStreams(s).environment).endowment_grid()
    return out


def build(out_dir: Path) -> Path:
    style.apply()
    rows = [json.loads(l) for l in (_DIAG / "wo2_checkpoint.jsonl").read_text().splitlines()
            if l.strip()]
    ink = style.color("ink")
    rs = {r["seed"]: (r["R_s"], r.get("censored", 0))
          for r in rows if r["condition"] == "uniform" and r["ablation"] == "none"}
    order = sorted(rs, key=lambda s: rs[s][0])
    grids = _worlds(order)

    # paper → water: endowment reads as "wetness/resource", token-driven
    cmap = LinearSegmentedColormap.from_list(
        "endow", [style.color("paper"), style.color("water")])

    fig, axes = plt.subplots(4, 5, figsize=(10.2, 8.6))
    fig.subplots_adjust(left=0.03, right=0.97, top=0.86, bottom=0.05,
                        wspace=0.12, hspace=0.34)
    for ax, seed in zip(axes.ravel(), order):
        ax.imshow(grids[seed], cmap=cmap, vmin=0.0, vmax=1.0,
                  interpolation="nearest", origin="lower")
        ax.set_xticks([])
        ax.set_yticks([])
        ax.grid(False)
        for sp in ax.spines.values():
            sp.set_visible(True)
            sp.set_linewidth(0.6)
            sp.set_edgecolor(style.rgba("ink", 0.3))
        r, cens = rs[seed]
        ax.set_title(f"s{seed} · R̂ₛ {'>' if cens else '='} {r:.0f}",
                     fontsize=8, fontfamily=style.MONO,
                     color=style.rgba("ink", 0.75), pad=4)

    fig.suptitle("The twenty worlds — endowment fields, ordered by measured capacity",
                 x=0.03, y=0.965, ha="left", fontsize=14.5,
                 fontfamily=style.DISPLAY, color=ink)
    fig.text(0.03, 0.915,
             "Same generator, twenty seeds. R̂ₛ = cycle-averaged steady population "
             "(uniform spawn, no ablation); '>' marks censored (still climbing at 3000 ticks).",
             ha="left", fontsize=8.5, fontfamily=style.BODY,
             color=style.rgba("ink", 0.62))

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "world_gallery.svg"
    fig.savefig(path, format="svg", metadata={"Date": None})
    plt.close(fig)
    return path


if __name__ == "__main__":
    import sys
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public/figures")
    print("wrote", build(out))
