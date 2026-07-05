"""Perception (§3.2): local field gradients + local entity presence, radius r.

No global map. Everything here is computed from the Moore neighbourhood of the
agent's tile. The output is a small ``Perception`` record of:
  * ``here``  — scalar conditions at the current tile (water, food, risk, comfort)
  * ``cues``  — for each need a (direction, strength) pointing at where moving
                would help: a Moore step toward the best local resource.
These feed the decision rule's per-(need, action) affordances.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from ..environment.entities import toroidal_delta


@dataclass
class Cue:
    dx: int = 0
    dy: int = 0
    strength: float = 0.0  # [0,1] urgency/quality of moving this way


@dataclass
class Perception:
    water_here: float = 0.0
    food_here: float = 0.0
    risk_here: float = 0.0
    comfort_deficit_here: float = 0.0
    in_band: bool = True
    cues: dict = field(default_factory=dict)         # need -> Cue
    risk_grad: tuple = (0.0, 0.0)


def _step_toward(x0, y0, x1, y1, size):
    """Unit Moore step from (x0,y0) toward (x1,y1) on the torus."""
    dx = toroidal_delta(x0, x1, size)
    dy = toroidal_delta(y0, y1, size)
    return int(np.sign(dx)), int(np.sign(dy))


def _best_consumable(world, field_obj, x, y, radius):
    """Return (here_amount, Cue) for a ConsumableField within radius."""
    if field_obj is None:
        return 0.0, Cue()
    size = world.size
    here = field_obj.available(x, y)
    best_amt, best_xy = 0.0, None
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            amt = field_obj.available(x + dx, y + dy)
            if amt > best_amt:
                best_amt, best_xy = amt, (x + dx, y + dy)
    if best_xy is None or (best_xy == (x, y)):
        return here, Cue(0, 0, here)
    sx, sy = _step_toward(x, y, best_xy[0], best_xy[1], size)
    cap = max(field_obj.capacity, 1e-9)
    return here, Cue(sx, sy, min(1.0, best_amt / cap))


def _prey_food(world, x, y, radius):
    """Eatable prey contribution: (here_amount, Cue)."""
    if world.prey is None:
        return 0.0, Cue()
    idx = world.prey.nearest_alive(x, y, radius)
    if idx is None:
        return 0.0, Cue()
    px, py = int(world.prey.pos[idx, 0]), int(world.prey.pos[idx, 1])
    if (px, py) == (x, y) or max(abs(toroidal_delta(x, px, world.size)),
                                 abs(toroidal_delta(y, py, world.size))) <= 1:
        here = 1.0  # adjacent/standing-on prey is eatable now
    else:
        here = 0.0
    sx, sy = _step_toward(x, y, px, py, world.size)
    return here, Cue(sx, sy, 1.0)


def _gradient_cue(gx, gy, config, away=False):
    """Map a field gradient to a committed Moore-step cue (config-tuned)."""
    if gx == 0 and gy == 0:
        return Cue(0, 0, 0.0)
    pc = config.perception
    mag = (gx * gx + gy * gy) ** 0.5
    strength = min(1.0, float(pc.gradient_cue_floor) + mag * float(pc.gradient_cue_gain))
    s = -1 if away else 1
    return Cue(s * int(np.sign(gx)), s * int(np.sign(gy)), strength)


def perceive(world, x, y, radius, config) -> Perception:
    p = Perception()

    # --- hydration: water field, with moisture gradient as the long cue -----
    water_here, water_cue = _best_consumable(world, world.water, x, y, radius)
    p.water_here = water_here
    if water_cue.strength <= 0.0 and world.moisture is not None:
        gx, gy = world.moisture.gradient(x, y)
        water_cue = _gradient_cue(gx, gy, config)
    p.cues["hydration"] = water_cue

    # --- energy: vegetation field + prey, plus rest (handled in decision) ---
    veg_here, veg_cue = _best_consumable(world, world.vegetation, x, y, radius)
    prey_here, prey_cue = _prey_food(world, x, y, radius)
    p.food_here = max(veg_here, prey_here)
    food_cue = veg_cue if veg_cue.strength >= prey_cue.strength else prey_cue
    p.cues["energy"] = food_cue

    # --- temperature_comfort: move toward the comfort band ------------------
    p.comfort_deficit_here = world.comfort_deficit(x, y)
    p.in_band = p.comfort_deficit_here <= 0.0
    if world.temperature is not None and not p.in_band:
        best_def, best_xy = p.comfort_deficit_here, None
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                d = world.comfort_deficit(x + dx, y + dy)
                if d < best_def:
                    best_def, best_xy = d, (x + dx, y + dy)
        if best_xy is not None:
            sx, sy = _step_toward(x, y, best_xy[0], best_xy[1], world.size)
            p.cues["temperature_comfort"] = Cue(
                sx, sy, min(1.0, p.comfort_deficit_here))
        else:
            p.cues["temperature_comfort"] = Cue(0, 0, 0.0)
    else:
        p.cues["temperature_comfort"] = Cue(0, 0, 0.0)

    # --- safety: flee down the risk gradient --------------------------------
    p.risk_here = world.risk_at(x, y)
    if world.risk is not None:
        gx, gy = world.risk.gradient(x, y)
        p.risk_grad = (gx, gy)
        # cue points AWAY from rising risk; urgency scales with local risk
        cue = _gradient_cue(gx, gy, config, away=True)
        p.cues["safety"] = Cue(cue.dx, cue.dy, min(1.0, p.risk_here))
    else:
        p.cues["safety"] = Cue(0, 0, 0.0)

    return p
