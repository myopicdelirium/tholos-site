# Batch A — ODD Protocol Specification

This document follows the **ODD protocol** (Overview, Design concepts, Details;
Grimm & Railsback) — the field standard for describing an ABM so a stranger can
rebuild it. It is the difference between a writeup someone can replicate and one
they can't. Section references (§) point to the Batch A spec.

> Conventions. The world is a `size × size` grid. Positions are integer tile
> coordinates `(x, y)`; arrays are indexed `[y, x]`. Boundaries are **toroidal**
> (wrap) for A1–A4 unless reconfigured. All needs and field values live in
> `[0, 1]`. Every numeric constant cited here is a **config value** — see
> `PARAMETERS.md` for the table and `config/` for the source of truth.

---

## 1. Overview

### 1.1 Purpose

To produce agents that (a) **survive a fixed ecology by optimizing among
competing physical needs**, and (b) survive it **poorly enough by A4** that the
humanistic mechanisms of Batch B have pressure to act on. Batch A exists to be
*measured against two criteria that pull against each other*: it must work
(agents learn/are selected to exploit the world) and it must not be enough
(survival is fragile under non-stationarity). Neither criterion is asserted; both
are logged and quantified (§0, §6, §7).

### 1.2 Entities, state variables, and scales

**Agent.** The only mobile decision-maker. State:

| Variable | Meaning |
|----------|---------|
| `id`, `(x, y)` | identity and tile position |
| `state` (need vector) | `Sᵢ(t) ∈ [0,1]` for each need, with target `Tᵢ` and threat threshold `Lᵢ < Tᵢ` |
| `traits` | heritable vector; Batch A's load-bearing trait is **exploration disposition** ∈ [0,1] |
| `learner` | per-(need, action) learned gains — the within-lifetime `Qᵢ(a)` (§3.5) |
| `memory` | stub in A; the seam for Batch B's distorting memory (§10) |
| `age`, `birth_tick`, `repro_cooldown` | reproduction bookkeeping |
| `offspring_count`, `cause_of_death`, `birthplace` | lifetime outcomes (§6) |

The **need vector is ordered and extensible**. Batch A ships `energy`,
`hydration`, `temperature_comfort`, `safety`; Batch B appends higher needs onto
this exact structure, so no code assumes the Batch A need set.

**Environment.** Built once and layered A1→A4 (§2):

- *Continuous scalar fields* (§2.1): `moisture`, `temperature`, `risk`. Agents
  perceive these as **local gradients**, never as a global map.
- *Discrete consumable fields*: `water`, `vegetation` — quantity on a per-tile
  grid sitting on a fixed clustered **source mask**, regenerating toward a cap.
- *Discrete populations*: `prey` (eatable points) and `predators` (threats that
  emit the risk field and can kill within an attack radius).

