"""perceive_all (vectorized) must equal perceive (scalar) EXACTLY — field by field.

The stream-hash harness (experiments/verify_perception.py) proves end-to-end
no-regression at full horizon; these tests prove the same identity at the source,
per agent per field, on live mutating worlds — so a future edit that breaks the
equivalence fails in seconds, with a named field, not a hash mismatch an hour in.

Cases target the three failure modes: a size-10 torus (radius-2 windows straddle
the seam every tick), a saturated tie world (N-way argmax ties + veg/prey cue
ties), and a plain A3 world (all cue kinds active: water, veg, prey, temperature,
risk). Equality is `==` on floats — bit-identity, not approx.
"""

import tempfile

import pytest

from batch_a.agent.perception import perceive_all
from batch_a.config import Config, load_config
from batch_a.rng import RNGStreams
from batch_a.scheduler import run_tick
from batch_a.sim import Simulation


def _build(overrides, seed):
    d = load_config("a3.yaml").to_dict()
    d["run"]["max_ticks"] = 1
    d["logging"]["per_tick"] = False
    d["perception"]["impl"] = "scalar"          # the sim itself runs the reference
    for path, v in overrides.items():
        node = d
        keys = path.split(".")
        for k in keys[:-1]:
            node = node[k]
        node[keys[-1]] = v
    return Config(d, "equiv-test"), seed


# Tiny grids need tame predation: 6 sigma-4 halos blanket a 10-tile torus and the
# whole population dies of safety-drain in ~3 ticks (verified) — 1 predator keeps
# the risk/safety cues exercised while leaving a survivable safe zone.
CASES = {
    "seam": ({"world.size": 10, "init.n_agents": 25,
              "entities.predators.count": 1, "fields.risk.predator_sigma": 2.0,
              "reproduction.max_population": 80}, 1),
    "tie": ({"world.size": 12, "init.n_agents": 25,
             "entities.predators.count": 1, "fields.risk.predator_sigma": 2.0,
             "reproduction.max_population": 80,
             "entities.water.cluster_sigma": 100.0,
             "entities.water.regen_per_tick": 1.0,
             "entities.vegetation.cluster_sigma": 100.0,
             "entities.vegetation.regen_per_tick": 1.0}, 3),
    "plain_a3": ({"world.size": 24, "init.n_agents": 30,
                  "reproduction.max_population": 120}, 0),
}


def _assert_identical(p_scalar, p_vec, agent_id, tick):
    ctx = f"agent {agent_id} @ tick {tick}"
    assert p_scalar.water_here == p_vec.water_here, f"water_here {ctx}"
    assert p_scalar.food_here == p_vec.food_here, f"food_here {ctx}"
    assert p_scalar.risk_here == p_vec.risk_here, f"risk_here {ctx}"
    assert p_scalar.comfort_deficit_here == p_vec.comfort_deficit_here, f"comfort {ctx}"
    assert p_scalar.in_band == p_vec.in_band, f"in_band {ctx}"
    assert p_scalar.risk_grad == p_vec.risk_grad, f"risk_grad {ctx}"
    assert list(p_scalar.cues) == list(p_vec.cues), f"cue ORDER {ctx}"  # dict order is load-bearing
    for need in p_scalar.cues:
        a, b = p_scalar.cues[need], p_vec.cues[need]
        assert (a.dx, a.dy, a.strength) == (b.dx, b.dy, b.strength), f"cue[{need}] {ctx}"


@pytest.mark.parametrize("case", list(CASES))
def test_vectorized_matches_scalar_exactly(case):
    overrides, seed = CASES[case]
    with tempfile.TemporaryDirectory() as tmp:
        overrides = {**overrides, "logging.out_dir": tmp}
        cfg, seed = _build(overrides, seed)
        sim = Simulation(cfg, seed, run_id=f"equiv_{case}")
        sim._spawn_founders()
        rng = sim.rng
        compared = 0
        for tick in range(60):
            living = [a for a in sim.agents if a.alive]
            if not living:
                break
            if tick % 5 == 0:                    # compare on the live world state
                batch = perceive_all(sim.world, living, cfg)
                for a in living:
                    _assert_identical(a.perceive(sim.world), batch[a.id], a.id, tick)
                    compared += 1
            run_tick(sim.world, sim.agents, cfg, rng, sim.recorder)
        assert compared > 100, f"too few comparisons ({compared}) — world died too fast"


def test_empty_agent_list_is_empty_dict():
    with tempfile.TemporaryDirectory() as tmp:
        cfg, seed = _build({"logging.out_dir": tmp}, 0)
        sim = Simulation(cfg, seed, run_id="equiv_empty")
        sim._spawn_founders()
        assert perceive_all(sim.world, [], cfg) == {}
