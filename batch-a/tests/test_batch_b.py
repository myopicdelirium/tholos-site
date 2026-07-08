"""Batch B mechanism tests: kinship, the grief latch, bounded attention.

The A-identity of the OFF state is covered by test_a_pinned; these test the ON
state's semantics against constructed situations with known answers.
"""

import tempfile

import pytest

from batch_a.config import Config, load_config
from batch_a.sim import Simulation
from batch_a.scheduler import run_tick
from batch_a.agent.decision import compute_weights


def _b1(tmp, **over):
    d = load_config("b1.yaml").to_dict()
    d["run"]["max_ticks"] = 1
    d["logging"]["per_tick"] = False
    d["logging"]["out_dir"] = tmp
    d["world"]["size"] = 24
    d["init"]["n_agents"] = 20
    # b1's 10 predators blanket a 24-tile test torus (see the tiny-world note in
    # test_perception_equivalence) — 2 keep losses coming without a massacre
    d["entities"]["predators"]["count"] = 2
    d["fields"]["risk"]["predator_sigma"] = 2.0
    for path, v in over.items():
        node = d
        ks = path.split(".")
        for k in ks[:-1]:
            node = node[k]
        node[ks[-1]] = v
    return Config(d, "b-test")


class _FakeNeeds:
    """Minimal need-vector stand-in with fixed deficits."""

    def __init__(self, deficits):
        self._d = dict(deficits)

    def deficits(self):
        return dict(self._d)

    def names(self):
        return list(self._d)


class _FakeAgent:
    def __init__(self, grief=None, band=()):
        self.grief = grief
        self.attention_band = list(band)


def _cfg_dict(attention=None, grief_enabled=False):
    d = load_config("b1.yaml").to_dict()
    if attention:
        d["decision"]["attention"].update(attention)
    d["grief"]["enabled"] = grief_enabled
    return Config(d, "w-test")


# ── compute_weights: gating semantics ─────────────────────────────────────
def test_attention_keeps_topk_and_zeroes_rest():
    cfg = _cfg_dict(attention={"enabled": True, "slots": 2, "hysteresis": 0.0})
    needs = _FakeNeeds({"energy": 0.5, "hydration": 0.3, "safety": 0.1, "x": 0.05})
    agent = _FakeAgent()
    w = compute_weights(needs, cfg.decision, agent=agent, config=cfg)
    assert w["safety"] == 0.0 and w["x"] == 0.0
    assert w["energy"] > w["hydration"] > 0
    assert abs(sum(w.values()) - 1.0) < 1e-12
    assert agent.attention_band == ["energy", "hydration"]


def test_hysteresis_holds_incumbent_against_small_challenger():
    cfg = _cfg_dict(attention={"enabled": True, "slots": 1, "hysteresis": 0.2})
    agent = _FakeAgent(band=["energy"])
    # hydration slightly ahead — but not by the hysteresis margin
    needs = _FakeNeeds({"energy": 0.45, "hydration": 0.55})
    w = compute_weights(needs, cfg.decision, agent=agent, config=cfg)
    assert w["hydration"] == 0.0 and w["energy"] > 0     # incumbent holds
    # a decisive challenger takes the slot
    needs = _FakeNeeds({"energy": 0.2, "hydration": 0.8})
    w = compute_weights(needs, cfg.decision, agent=agent, config=cfg)
    assert w["energy"] == 0.0 and w["hydration"] > 0


def test_exempt_drive_bypasses_the_budget():
    cfg = _cfg_dict(attention={"enabled": True, "slots": 1, "hysteresis": 0.0,
                               "exempt": ["hydration"]},
                    grief_enabled=True)
    agent = _FakeAgent(grief={"drive": 5.0, "site": (0, 0), "since": 0})
    needs = _FakeNeeds({"energy": 0.2, "hydration": 0.6})
    w = compute_weights(needs, cfg.decision, agent=agent, config=cfg)
    # grief takes the single slot, but hydration keeps weight via the private channel
    assert w["grief"] > 0 and w["hydration"] > 0 and w["energy"] == 0.0


def test_grief_dominates_the_band_when_latched():
    cfg = _cfg_dict(attention={"enabled": True, "slots": 1, "hysteresis": 0.08},
                    grief_enabled=True)
    agent = _FakeAgent(grief={"drive": 2.5, "site": (0, 0), "since": 0})
    needs = _FakeNeeds({"energy": 0.4, "hydration": 0.9})
    w = compute_weights(needs, cfg.decision, agent=agent, config=cfg)
    assert w["grief"] > 0.5
    assert w["hydration"] == 0.0 and w["energy"] == 0.0  # the alarm is shielded


# ── the latch lifecycle in a live sim ──────────────────────────────────────
def test_latch_forms_on_child_death_and_decays_only_when_attended():
    with tempfile.TemporaryDirectory() as tmp:
        cfg = _b1(tmp)
        sim = Simulation(cfg, 11, run_id="b_latch")
        sim._spawn_founders()
        # run until some parent is bereaved (predators supply losses)
        bereaved = None
        for _ in range(600):
            run_tick(sim.world, sim.agents, cfg, sim.rng, sim.recorder)
            bereaved = next((a for a in sim.agents
                             if a.alive and a.grief is not None), None)
            if bereaved:
                break
        assert bereaved is not None, "no bereavement in 600 ticks — stage broken"
        assert bereaved.bereaved_at is not None
        assert bereaved.grief["drive"] <= float(cfg.grief.drive)
        assert isinstance(bereaved.grief["site"], tuple)
        # kinship wiring: the dead child pointed back at this parent
        dead_kids = [a for a in sim.agents
                     if not a.alive and a.parent_id == bereaved.id]
        assert dead_kids, "latched parent has no dead child on record"


def test_kinship_recorded_without_grief_enabled():
    with tempfile.TemporaryDirectory() as tmp:
        cfg = _b1(tmp, **{"grief.enabled": False,
                          "decision.attention.enabled": False})
        sim = Simulation(cfg, 5, run_id="b_kin")
        sim._spawn_founders()
        for _ in range(400):
            run_tick(sim.world, sim.agents, cfg, sim.rng, sim.recorder)
        kids = [a for a in sim.agents if a.parent_id is not None]
        assert kids, "no births in 400 ticks"
        byid = {a.id: a for a in sim.agents}
        for k in kids[:20]:
            assert k.id in byid[k.parent_id].children
        # and no grief ever forms when disabled
        assert all(a.grief is None for a in sim.agents)
