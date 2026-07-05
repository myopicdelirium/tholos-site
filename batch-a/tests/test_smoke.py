"""Each case runs end-to-end and produces the §6 logging artifacts."""

import json
import tempfile
from pathlib import Path

import pytest

from batch_a.config import Config
from batch_a.sim import Simulation


@pytest.mark.parametrize("case", ["a1.yaml", "a2.yaml", "a3.yaml", "a4.yaml"])
def test_case_runs_and_logs(fast_config, case):
    with tempfile.TemporaryDirectory() as tmp:
        d = fast_config(case, n_agents=12).to_dict()
        d["logging"]["out_dir"] = tmp
        res = Simulation(Config(d, case), 0, run_id="smoke").run()
        out = Path(res["out_dir"])
        # §6 artifacts present
        assert (out / "summaries.csv").exists()
        assert (out / "config.yaml").exists()
        meta = json.loads((out / "meta.json").read_text())
        assert meta["environment_hash"] == res["environment_hash"]
        assert meta["seed"] == 0
        assert res["ticks_run"] >= 1


def test_a1_is_single_agent_no_reproduction(fast_config):
    with tempfile.TemporaryDirectory() as tmp:
        d = fast_config("a1.yaml").to_dict()
        d["logging"]["out_dir"] = tmp
        res = Simulation(Config(d, "a1"), 0).run()
        assert res["founders"] == 1
        assert res["total_births"] == 0  # no reproduction in A1


def test_a2_has_selection(fast_config):
    """A2 enables reproduction → births occur, population can exceed founders."""
    with tempfile.TemporaryDirectory() as tmp:
        d = fast_config("a2.yaml", n_agents=25, max_ticks=300).to_dict()
        d["logging"]["out_dir"] = tmp
        res = Simulation(Config(d, "a2"), 0).run()
        assert res["total_births"] > 0
