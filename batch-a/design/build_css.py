#!/usr/bin/env python3
"""Generate the site's CSS custom properties from design/tokens.json (V1).

ONE palette source: tokens.json drives the Python figure pipeline (viz/style.py)
and — via this generator — the site CSS. Emits src/app/tokens.css with:

  * the site's legacy variable names (--ivory, --teal, --insurgent, …) in their
    existing space-separated RGB-triplet form, so every current usage
    (rgb(var(--ivory) / 0.98), the player's getPropertyValue("--insurgent"))
    keeps working byte-for-byte;
  * semantic --ba-* hex variables (paper/ink/water/rust/… + per-case and
    per-death-cause accents) for new work, so nothing new hardcodes a color.

Deterministic output; `--check` exits 1 if the committed file drifts from the
tokens (guarded by tests/test_design_tokens.py).

    python -m design.build_css            # regenerate
    python -m design.build_css --check    # verify no drift
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
TOKENS = _HERE / "tokens.json"
OUT = _HERE.parent.parent / "src" / "app" / "tokens.css"   # repo-root/src/app/

# tokens.json name → legacy site variable (existing usages must keep working)
LEGACY = {
    "paper": "ivory",
    "ink": "ink",
    "water": "teal",
    "rust": "insurgent",
    "brass": "brass",
    "taupe": "taupe",
    "mist": "mist",
}


def _triplet(hex_color: str) -> str:
    h = hex_color.lstrip("#")
    return " ".join(str(int(h[i:i + 2], 16)) for i in (0, 2, 4))


def render() -> str:
    palette = json.loads(TOKENS.read_text())["palette"]
    lines = [
        "/* GENERATED from batch-a/design/tokens.json — do not edit by hand.",
        "   Regenerate: (cd batch-a && python -m design.build_css)  */",
        "",
        ":root {",
        "  /* legacy names (RGB triplets — used as rgb(var(--x) / a)) */",
    ]
    for tok, legacy in LEGACY.items():
        lines.append(f"  --{legacy}: {_triplet(palette[tok])};")
    lines.append("")
    lines.append("  /* semantic Batch A names (hex — canvas/new work) */")
    for tok in LEGACY:
        lines.append(f"  --ba-{tok}: {palette[tok]};")
    for case, hexv in palette["case"].items():
        lines.append(f"  --ba-case-{case.lower()}: {hexv};")
    for cause, hexv in palette["death"].items():
        lines.append(f"  --ba-death-{cause.replace('_', '-')}: {hexv};")
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def main():
    css = render()
    if "--check" in sys.argv:
        current = OUT.read_text() if OUT.exists() else ""
        if current != css:
            print(f"DRIFT: {OUT} does not match tokens.json — regenerate.")
            sys.exit(1)
        print("tokens.css matches tokens.json")
        return
    OUT.write_text(css)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
