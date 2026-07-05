"""Shared matplotlib style for Batch A figures (V2-MACH).

Reads `design/tokens.json` and registers ONE style so every figure is native to
the site — ink on paper, hairline grid, minimal spines, SVG output with real text
(so the browser renders the site's Ibarra Real Nova / Inter). **No color literal
may live in a figure script — import `T` (tokens) from here.**
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib as mpl

_ROOT = Path(__file__).resolve().parent.parent          # batch-a/
TOKENS_PATH = _ROOT / "design" / "tokens.json"


def load_tokens() -> dict:
    with open(TOKENS_PATH) as fh:
        return json.load(fh)


T = load_tokens()
P = T["palette"]
TYPE = T["type"]


def _rgba(hex_color: str, alpha: float) -> tuple:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return (r, g, b, alpha)


def apply():
    """Install the Batch A rcParams. Idempotent."""
    mpl.rcParams.update({
        # canvas
        "figure.facecolor": P["paper"],
        "savefig.facecolor": P["paper"],
        "axes.facecolor": P["paper"],
        "figure.dpi": 120,
        "savefig.dpi": 120,
        "savefig.bbox": "tight",
        # SVG: keep text as text so the site's webfonts render it; fixed hashsalt
        # makes clip-path ids reproducible → byte-identical SVG on regeneration
        "svg.fonttype": "none",
        "svg.hashsalt": "batch-a",
        # ink
        "text.color": P["ink"],
        "axes.edgecolor": _rgba(P["ink"], 0.45),
        "axes.labelcolor": P["ink"],
        "xtick.color": _rgba(P["ink"], 0.7),
        "ytick.color": _rgba(P["ink"], 0.7),
        # type — body/sans by default; figures set serif per-title
        "font.family": "sans-serif",
        "font.sans-serif": [TYPE["body"], "Inter", "DejaVu Sans"],
        "font.serif": [TYPE["display"], "DejaVu Serif"],
        "font.size": 9,
        # hairline grid, minimal spines
        "axes.grid": True,
        "grid.color": _rgba(P["ink"], 0.10),
        "grid.linewidth": 0.6,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.linewidth": 0.8,
        "xtick.major.width": 0.8,
        "ytick.major.width": 0.8,
        "lines.solid_capstyle": "round",
    })


# convenience accessors (no literals in figures)
def color(name: str) -> str:
    return P[name]


def case_color(case: str) -> str:
    return P["case"][case]


def rgba(name: str, alpha: float) -> tuple:
    return _rgba(P[name], alpha)


DISPLAY = TYPE["display"]
BODY = TYPE["body"]
MONO = TYPE["mono"]
