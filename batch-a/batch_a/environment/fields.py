"""Continuous scalar fields (§2.1): moisture, temperature, risk.

Agents perceive fields as *local gradients*, never as a global map (§3.2). All
indexing is toroidal when the world wraps, so there are no edge artifacts (§2.1).
Positions are (x, y) integer tile coordinates; arrays are indexed [y, x].
"""

from __future__ import annotations

import numpy as np


def wrap(coord: int, size: int) -> int:
    """Toroidal wrap of a single coordinate."""
    return coord % size


class ScalarField:
    """A size×size scalar field in [0, 1] with toroidal-aware local gradient."""

    def __init__(self, grid: np.ndarray, toroidal: bool = True):
        self.grid = grid.astype(np.float64)
        self.size = grid.shape[0]
        self.toroidal = toroidal

    def value(self, x: int, y: int) -> float:
        return float(self.grid[wrap(y, self.size), wrap(x, self.size)])

    def gradient(self, x: int, y: int) -> tuple[float, float]:
        """Local (dx, dy) gradient via central differences (toroidal)."""
        s = self.size
        xm, xp = (x - 1) % s, (x + 1) % s
        ym, yp = (y - 1) % s, (y + 1) % s
        if not self.toroidal:
            xm, xp = max(x - 1, 0), min(x + 1, s - 1)
            ym, yp = max(y - 1, 0), min(y + 1, s - 1)
        gx = 0.5 * (self.grid[y % s, xp] - self.grid[y % s, xm])
        gy = 0.5 * (self.grid[yp, x % s] - self.grid[ym, x % s])
        return float(gx), float(gy)


def _gaussian_bumps(size, centers, sigma, rng, baseline=0.0, toroidal=True):
    """Sum of gaussian bumps on the grid, normalized to [0, 1]."""
    yy, xx = np.mgrid[0:size, 0:size]
    field = np.full((size, size), float(baseline))
    for cx, cy in centers:
        dx = xx - cx
        dy = yy - cy
        if toroidal:
            dx = np.minimum(np.abs(dx), size - np.abs(dx))
            dy = np.minimum(np.abs(dy), size - np.abs(dy))
        field += np.exp(-(dx**2 + dy**2) / (2.0 * sigma**2))
    mx = field.max()
    if mx > 0:
        field = field / mx
    return field


def make_moisture(cfg, size, rng, toroidal=True, centers=None) -> ScalarField:
    """Clustered, static moisture field — the 'paths of increasing moisture'.

    When ``centers`` is supplied (the water-source centers), moisture peaks on
    the water, so ascending the gradient genuinely leads an agent to drink.
    """
    if centers is None:
        n = int(cfg.clusters)
        centers = [
            (int(rng.integers(0, size)), int(rng.integers(0, size)))
            for _ in range(n)
        ]
    grid = _gaussian_bumps(
        size, centers, float(cfg.cluster_sigma), rng,
        baseline=float(cfg.baseline), toroidal=toroidal,
    )
    return ScalarField(grid, toroidal=toroidal)


def make_temperature_base(cfg, size, toroidal=True) -> np.ndarray:
    """Static linear temperature gradient (seasonality is added per tick later)."""
    lo, hi = float(cfg.low), float(cfg.high)
    ramp = np.linspace(lo, hi, size)
    if cfg.gradient_axis == "x":
        grid = np.tile(ramp, (size, 1))
    else:
        grid = np.tile(ramp.reshape(-1, 1), (1, size))
    return grid.astype(np.float64)
