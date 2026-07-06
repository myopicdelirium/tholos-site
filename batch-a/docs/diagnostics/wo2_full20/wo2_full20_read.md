# WO-2 full-20 — birthplace moderator + selection (PARTIAL (130 cells so far))

Primary βₛ = **hazard_beta** (crash-robust stable-tick hazard; raw = sensitivity).
Disentangling regression on **13** uncensored `ablation=none` seeds.

## Disentangling volatility from capacity (the point of n=20)
| relation | value |
|---|---|
| βₛ ~ volatility (marginal r) | 0.17 |
| βₛ ~ capacity R_s (marginal r) | 0.17 |
| **βₛ ~ z(volatility) + z(capacity)** — std coef volatility | **1.121** |
| — std coef capacity | 1.119 |
| model R² | 0.39 |

**neither moderator dominates once both are in the model (volatility +1.12, capacity +1.12) — birthplace is a weak, non-specific moderator; lead with the selection result.**

## Selection (promoted lead)
- survivor−founder trait drift (median, clean world): **-0.3498**
- survivor trait ~ volatility: r=-0.15 · ~ capacity: r=-0.21

## Ablation decomposition (trait drift)
| ablation | n | drift median |
|---|---|---|
| none | 49 | -0.3498 |
| freeze_learning | 36 | 0.2368 |
| freeze_traits | 38 | 0.0 |

Reproduce: `python -m experiments.analyze_wo2_full20`. Source: `wo2_full20/wo2_checkpoint.jsonl`.
Bit-identical fast path (perception.impl=vectorized) — no-regression vs scalar, not a correctness proof.
