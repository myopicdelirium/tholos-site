"""Process scheduling (§4): the fixed tick pipeline — where ABM bugs hide.

Update order is load-bearing and never drifts:
  1. Environment update (regen; A4: season tick, fauna move, drought roll)
  2. All agents perceive (snapshot — everyone sees the same world state)
  3. All agents choose actions
  4. Actions resolve (consumption, movement, predation) with conflict resolution
  5. State drains applied
  6. Learning updates
  7. Death checks, then births (A2+)
  8. Logging

Updating is SYNCHRONOUS (§4 decision point): perception/choice in steps 2–3 act
on the pre-resolution snapshot, so there is no first-mover advantage and runs are
reproducible. Conflict resolution (two agents, one source) is defined here, now.
"""

from __future__ import annotations

from .reproduction import reproduce


def _resolve_consumable(world, field_obj, claimants, rng):
    """Allocate a regenerating field among agents claiming the same tiles.

    Synchronous-fair conflict resolution: group claims by tile, then satisfy
    agents in a seed-deterministic shuffled order until the tile is depleted.
    Returns {agent_id: need_gain}.
    """
    gains = {}
    by_tile = {}
    for agent, need_name in claimants:
        by_tile.setdefault((agent.x, agent.y), []).append((agent, need_name))
    for (tx, ty), group in by_tile.items():
        order = rng.permutation(len(group))
        for k in order:
            agent, need_name = group[k]
            deficit = agent.state[need_name].deficit()
            if deficit <= 0:
                continue
            taken = field_obj.take(tx, ty, deficit)
            gain = taken * field_obj.efficiency
            agent.state.add(need_name, gain)
            gains[agent.id] = gains.get(agent.id, 0.0) + gain
    return gains


def _resolve_actions(world, living, decisions, config, rng):
    """Step 4. Returns (realized_gain_by_id, predated_ids)."""
    realized = {}

    # --- movement (move / flee) ------------------------------------------
    movers = []
    for a in living:
        d = decisions[a.id]
        if d.action in ("move", "flee"):
            a.x, a.y = world.wrap(a.x + d.dx, a.y + d.dy)
            movers.append(a)

    # --- drinking (water field) ------------------------------------------
    if world.water is not None:
        drinkers = [(a, "hydration") for a in living
                    if decisions[a.id].action == "drink"]
        for aid, g in _resolve_consumable(world, world.water, drinkers,
                                          rng.agent).items():
            realized[aid] = realized.get(aid, 0.0) + g

    # --- eating (prey first, then vegetation) ----------------------------
    veg_claimants = []
    for a in living:
        if decisions[a.id].action != "eat":
            continue
        ate_prey = False
        if world.prey is not None:
            idx = world.prey.nearest_alive(a.x, a.y, 1)
            if idx is not None:
                world.prey.consume(idx)
                gain = min(a.state["energy"].deficit(), world.prey.efficiency)
                a.state.add("energy", gain)
                realized[a.id] = realized.get(a.id, 0.0) + gain
                ate_prey = True
        if not ate_prey and world.vegetation is not None:
            veg_claimants.append((a, "energy"))
    if world.vegetation is not None and veg_claimants:
        for aid, g in _resolve_consumable(world, world.vegetation, veg_claimants,
                                          rng.agent).items():
            realized[aid] = realized.get(aid, 0.0) + g

    # --- resting ----------------------------------------------------------
    rest_amt = float(config.actions.rest.amount)
    for a in living:
        if decisions[a.id].action == "rest":
            before = a.state["energy"].value
            a.state.add("energy", rest_amt)
            realized[a.id] = realized.get(a.id, 0.0) + (a.state["energy"].value - before)

    # --- realized signal for movers (did moving bring them to resource?) --
    for a in movers:
        d = decisions[a.id]
        tn = d.target_need
        if tn == "hydration" and world.water is not None:
            realized[a.id] = world.water.available(a.x, a.y)
        elif tn == "energy":
            food = world.vegetation.available(a.x, a.y) if world.vegetation else 0.0
            if world.prey is not None and world.prey.nearest_alive(a.x, a.y, 1) is not None:
                food = max(food, 1.0)
            realized[a.id] = food
        elif tn == "temperature_comfort":
            realized[a.id] = max(0.0, 1.0 - world.comfort_deficit(a.x, a.y))
        elif tn == "safety":
            realized[a.id] = max(0.0, 1.0 - world.risk_at(a.x, a.y))
        else:
            realized.setdefault(a.id, 0.0)

    # --- predation --------------------------------------------------------
    predated = set()
    if world.predators is not None:
        agent_xy = [(a.x, a.y) for a in living]
        for ai in world.predators.attacks(agent_xy, rng.environment):
            predated.add(living[ai].id)

    return realized, predated


