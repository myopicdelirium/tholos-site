# WO-2 full-20 — birthplace moderator + selection (COMPLETE)

Primary βₛ = **hazard_beta** (crash-robust stable-tick hazard; raw = sensitivity).
Disentangling regression on **18** uncensored `ablation=none` seeds.

## Disentangling volatility from capacity (the point of n=20)
| relation | value |
|---|---|
| βₛ ~ volatility (marginal r) | -0.14 |
| βₛ ~ capacity R_s (marginal r) | 0.34 |
| **βₛ ~ z(volatility) + z(capacity)** — std coef volatility | **0.468** (95% CI [-0.684, 1.275]) |
| — std coef capacity | 0.732 (95% CI [0.149, 1.3]) |
| model R² | 0.19 |

**CAPACITY is the moderator (+0.73, CI [0.149, 1.3]) — volatility's coefficient (+0.47, CI [-0.684, 1.275]) does not exclude zero; the pilot's volatility signal was tracking capacity after all.**

## Selection (promoted lead)
- survivor−founder trait drift (median, clean world): **-0.3489**
- survivor trait ~ volatility: r=-0.05 · ~ capacity: r=-0.3

## Ablation decomposition (trait drift)
| ablation | n | drift median |
|---|---|---|
| none | 59 | -0.3489 |
| freeze_learning | 53 | 0.2368 |
| freeze_traits | 58 | 0.0 |

Reproduce: `python -m experiments.analyze_wo2_full20`. Source: `wo2_full20/wo2_checkpoint.jsonl`.
Bit-identical fast path (perception.impl=vectorized) — no-regression vs scalar, not a correctness proof.
