#!/usr/bin/env python3
"""Export the per-tick death/population series for the WO-3 raster figure.

Re-runs ONE seed of A3 and A4 at the exact WO-3 grind config (cap 2000, 3000
ticks, vectorized) and dumps the small per-tick series (pop + deaths-by-cause)
that the grind's scalar-only checkpoint deliberately discarded. Determinism makes
this the SAME run the checkpoint row summarizes — verified here by recomputing
Fano/drawdown from the exported series and comparing to the checkpoint (loud
failure on mismatch; a silent config drift would otherwise fake the figure).

    python -m experiments.export_wo3_raster --seed 13
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from batch_a.config import Config, load_config          # noqa: E402
from batch_a.sim import Simulation                        # noqa: E402
from experiments.wo3_a4_mortality import (                # noqa: E402
    _fano, _max_drawdown, _TRANSIENT,
)

DIAG = Path(__file__).resolve().parent.parent / "docs" / "diagnostics" / "wo3_full20"


def export(seed: int, cap=2000, ticks=3000, impl="vectorized"):
    ckpt = {(r["case"], r["seed"]): r
            for r in (json.loads(l) for l in (DIAG / "wo3_checkpoint.jsonl").read_text().splitlines())}
    out = {"seed": seed, "cap": cap, "ticks": ticks}
    for case in ("a3", "a4"):
        d = load_config(f"{case}.yaml").to_dict()
        d["run"]["max_ticks"] = ticks
        d["run"]["stop_on_extinction"] = False
        d["logging"]["per_tick"] = False
        d["reproduction"]["max_population"] = cap
        d.setdefault("perception", {})["impl"] = impl
        sim = Simulation(Config(d, f"wo3raster:{case}"), seed, run_id=f"wo3raster_{case}_s{seed}")
        sim.run()
        pop = sim.pop_series
        deaths = sim.recorder.death_series
        # verification: this must be the grind's run
        ref = ckpt[(case, seed)]
        fano = _fano([x["total"] for x in deaths[_TRANSIENT:len(pop)]])
        dd = _max_drawdown(pop[_TRANSIENT:])
        if ref["fano_deaths"] is not None and abs(fano - ref["fano_deaths"]) > 1e-6:
            raise SystemExit(f"{case} s{seed}: recomputed fano {fano} != checkpoint "
                             f"{ref['fano_deaths']} — config drift, figure would lie.")
        if abs(dd - ref["max_drawdown"]) > 1e-6:
            raise SystemExit(f"{case} s{seed}: drawdown {dd} != checkpoint {ref['max_drawdown']}")
        causes = sorted({k for x in deaths for k in x if k not in ("tick", "total")})
        out[case] = {
            "pop": pop,
            "deaths_total": [x["total"] for x in deaths[:len(pop)]],
            "deaths_by_cause": {c: [x.get(c, 0) for x in deaths[:len(pop)]] for c in causes},
            "fano": fano, "max_drawdown": dd,
        }
        print(f"{case} s{seed}: fano={fano} dd={dd}  == checkpoint ✓")
    path = DIAG / f"wo3_raster_s{seed}.json"
    path.write_text(json.dumps(out))
    print(f"wrote {path}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=13)
    a = ap.parse_args()
    export(a.seed)


if __name__ == "__main__":
    main()
