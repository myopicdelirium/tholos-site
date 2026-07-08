#!/usr/bin/env python3
"""Grind status: progress, rate, and ETA for the WO-2/WO-3 full-20 runs.

Rate is derived from the grind's own progress commits (each push-per-cycle commit
timestamps a cell count), so no extra state is kept anywhere. Also breaks the
WO-2 checkpoint down by (condition × ablation) so the slow tail is visible.

    python -m experiments.grind_status
"""

from __future__ import annotations

import json
import re
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WO2 = ROOT / "docs" / "diagnostics" / "wo2_full20" / "wo2_checkpoint.jsonl"
WO3 = ROOT / "docs" / "diagnostics" / "wo3_full20" / "wo3_checkpoint.jsonl"


def _rows(path):
    if not path.exists():
        return []
    return [json.loads(l) for l in path.read_text().splitlines() if l.strip()]


def _rate_from_git(pattern):
    """(cells, unix_time) pairs from grind progress commits, oldest→newest."""
    out = subprocess.run(
        ["git", "-C", str(ROOT.parent), "log", "--format=%at %s"],
        capture_output=True, text=True).stdout
    pts = []
    for line in out.splitlines():
        m = re.match(rf"(\d+) {pattern}: (\d+)/\d+ cells", line)
        if m:
            pts.append((int(m.group(2)), int(m.group(1))))
    return sorted(pts, key=lambda p: p[1])


def _eta(done, total, pts):
    if len(pts) < 2 or done >= total:
        return None
    (c0, t0), (c1, t1) = pts[0], pts[-1]
    if c1 <= c0 or t1 <= t0:
        return None
    rate = (c1 - c0) / (t1 - t0)          # cells/sec over the observed window
    return (total - done) / rate


def _fmt_eta(sec):
    if sec is None:
        return "n/a"
    return f"{int(sec // 3600)}h{int(sec % 3600 // 60):02d}m"


def main():
    rows2 = _rows(WO2)
    print(f"WO-2: {len(rows2)}/180 cells")
    if rows2:
        by = {}
        for r in rows2:
            by.setdefault((r["condition"], r["ablation"]), 0)
        for r in rows2:
            by[(r["condition"], r["ablation"])] += 1
        for (c, a), n in sorted(by.items()):
            print(f"   {c:10} {a:16} {n:2}/20")
        pts = _rate_from_git("WO-2 grind")
        eta = _eta(len(rows2), 180, pts)
        if pts:
            rate_h = None
            if len(pts) >= 2 and pts[-1][1] > pts[0][1]:
                rate_h = (pts[-1][0] - pts[0][0]) / (pts[-1][1] - pts[0][1]) * 3600
            print(f"   rate ≈ {rate_h:.0f} cells/h · ETA ≈ {_fmt_eta(eta)}"
                  if rate_h else "   rate: n/a")
        cens = sum(1 for r in rows2 if r.get("censored"))
        print(f"   censored (unsettled) so far: {cens}/{len(rows2)}")

    rows3 = _rows(WO3)
    if rows3:
        print(f"WO-3: {len(rows3)}/40 cells")
        pts = _rate_from_git("WO-3 grind")
        print(f"   ETA ≈ {_fmt_eta(_eta(len(rows3), 40, pts))}")
    else:
        print("WO-3: 0/40 (chained — starts when WO-2 completes)")


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:      # piped into head — fine
        pass