def _apply_drains(world, living, decisions, config):
    """Step 5. Endogenous drains, exposure, and movement cost."""
    move_cost = float(config.actions.move_cost_per_tile)
    flee_cost = float(config.actions.flee_cost_per_tile)
    for a in living:
        for need in a.state:
            if need.drain_per_tick:
                a.state.drain(need.name, need.drain_per_tick)

        # movement energy cost (A2+)
        act = decisions[a.id].action
        if act == "move" and move_cost:
            a.state.drain("energy", move_cost)
        elif act == "flee" and flee_cost:
            a.state.drain("energy", flee_cost)

        # temperature comfort: exposure outside band, recovery inside (A3+)
        if world.temperature is not None:
            tc = a.state["temperature_comfort"]
            deficit = world.comfort_deficit(a.x, a.y)
            if deficit > 0:
                a.state.drain("temperature_comfort", tc.exposure_gain * deficit)
            else:
                a.state.add("temperature_comfort", tc.recovery)

        # safety: exposure to local risk, recovery when safe (A3+)
        if world.risk is not None:
            sf = a.state["safety"]
            risk = world.risk_at(a.x, a.y)
            if risk > 0:
                a.state.drain("safety", sf.exposure_gain * risk)
            else:
                a.state.add("safety", sf.recovery)


def run_tick(world, agents, config, rng, recorder):
    tick = world.tick  # tick index this step operates on (pre-increment)

    # 1. environment update
    world.update()

    living = [a for a in agents if a.alive]
    prev_pos = {a.id: (a.x, a.y) for a in living}

    # 2. perceive (snapshot)
    perceptions = {a.id: a.perceive(world) for a in living}

    # 3. choose
    decisions = {a.id: a.choose(world, perceptions[a.id], rng.agent)
                 for a in living}

    # 4. resolve actions
    realized, predated = _resolve_actions(world, living, decisions, config, rng)

    # 5. drains + per-agent bookkeeping/metrics
    _apply_drains(world, living, decisions, config)
    for a in living:
        a.age += 1
        if a.repro_cooldown > 0:
            a.repro_cooldown -= 1
        a.metrics.update(prev_pos[a.id], (a.x, a.y), world, a.age)

    # 6. learning
    for a in living:
        a.learn(realized.get(a.id, 0.0))
        a.memory.observe(a, perceptions[a.id], world)

    # 7. deaths, then births
    for a in living:
        if a.id in predated:
            a.alive = False
            a.cause_of_death = "predation"
        else:
            dead_need = a.state.first_depleted()
            if dead_need is not None:
                a.alive = False
                a.cause_of_death = dead_need
        if not a.alive:
            recorder.log_summary(a)

    newborns = reproduce(agents, world, config, rng, tick)
    agents.extend(newborns)

    # 8. logging
    recorder.log_env(tick, world.env_summary())
    recorder.log_fauna(tick, world)
    for a in living:
        recorder.log_tick(tick, a)
    for a in newborns:
        recorder.log_tick(tick, a)

    return len([a for a in agents if a.alive])
