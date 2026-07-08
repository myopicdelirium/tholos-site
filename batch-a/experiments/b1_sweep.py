#!/usr/bin/env python3
"""B1 pilot sweep — the phase structure of terminal commitment.

Preregistered claims (docs/BATCH_B_SPEC.md):
  C1  Bereaved parents die during the latch at a rate far above the matched
      non-bereaved-parent baseline, WITHOUT any scripted death.
  C2  The effect is gated by attention bandwidth: strong at slots=1, weak/absent
      at slots=3 (the alarm is only shielded when the band is narrow).
  C3  The effect is gated by latch persistence: fast decay releases in time
      (grief without martyrdom); slow decay outlives the body.
  C4  ABLATION latch-off: no grief → bereaved indistinguishable from baseline.
  C5  ABLATION private channel (hydration exempt from the budget): commitment
      persists but thirst-martyrdom specifically collapses — the deaths shift
      or vanish, showing the mechanism is the SHIELDING, not the grief itself.

Grid: decay_attended × slots × seeds, plus grief-off baselines per slots and the
private-channel cell. Per-(cell, seed) scalars only — checkpoint survives
container restarts (tracked dir), same grind discipline as WO-2/WO-3.

    python -m experiments.b1_sweep --seeds 0-7
"""

from __future__ import annotations

import argparse
import csv
import json
import statistics
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from batch_a.config import Config, load_config          # noqa: E402
from batch_a.sim import Simulation                        # noqa: E402

DECAYS = [0.002, 0.004, 0.012]      # vigil ≈ 1100 / 550 / 183 attended ticks
SLOTS = [1, 2, 3]                    # attention bandwidth
ABLATION_CELLS = [
    # (name, grief_on, slots, decay, exempt)
    ("baseline_s1", False, 1, None, []),
    ("baseline_s2", False, 2, None, []),
    ("baseline_s3", False, 3, None, []),
    ("private_channel", True, 1, 0.004, ["hydration"]),
]


def _parse_seeds(spec):
    out = []
    for part in spec.split(","):
        if "-" in part:
            lo, hi = part.split("-")
            out.extend(range(int(lo), int(hi) + 1))
        elif part.strip():
            out.append(int(part))
    return out


def _cells(seeds):
    cells = []
    for d in DECAYS:
        for s in SLOTS:
            for seed in seeds:
                cells.append((f"d{d}_s{s}", True, s, d, [], seed))
    for name, gon, s, d, ex in ABLATION_CELLS:
        for seed in seeds:
            cells.append((name, gon, s, d, ex, seed))
    return cells


def run_cell(name, grief_on, slots, decay, exempt, seed):
    d = load_config("b1.yaml").to_dict()
    d["grief"]["enabled"] = bool(grief_on)
    if decay is not None:
        d["grief"]["decay_attended"] = float(decay)
    d["decision"]["attention"]["slots"] = int(slots)
    d["decision"]["attention"]["exempt"] = list(exempt)
    d["logging"]["per_tick"] = False
    sim = Simulation(Config(d, f"b1:{name}"), seed, run_id=f"b1_{name}_s{seed}")
    res = sim.run()
    ag = sim.agents

    parents = [a for a in ag if a.offspring_count >= 1]
    bpar = [a for a in parents if a.bereaved_at is not None]
    npar = [a for a in parents if a.bereaved_at is None]

    died_latched = {}
    vigil_lengths = []
    released = alive_latched = 0
    for a in bpar:
        if a.alive:
            alive_latched += a.grief is not None
            released += a.grief is None
        elif a.grief is not None:
            died_latched[a.cause_of_death] = died_latched.get(a.cause_of_death, 0) + 1
            death_tick = a.birth_tick + a.metrics.ticks_alive
            vigil_lengths.append(death_tick - a.grief["since"])
        else:
            released += 1

    nb = len(bpar)
    selfneglect = died_latched.get("hydration", 0) + died_latched.get("energy", 0)
    npar_dead = {}
    for a in npar:
        if not a.alive:
            npar_dead[a.cause_of_death] = npar_dead.get(a.cause_of_death, 0) + 1
    nn = len(npar)

    return {
        "n_parents": len(parents), "n_bereaved": nb, "n_nonbereaved": nn,
        "died_latched": died_latched,
        "martyr_selfneglect": round(selfneglect / nb, 4) if nb else None,
        "vigil_death_rate": round(sum(died_latched.values()) / nb, 4) if nb else None,
        "released": released, "alive_latched": int(alive_latched),
        "median_vigil_len": (int(statistics.median(vigil_lengths))
                             if vigil_lengths else None),
        "nonb_selfneglect": round((npar_dead.get("hydration", 0)
                                   + npar_dead.get("energy", 0)) / nn, 4) if nn else None,
        "nonb_death_rate": round(sum(npar_dead.values()) / nn, 4) if nn else None,
        "world_deaths": res["deaths_by_cause"],
        "final_pop": res["final_population"], "extinct": int(res["extinct"]),
    }


