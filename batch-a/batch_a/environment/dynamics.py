"""Per-tick environment update (§4 step 1).

For A1–A3 this is just regeneration. A4 non-stationarity — seasonality, mobile
fauna, drought/rebound — is layered on the *same* World here, not in a fork
(§2.2, §10). The A3→A4 jump is the stationary → non-stationary phase change.
"""

from __future__ import annotations

import math


def step_environment(world, rng):
    cfg = world.config
    ns = cfg.nonstationarity

    # --- drought / rebound (A4): water sources stochastically dry & recover ---
    regen_factor = 1.0
    if ns.drought.enabled:
        if world.in_drought:
            if rng.random() < float(ns.drought.recovery_prob):
                world.in_drought = False
        else:
            if rng.random() < float(ns.drought.onset_prob):
                world.in_drought = True
        if world.in_drought:
            regen_factor = float(ns.drought.dry_regen_factor)

    # --- seasonality (A4): temperature oscillates, vegetation is season-gated ---
    if ns.seasonality:
        tc = cfg.fields.temperature
        period = max(1, int(tc.season_period))
        world.season_phase = (world.tick % period) / period
        amp = float(tc.season_amplitude)
        if world.temperature is not None and world._temp_base is not None:
            offset = amp * math.sin(2.0 * math.pi * world.season_phase)
            world.temperature.grid = world._temp_base + offset
        if world.vegetation is not None and world.vegetation.season_gated:
            # edible in the first half of the cycle, dormant in the second
            world.vegetation.in_season = world.season_phase < 0.5

    # --- regeneration of consumable fields -----------------------------------
    if world.water is not None:
        world.water.regen(factor=regen_factor)
    if world.vegetation is not None:
        world.vegetation.regen(factor=1.0)

    # --- discrete populations: respawn + movement ----------------------------
    if world.prey is not None:
        world.prey.step(rng)
    if world.predators is not None:
        world.predators.step(rng)
        world._rebuild_risk()  # risk field follows predators when they move
