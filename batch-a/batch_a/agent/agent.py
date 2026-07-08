"""The Agent: a homeostatic optimizer with learning, traits, and memory.

Behaviour is assembled from the seams in this package; the Agent itself just
holds state and delegates. Effects of actions are applied centrally by the
scheduler (§4) so conflicts resolve in one place — the Agent never mutates the
world directly.
"""

from __future__ import annotations

from .learning import QLearner
from .memory import Memory
from .perception import perceive
from .decision import decide
from .state import NeedVector


class Agent:
    _next_id = 0

    def __init__(self, config, world, x, y, traits, birth_tick, metrics):
        self.config = config
        self.id = Agent._next_id
        Agent._next_id += 1

        self.x, self.y = int(x), int(y)
        self.state = NeedVector(config.needs)
        self.traits = traits
        self.learner = QLearner(config.learning)
        self.memory = Memory()
        self.metrics = metrics

        self.alive = True
        self.cause_of_death = None
        self.birth_tick = birth_tick
        self.age = 0
        self.birthplace = (self.x, self.y)
        self.offspring_count = 0
        self.repro_cooldown = 0
        self.last_action = None

        # kinship + grief (Batch B, §B1) — pure bookkeeping unless grief.enabled
        self.parent_id = None
        self.children: list[int] = []
        self.grief = None            # {"drive", "site", "since"} while latched
        self.bereaved_at = None      # tick of first bereavement (for measurement)
        self.attention_band: list[str] = []  # drives holding slots last tick

        # filled each tick for the learner update after resolution
        self._pending = None

    @classmethod
    def reset_ids(cls):
        cls._next_id = 0

    # -- perception + choice (steps 2–3) -----------------------------------
    def perceive(self, world):
        return perceive(world, self.x, self.y, world.radius, self.config)

    def choose(self, world, perception, rng):
        decision = decide(self, world, perception, self.config, rng)
        self._pending = decision
        self.last_action = decision.action
        return decision

    # -- learning hook (step 6) --------------------------------------------
    def learn(self, realized_gain):
        d = self._pending
        if d is None or d.target_need is None:
            return
        self.learner.update(d.target_need, d.action, d.expected, realized_gain)

    def is_reproduction_ready(self, repro_cfg) -> bool:
        if not repro_cfg.enabled:
            return False
        if self.age < int(repro_cfg.maturity_age) or self.repro_cooldown > 0:
            return False
        if self.state.min_value() < float(repro_cfg.readiness_min_need):
            return False
        return self.state["energy"].value >= float(repro_cfg.energy_cost)

    def traits_dict(self) -> dict:
        return self.traits.as_dict()