def _load_done(ckpt):
    done = {}
    if ckpt.exists():
        for line in ckpt.read_text().splitlines():
            if line.strip():
                r = json.loads(line)
                done[(r["cell"], r["seed"])] = r
    return done


def run(seeds, out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    ckpt = out / "b1_checkpoint.jsonl"
    done = _load_done(ckpt)
    rows = []
    for (name, gon, slots, decay, exempt, seed) in _cells(seeds):
        key = (name, seed)
        if key in done:
            rows.append(done[key])
            continue
        res = run_cell(name, gon, slots, decay, exempt, seed)
        row = {"cell": name, "grief": int(gon), "slots": slots,
               "decay": decay, "exempt": ",".join(exempt), "seed": seed, **res}
        with open(ckpt, "a") as fh:
            fh.write(json.dumps(row) + "\n")
        rows.append(row)
        m = res["martyr_selfneglect"]
        print(f"  {name:16} s{seed:<2} | bereaved={res['n_bereaved']:>3} "
              f"martyr={'—' if m is None else f'{m:.2f}'} "
              f"nonb={res['nonb_selfneglect']}", flush=True)

    _summarize(rows, out)
    return rows


def _summarize(rows, out):
    def med(vals):
        vals = [v for v in vals if v is not None]
        return round(statistics.median(vals), 3) if vals else None

    cells = sorted({r["cell"] for r in rows})
    summary = []
    for cell in cells:
        cr = [r for r in rows if r["cell"] == cell]
        summary.append({
            "cell": cell, "n_seeds": len(cr),
            "slots": cr[0]["slots"], "decay": cr[0]["decay"],
            "grief": cr[0]["grief"], "exempt": cr[0]["exempt"],
            "martyr_median": med([r["martyr_selfneglect"] for r in cr]),
            "vigil_death_median": med([r["vigil_death_rate"] for r in cr]),
            "nonb_selfneglect_median": med([r["nonb_selfneglect"] for r in cr]),
            "median_vigil_len": med([r["median_vigil_len"] for r in cr]),
            "released_total": sum(r["released"] for r in cr),
            "bereaved_total": sum(r["n_bereaved"] for r in cr),
        })
        s = summary[-1]
        print(f"{cell:16} | martyr={s['martyr_median']} "
              f"vigil_death={s['vigil_death_median']} "
              f"nonb={s['nonb_selfneglect_median']} "
              f"released={s['released_total']}/{s['bereaved_total']}")

    with open(out / "b1_summary.json", "w") as fh:
        json.dump(summary, fh, indent=2)
    skip = {"died_latched", "world_deaths"}
    fields = [k for k in dict.fromkeys(k for r in rows for k in r) if k not in skip]
    with open(out / "b1_runs.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"\nWrote {out}/b1_runs.csv + b1_summary.json")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", default="0-7")
    ap.add_argument("--out", default="docs/diagnostics/b1_pilot")  # tracked → survives restarts
    ap.add_argument("--check-complete", action="store_true")
    args = ap.parse_args()
    seeds = _parse_seeds(args.seeds)
    if args.check_complete:
        done = _load_done(Path(args.out) / "b1_checkpoint.jsonl")
        missing = [c for c in _cells(seeds) if (c[0], c[5]) not in done]
        print(f"complete: {len(missing) == 0} ({len(missing)} cells remaining)")
        sys.exit(0 if not missing else 1)
    run(seeds, args.out)


if __name__ == "__main__":
    main()
