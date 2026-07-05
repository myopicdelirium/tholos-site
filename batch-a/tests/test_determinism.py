"""Determinism is non-negotiable (§10): same (config, seed) → identical history."""

import tempfile

from batch_a.sim import Simulation


def _tick_signature(config, seed, tmp):
    config = config  # already a Config
    d = config.to_dict()
    d["logging"]["out_dir"] = tmp
    from batch_a.config import Config
    sim = Simulation(Config(d, "t"), seed, run_id=f"det_{seed}")
    res = sim.run()
    from pathlib import Path
    rows = (Path(res["out_dir"]) / "ticks.csv").read_text().splitlines()
    # exclude the run_id column (col 0) which is intentionally per-run
    return [",".join(line.split(",")[1:]) for line in rows]


def test_same_seed_identical(fast_config):
    with tempfile.TemporaryDirectory() as tmp:
        cfg = fast_config("a2.yaml", n_agents=15)
        a = _tick_signature(cfg, 7, tmp)
        b = _tick_signature(cfg, 7, tmp)
    assert a == b and len(a) > 1


def test_different_seed_differs(fast_config):
    with tempfile.TemporaryDirectory() as tmp:
        cfg = fast_config("a2.yaml", n_agents=15)
        a = _tick_signature(cfg, 1, tmp)
        b = _tick_signature(cfg, 2, tmp)
    assert a != b


def test_env_and_spawn_streams_separable(fast_config):
    """Same env seed, different spawn placement should be reachable via streams."""
    from batch_a.rng import RNGStreams
    r1 = RNGStreams(42)
    r2 = RNGStreams(42)
    # independent streams: drawing from spawn must not perturb environment
    _ = r1.spawn.random(100)
    assert r1.environment.random() == r2.environment.random()
