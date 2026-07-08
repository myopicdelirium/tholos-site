# Batch B — Specification and Preregistration

*Case B1: terminal commitment. The first mechanism of the humanistic program,
built ON the Batch A substrate through the seams reserved for it, measured with
the Batch A discipline. This document is written before the pilot sweep's
results are read; the claims below are preregistered.*

---

## 0. Relation to the Vigil

The site's instrument *The Vigil* (`/instruments/vigil`) states the phenomenon:
a bereaved agent whose latched search drive shields its thirst alarm from
attention can die of the shielding. B1 is the same claim **made on the real
substrate and held to the batch standard**: the mechanisms live in the Batch A
codebase behind its seams; Batch A's own streams are pinned byte-identical with
B present-but-disabled; every number comes from seeded, reproducible runs at
n ≥ 8 (pilot) / n ≥ 20 (headline) with matched in-world baselines and two
ablation controls. Where the Vigil demonstrates, B1 measures.

## 1. Mechanisms (all in Batch A's reserved seams)

**M1 — Bounded attention** (`compute_weights`, the documented swappable weight
function). Drive weights are deficit-proportional as in Batch A, then gated:
only `slots` drives keep weight each tick. An incumbent drive holds its slot
until a challenger exceeds it by `hysteresis` — the inertial band. Drives in
`exempt` bypass the budget entirely. Weights renormalize over the kept set.

**M2 — Kinship** (`reproduction.py`). Children carry `parent_id`; parents carry
child ids. Bookkeeping only.

**M3 — Grief latch** (`scheduler.py` step 7 + `decide`). When a child dies, the
parent's grief drive latches at `drive` (≫ any single deficit), anchored to the
loss site. It competes in the *same* attention budget as the body's alarms and
contributes a movement cue toward the site (search/vigil IS movement; at the
site, resting at it). The drive decays at `decay_attended` only while grief
holds a slot (`decay_ambient` otherwise, default 0 — a perfect latch) and
releases below `release`. Grief is never a learning target: the learner would
habituate an unresolvable drive and confound the measurement.

**No death is scripted.** Death remains what it was in Batch A: a need reaching
zero, or predation. Martyrdom, if it occurs, is the *coupling* — latch ×
shared budget × a body that keeps drying.

### Assumptions, stated plainly
- **The bereavement signal carries the loss site.** Parents latch onto where the
  child died without having witnessed it. This is a modeling idealization (a
  kin-signal); B1 does not model discovery.
- **The cap (250) binds.** B1's outcome is per-bereaved-agent, not a capacity
  estimate; every sweep cell shares the cap. (The WO-4 cap lesson is about
  capacity claims, which B1 does not make.)
- **Attention gating binds everyone,** not only the bereaved — the baseline
  cohort lives under the same bounded attention. The comparison is therefore
  within-world: bereaved parents vs non-bereaved parents, same regime.

## 2. The stage (b1.yaml) and how it was calibrated

The calibration path is a finding and is reported as such:

1. First probe (A3 defaults + cap 400): ambient thirst mortality ~0.74 — the
   claim is unmeasurable on a stage that kills everyone. *(Rejected.)*
2. Water boosted: ambient still ~0.48–0.55 from contested tiles at the cap;
   martyr signal indistinguishable from base rate at slots=2. *(Rejected.)*
3. Measurement fixed: baselines must be **parents** (agents that demonstrably
   reached maturity), not all agents — infant mortality had polluted the
   denominator. Martyrdom widened from thirst-only to **self-neglect**
   (energy OR hydration while latched): at their vigils, more parents starve
   than dehydrate.
4. Abundance + temperature disabled (a slow ambient drain with no role in the
   loss story that only fights the attention budget): non-bereaved parent
   self-neglect ≈ 0.28 at slots=1; bereaved ≈ 0.95. *(Locked.)*

Final stage: A3 ecology minus temperature; water ×16 sources regen 0.4;
vegetation ×16 regen 0.06; 10 predators at p=0.3 (the loss supply); cap 250;
2000 ticks; needs clocks — thirst 100 ticks full→empty, energy 250.

## 3. Preregistered claims (pilot decides C1–C5)

- **C1 (emergence).** Bereaved parents die *while latched* at a rate far above
  the matched non-bereaved-parent rate, with no scripted death. Pilot probe
  (seed 3, slots=1, decay 0.004): 0.95 vs 0.28. The sweep must show this is not
  one seed's story.
- **C2 (bandwidth gate).** The effect is strong at slots=1, attenuated at
  slots=2, absent at slots=3 — the alarm is only shielded when the band is
  narrow enough for grief to crowd it out.
- **C3 (persistence gate).** Fast decay (0.012 ≈ 183 attended ticks) releases
  before the body fails — grief without martyrdom. Slow decay (0.002 ≈ 1100)
  outlives both clocks. The boundary between them is the phase line.
- **C4 (latch ablation).** grief off → zero latched deaths, bereaved
  indistinguishable from baseline (they are baseline).
- **C5 (private channel).** `exempt: [hydration]` at slots=1: commitment
  persists (long vigils still happen) but thirst-martyrdom specifically
  collapses; deaths shift to energy or vanish. This separates *the shielding*
  from *the grief* — the mechanism's signature, and the Vigil's second
  ablation reproduced on the substrate.

**Falsifiers.** C1 fails if the sweep's bereaved-vs-baseline gap is within
seed noise; C2/C3 fail if martyr rate does not order monotonically in slots /
decay; C5 fails if exempting hydration leaves thirst-martyrdom intact (which
would mean deaths were never about shielded attention).

## 4. Measurement

Per (cell, seed), scalars only (restart-durable checkpoint):
bereaved-parent count; deaths-while-latched by cause; **martyr rate** =
(energy+hydration deaths while latched)/bereaved; **vigil-death rate** (any
cause, incl. dying to predators at the loss site — "died at the vigil",
reported separately from self-neglect); released / alive-latched counts;
median vigil length at death; non-bereaved-parent self-neglect and total
death rates; world deaths; extinction.

Pilot n=8 seeds/cell (104 runs). Headline confirmation at n≥20 on the boundary
cells once the pilot locates them. Medians + bootstrap CIs for anything
published.

## 5. What B1 is not

Not a model of grief's phenomenology; not a claim about optimal mourning; not
calibrated to human data. It is an existence-and-mechanism result: a
utility-architecture in which *the capacity to grieve and the capacity to
perish are the same capacity*, with the dependence on bandwidth and persistence
measured, and the mechanism identified by ablation rather than asserted.

## 6. Roadmap seeded by B1

- **B2 — attachment to place**: the same latch architecture on locations
  (affect-weighted memory seam), without bereavement.
- **B3 — social buffering**: conspecific proximity as a decay accelerant —
  does company release the latch in time?
- **B4 — selection under grief**: heritable latch parameters under the Batch A
  selection machinery — does evolution keep the capacity that kills?
  (The A-side WO-2 result — learning reverses selection on exploration —
  suggests interactions here will not be intuitable in advance.)
