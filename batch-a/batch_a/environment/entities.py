"""Discrete consumable & threat entities (§2.2).

Two kinds:
  * ConsumableField — water and vegetation. Quantity lives on a per-tile grid
    sitting on a fixed clustered *source mask*, regenerating toward a cap. This
    cleanly gives clustered sources, regeneration-on-consumption, and a basis for
    conflict resolution (two agents, one source).
  * DiscretePopulation — prey (eatable points) and predators (mobile threats).

All distances are toroidal Chebyshev (Moore neighbourhoods).
"""

from __future__ import annotations

import numpy as np

from .fields import ScalarField, _gaussian_bumps


def toroidal_delta(a: int, b: int, size: int) -> int:
    """Signed shortest step from a to b on a ring of length size."""
    d = (b - a) % size
    if d > size // 2:
        d -= size
    return d


def cheb_dist(x0, y0, x1, y1, size) -> int:
    dx = abs(toroidal_delta(x0, x1, size))
    dy = abs(toroidal_delta(y0, y1, size))
    return max(dx, dy)


class ConsumableField:
    """A regenerating quantity field on a fixed clustered source mask."""

    def __init__(self, name, cfg, size, rng, role, centers=None):
        self.name = name
        self.size = size
        self.capacity = float(cfg.capacity)
        self.regen_per_tick = float(cfg.regen_per_tick)
        self.restores = cfg.restores
        self.action = cfg.action
        self.efficiency = float(cfg.efficiency)
        self.season_gated = bool(cfg.get("season_gated", False))
        self.in_season = True  # toggled by seasonality dynamics (A4)

        n = int(cfg.get("sources", cfg.get("patches", 1)))
        sigma = float(cfg.cluster_sigma)
        if centers is None:
            centers = [
                (int(rng.integers(0, size)), int(rng.integers(0, size)))
                for _ in range(n)
            ]
        self.centers = centers
        density = _gaussian_bumps(size, centers, sigma, rng, baseline=0.0)
        # Source tiles = the densest cores of each cluster.
        self.source_mask = density > 0.5
        self.quantity = np.where(self.source_mask, self.capacity, 0.0)

    def available(self, x, y) -> float:
        if self.season_gated and not self.in_season:
            return 0.0
        return float(self.quantity[y % self.size, x % self.size])

    def take(self, x, y, demand) -> float:
        """Remove up to ``demand`` from a tile; return the amount actually taken."""
        if self.season_gated and not self.in_season:
            return 0.0
        yy, xx = y % self.size, x % self.size
        avail = self.quantity[yy, xx]
        taken = min(float(demand), float(avail))
        self.quantity[yy, xx] = avail - taken
        return taken

    def regen(self, factor: float = 1.0):
        inc = self.regen_per_tick * factor
        np.minimum(self.quantity + inc * self.source_mask, self.capacity,
                   out=self.quantity)

    def total(self) -> float:
        return float(self.quantity.sum())


class DiscretePopulation:
    """Prey or predators: discrete points with optional movement & respawn."""

    def __init__(self, name, cfg, size, rng, kind):
        self.name = name
        self.kind = kind  # 'prey' or 'predator'
        self.size = size
        self.count = int(cfg.count)
        self.mobile = bool(cfg.get("mobile", False))
        self.move_prob = float(cfg.get("move_prob", 0.0))

        if kind == "prey":
            self.restores = cfg.restores
            self.efficiency = float(cfg.efficiency)
            self.action = cfg.action
            self.respawn_ticks = int(cfg.get("respawn_ticks", 80))
        else:  # predator
            self.attack_radius = int(cfg.attack_radius)
            self.predation_prob = float(cfg.predation_prob)

        self.pos = rng.integers(0, size, size=(self.count, 2)).astype(np.int64)
        self.alive = np.ones(self.count, dtype=bool)
        self.respawn_timer = np.zeros(self.count, dtype=np.int64)

    # -- prey --------------------------------------------------------------
    def nearest_alive(self, x, y, radius):
        """Index of the nearest alive member within Chebyshev ``radius`` or None."""
        best, best_d = None, radius + 1
        for i in range(self.count):
            if not self.alive[i]:
                continue
            d = cheb_dist(x, y, int(self.pos[i, 0]), int(self.pos[i, 1]), self.size)
            if d <= radius and d < best_d:
                best, best_d = i, d
        return best

    def consume(self, idx):
        self.alive[idx] = False
        self.respawn_timer[idx] = self.respawn_ticks

    # -- predators ---------------------------------------------------------
    def risk_field(self, sigma, baseline) -> ScalarField:
        centers = [tuple(self.pos[i]) for i in range(self.count) if self.alive[i]]
        grid = _gaussian_bumps(self.size, centers, sigma, None, baseline=baseline)
        return ScalarField(grid, toroidal=True)

    def attacks(self, agents_xy, rng):
        """Return indices (into agents_xy) killed by predators this tick."""
        killed = []
        for ai, (ax, ay) in enumerate(agents_xy):
            for pi in range(self.count):
                if not self.alive[pi]:
                    continue
                d = cheb_dist(ax, ay, int(self.pos[pi, 0]), int(self.pos[pi, 1]),
                              self.size)
                if d <= self.attack_radius and rng.random() < self.predation_prob:
                    killed.append(ai)
                    break
        return killed

    # -- shared dynamics ---------------------------------------------------
    def step(self, rng):
        # respawn (prey)
        if self.kind == "prey":
            reborn = (~self.alive) & (self.respawn_timer > 0)
            self.respawn_timer[reborn] -= 1
            ready = (~self.alive) & (self.respawn_timer <= 0)
            if ready.any():
                idx = np.where(ready)[0]
                self.alive[idx] = True
                self.pos[idx] = rng.integers(0, self.size, size=(idx.size, 2))
        # movement (A4)
        if self.mobile and self.move_prob > 0:
            for i in range(self.count):
                if self.alive[i] and rng.random() < self.move_prob:
                    step = rng.integers(-1, 2, size=2)
                    self.pos[i] = (self.pos[i] + step) % self.size
