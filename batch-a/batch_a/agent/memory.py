"""Memory (§10): a stub in Batch A, load-bearing from the coordination case on.

Batch A agents act on immediate perception, so memory does nothing that touches
the logged stream — and with `foraging.memory` disabled it still doesn't (the
Batch A streams are pinned byte-identical). The coordination case (§C1) turns it
on: the agent remembers the richest place it has personally visited, so it can
navigate back to opportunity that sits outside its perceptual radius. Batch B's
distorting memory (grief that recolours a place) plugs into this same interface.
"""

from __future__ import annotations


class Memory:
    def __init__(self):
        self.last_position = None
        self.ticks_observed = 0
        # foraging memory (coordination case) — inert unless foraging.memory.enabled
        self.best_site = None      # (x, y) where sustained intake was richest
        self.best_value = 0.0      # its remembered intake rate, decaying over time
        self.intake_ema = 0.0      # running estimate of how well the agent is eating NOW

    def observe(self, agent, perception, world):
        """Called once per tick after the agent acts (§4)."""
        self.last_position = (agent.x, agent.y)
        self.ticks_observed += 1

        fm = world.config.foraging.memory if "foraging" in world.config else None
        if fm is None or not fm.enabled:
            return
        # realized INTAKE RATE is the IFD currency: it integrates a patch's
        # productivity AND its crowding, which standing food cannot. A big rich
        # patch keeps feeding you; a small crowded one does not — even if every
        # tile looks identical.
        alpha = float(fm.intake_alpha)
        self.intake_ema = (1.0 - alpha) * self.intake_ema + alpha * float(agent.last_intake)
        # decay the remembered best so a patch since crowded/eaten fades and the
        # agent re-explores — the self-correction that makes the distribution
        # track the resource instead of freezing on a stale memory.
        self.best_value *= (1.0 - float(fm.decay))
        if self.intake_ema > self.best_value:
            self.best_value = self.intake_ema
            self.best_site = (agent.x, agent.y)
