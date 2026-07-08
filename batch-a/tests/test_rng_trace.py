"""RNG trace/replay must reproduce a run bit-identically (SoA rung-3 tooling).

Record a full short run's randomness, replay it into a fresh run of the same
config: the tick streams must be identical and the trace fully consumed. Also
guards the recorded method surface against silent growth (a new rng call in the
sim that isn't recorded would make replay diverge undetectably).
"""

import subprocess
import tempfile
from pathlib import Path

import pytest

import batch_a.sim as sim_mod
from batch_a.config import Config, load_config
from experiments.rng_trace import (
    METHODS, RecordingStreams, ReplayStreams, load_trace, save_trace,
)


def _cfg(tmp):
    d = load_config("a3.yaml").to_dict()
    d["run"]["max_ticks"] = 60
    d["world"]["size"] = 20
    d["init"]["n_agents"] = 15
    d["reproduction"]["max_population"] = 60
    # tame predation: default 6 sigma-4 halos blanket a 20-tile grid and the
    # population safety-drains to extinction in ticks (see test_perception_equivalence)
    d["entities"]["predators"]["count"] = 1
    d["fields"]["risk"]["predator_sigma"] = 2.0
    d["logging"]["per_tick"] = True
    d["logging"]["out_dir"] = tmp
    return Config(d, "rng-trace-test")


def _signature(res):
    rows = (Path(res["out_dir"]) / "ticks.csv").read_text().splitlines()
    return [",".join(l.split(",")[1:]) for l in rows]   # drop run_id col


def _run(cfg, seed, run_id, streams_factory, monkeypatch):
    monkeypatch.setattr(sim_mod, "RNGStreams", streams_factory)
    sim = sim_mod.Simulation(cfg, seed, run_id=run_id)
    res = sim.run()
    return sim, _signature(res)


def test_record_then_replay_is_bit_identical(monkeypatch):
    with tempfile.TemporaryDirectory() as tmp:
        cfg = _cfg(tmp)
        rec_sim, sig_ref = _run(cfg, 5, "trace_ref", RecordingStreams, monkeypatch)
        trace = rec_sim.rng.trace
        assert len(trace) > 800                       # a surviving run consumes plenty

        # round-trip serialization
        save_trace(trace, Path(tmp) / "trace.jsonl")
        trace = load_trace(Path(tmp) / "trace.jsonl")

        replayer = {}
        def factory(seed):
            replayer["rs"] = ReplayStreams(seed, trace)
            return replayer["rs"]
        _, sig_replay = _run(cfg, 5, "trace_replay", factory, monkeypatch)
        assert sig_replay == sig_ref                  # bit-identical stream
        replayer["rs"].assert_exhausted()             # and exactly as much randomness


def test_tampered_trace_changes_the_run(monkeypatch):
    """Replay actually drives the sim: perturbing one recorded draw must change
    the stream (otherwise the tool proves nothing)."""
    with tempfile.TemporaryDirectory() as tmp:
        cfg = _cfg(tmp)
        rec_sim, sig_ref = _run(cfg, 5, "tamper_ref", RecordingStreams, monkeypatch)
        trace = [dict(r) for r in rec_sim.rng.trace]
        # flip EVERY scalar agent-stream uniform draw to its complement — one flip
        # can be behaviorally invisible (both sides of a threshold), many cannot
        flipped = 0
        for r in trace:
            if r["s"] == "agent" and r["m"] == "random" and r["sh"] == []:
                r["v"] = 1.0 - r["v"]
                flipped += 1
        assert flipped > 50
        def factory(seed):
            return ReplayStreams(seed, trace)
        try:
            _, sig_tampered = _run(cfg, 5, "tamper_replay", factory, monkeypatch)
        except RuntimeError:
            return                                    # divergence tripped the guards — fine
        assert sig_tampered != sig_ref


def test_recorded_surface_matches_sim_call_surface():
    """Every rng method the sim calls must be in METHODS — a new call site with
    an unrecorded method would silently escape the trace."""
    root = Path(__file__).resolve().parents[1] / "batch_a"
    out = subprocess.run(
        ["grep", "-rhoE", r"rng[a-z_.]*\.(random|integers|permutation|choice|"
         r"normal|uniform|standard_normal|binomial|poisson|shuffle|exponential)\(",
         str(root)],
        capture_output=True, text=True).stdout
    called = {line.rsplit(".", 1)[-1].rstrip("(") for line in out.splitlines() if line}
    assert called, "grep found no rng calls — pattern broke?"
    missing = called - set(METHODS)
    assert not missing, (
        f"sim calls rng methods {missing} that rng_trace does not record — "
        f"extend METHODS or replay will silently diverge.")
