"""Action set as a *registry*, not a hard-coded enum (§3.3, §10).

Batch A ships: move, drink, eat, rest, flee. Batch B extends the registry with
social actions (share, refuse, signal, mate, ...) without touching the decision
or scheduler machinery — they iterate over whatever is registered.

An Action carries only metadata; *effects are resolved centrally* in the
scheduler (§4 step 4) so conflicts (two agents, one food item) resolve in one
place. ``moves`` flags actions that change position (and thus pay move cost).
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Action:
    name: str
    moves: bool          # does it change the agent's position?
    stationary_need: str | None = None  # need it can satisfy in place


class ActionRegistry:
    def __init__(self):
        self._actions: dict[str, Action] = {}
        self._order: list[str] = []

    def register(self, action: Action):
        if action.name not in self._actions:
            self._order.append(action.name)
        self._actions[action.name] = action

    def __iter__(self):
        return (self._actions[n] for n in self._order)

    def __getitem__(self, name) -> Action:
        return self._actions[name]

    def names(self):
        return list(self._order)


def default_registry() -> ActionRegistry:
    reg = ActionRegistry()
    reg.register(Action("move", moves=True))
    reg.register(Action("drink", moves=False, stationary_need="hydration"))
    reg.register(Action("eat", moves=False, stationary_need="energy"))
    reg.register(Action("rest", moves=False, stationary_need="energy"))
    reg.register(Action("flee", moves=True))
    return reg