**Scales.** One tick = one decision/update cycle. The grid starts `64×64` for
fast iteration and is parameterizable up to `256×256` (the paper's size) — size
is a config value, never hard-coded. Perception is a bounded Moore radius
`r ∈ {1, 2}`.

### 1.3 Process overview and scheduling (§4)

Update order is **load-bearing** and never drifts. Each tick:

1. **Environment update** — regeneration; in A4 also: season tick, fauna move,
   drought roll.
2. **All agents perceive** — on a *snapshot*, so everyone sees the same world.
3. **All agents choose actions**.
4. **Actions resolve** — consumption, movement, predation. Conflict resolution
   (two agents, one source) is defined here (see §2.2 below).
5. **State drains applied** — endogenous drain, exposure, movement cost.
6. **Learning updates** — `Qᵢ(a)` adjusts toward realized outcomes.
7. **Death checks** (state ≤ 0 or predation), then **births** (A2+).
8. **Logging**.

Updating is **synchronous** (steps 2–3 act on the pre-resolution snapshot): no
first-mover advantage, and runs are reproducible. (Sequential random-order
updating is the documented alternative; A2's movement-cost result can be
sensitive to this, so the choice is explicit, §4.)

---

## 2. Design concepts

**Basic principles.** Homeostatic control: each agent keeps a vector of needs
near target by choosing actions that restore the most pressing deficits, net of
movement cost and risk. Adaptation has two channels, deliberately separable for
ablation (§1 of the spec):

- **Learned** — within one lifetime, `Qᵢ(a)` updates (recency / TD(0)).
- **Selected** — across generations, heritable traits + birth/death.

**Objectives (decision rule, §3.4).** Each agent scores actions by

```
U(a) = Σᵢ wᵢ(t)·Qᵢ(a) − MoveCost(a) − Risk(a)
```

and chooses `argmax` with ε-stochasticity. `wᵢ(t)` is deficit-proportional in
Batch A and is computed behind a **single swappable function** (`compute_weights`)
so Batch B can drop in Maslow-banded gating without touching anything else.
`Qᵢ(a) = learned_gain[i][a] × perceptual_affordance[i][a]`: the affordance is the
current perceptual signal (e.g. water available locally), the gain is what the
learner adapts.

**Learning.** `gain[i][a] ← gain[i][a] + α·(realized/expected − gain[i][a])`
(recency); TD(0) adds a `γ·V(next)` bootstrap. One config flag disables learning
for the ablation — gains then stay at their prior and the perceptual policy still
runs, which is exactly what isolates the trait channel.

**Prediction & sensing.** Agents sense only their Moore neighbourhood: field
gradients and entity presence within radius `r`. Moisture is generated to **peak
on water sources**, so "ascend the moisture gradient" genuinely leads to water —
the spec's "paths of increasing moisture". A faint-but-correct gradient still
commits the agent to a heading (a config floor), enabling long-range navigation.

**Interaction.** Agents compete for finite consumable tiles. Conflict resolution
(§4 step 4): claims are grouped by tile, then satisfied in a **seed-deterministic
shuffled order** until the tile depletes. Predators interact with agents by
emitting risk and attacking within their attack radius.

**Stochasticity.** ε-stochastic action choice and random-step exploration noise,
both scaled by the exploration trait; spawn placement; mutation; environment
rolls (drought, fauna movement). Every draw comes from an explicit, seeded stream
(§ Details/Initialization).

**Collectives.** None in Batch A (asexual, non-social). The action registry and
reproduction seam leave room for Batch B's social actions and mating.

**Emergence vs. imposed.** Survival, settling, over-exploration, and the
selected trait distribution are **emergent** and measured (§7). The ecology,
update order, and need dynamics are **imposed**.

**Observation (§6, §7).** Logged from tick 1: per-tick per-agent state; cause of
death; per-agent lifetime summaries (birthplace endowment, time-to-settle,
fraction stationary, over-exploration distance, survival time, offspring count);
per-run seed, full config, and environment hash. Operational definitions turn
each headline insight into a number — see `EXPERIMENTAL_DESIGN.md` §Operational.

---

## 3. Details

### 3.1 Initialization (§5 — the independent variable)

Birthplace is a **controlled, logged condition, not incidental randomness**. At
`t=0`:

- The world is built from the environment RNG stream (fields, source masks,
  prey/predator placement).
- Founders are placed by the **spawn** RNG stream, separable from the environment
  stream — so the world can be held fixed while only spawns vary (or vice versa).
- Spawn mode is one of `uniform`, `born_rich`, `born_poor`. `born_rich` draws
  founder tiles from the top resource-endowment percentile; `born_poor` from the
  bottom. **Resource endowment at birth** = mean of the per-tile endowment
  (normalized moisture + water + vegetation) within radius `r` of the spawn tile.
  It is logged per agent and is the scalar behind "born into resources".
- Founder traits are drawn from `N(init_mean, init_sd)` (clipped to [0,1]), or
  fixed identical under the trait-frozen ablation.

### 3.2 Input data

None external. The world is generated procedurally from config + seed; there are
no time-series driver files. (A4 non-stationarity is generated internally.)

### 3.3 Submodels

**Need dynamics (§3.1, §4 step 5).** Each tick every need drains by its
`drain_per_tick`. Two needs additionally respond to exposure:

- `temperature_comfort`: outside the comfort band it drains by
  `exposure_gain × distance_outside_band`; inside it recovers by `recovery`.
- `safety`: drains by `exposure_gain × local_risk`; recovers when risk is low.

Actions restore needs in step 4 (before drains): `drink` → hydration from the
water field; `eat` → energy from prey (preferred) or vegetation; `rest` → energy
by a fixed amount; movement pays `move_cost_per_tile` from energy (A2+).

**Action set (§3.3).** A **registry**, not an enum: `move`, `drink`, `eat`,
`rest`, `flee`. When `move` is chosen, direction is a weighted vote over per-need
perceptual cues; `flee` steps down the risk gradient. The exploration trait
injects ε action-noise and random-step noise — the mechanism behind "explores
forever even past optimal" (§7).

**Reproduction (§9.4).** Asexual clone-with-mutation. A parent that is mature,
off cooldown, has all needs ≥ `readiness_min_need`, and enough energy, spends
`energy_cost` to spawn one offspring within `offspring_spawn_radius`. The
offspring inherits the parent's traits with gaussian mutation (or identical under
ablation). A `max_population` cap keeps runs bounded.

**Mortality (§6).** Death occurs when any need hits 0 (cause = that need) or by
predation (cause = `predation`). Cause-of-death accounting exists from the start
because Batch B's "death by grief / sacrifice" requires it.

### 3.4 The A3 → A4 phase change (§2.2)

A1–A3 are **stationary**. A4 toggles non-stationarity on the *same* world (a
config delta, not a fork):

- **Seasonality** — the temperature field oscillates by `season_amplitude` over
  `season_period`; vegetation is `season_gated` (edible only part of the year).
- **Mobile fauna** — prey and predators step with per-tick probability; the risk
  field follows the predators.
- **Drought/rebound** — water sources stochastically enter drought (regen scaled
  by `dry_regen_factor`) and recover, governed by `onset_prob` / `recovery_prob`.

Everything an agent learned or was selected for in A3 can be invalidated in A4.
**That is the point.** Harshness is tuned to *fragile survival* (the population
persists but poorly), per the §9.5 ruling; all harshness knobs live in
`config/a4.yaml`.

### 3.5 Determinism (§10)

A single master seed per run seeds a `SeedSequence`, spawning four independent
generators: **environment**, **spawn**, **agent** (decision/conflict), and
**mutation**. The global RNG is never touched. Two runs with the same
`(code, config, seed)` produce identical histories; `python -m batch_a verify`
asserts this, and `tests/test_determinism.py` guards it in CI.
