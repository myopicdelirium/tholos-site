"""Reproduction (§9.4): asexual clone-with-mutation.

The simplest model that still produces *selection*: a ready agent spends energy
to spawn one offspring nearby, which inherits its traits with small gaussian
mutation. (Batch B will need mating; the action registry and this seam leave
room, but A2–A3 start asexual per the ruling.) Birth happens in step 7 of the
tick pipeline, after deaths.
"""

from __future__ import annotations

from .agent.agent import Agent
from .agent.traits import inherit
from .metrics import AgentMetrics


def reproduce(agents, world, config, rng, tick):
    """Mutate ready parents in place; return the list of newborn agents."""
    repro = config.reproduction
    if not repro.enabled:
        return []

    cap = int(repro.max_population)
    alive = [a for a in agents if a.alive]
    newborns = []
    radius = int(repro.offspring_spawn_radius)
    cost = float(repro.energy_cost)
    endow_radius = int(config.init.endowment_radius)

    for parent in alive:
        if len(alive) + len(newborns) >= cap:
            break
        if not parent.is_reproduction_ready(repro):
            continue

        # place offspring within a small radius of the parent
        ox = parent.x + int(rng.spawn.integers(-radius, radius + 1))
        oy = parent.y + int(rng.spawn.integers(-radius, radius + 1))
        ox, oy = world.wrap(ox, oy)

        child_traits = inherit(parent.traits, config.traits, rng.mutation)
        endowment = world.endowment_at(ox, oy, endow_radius)
        metrics = AgentMetrics(config, world, endowment)
        child = Agent(config, world, ox, oy, child_traits, tick, metrics)

        parent.state.drain("energy", cost)
        parent.repro_cooldown = int(repro.cooldown)
        parent.offspring_count += 1
        child.parent_id = parent.id          # kinship (Batch B) — no RNG/float effect
        parent.children.append(child.id)
        newborns.append(child)

    return newborns
