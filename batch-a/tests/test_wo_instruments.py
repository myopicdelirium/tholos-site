"""The science instruments must recover known truths from synthetic data.

WO-2/WO-3 conclusions are only as good as the estimators behind them. Each test
constructs data where the ground truth is known by design and asserts the
instrument recovers it: Poisson deaths → Fano ≈ 1; injected crashes → Fano ≫ 1;
a constructed drawdown → its exact depth; a sine population → its true period;
and a synthetic endowment-dependent hazard → the crash-robust βₛ with the right
sign. If an instrument drifts, these fail with the quantity named.
"""

import numpy as np
import pytest

from experiments.wo2_a3_birthplace import (
    _HAVE_STATS, _crash_robust, _stable_mask, _volatility_cv, _oscillation_period,
    _end_slope,
)
from experiments.wo3_a4_mortality import (
    _fano, _burst_share, _max_drawdown, _osc_amplitude, _inherit_reading,
)


# ── WO-3: death-clustering instruments ────────────────────────────────────
def test_fano_poisson_is_near_one():
    rng = np.random.default_rng(0)
    counts = rng.poisson(3.0, size=4000)
    assert 0.85 < _fano(counts) < 1.15          # independent deaths → Fano ≈ 1


def test_fano_bursty_is_large():
    counts = [0] * 950 + [60] * 50              # synchronized crashes
    assert _fano(counts) > 10


def test_fano_empty_is_none():
    assert _fano([0, 0, 0]) is None


def test_burst_share_concentrated():
    counts = [0] * 95 + [20] * 5                # all deaths in the burstiest 5%
    assert _burst_share(counts, k=0.05) == 1.0


def test_burst_share_uniform_is_k():
    counts = [10] * 100                          # perfectly even → share == k
    assert _burst_share(counts, k=0.05) == pytest.approx(0.05, abs=0.01)


def test_max_drawdown_exact():
    pop = [100, 120, 60, 90, 110]                # peak 120 → trough 60 = 50%
    assert _max_drawdown(pop) == 0.5


def test_max_drawdown_monotone_rise_is_zero():
    assert _max_drawdown([10, 20, 30, 40]) == 0.0


def test_osc_amplitude_flat_is_zero():
    assert _osc_amplitude([100.0] * 200) == 0.0


def test_inherit_reading_is_sign_aware():
    assert "INHERITED" in _inherit_reading(0.8)
    assert "not the inherited" in _inherit_reading(-0.8)
    assert "weakly related" in _inherit_reading(0.1)


# ── WO-2: convergence + volatility instruments ────────────────────────────
def test_oscillation_period_recovers_sine():
    t = np.arange(3000)
    pop = 500 + 100 * np.sin(2 * np.pi * t / 250)   # true period 250
    period = _oscillation_period(list(pop), frac=0.5)
    assert period is not None and abs(period - 250) <= 15


def test_volatility_flat_is_zero():
    assert _volatility_cv([400.0] * 1000) == 0.0


def test_end_slope_detects_climb():
    pop = list(np.linspace(100, 400, 1000))          # +0.3/tick everywhere
    assert _end_slope(pop) == pytest.approx(0.3, abs=0.05)
    assert _end_slope([250.0] * 1000) == pytest.approx(0.0, abs=0.01)


def test_stable_mask_excludes_crash_window():
    pop = np.concatenate([np.full(600, 400.0),
                          np.linspace(400, 120, 60),   # the crash
                          np.full(600, 120.0)])
    mask = _stable_mask(pop)
    assert not mask[:200].any()                       # transient always excluded
    assert mask[300:590].mean() > 0.9                 # stable before
    assert not mask[605:650].any()                    # crash ticks excluded
    assert mask[750:1200].mean() > 0.9                # stable after


# ── WO-2: the crash-robust hazard recovers a known sign ───────────────────
@pytest.mark.skipif(not _HAVE_STATS, reason="statsmodels not installed")
@pytest.mark.parametrize("protective", [True, False])
def test_crash_robust_recovers_hazard_sign(protective):
    """Synthetic panel: per-tick death hazard depends on endowment with a known
    sign; the estimator must return protective βₛ with that sign."""
    rng = np.random.default_rng(42)
    n, horizon = 600, 1500
    endow = rng.normal(0.5, 0.15, n)
    k = 3.0 if protective else -3.0
    base = 0.004
    agents = []
    for i in range(n):
        p = base * float(np.exp(-k * (endow[i] - 0.5)))  # high endow → low hazard (protective)
        s = int(min(rng.geometric(min(max(p, 1e-5), 0.5)), horizon))
        agents.append({
            "birth_tick": 0,
            "survival_time": s,
            "cause": "energy" if s < horizon else None,
            "endowment": float(endow[i]),
            "exploration": float(rng.uniform(0, 1)),
        })
    pop_series = [float(n)] * horizon                    # flat → every tick stable
    hb, hse, cox, n_stable, n_deaths = _crash_robust(agents, pop_series)
    assert hb is not None and n_deaths > 50
    assert (hb > 0) == protective, f"beta {hb} has wrong sign (protective={protective})"
    if cox is not None:
        assert (cox > 0) == protective                   # cross-check agrees
