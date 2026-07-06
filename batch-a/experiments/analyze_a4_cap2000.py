#!/usr/bin/env python3
"""A4 headline regeneration at cap 2000 — retires the 'provisional' flag.

The A4 numbers in the report/site were produced at cap 400, which WO-4 showed is
a global confound (the cap binds every world). WO-3's A4 arm re-runs A4 at cap
2000 × 20 seeds × 3000 ticks on the verified fast path — this readout derives the
replacement headline numbers from its checkpoint, paired against the same-seed A3
arm so "what does non-stationarity cost?" is a within-seed contrast.

Every number carries a bootstrap CI over seeds (the ≥20-seed invariant). Partial-
tolerant (labelled) so it can preview mid-grind.

    python -m experiments.analyze_a4_cap2000
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from batch_a.metrics import bootstrap_ci                 # noqa: E402


def _ci(vals):
    vals = [v for v in vals if v is not None]
    if not vals:
        return {"median": None, "ci_low": None, "ci_high": None}
    return bootstrap_ci(vals)


def _fmt(c, nd=3):
    if c["median"] is None:
        return "—"
    return f"{round(c['median'], nd)} [{round(c['ci_low'], nd)}, {round(c['ci_high'], nd)}]"


def analyze(rows):
    out = {}
    for case in ("a3", "a4"):
        cell = [r for r in rows if r["case"] == case]
        if not cell:
            continue
        out[case] = {
            "n_seeds": len(cell),
            "extinct_fraction": round(sum(r["extinct"] for r in cell) / len(cell), 3),
            "R_s": _ci([r["R_s"] for r in cell]),
            "final_pop": _ci([r["final_pop"] for r in cell]),
            "max_drawdown": _ci([r["max_drawdown"] for r in cell]),
            "volatility_cv": _ci([r["volatility_cv"] for r in cell]),
            "fano_deaths": _ci([r["fano_deaths"] for r in cell]),
            "dominant_causes": _tally([r["dominant_cause"] for r in cell]),
        }
    # within-seed contrast: A4 − A3, paired
    a3 = {r["seed"]: r for r in rows if r["case"] == "a3"}
    a4 = {r["seed"]: r for r in rows if r["case"] == "a4"}
    paired = sorted(set(a3) & set(a4))
    if len(paired) >= 3:
        out["paired_contrast"] = {
            "n_paired": len(paired),
            "dR_s": _ci([a4[s]["R_s"] - a3[s]["R_s"] for s in paired]),
            "d_drawdown": _ci([a4[s]["max_drawdown"] - a3[s]["max_drawdown"] for s in paired]),
            "d_volatility": _ci([a4[s]["volatility_cv"] - a3[s]["volatility_cv"] for s in paired]),
        }
    return out


def _tally(items):
    out = {}
    for it in items:
        if it is not None:
            out[it] = out.get(it, 0) + 1
    return dict(sorted(out.items(), key=lambda kv: -kv[1]))


def write_readout(a, out_dir, complete):
    status = "COMPLETE — cap-400 'provisional' flag RETIRED" if complete else \
             f"PARTIAL — provisional flag stays until 40/40 cells"
    def row(label, key, nd=3):
        c3 = _fmt(a.get("a3", {}).get(key, {"median": None}), nd) if "a3" in a else "—"
        c4 = _fmt(a.get("a4", {}).get(key, {"median": None}), nd) if "a4" in a else "—"
        return f"| {label} | {c3} | {c4} |"
    pc = a.get("paired_contrast", {})
    md = f"""# A4 at cap 2000 — regenerated headline numbers ({status})

Source: WO-3 checkpoint (A3 + A4 × 20 seeds, cap 2000, 3000 ticks, vectorized
fast path — bit-identical to the scalar reference). Medians with bootstrap 95%
CIs over seeds. The A3 column is the same-seed stationary baseline, so the A4
contrast is within-world: the cost of non-stationarity itself, not world luck.

| metric | A3 (stationary) | A4 (non-stationary) |
|---|---|---|
| n seeds | {a.get('a3', {}).get('n_seeds', 0)} | {a.get('a4', {}).get('n_seeds', 0)} |
| extinct fraction | {a.get('a3', {}).get('extinct_fraction', '—')} | {a.get('a4', {}).get('extinct_fraction', '—')} |
{row('carrying capacity R_s', 'R_s', 0)}
{row('final population', 'final_pop', 0)}
{row('max drawdown (crash severity)', 'max_drawdown')}
{row('volatility (CV)', 'volatility_cv')}
{row('Fano of per-tick deaths', 'fano_deaths', 1)}

Dominant killers — A3: {a.get('a3', {}).get('dominant_causes', {})} ·
A4: {a.get('a4', {}).get('dominant_causes', {})}

## Within-seed contrast (A4 − A3, paired)
- ΔR_s: {_fmt(pc.get('dR_s', {'median': None}), 0) if pc else '—'}
- Δ drawdown: {_fmt(pc.get('d_drawdown', {'median': None})) if pc else '—'}
- Δ volatility: {_fmt(pc.get('d_volatility', {'median': None})) if pc else '—'}

Reproduce: `python -m experiments.analyze_a4_cap2000`. Fragility ruling (§9.5
"fragile survival") should be re-read against the cap-2000 extinct fraction and
drawdown, not the cap-400 numbers.
"""
    Path(out_dir, "a4_cap2000_read.md").write_text(md)
    Path(out_dir, "a4_cap2000_analysis.json").write_text(json.dumps(a, indent=2))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ckpt", default="docs/diagnostics/wo3_full20/wo3_checkpoint.jsonl")
    ap.add_argument("--out", default="docs/diagnostics")
    args = ap.parse_args()
    p = Path(args.ckpt)
    if not p.exists():
        print(f"no checkpoint at {p} — WO-3 has not produced cells yet")
        sys.exit(1)
    rows = [json.loads(l) for l in p.read_text().splitlines() if l.strip()]
    a = analyze(rows)
    complete = len(rows) >= 40
    write_readout(a, args.out, complete)
    print(f"[{'COMPLETE' if complete else f'PARTIAL {len(rows)}/40'}] "
          f"A4 extinct={a.get('a4', {}).get('extinct_fraction')} "
          f"drawdown={_fmt(a.get('a4', {}).get('max_drawdown', {'median': None}))}")
    print(f"Wrote {args.out}/a4_cap2000_read.md + a4_cap2000_analysis.json")


if __name__ == "__main__":
    main()
