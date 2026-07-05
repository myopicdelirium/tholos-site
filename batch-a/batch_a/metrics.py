"""Operational definitions (§7): turn anecdotes into measurements.

Each headline insight gets a number, tracked live per agent (cheaply, without
storing full trajectories) and finalized into a lifetime summary row (§6):

  conservative↔explorative  -> exploration trait + mean step displacement/tick
  "born into resources"      -> birthplace endowment scalar (§5)
  "settles and stays"        -> time_to_settle + fraction of lifetime stationary
  "explores past optimal"    -> distance travelled after first reaching a
                                K-th-percentile resource tile (over-exploration)
  survival outcome           -> survival time + reproductive success
"""

from __future__ import annotations

import math

from .environment.entities import toroidal_delta


def _toroidal_step(x0, y0, x1, y1, size) -> float:
    dx = toroidal_delta(x0, x1, size)
    dy = toroidal_delta(y0, y1, size)
    return math.hypot(dx, dy)


class AgentMetrics:
    """Live tracker of one agent's operational-definition statistics."""

    def __init__(self, config, world, birthplace_endowment):
        m = config.metrics
        self.settle_threshold = float(m.settle_displacement_threshold)
        self.settle_window = int(m.settle_window)
        self.good_threshold = world.good_tile_threshold(
            float(m.resource_percentile_k))
        self.size = world.size

        self.birthplace_endowment = birthplace_endowment
        self.total_displacement = 0.0
        self.stationary_ticks = 0
        self.ticks_alive = 0
        self._low_streak = 0
        self.time_to_settle = None
        self.reached_good = False
        self.good_reach_age = None
        self.dist_after_good = 0.0

    def update(self, prev_xy, new_xy, world, age):
        self.ticks_alive = age
        step = _toroidal_step(prev_xy[0], prev_xy[1], new_xy[0], new_xy[1],
                              self.size)
        self.total_displacement += step
        if step < 0.5:
            self.stationary_ticks += 1

        # time-to-settle: first age after which per-step displacement stays
        # below threshold for a full window
        if step < self.settle_threshold:
            self._low_streak += 1
            if self._low_streak >= self.settle_window and self.time_to_settle is None:
                self.time_to_settle = age - self.settle_window
        else:
            self._low_streak = 0

        # over-exploration: distance travelled after first reaching a good tile
        endow = world.endowment_at(new_xy[0], new_xy[1], 0)
        if not self.reached_good and endow >= self.good_threshold:
            self.reached_good = True
            self.good_reach_age = age
        if self.reached_good:
            self.dist_after_good += step

    def mean_displacement(self) -> float:
        return self.total_displacement / self.ticks_alive if self.ticks_alive else 0.0

    def fraction_stationary(self) -> float:
        return self.stationary_ticks / self.ticks_alive if self.ticks_alive else 0.0

    def summary(self) -> dict:
        return {
            "birthplace_endowment": round(self.birthplace_endowment, 5),
            "survival_time": self.ticks_alive,
            "total_displacement": round(self.total_displacement, 3),
            "mean_step_displacement": round(self.mean_displacement(), 5),
            "fraction_stationary": round(self.fraction_stationary(), 5),
            "time_to_settle": self.time_to_settle,
            "reached_good_tile": int(self.reached_good),
            "over_exploration_distance": round(self.dist_after_good, 3),
        }


# --------------------------------------------------------------------------
# Cross-seed aggregation (§8.3): median + bootstrap CI, per the paper.
# --------------------------------------------------------------------------
def bootstrap_ci(values, n_boot=2000, alpha=0.05, seed=0):
    """Median with a percentile bootstrap confidence interval."""
    import numpy as np

    arr = np.asarray([v for v in values if v is not None], dtype=float)
    if arr.size == 0:
        return {"median": None, "ci_low": None, "ci_high": None, "n": 0}
    rng = np.random.default_rng(seed)
    boots = np.empty(n_boot)
    for i in range(n_boot):
        sample = rng.choice(arr, size=arr.size, replace=True)
        boots[i] = np.median(sample)
    lo, hi = np.quantile(boots, [alpha / 2, 1 - alpha / 2])
    return {
        "median": float(np.median(arr)),
        "ci_low": float(lo),
        "ci_high": float(hi),
        "n": int(arr.size),
    }
