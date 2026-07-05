"""Regenerate every Batch A figure from committed CSVs → public/figures/*.svg.

Deterministic: same data → identical SVG. Add a figure by importing its module
and appending it to FIGURES.

    python -m viz.build
"""

from __future__ import annotations

from pathlib import Path

from .figures import a1_learning_gradient

# repo-root public/figures (the Next.js site's static assets)
OUT_DIR = Path(__file__).resolve().parents[2] / "public" / "figures"

FIGURES = [a1_learning_gradient]


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for mod in FIGURES:
        path = mod.build(OUT_DIR)
        print(f"wrote {path.relative_to(path.parents[2])}  ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
