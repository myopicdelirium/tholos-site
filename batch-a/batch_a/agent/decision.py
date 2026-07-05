"""Decision rule (§3.4).

U(a) = Σ_i w_i(t)·Q_i(a) − MoveCost(a) − Risk(a),  argmax with ε-stochasticity.

Two seams Batch B needs are isolated here:
  * ``compute_weights`` is the *single* weight function. Batch A uses simple
    deficit-proportional weighting; B swaps in Maslow-banded gating by replacing
    only this function.
  * Q_i(a) = learned_gain · perceptual_affordance, so the learner (learning.py)
    and the perception (perception.py) compose cleanly.

When ``move`` is chosen, its direction is a weighted vote over the per-need
perceptual cues; the exploration trait injects ε action-noise and random-step
noise (the source of "explores forever even past optimal", §7).
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Decision:
    action: str
    dx: int = 0
    dy: int = 0
    target_need: str | None = None  # need the action primarily serves (for learning)
    expected: float = 0.0           # affordance acted on (for learning update)


# --------------------------------------------------------------------------
# The swappable weight function (Maslow gating drops in here for Batch B).
# --------------------------------------------------------------------------
def compute_weights(needs, decision_cfg) -> dict:
    """Deficit-proportional need weights w_i(t), normalized to sum 1."""
    deficits = needs.deficits()
    total = sum(deficits.values())
    if total <= 1e-9:
        n = len(deficits)
        return {k: 1.0 / n for k in deficits}
    return {k: v / total for k, v in deficits.items()}


def _alignment(cue, dstar) -> float:
    if dstar == (0, 0) or (cue.dx == 0 and cue.dy == 0):
        return 0.0
    dot = cue.dx * dstar[0] + cue.dy * dstar[1]
    return max(0.0, dot) / 2.0  # Moore-step dot ∈ [-2,2]; map aligned→1


def decide(agent, world, perception, config, rng) -> Decision:
    needs = agent.state
    weights = compute_weights(needs, config.decision)
    learner = agent.learner
    cues = perception.cues

    # --- desired move direction: weighted vote over per-need cues ----------
    vote_x = vote_y = 0.0
    for need_name, cue in cues.items():
        w = weights.get(need_name, 0.0)
        vote_x += w * cue.strength * cue.dx
        vote_y += w * cue.strength * cue.dy
    dstar = (int((vote_x > 0) - (vote_x < 0)), int((vote_y > 0) - (vote_y < 0)))

    # --- per-(need, action) affordances ------------------------------------
    rest_amount = float(config.actions.rest.amount)
    aff = {a: {} for a in ("move", "drink", "eat", "rest", "flee")}
    for need_name in needs.names():
        aff["move"][need_name] = (
            cues[need_name].strength * _alignment(cues[need_name], dstar))
    aff["drink"]["hydration"] = perception.water_here
    aff["eat"]["energy"] = perception.food_here
    aff["rest"]["energy"] = min(1.0, rest_amount * 10.0)  # constant capability
    if "temperature_comfort" in cues:
        aff["rest"]["temperature_comfort"] = 1.0 if perception.in_band else 0.0
    aff["flee"]["safety"] = perception.risk_here

    # --- move cost & risk per action ---------------------------------------
    mc = config.actions
    move_cost = float(mc.move_cost_per_tile)
    flee_cost = float(mc.flee_cost_per_tile)
    mcw = float(config.decision.move_cost_weight)
    rw = float(config.decision.risk_weight)

    safety_cue = cues.get("safety")
    flee_dx, flee_dy = (safety_cue.dx, safety_cue.dy) if safety_cue else (0, 0)

    def risk_after(dx, dy):
        return world.risk_at(agent.x + dx, agent.y + dy)

    cost = {
        "move": mcw * move_cost,
        "drink": 0.0,
        "eat": 0.0,
        "rest": 0.0,
        "flee": mcw * flee_cost,
    }
    risk = {
        "move": rw * risk_after(*dstar),
        "drink": rw * perception.risk_here,
        "eat": rw * perception.risk_here,
        "rest": rw * perception.risk_here,
        "flee": rw * risk_after(flee_dx, flee_dy),
    }

    # --- U(a) and the need each action primarily serves --------------------
    utilities = {}
    primary = {}
    for action in ("move", "drink", "eat", "rest", "flee"):
        u = -cost[action] - risk[action]
        best_need, best_contrib = None, 0.0
        for need_name, affordance in aff[action].items():
            contrib = weights.get(need_name, 0.0) * learner.q(
                need_name, action, affordance)
            u += contrib
            if contrib >= best_contrib:
                best_need, best_contrib = need_name, contrib
        utilities[action] = u
        primary[action] = best_need

    # --- argmax with ε-stochasticity --------------------------------------
    eps = agent.traits.epsilon(config.decision, config.traits)
    actions = list(utilities.keys())
    if rng.random() < eps:
        choice = actions[int(rng.integers(0, len(actions)))]
    else:
        choice = max(actions, key=lambda a: utilities[a])

    # --- resolve direction for movement actions ---------------------------
    if choice == "move":
        dx, dy = dstar
        if rng.random() < agent.traits.step_noise(config.traits):
            dx, dy = int(rng.integers(-1, 2)), int(rng.integers(-1, 2))
        if dx == 0 and dy == 0:  # never waste a chosen move
            dx, dy = int(rng.integers(-1, 2)), int(rng.integers(-1, 2))
        return Decision("move", dx, dy, primary["move"], aff["move"].get(
            primary["move"], 0.0))
    if choice == "flee":
        return Decision("flee", flee_dx, flee_dy, "safety", perception.risk_here)
    target = primary[choice]
    return Decision(choice, 0, 0, target, aff[choice].get(target, 0.0))
