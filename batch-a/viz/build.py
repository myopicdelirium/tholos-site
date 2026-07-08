"""Regenerate every Batch A figure from committed CSVs → public/figures/*.svg.

Deterministic: same data → identical SVG. Add a figure by importing its module
and appending it to FIGURES.

    python -m viz.build
"""

from __future__ import annotations

from pathlib import Path

from .figures import (
    a1_learning_gradient, b1_phase, wo2_selection_moderator, wo2_selection_reversal,
    wo3_mortality_structure, wo3_death_raster, world_gallery,
)

# repo-root public/figures (the Next.js site's static assets)
OUT_DIR = Path(__file__).resolve().parents[2] / "public" / "figures"

# (module, data gate) — a figure only builds once its diagnostics exist, so
# `python -m viz.build` stays green mid-grind and picks figures up as data lands.
_DIAG = Path(__file__).resolve().parents[1] / "docs" / "diagnostics"
_WO2 = _DIAG / "wo2_full20" / "wo2_checkpoint.jsonl"
_WO3 = _DIAG / "wo3_full20" / "wo3_checkpoint.jsonl"
FIGURES = [
    (a1_learning_gradient, _DIAG / "wo1_a1_summary.json"),
    (wo2_selection_moderator, _WO2),
    (wo2_selection_reversal, _WO2),
    (world_gallery, _WO2),
    (wo3_mortality_structure, _WO3),
    (wo3_death_raster, _DIAG / "wo3_full20" / "wo3_raster_s13.json"),
    (b1_phase, _DIAG / "b1_pilot" / "b1_checkpoint.jsonl"),
]


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for mod, gate in FIGURES:
        if not gate.exists():
            print(f"skip {mod.__name__.split('.')[-1]} (no data yet: {gate.name})")
            continue
        path = mod.build(OUT_DIR)
        print(f"wrote {path.relative_to(path.parents[2])}  ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
