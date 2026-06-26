"""Command-line interface.

    python -m batch_a run   --config a1.yaml --seed 0
    python -m batch_a sweep --config a2.yaml --seeds 0-9
    python -m batch_a verify --config a1.yaml --seed 0   # determinism self-check
"""

from __future__ import annotations

import argparse
import json
import sys

from .config import load_config
from .sim import Simulation


def _parse_seeds(spec: str):
    seeds = []
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            lo, hi = part.split("-")
            seeds.extend(range(int(lo), int(hi) + 1))
        elif part:
            seeds.append(int(part))
    return seeds


def _run(args):
    results = Simulation(load_config(args.config), args.seed, args.run_id).run()
    print(json.dumps(results, indent=2))


def _sweep(args):
    config = load_config(args.config)
    summary = []
    for seed in _parse_seeds(args.seeds):
        res = Simulation(config, seed).run()
        summary.append(res)
        print(f"seed {seed:>3}: final_pop={res['final_population']:>4} "
              f"births={res['total_births']:>4} "
              f"median_survival={res['median_survival_time']:.0f} "
              f"extinct={res['extinct']}")
    print(json.dumps({"sweep": args.config, "runs": summary}, indent=2)
          [:0] or "", end="")  # keep stdout terse; per-run lines above


def _verify(args):
    """Run the same (config, seed) twice and confirm identical tick streams.

    The run_id column is excluded from the hash — it is the one field that is
    intentionally per-run; everything the simulation produces must match.
    """
    import csv as _csv
    import hashlib
    from pathlib import Path

    def _hash(run_id):
        out = Simulation(load_config(args.config), args.seed, run_id).run()["out_dir"]
        path = Path(out) / "ticks.csv"
        h = hashlib.sha256()
        with open(path, newline="") as fh:
            reader = _csv.reader(fh)
            for row in reader:
                h.update((",".join(row[1:]) + "\n").encode())  # drop run_id (col 0)
        return h.hexdigest()

    h1 = _hash(f"_verify_a_{args.config}_{args.seed}")
    h2 = _hash(f"_verify_b_{args.config}_{args.seed}")
    ok = h1 == h2
    print(f"determinism: {'OK' if ok else 'FAIL'}  {h1[:16]} vs {h2[:16]}")
    sys.exit(0 if ok else 1)


def main(argv=None):
    parser = argparse.ArgumentParser(prog="batch_a", description="Batch A ABM")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_run = sub.add_parser("run", help="run one (config, seed)")
    p_run.add_argument("--config", required=True)
    p_run.add_argument("--seed", type=int, default=0)
    p_run.add_argument("--run-id", default=None)
    p_run.set_defaults(func=_run)

    p_sweep = sub.add_parser("sweep", help="run a seed sweep")
    p_sweep.add_argument("--config", required=True)
    p_sweep.add_argument("--seeds", default="0-9")
    p_sweep.set_defaults(func=_sweep)

    p_ver = sub.add_parser("verify", help="determinism self-check")
    p_ver.add_argument("--config", required=True)
    p_ver.add_argument("--seed", type=int, default=0)
    p_ver.set_defaults(func=_verify)

    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
