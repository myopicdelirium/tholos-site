# WO-2 / WO-3 Amendment — the cap-400 confound

*Amends WO-2 and WO-3. Triggered by the WO-4 result. Companion to
`EXECUTION_TRACKER.md`.*

## The finding that forces this (WO-4, n=5)

Cap 400 binds in every world (5/5 saturate). But the same seeds, uncapped, span
~515 to ≥1500 — and are **consistent across caps** (seed 2 → ~515 at both 800 and
1500; seeds 0/3 fill any cap). So:

1. **Real carrying capacity exists and is per-world**, set by the procedural
   resource layout (~500 to ≥1500, soft at n=5).
2. **Cap 400 homogenizes the worlds.** At 400 a resource-rich and a resource-poor
   world are indistinguishable — both just "full." The between-world resource
   heterogeneity that should *drive* birthplace effects is invisible at 400.
3. **Cap 400 is a global confound.** No prior A1–A4 headline number is clean. The
   A4 "booms to the cap, then crashes" contrast is specifically cap-*clipped*.
4. **A3 boom-busts in some stationary worlds** (seed 4: 927→412) — endogenous
   demographic oscillation, so A4 fragility may be partly *inherited from A3*.

## Decisions

- **New invariant:** cap 400 is a confound; no A1–A4 headline number is
  publishable until regenerated at a non-binding cap (or cap-binding seeds
  flagged). Oscillating-world capacity is **cycle-averaged**, not single-tick.
- **WO-2 runs at high cap, ≥20 seeds, within-world design** → produces per-seed
  capacity as a byproduct, so the standalone 20-seed WO-4 re-run is folded in.
- **§9.1 stays open**; WO-2's ablations will inform whether learning matters.

---

## WO-2 (amended)

**Setup.** Cap **2000** (above the observed max → resources bind, not the
ceiling). Horizon **≥3000 ticks** (steady state or one oscillation cycle). Runtime
/ agent-count guard against runaway worlds. Conditions `uniform / born_rich /
born_poor` × ablations `none / freeze_learning / freeze_traits`. Per-agent and
per-seed logging, plus:
- **Per-seed capacity Rₛ = cycle-averaged** steady population (not single-tick).
- **Flag** seeds still climbing at horizon end, and seeds that still cap-bind at
  2000 (richest; birthplace expected null there — report separately, don't discard).

**Analysis — the within-world design (the point).** Birthplace is a *within-world*
contrast; do not pool across worlds for the primary claim.
1. **Within each seed s:** `survival ~ birthplace_endowment` → slope **βₛ**; also
   `survival ~ birthplace_endowment × trait_exploration` (trait interaction).
2. **Across seeds:** `βₛ ~ Rₛ`. **Prediction:** βₛ steep (positive) in
   resource-poor worlds, flat (~0) in rich ones — abundance forgives a bad
   birthplace. *This inverse relationship is the headline.*
3. **Selection proof:** founder-vs-survivor `trait_exploration` shift; test whether
   drift magnitude scales with scarcity.
4. **Ablation decomposition:** does the effect survive `freeze_learning` (trait
   alone)? Must vanish under `freeze_traits` (control). If it needs both → interaction.

Report each with CI; report cap-bound and still-climbing seeds separately.

## WO-3 (amended — parallel, cap 2000)

- Deaths-by-cause over the population trajectory + season phase (original).
- **Inheritance check:** run A3 (stationary, *same seeds*, cap 2000); compare death
  clustering A3 vs A4 per seed. Attribute the shared boom-bust portion to
  endogenous demographics; reserve "A4 fragility" for the *excess* from
  non-stationarity.
- **Verdict:** individual (steady attrition) vs demographic (synchronized crashes),
  controlling for A3-inherited oscillation.

## A4 regeneration (blocks publication, not current work)

All A4 headline/contrast numbers regenerated at the raised cap before they appear
on the site or in the report. Existing A4 contrast = **"cap-confounded —
provisional"** until then.
