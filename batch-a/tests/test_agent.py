"""Agent substrate: need vector extensibility, traits inheritance, learning flag."""

import numpy as np

from batch_a.agent.learning import QLearner
from batch_a.agent.state import NeedVector
from batch_a.agent.traits import Traits, founder_traits, inherit
from batch_a.config import load_config


def test_need_vector_is_ordered_and_clamped():
    cfg = load_config("a3.yaml")
    nv = NeedVector(cfg.needs)
    assert nv.names() == ["energy", "hydration", "temperature_comfort", "safety"]
    nv.add("energy", 5.0)              # cannot exceed target
    assert nv["energy"].value == cfg.needs.energy.target
    nv.drain("energy", 5.0)           # cannot go below zero
    assert nv["energy"].value == 0.0
    assert nv.first_depleted() == "energy"


def test_learning_disabled_freezes_gain():
    cfg = load_config("a1.yaml").to_dict()
    cfg["learning"]["enabled"] = False
    from batch_a.config import Config
    learner = QLearner(Config(cfg, "x").learning)
    g0 = learner.gain("hydration", "drink")
    learner.update("hydration", "drink", expected=0.5, realized=2.0)
    assert learner.gain("hydration", "drink") == g0  # frozen


def test_learning_enabled_adapts_gain():
    cfg = load_config("a1.yaml")
    learner = QLearner(cfg.learning)
    g0 = learner.gain("hydration", "drink")
    for _ in range(20):
        learner.update("hydration", "drink", expected=0.5, realized=1.0)
    assert learner.gain("hydration", "drink") != g0


def test_trait_inheritance_mutates_within_bounds():
    cfg = load_config("a2.yaml")
    rng = np.random.default_rng(0)
    parent = Traits(exploration=0.5)
    kids = [inherit(parent, cfg.traits, rng).exploration for _ in range(500)]
    assert all(0.0 <= k <= 1.0 for k in kids)
    assert abs(np.mean(kids) - 0.5) < 0.05      # unbiased around the parent
    assert np.std(kids) > 0.0                   # mutation actually varies


def test_fix_identical_disables_variation():
    cfg = load_config("a1.yaml")  # a1 fixes traits identical
    rng = np.random.default_rng(0)
    vals = {founder_traits(cfg.traits, rng).exploration for _ in range(50)}
    assert len(vals) == 1
