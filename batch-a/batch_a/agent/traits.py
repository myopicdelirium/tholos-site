"""Heritable traits (§3.6, §9.4).

Batch A's load-bearing trait is the exploration disposition — the
conservative↔explorative axis (A2). It maps to two behavioural knobs: the ε of
ε-stochastic choice, and the probability of taking a random (non-greedy) move
step. Traits are passed to offspring with small gaussian mutation; one config
flag fixes everyone identical for the trait-frozen ablation (§1).
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Traits:
    exploration: float  # [0,1] conservative (0) ↔ explorative (1)

    def epsilon(self, cfg_decision, cfg_trait) -> float:
        return float(cfg_decision.epsilon) + self.exploration * float(
            cfg_trait.exploration.epsilon_scale)

    def step_noise(self, cfg_trait) -> float:
        return self.exploration * float(cfg_trait.exploration.step_noise_scale)

    def as_dict(self) -> dict:
        return {"exploration": round(self.exploration, 4)}


def founder_traits(cfg_traits, rng):
    """Sample a founder's traits (or the fixed value under ablation)."""
    ex = cfg_traits.exploration
    if cfg_traits.fix_identical:
        return Traits(exploration=float(ex.init_mean))
    val = rng.normal(float(ex.init_mean), float(ex.init_sd))
    return Traits(exploration=min(1.0, max(0.0, val)))


def inherit(parent: Traits, cfg_traits, rng) -> Traits:
    """Asexual clone-with-mutation (§9.4)."""
    ex = cfg_traits.exploration
    if cfg_traits.fix_identical:
        return Traits(exploration=parent.exploration)
    val = parent.exploration + rng.normal(0.0, float(ex.mutation_sd))
    return Traits(exploration=min(1.0, max(0.0, val)))
