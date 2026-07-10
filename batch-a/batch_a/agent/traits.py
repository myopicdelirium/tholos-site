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
    # C2 (emergence): heritable disposition to disengage from ground that pays
    # below what it looked worth. 0 = blind (byte-identical to Batch A / greedy);
    # rises only if selection finds it useful. Never references crowds — the
    # signal it acts on is the agent's own perceived-vs-realized foraging gap.
    # (Superseded as inert — see EMERGENCE_SPEC §7; kept behind its flag.)
    contest_response: float = 0.0
    # C2′ (emergence): the EVOLVABLE foraging policy. The agent scores where to
    # forage as g_food·(food there) + g_crowd·(conspecifics there) — a linear
    # combination of two PRIMITIVE senses, with the weights heritable. Nothing
    # says "avoid crowds": g_crowd is a neutral weight on a neutral sense, born
    # ~0 (blind), and only selection can drive it negative. g_food (seek food)
    # is itself evolvable, so even hunger-seeking is selected, not authored.
    g_food: float = 0.0
    g_crowd: float = 0.0

    def epsilon(self, cfg_decision, cfg_trait) -> float:
        return float(cfg_decision.epsilon) + self.exploration * float(
            cfg_trait.exploration.epsilon_scale)

    def step_noise(self, cfg_trait) -> float:
        return self.exploration * float(cfg_trait.exploration.step_noise_scale)

    def as_dict(self) -> dict:
        d = {"exploration": round(self.exploration, 4)}
        # omit when blind so Batch A logs (and the pin) stay byte-identical
        if abs(self.contest_response) > 1e-9:
            d["contest_response"] = round(self.contest_response, 4)
        if abs(self.g_food) > 1e-9 or abs(self.g_crowd) > 1e-9:
            d["g_food"] = round(self.g_food, 4)
            d["g_crowd"] = round(self.g_crowd, 4)
        return d


def _contest_cfg(cfg_traits):
    """The contest_response sub-config if present AND enabled, else None."""
    cr = cfg_traits.get("contest_response") if "contest_response" in cfg_traits else None
    return cr if (cr is not None and bool(cr.get("enabled", False))) else None


def _policy_cfg(cfg_traits):
    """The forage_policy sub-config if present AND enabled, else None."""
    fp = cfg_traits.get("forage_policy") if "forage_policy" in cfg_traits else None
    return fp if (fp is not None and bool(fp.get("enabled", False))) else None


def _sample_policy(t, fp, rng, parent=None):
    """Draw / mutate the two foraging-policy genes onto Traits t (in place).
    Draws happen ONLY when the policy is enabled, so Batch A's RNG is untouched."""
    gf, gc = fp.g_food, fp.g_crowd
    if parent is None:
        t.g_food = float(rng.normal(float(gf.init_mean), float(gf.init_sd)))
        t.g_crowd = float(rng.normal(float(gc.init_mean), float(gc.init_sd)))
    else:
        t.g_food = float(parent.g_food + rng.normal(0.0, float(gf.mutation_sd)))
        t.g_crowd = float(parent.g_crowd + rng.normal(0.0, float(gc.mutation_sd)))
    lim = float(fp.get("clamp", 4.0))
    t.g_food = min(lim, max(-lim, t.g_food))
    t.g_crowd = min(lim, max(-lim, t.g_crowd))


def founder_traits(cfg_traits, rng):
    """Sample a founder's traits (or the fixed value under ablation).

    The contest_response draw is taken ONLY when the trait is enabled, so with it
    off the RNG stream — and every Batch A run — is unchanged.
    """
    ex = cfg_traits.exploration
    cr = _contest_cfg(cfg_traits)
    fp = _policy_cfg(cfg_traits)
    if cfg_traits.fix_identical:
        t = Traits(exploration=float(ex.init_mean))
        if cr is not None:
            t.contest_response = max(0.0, float(cr.init_mean))
        if fp is not None:
            t.g_food = float(fp.g_food.init_mean)
            t.g_crowd = float(fp.g_crowd.init_mean)
        return t
    val = rng.normal(float(ex.init_mean), float(ex.init_sd))
    t = Traits(exploration=min(1.0, max(0.0, val)))
    if cr is not None:
        c = rng.normal(float(cr.init_mean), float(cr.init_sd))
        t.contest_response = min(float(cr.get("max", 3.0)), max(0.0, c))
    if fp is not None:
        _sample_policy(t, fp, rng)
    return t


def inherit(parent: Traits, cfg_traits, rng) -> Traits:
    """Asexual clone-with-mutation (§9.4)."""
    ex = cfg_traits.exploration
    cr = _contest_cfg(cfg_traits)
    fp = _policy_cfg(cfg_traits)
    if cfg_traits.fix_identical:
        t = Traits(exploration=parent.exploration)
        t.contest_response = parent.contest_response
        t.g_food = parent.g_food
        t.g_crowd = parent.g_crowd
        return t
    val = parent.exploration + rng.normal(0.0, float(ex.mutation_sd))
    t = Traits(exploration=min(1.0, max(0.0, val)))
    if cr is not None:
        c = parent.contest_response + rng.normal(0.0, float(cr.mutation_sd))
        t.contest_response = min(float(cr.get("max", 3.0)), max(0.0, c))
    if fp is not None:
        _sample_policy(t, fp, rng, parent=parent)
    return t
