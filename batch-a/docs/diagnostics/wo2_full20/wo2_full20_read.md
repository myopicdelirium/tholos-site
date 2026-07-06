# WO-2 full-20 — birthplace moderator + selection (PARTIAL (126 cells so far))

Primary βₛ = **hazard_beta** (crash-robust stable-tick hazard; raw = sensitivity).
Disentangling regression on **12** uncensored `ablation=none` seeds.

## Disentangling volatility from capacity (the point of n=20)
| relation | value |
|---|---|
| βₛ ~ volatility (marginal r) | -0.1 |
| βₛ ~ capacity R_s (marginal r) | 0.42 |
| **βₛ ~ z(volatility) + z(capacity)** — std coef volatility | **0.834** |
| — std coef capacity | 1.117 |
| model R² | 0.39 |

**neither moderator dominates once both are in the model (volatility +0.83, capacity +1.12) — birthplace is a weak, non-specific moderator; lead with the selection result.**

## Selection (promoted lead)
- survivor−founder trait drift (median, clean world): **-0.3498**
- survivor trait ~ volatility: r=0.01 · ~ capacity: r=-0.35

## Ablation decomposition (trait drift)
| ablation | n | drift median |
|---|---|---|
| none | 45 | -0.3498 |
| freeze_learning | 36 | 0.2368 |
| freeze_traits | 38 | 0.0 |

Reproduce: `python -m experiments.analyze_wo2_full20`. Source: `wo2_full20/wo2_checkpoint.jsonl`.
Bit-identical fast path (perception.impl=vectorized) — no-regression vs scalar, not a correctness proof.
