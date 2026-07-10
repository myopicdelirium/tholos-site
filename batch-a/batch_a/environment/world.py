"""The World: the shared substrate fields + entities live on (§2).

Built once from config and layered across A1→A4. Holding it fixed (except the
deliberate A4 non-stationarity) is what lets later batches attribute change to
the agent, not the world. Per-tick environment updates live in dynamics.py.
"""

from __future__ import annotations

import numpy as np

from . import dynamics
from .entities import ConsumableField, DiscretePopulation, cheb_dist
from .fields import ScalarField, make_moisture, make_temperature_base


class World:
    def __init__(self, config, rng_env):
        self.config = config
        self.rng = rng_env
        wc = config.world
        self.size = int(wc.size)
        self.toroidal = wc.boundary == "toroidal"
        self.radius = int(wc.perception_radius)
        self.tick = 0

        # --- shared water/moisture centers --------------------------------
        # Generate the water-source cluster centers first so the moisture field
        # can peak on them: 'paths of increasing moisture' must lead to water.
        ec = config.entities
        water_centers = None
        if ec.water.enabled:
            n = int(ec.water.sources)
            water_centers = [
                (int(rng_env.integers(0, self.size)),
                 int(rng_env.integers(0, self.size)))
                for _ in range(n)
            ]

        # --- scalar fields ------------------------------------------------
        fc = config.fields
        self.moisture = (
            make_moisture(fc.moisture, self.size, rng_env, self.toroidal,
                          centers=water_centers)
            if fc.moisture.enabled else None
        )
        self._temp_cfg = fc.temperature
        self._temp_base = (
            make_temperature_base(fc.temperature, self.size, self.toroidal)
            if fc.temperature.enabled else None
        )
        self.temperature = (
            ScalarField(self._temp_base.copy(), self.toroidal)
            if self._temp_base is not None else None
        )
        self._risk_cfg = fc.risk
        self.risk = None  # rebuilt each tick from predators when enabled

        # --- consumable fields -------------------------------------------
        self.water = (
            ConsumableField("water", ec.water, self.size, rng_env, "water",
                            centers=water_centers)
            if ec.water.enabled else None
        )
        self.vegetation = (
            ConsumableField("vegetation", ec.vegetation, self.size, rng_env, "veg")
            if ec.vegetation.enabled else None
        )

        # --- discrete populations ----------------------------------------
        self.prey = (
            DiscretePopulation("prey", ec.prey, self.size, rng_env, "prey")
            if ec.prey.enabled else None
        )
        self.predators = (
            DiscretePopulation("predators", ec.predators, self.size, rng_env,
                               "predator")
            if ec.predators.enabled else None
        )

        # --- non-stationarity state (A4) ---------------------------------
        self.in_drought = False
        self.season_phase = 0.0  # [0,1) position in the seasonal cycle

        self._rebuild_risk()
        self._endowment_cache = None
        self.agent_density = None       # local-competitor field (§C1 congestion)

    # ------------------------------------------------------------------
    # Environment update — step 1 of the tick pipeline (§4).
    # ------------------------------------------------------------------
    def update(self):
        dynamics.step_environment(self, self.rng)
        self.tick += 1

    def rebuild_agent_density(self, agents, radius):
        """Local-competitor field: each tile's count of agents within `radius`
        (toroidal box blur). Foragers read its gradient to flee crowding (§C1)."""
        size = self.size
        cnt = np.zeros((size, size))
        for a in agents:
            if a.alive:
                cnt[a.y % size, a.x % size] += 1.0
        sm = np.zeros_like(cnt)
        for dy in range(-radius, radius + 1):
            row = np.roll(cnt, dy, axis=0)
            for dx in range(-radius, radius + 1):
                sm += np.roll(row, dx, axis=1)
        self.agent_density = ScalarField(sm, self.toroidal)

    def best_food_per_capita_step(self, x, y, radius, k):
        """Ideal-Free foraging step (§C1). Scan the food window and step toward
        the tile whose food PER LOCAL COMPETITOR — food/(1 + k·density) — is
        highest, not the tile with the most food. The multiplicative crowd
        discount is negative density dependence: as a patch fills, its per-capita
        value falls until the marginal forager does better elsewhere, and the
        fixed point of everyone doing this privately is the Ideal Free
        Distribution (payoff equalized, headcount ∝ productivity). Returns
        (dx, dy, strength) or None if there is no food in range. Compare the
        naive additive repulsion this replaced, which equalized spatial density
        rather than payoff and inverted under load."""
        veg = self.vegetation
        if veg is None:
            return None
        size = self.size
        dens = self.agent_density.grid if self.agent_density is not None else None
        best_val, best_xy = 0.0, None
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                yy, xx = (y + dy) % size, (x + dx) % size
                food = veg.available(xx, yy)
                if food <= 0.0:
                    continue
                d = float(dens[yy, xx]) if dens is not None else 0.0
                v = food / (1.0 + k * d)
                if v > best_val:
                    best_val, best_xy = v, (dx, dy)
        if best_xy is None or best_xy == (0, 0):
            return None
        cap = max(veg.capacity, 1e-9)
        return (int(np.sign(best_xy[0])), int(np.sign(best_xy[1])),
                min(1.0, best_val / cap))

    def _rebuild_risk(self):
        if self.predators is not None and self._risk_cfg.enabled:
            self.risk = self.predators.risk_field(
                float(self._risk_cfg.predator_sigma),
                float(self._risk_cfg.baseline),
            )
        else:
            self.risk = None

    # ------------------------------------------------------------------
    # Field / entity queries (local information only, §3.2).
    # ------------------------------------------------------------------
    def temperature_at(self, x, y) -> float:
        return self.temperature.value(x, y) if self.temperature else 0.5

    def comfort_deficit(self, x, y) -> float:
        """Distance the local temperature sits outside the comfort band ([0,1])."""
        if self.temperature is None:
            return 0.0
        t = self.temperature_at(x, y)
        lo, hi = float(self._temp_cfg.comfort_low), float(self._temp_cfg.comfort_high)
        if t < lo:
            return lo - t
        if t > hi:
            return t - hi
        return 0.0

    def risk_at(self, x, y) -> float:
        return self.risk.value(x, y) if self.risk is not None else 0.0

    def wrap(self, x, y):
        if self.toroidal:
            return x % self.size, y % self.size
        return max(0, min(x, self.size - 1)), max(0, min(y, self.size - 1))

    # ------------------------------------------------------------------
    # Resource endowment (§5, §7): a scalar summary of local resources.
    # ------------------------------------------------------------------
    def endowment_grid(self) -> np.ndarray:
        """Per-tile resource endowment in [0,1], cached per world build."""
        if self._endowment_cache is not None:
            return self._endowment_cache
        size = self.size
        acc = np.zeros((size, size))
        layers = 0
        if self.moisture is not None:
            acc += self.moisture.grid
            layers += 1
        if self.water is not None:
            acc += self.water.quantity / max(self.water.capacity, 1e-9)
            layers += 1
        if self.vegetation is not None:
            acc += self.vegetation.quantity / max(self.vegetation.capacity, 1e-9)
            layers += 1
        if layers:
            acc /= layers
        self._endowment_cache = acc
        return acc

    def endowment_at(self, x, y, radius) -> float:
        """Mean endowment within Chebyshev ``radius`` of (x, y) — the §5 scalar."""
        grid = self.endowment_grid()
        size = self.size
        vals = []
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                vals.append(grid[(y + dy) % size, (x + dx) % size])
        return float(np.mean(vals))

    def good_tile_threshold(self, k_percentile) -> float:
        """Kth-percentile endowment defining a 'good' tile (§7 over-exploration)."""
        return float(np.quantile(self.endowment_grid(), k_percentile))

    def env_summary(self) -> dict:
        """Cheap per-tick scalars for run-level diagnostics."""
        return {
            "water_total": self.water.total() if self.water else 0.0,
            "veg_total": self.vegetation.total() if self.vegetation else 0.0,
            "in_drought": int(self.in_drought),
            "season_phase": round(self.season_phase, 4),
        }
