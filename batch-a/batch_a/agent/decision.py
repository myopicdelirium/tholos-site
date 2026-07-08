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
# The swappable weight function — Batch B's gating drops in here, as designed.
# --------------------------------------------------------------------------
def compute_weights(needs, decision_cfg, agent=None, config=None) -> dict:
    """Drive weights w_i(t), normalized to sum 1.

    Batch A: deficit-proportional over the need vector (byte-identical to the
    original when the B blocks are disabled — guarded by tests/test_a_pinned).

    Batch B (§B1), when enabled in config:
      * a latched GRIEF drive joins the raw pool before normalization, competing
        with the body's alarms on equal terms;
      * BOUNDED ATTENTION then gates the normalized weights: only ``slots``
        drives keep weight, an incumbent holds its slot until a challenger
        beats it by ``hysteresis`` (the inertial band), and ``exempt`` drives
        bypass the budget (the private-channel ablation). Everything else is
        zeroed and the kept weights renormalized.
    """
    deficits = needs.deficits()

    grief_on = (config is not None and config.grief.enabled
                and agent is not None and agent.grief is not None)
    attention = decision_cfg.get("attention")
    attention_on = attention is not None and bool(attention.enabled)

    if not grief_on and not attention_on:
        # the exact Batch A path — do not touch
        total = sum(deficits.values())
        if total <= 1e-9:
            n = len(deficits)
            return {k: 1.0 / n for k in deficits}
        return {k: v / total for k, v in deficits.items()}

    raw = dict(deficits)
    if grief_on:
        raw["grief"] = float(agent.grief["drive"])
    total = sum(raw.values())
    if total <= 1e-9:
        w = {k: 1.0 / len(raw) for k in raw}
    else:
        w = {k: v / total for k, v in raw.items()}

    if attention_on and agent is not None:
        names = list(w)
        exempt = [n for n in list(attention.get("exempt", []) or []) if n in w]
        pool = [n for n in names if n not in exempt]
        slots = min(int(attention.slots), len(pool))
        h = float(attention.hysteresis)
        incumbents = set(agent.attention_band)
        # incumbency bonus implements the inertial band; ties broken by drive order
        eff = {n: w[n] + (h if n in incumbents else 0.0) for n in pool}
        band = sorted(pool, key=lambda n: (-eff[n], names.index(n)))[:slots]
        kept = set(band) | set(exempt)
        gated = {n: (w[n] if n in kept else 0.0) for n in names}
        gtot = sum(gated.values())
        if gtot > 1e-9:
            w = {n: v / gtot for n, v in gated.items()}
        else:
            w = {n: (1.0 / len(kept) if n in kept else 0.0) for n in names}
        agent.attention_band = band

    return w


def _alignment(cue, dstar) -> float:
    if dstar == (0, 0) or (cue.dx == 0 and cue.dy == 0):
        return 0.0
    dot = cue.dx * dstar[0] + cue.dy * dstar[1]
    return max(0.0, dot) / 2.0  # Moore-step dot ∈ [-2,2]; map aligned→1


def decide(agent, world, perception, config, rng) -> Decision:
    needs = agent.state
    weights = compute_weights(needs, config.decision, agent=agent, config=config)
    learner = agent.learner
    cues = perception.cues

    # --- grief (Batch B): a cue toward the loss site joins the vote --------
    if agent.grief is not None and config.grief.enabled:
        from .perception import Cue, _step_toward
        gx, gy = _step_toward(agent.x, agent.y, agent.grief["site"][0],
                              agent.grief["site"][1], world.size)
        strength = min(1.0, float(agent.grief["drive"])
                       * float(config.grief.site_cue_gain))
        cues = dict(cues)                    # copy — A path keeps the original
        cues["grief"] = Cue(gx, gy, strength)

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
    if "grief" in cues:                      # searching IS moving toward the site
        aff["move"]["grief"] = cues["grief"].strength * _alignment(cues["grief"], dstar)
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
            # grief never becomes the learning target (its outcome is unresolvable
            # by construction; letting the learner habituate it would confound B1)
            if need_name != "grief" and contrib >= best_contrib:
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
