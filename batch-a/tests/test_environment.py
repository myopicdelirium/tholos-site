"""Environment mechanics: toroidal fields, regeneration, conflict resolution."""

import numpy as np

from batch_a.config import load_config
from batch_a.environment.entities import toroidal_delta, cheb_dist
from batch_a.environment.fields import ScalarField
from batch_a.rng import RNGStreams
from batch_a.environment.world import World


def test_toroidal_delta_wraps():
    assert toroidal_delta(0, 1, 10) == 1
    assert toroidal_delta(0, 9, 10) == -1     # shortest path wraps
    assert toroidal_delta(9, 0, 10) == 1
    assert cheb_dist(0, 0, 9, 9, 10) == 1     # corner-to-corner on the torus


def test_field_gradient_points_uphill():
    grid = np.zeros((8, 8))
    grid[4, 6] = 1.0  # a peak at x=6,y=4
    f = ScalarField(grid, toroidal=True)
    gx, gy = f.gradient(5, 4)  # just left of the peak
    assert gx > 0  # gradient points toward higher x (toward the peak)


def test_water_regenerates_after_consumption():
    cfg = load_config("a1.yaml")
    world = World(cfg, RNGStreams(0).environment)
    # find a source tile
    ys, xs = np.where(world.water.source_mask)
    x, y = int(xs[0]), int(ys[0])
    world.water.quantity[y, x] = 0.0
    before = world.water.available(x, y)
    world.water.regen()
    assert world.water.available(x, y) > before


def test_moisture_peaks_on_water():
    """'Paths of increasing moisture' must lead to water (colocation)."""
    cfg = load_config("a1.yaml")
    world = World(cfg, RNGStreams(0).environment)
    ys, xs = np.where(world.water.source_mask)
    # moisture at a water source should beat the global mean
    src_moist = np.mean([world.moisture.value(int(x), int(y))
                         for x, y in zip(xs, ys)])
    assert src_moist > world.moisture.grid.mean()
