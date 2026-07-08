# A4 at cap 2000 — regenerated headline numbers (COMPLETE — cap-400 'provisional' flag RETIRED)

Source: WO-3 checkpoint (A3 + A4 × 20 seeds, cap 2000, 3000 ticks, vectorized
fast path — bit-identical to the scalar reference). Medians with bootstrap 95%
CIs over seeds. The A3 column is the same-seed stationary baseline, so the A4
contrast is within-world: the cost of non-stationarity itself, not world luck.

| metric | A3 (stationary) | A4 (non-stationary) |
|---|---|---|
| n seeds | 20 | 20 |
| extinct fraction | 0.0 | 0.3 |
| carrying capacity R_s | 735.0 [508.0, 1043.0] | 419.0 [156.0, 728.0] |
| final population | 726.0 [494.0, 1047.0] | 322.0 [1.0, 548.0] |
| max drawdown (crash severity) | 0.416 [0.295, 0.601] | 0.872 [0.849, 0.999] |
| volatility (CV) | 0.05 [0.045, 0.07] | 0.269 [0.14, 0.391] |
| Fano of per-tick deaths | 1.8 [1.7, 1.9] | 3.8 [2.8, 4.9] |

Dominant killers — A3: {'hydration': 20} ·
A4: {'hydration': 18, 'temperature_comfort': 2}

## Within-seed contrast (A4 − A3, paired)
- ΔR_s: -401.0 [-577.0, -124.0]
- Δ drawdown: 0.464 [0.34, 0.531]
- Δ volatility: 0.196 [0.079, 0.363]

Reproduce: `python -m experiments.analyze_a4_cap2000`. Fragility ruling (§9.5
"fragile survival") should be re-read against the cap-2000 extinct fraction and
drawdown, not the cap-400 numbers.
