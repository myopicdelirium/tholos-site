#!/usr/bin/env python3
"""Inline the emergence run data into the visual → self-contained HTML.

    python -m viz.build_emergence_visual        # → viz/visuals/emergence.build.html
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "viz" / "visuals" / "emergence.html"
DATA = ROOT.parent / "public" / "runs" / "emergence.json"
OUT = ROOT / "viz" / "visuals" / "emergence.build.html"
PLACEHOLDER = "/*__DATA__*/ null"


def main():
    tpl = TEMPLATE.read_text()
    data = json.loads(DATA.read_text())
    if PLACEHOLDER not in tpl:
        raise SystemExit("placeholder not found")
    OUT.write_text(tpl.replace(PLACEHOLDER, json.dumps(data, separators=(",", ":"))))
    print(f"→ {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
