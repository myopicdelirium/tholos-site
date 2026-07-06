# WO-2 full-20 — birthplace moderator + selection (PARTIAL (133 cells so far))

Primary βₛ = **hazard_beta** (crash-robust stable-tick hazard; raw = sensitivity).
Disentangling regression on **15** uncensored `ablation=none` seeds.

## Disentangling volatility from capacity (the point of n=20)
| relation | value |
|---|---|
| βₛ ~ volatility (marginal r) | 0.16 |
| βₛ ~ capacity R_s (marginal r) | 0.19 |
| **βₛ ~ z(volatility) + z(capacity)** — std coef volatility | **0.875** (95% CI [-0.468, 1.634]) |
| — std coef capacity | 0.892 (95% CI [0.252, 1.526]) |
| model R² | 0.32 |

**CAPACITY is the moderator (+0.89, CI [0.252, 1.526]) — volatility's coefficient (+0.88, CI [-0.468, 1.634]) does not exclude zero; the pilot's volatility signal was tracking capacity after all.**

## Selection (promoted lead)
- survivor−founder trait drift (median, clean world): **-0.3546**
- survivor trait ~ volatility: r=-0.15 · ~ capacity: r=-0.29

## Ablation decomposition (trait drift)
| ablation | n | drift median |
|---|---|---|
| none | 52 | -0.3546 |
| freeze_learning | 36 | 0.2368 |
| freeze_traits | 38 | 0.0 |

Reproduce: `python -m experiments.analyze_wo2_full20`. Source: `wo2_full20/wo2_checkpoint.jsonl`.
Bit-identical fast path (perception.impl=vectorized) — no-regression vs scalar, not a correctness proof.
