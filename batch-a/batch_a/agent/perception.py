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


# ==========================================================================
# Vectorized batch perception (perception.impl == "vectorized").
#
# perceive_all() computes the perceptions of every living agent in one pass of
# element-wise NumPy gathers, and MUST be bit-identical to calling perceive()
# per agent — it is a no-regression fast path, not a re-derivation. Identity
# holds because:
#   * every value is an element-wise float64 op on the SAME grid entries the
#     scalar path reads (a gather, not a reduction across agents), so there is
#     no float reordering or drift;
#   * argmax/argmin return the first occurrence of the extremum, matching the
#     scalar scans' strict '>' / '<' "first keeps" tie-break, provided the
#     window is flattened in the scalar scan order (dy outer, dx inner);
#   * cue-strength arithmetic ('** 0.5', '* gain', 'min(1.0, ·)') is written
#     character-for-character as in the scalar helpers, using the same libm.
# The decision rule, its RNG draws, and conflict resolution stay on the scalar
# path — their per-agent conditional draws cannot be vectorized without moving
# the reference. Requires a toroidal world (all Batch A worlds are); the
# scheduler falls back to the scalar path otherwise.
# ==========================================================================
def perceive_all(world, agents, config) -> dict:
    """Batched perception for every agent. Returns {agent.id: Perception}."""
    if not agents:
        return {}
    if not world.toroidal:
        # gradients/windows below assume wrap; defer to the scalar reference.
        return {a.id: a.perceive(world) for a in agents}

    size = world.size
    r = world.radius
    xs = np.array([a.x for a in agents], dtype=np.int64)
    ys = np.array([a.y for a in agents], dtype=np.int64)
    n = xs.shape[0]
    ar = np.arange(n)

    # Moore window offsets in the scalar scan order: dy outer, dx inner.
    axis = np.arange(-r, r + 1)
    dvy = np.repeat(axis, 2 * r + 1)
    dvx = np.tile(axis, 2 * r + 1)
    center_idx = dvy.shape[0] // 2          # the (dy=0, dx=0) tile
    win_y = (ys[:, None] + dvy[None, :]) % size
    win_x = (xs[:, None] + dvx[None, :]) % size

    pc = config.perception
    grad_floor = float(pc.gradient_cue_floor)
    grad_gain = float(pc.gradient_cue_gain)

    # -- ConsumableField: per-agent (here, cue) mirroring _best_consumable --
    def consumable(field_obj):
        if field_obj is None:
            z = np.zeros(n)
            return z, np.zeros(n, int), np.zeros(n, int), z.copy()
        vals = field_obj.quantity[win_y, win_x].astype(np.float64)
        if field_obj.season_gated and not field_obj.in_season:
            vals = np.zeros_like(vals)          # available() returns 0 out of season
        here = vals[:, center_idx].copy()
        argm = np.argmax(vals, axis=1)          # first occurrence of the max
        maxval = vals[ar, argm]
        cap = max(field_obj.capacity, 1e-9)
        cdx = np.zeros(n, int)
        cdy = np.zeros(n, int)
        cstr = here.copy()                       # Cue(0,0,here) when no better tile
        off = (maxval > 0.0) & (argm != center_idx)
        cdx[off] = np.sign(dvx[argm[off]]).astype(int)
        cdy[off] = np.sign(dvy[argm[off]]).astype(int)
        cstr[off] = np.minimum(1.0, maxval[off] / cap)
        return here, cdx, cdy, cstr

    # -- prey: nearest alive within radius, mirroring _prey_food -----------
    def prey_cue():
        prey = world.prey
        z = np.zeros(n)
        zi = np.zeros(n, int)
        if prey is None or prey.count == 0 or not bool(prey.alive.any()):
            return z, zi, zi.copy(), z.copy()
        px = prey.pos[:, 0].astype(np.int64)
        py = prey.pos[:, 1].astype(np.int64)
        ddx = (px[None, :] - xs[:, None]) % size
        ddx = np.where(ddx > size // 2, ddx - size, ddx)
        ddy = (py[None, :] - ys[:, None]) % size
        ddy = np.where(ddy > size // 2, ddy - size, ddy)
        cheb = np.maximum(np.abs(ddx), np.abs(ddy))
        valid = prey.alive[None, :] & (cheb <= r)
        dist = np.where(valid, cheb, size + 1)
        idx = np.argmin(dist, axis=1)            # nearest, lowest index on ties
        has = valid.any(axis=1)
        cheb_sel = cheb[ar, idx]
        here = np.zeros(n)
        cdx = np.zeros(n, int)
        cdy = np.zeros(n, int)
        cstr = np.zeros(n)
        here[has] = np.where(cheb_sel[has] <= 1, 1.0, 0.0)
        cdx[has] = np.sign(ddx[ar, idx][has]).astype(int)
        cdy[has] = np.sign(ddy[ar, idx][has]).astype(int)
        cstr[has] = 1.0
        return here, cdx, cdy, cstr

    # -- temperature comfort, mirroring the perceive() scan ----------------
    def temp_cue():
        temp = world.temperature
        z = np.zeros(n)
        if temp is None:
            return z, np.ones(n, bool), np.zeros(n, int), np.zeros(n, int), z.copy()
        grid = temp.grid
        lo = float(world._temp_cfg.comfort_low)
        hi = float(world._temp_cfg.comfort_high)
        defc = np.where(grid < lo, lo - grid, np.where(grid > hi, grid - hi, 0.0))
        dvals = defc[win_y, win_x]
        here = dvals[:, center_idx].copy()
        in_band = here <= 0.0
        argmn = np.argmin(dvals, axis=1)         # first occurrence of the min
        minval = dvals[ar, argmn]
        best = (~in_band) & (minval < here)
        cdx = np.zeros(n, int)
        cdy = np.zeros(n, int)
        cstr = np.zeros(n)
        cdx[best] = np.sign(dvx[argmn[best]]).astype(int)
        cdy[best] = np.sign(dvy[argmn[best]]).astype(int)
        cstr[best] = np.minimum(1.0, here[best])
        return here, in_band, cdx, cdy, cstr

    # -- safety: risk gradient (away), mirroring _gradient_cue(away=True) ---
    def safety_cue():
        risk = world.risk
        if risk is None:
            z = np.zeros(n)
            return z, np.zeros(n, int), np.zeros(n, int), z.copy(), np.zeros((n, 2))
        grid = risk.grid
        xm, xp = (xs - 1) % size, (xs + 1) % size
        ym, yp = (ys - 1) % size, (ys + 1) % size
        gx = 0.5 * (grid[ys, xp] - grid[ys, xm])
        gy = 0.5 * (grid[yp, xs] - grid[ym, xs])
        risk_here = grid[ys, xs].astype(np.float64)
        both_zero = (gx == 0.0) & (gy == 0.0)
        cdx = np.where(both_zero, 0, (-np.sign(gx)).astype(int))
        cdy = np.where(both_zero, 0, (-np.sign(gy)).astype(int))
        cstr = np.minimum(1.0, risk_here)
        return risk_here, cdx.astype(int), cdy.astype(int), cstr, np.stack([gx, gy], 1)

    # ---- hydration (water + moisture-gradient fallback) ------------------
    water_here, wdx, wdy, wstr = consumable(world.water)
    if world.moisture is not None:
        need_fb = wstr <= 0.0
        if bool(need_fb.any()):
            grid = world.moisture.grid
            xm, xp = (xs - 1) % size, (xs + 1) % size
            ym, yp = (ys - 1) % size, (ys + 1) % size
            mgx = 0.5 * (grid[ys, xp] - grid[ys, xm])
            mgy = 0.5 * (grid[yp, xs] - grid[ym, xs])
            mzero = (mgx == 0.0) & (mgy == 0.0)
            mag = (mgx * mgx + mgy * mgy) ** 0.5
            mstr = np.minimum(1.0, grad_floor + mag * grad_gain)
            fb_dx = np.where(mzero, 0, np.sign(mgx).astype(int))
            fb_dy = np.where(mzero, 0, np.sign(mgy).astype(int))
            fb_str = np.where(mzero, 0.0, mstr)
            wdx = np.where(need_fb, fb_dx, wdx)
            wdy = np.where(need_fb, fb_dy, wdy)
            wstr = np.where(need_fb, fb_str, wstr)

    # ---- energy (vegetation vs prey) ------------------------------------
    veg_here, vdx, vdy, vstr = consumable(world.vegetation)
    prey_here, pdx, pdy, pstr = prey_cue()
    food_here = np.maximum(veg_here, prey_here)
    use_veg = vstr >= pstr                       # veg_cue if veg.strength >= prey.strength
    fdx = np.where(use_veg, vdx, pdx)
    fdy = np.where(use_veg, vdy, pdy)
    fstr = np.where(use_veg, vstr, pstr)

    # ---- temperature + safety ------------------------------------------
    cd_here, in_band, tdx, tdy, tstr = temp_cue()
    risk_here, sdx, sdy, sstr, rgrad = safety_cue()

    # ---- assemble per-agent Perception records (cue order load-bearing) --
    out = {}
    for i, a in enumerate(agents):
        p = Perception()
        p.water_here = float(water_here[i])
        p.food_here = float(food_here[i])
        p.comfort_deficit_here = float(cd_here[i])
        p.in_band = bool(in_band[i])
        p.risk_here = float(risk_here[i])
        p.risk_grad = (float(rgrad[i, 0]), float(rgrad[i, 1]))
        p.cues["hydration"] = Cue(int(wdx[i]), int(wdy[i]), float(wstr[i]))
        p.cues["energy"] = Cue(int(fdx[i]), int(fdy[i]), float(fstr[i]))
        p.cues["temperature_comfort"] = Cue(int(tdx[i]), int(tdy[i]), float(tstr[i]))
        p.cues["safety"] = Cue(int(sdx[i]), int(sdy[i]), float(sstr[i]))
        out[a.id] = p
    return out
