"""Memory (§10): stubbed in Batch A, a real seam for Batch B.

Batch A agents act on immediate perception, so memory does nothing load-bearing
here. But B's *distorting* memory (grief that recolours a place, attachment to a
site) plugs into this exact interface — so it exists from day one and the
scheduler already calls ``observe`` each tick. Keep it trivial; keep it present.
"""

from __future__ import annotations


class Memory:
    def __init__(self):
        self.last_position = None
        self.ticks_observed = 0

    def observe(self, agent, perception, world):
        """Called once per tick after the agent acts (§4)."""
        self.last_position = (agent.x, agent.y)
        self.ticks_observed += 1
