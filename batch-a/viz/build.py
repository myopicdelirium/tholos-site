"""Regenerate every Batch A figure from committed CSVs → public/figures/*.svg.

Deterministic: same data → identical SVG. Add a figure by importing its module
and appending it to FIGURES.

    python -m viz.build
"""

from __future__ import annotations

from pathlib import Path

from .figures import a1_learning_gradient, wo2_selection_moderator, wo3_mortality_structure

# repo-root public/figures (the Next.js site's static assets)
OUT_DIR = Path(__file__).resolve().parents[2] / "public" / "figures"

# (module, data gate) — a figure only builds once its diagnostics exist, so
# `python -m viz.build` stays green mid-grind and picks figures up as data lands.
_DIAG = Path(__file__).resolve().parents[1] / "docs" / "diagnostics"
FIGURES = [
    (a1_learning_gradient, _DIAG / "wo1_a1_summary.json"),
    (wo2_selection_moderator, _DIAG / "wo2_full20" / "wo2_checkpoint.jsonl"),
    (wo3_mortality_structure, _DIAG / "wo3_full20" / "wo3_checkpoint.jsonl"),
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
