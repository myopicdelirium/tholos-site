"""Within-lifetime learning (§3.5): the local value update over Q_i(a).

Q_i(a) is the agent's learned estimate of how well action ``a`` satisfies need
``i``. We factor it as ``gain[i][a] * affordance`` where the affordance is the
current perceptual signal (computed in perception.py) and ``gain`` is the learned
multiplier this module adapts. Freezing learning (ablation, §1) holds gains fixed
at their prior, so the perceptual policy still runs — exactly what the ablation
needs to isolate.

Two rules (config ``learning.rule``):
  * recency : delta rule   gain += alpha * (realized/expected - gain)
  * td0     : as recency but the target is bootstrapped with gamma * V(next)
"""

from __future__ import annotations

from collections import defaultdict


class QLearner:
    def __init__(self, cfg):
        self.enabled = bool(cfg.enabled)
        self.rule = cfg.rule
        self.alpha = float(cfg.alpha)
        self.gamma = float(cfg.gamma)
        self.gain_init = float(cfg.gain_init)
        self.gain_min = float(cfg.gain_min)
        self.gain_max = float(cfg.gain_max)
        # gain[(need, action)] -> float
        self._gain = defaultdict(lambda: self.gain_init)

    def gain(self, need, action) -> float:
        return self._gain[(need, action)]

    def q(self, need, action, affordance) -> float:
        """Q_i(a) = learned gain × current perceptual affordance."""
        return self._gain[(need, action)] * affordance

    def update(self, need, action, expected, realized, next_value=0.0):
        """Adapt the (need, action) gain toward the realized outcome.

        ``expected`` is the affordance the agent acted on; ``realized`` is the
        actual need gain obtained. With td0 the target adds a discounted
        estimate of the next-state value for this (need, action) channel.
        """
        if not self.enabled or expected <= 1e-9:
            return
        target_ratio = realized / expected
        if self.rule == "td0":
            target_ratio += self.gamma * next_value
        key = (need, action)
        g = self._gain[key]
        g += self.alpha * (target_ratio - g)
        self._gain[key] = min(self.gain_max, max(self.gain_min, g))

    def snapshot(self) -> dict:
        return {f"{n}:{a}": round(v, 4) for (n, a), v in self._gain.items()}
