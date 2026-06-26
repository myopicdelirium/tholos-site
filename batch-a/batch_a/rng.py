"""Seeded, explicitly-threaded randomness (§5, §10).

Determinism is non-negotiable. There is exactly one master seed per run. From it
we derive *independent, separable* streams so that, e.g., the world can be held
fixed while only spawns vary (or vice versa). Never call the global numpy RNG.
"""

from __future__ import annotations

import numpy as np


# Order matters: SeedSequence.spawn is positional, so these names are pinned.
_STREAMS = ("environment", "spawn", "agent", "mutation")


class RNGStreams:
    """Bundle of independent numpy Generators derived from one master seed.

    Attributes
    ----------
    environment : world dynamics (regeneration, fauna movement, drought rolls)
    spawn       : agent spawn placement (the §5 independent variable)
    agent       : agent decision noise (ε-stochasticity, conflict shuffles)
    mutation    : heritable-trait mutation at reproduction
    """

    def __init__(self, seed: int):
        self.seed = int(seed)
        children = np.random.SeedSequence(self.seed).spawn(len(_STREAMS))
        for name, child in zip(_STREAMS, children):
            setattr(self, name, np.random.default_rng(child))

    def __repr__(self) -> str:  # pragma: no cover - cosmetic
        return f"RNGStreams(seed={self.seed})"
