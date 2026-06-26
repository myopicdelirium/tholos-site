"""Homeostatic need substrate (§3.1).

Per-need state S_i(t) ∈ [0,1] with target T_i and threat threshold L_i < T_i.
The vector is *ordered and extensible*: Batch A ships energy / hydration /
temperature_comfort / safety, and Batch B appends higher needs onto this exact
structure — so nothing here may assume the Batch A need set.
"""

from __future__ import annotations


class Need:
    __slots__ = ("name", "value", "target", "threshold", "drain_per_tick",
                 "exposure_gain", "recovery")

    def __init__(self, name, spec):
        self.name = name
        self.value = float(spec.initial)
        self.target = float(spec.target)
        self.threshold = float(spec.threshold)
        self.drain_per_tick = float(spec.drain_per_tick)
        self.exposure_gain = float(spec.get("exposure_gain", 0.0))
        self.recovery = float(spec.get("recovery", 0.0))

    def deficit(self) -> float:
        """How far below target this need sits ([0, target])."""
        return max(0.0, self.target - self.value)

    def below_threshold(self) -> bool:
        return self.value <= self.threshold


class NeedVector:
    """Insertion-ordered collection of needs with [0,1] clamping."""

    def __init__(self, needs_cfg):
        self._needs = {}
        for name in needs_cfg.to_dict().keys():
            self._needs[name] = Need(name, needs_cfg[name])

    # -- access ------------------------------------------------------------
    def __getitem__(self, name) -> Need:
        return self._needs[name]

    def __iter__(self):
        return iter(self._needs.values())

    def names(self):
        return list(self._needs.keys())

    def values(self) -> dict:
        return {n: nd.value for n, nd in self._needs.items()}

    def deficits(self) -> dict:
        return {n: nd.deficit() for n, nd in self._needs.items()}

    # -- mutation ----------------------------------------------------------
    def add(self, name, amount):
        nd = self._needs[name]
        nd.value = min(nd.target, max(0.0, nd.value + amount))

    def drain(self, name, amount):
        nd = self._needs[name]
        nd.value = min(nd.target, max(0.0, nd.value - amount))

    def min_value(self) -> float:
        return min(nd.value for nd in self._needs.values())

    def first_depleted(self):
        """Name of the first need at/below zero, or None — the cause of death."""
        for nd in self._needs.values():
            if nd.value <= 0.0:
                return nd.name
        return None
