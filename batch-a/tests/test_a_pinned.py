"""Batch A behavior is PINNED — Batch B code must not move it by one bit.

The hashes in pinned_a_hashes.json were generated from the trusted pre-Batch-B
code (commit 88f6ce2 lineage). Every Batch B mechanism ships behind config flags
that default OFF; with the flags off, these streams must stay byte-identical
forever. If this test fails, a B change leaked into the A path — fix the leak,
never re-pin to make it pass (re-pinning is only legitimate for a deliberate,
documented A change).
"""

import hashlib
import json
import tempfile
from pathlib import Path

import pytest

from batch_a.config import Config, load_config
from batch_a.sim import Simulation

PINS = json.loads((Path(__file__).parent / "pinned_a_hashes.json").read_text())


def _stream_hash(case, seed, ticks=150):
    d = load_config(case).to_dict()
    d["run"]["max_ticks"] = ticks
    d["world"]["size"] = 32
    d["init"]["n_agents"] = 20
    d["logging"]["per_tick"] = True
    with tempfile.TemporaryDirectory() as tmp:
        d["logging"]["out_dir"] = tmp
        sim = Simulation(Config(d, f"pin:{case}"), seed, run_id=f"pin_{case}_{seed}")
        res = sim.run()
        h = hashlib.sha256()
        for line in (Path(res["out_dir"]) / "ticks.csv").read_text().splitlines():
            h.update((",".join(line.split(",")[1:]) + "\n").encode())
        return h.hexdigest()


@pytest.mark.parametrize("key", list(PINS))
def test_a_stream_is_pinned(key):
    case, seed = key.split(":")
    assert _stream_hash(case, int(seed)) == PINS[key], (
        f"{key}: Batch A stream drifted from its pinned hash — a Batch B change "
        f"leaked into the A path. Find the leak; do not re-pin.")
