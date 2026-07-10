#!/usr/bin/env python3
"""Inline the run data into the IFD visual → a single self-contained HTML file.

Reads the template viz/visuals/ifd.html (which carries a `const DATA = /*__DATA__*/
null;` placeholder) and public/runs/ifd_compare.json, and writes a standalone file
with the data inlined — usable as an Artifact (whose CSP blocks fetching the JSON)
and openable directly in a browser.

    python -m viz.build_ifd_visual            # → viz/visuals/ifd.build.html
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]          # batch-a/
TEMPLATE = ROOT / "viz" / "visuals" / "ifd.html"
DATA = ROOT.parent / "public" / "runs" / "ifd_compare.json"
OUT = ROOT / "viz" / "visuals" / "ifd.build.html"
PLACEHOLDER = "/*__DATA__*/ null"


def main():
    tpl = TEMPLATE.read_text()
    data = json.loads(DATA.read_text())
    if PLACEHOLDER not in tpl:
        raise SystemExit("placeholder not found in template")
    html = tpl.replace(PLACEHOLDER, json.dumps(data, separators=(",", ":")))
    OUT.write_text(html)
    print(f"→ {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
