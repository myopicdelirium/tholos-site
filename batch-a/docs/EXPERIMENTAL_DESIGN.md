# Batch A — Experimental Design

What "fully reporting on Batch A" requires (§8): an ODD spec (`ODD.md`), a
parameter table (`PARAMETERS.md`), and — here — the experimental design: for each
case what is varied, what is held fixed, how many seeds, how results are
aggregated, the controls/ablations, sensitivity, and how results tie to
operational definitions rather than narration.

## Aggregation discipline (§8.3)

- **Seeds.** Each reported cell is run across a seed sweep (≥ 20 for headline
  results; the examples below use fewer for turnaround). Seed controls the master
  RNG; environment and spawn streams are separable so the world can be held fixed
  while only spawns vary.
- **Aggregate.** Median across seeds with a **percentile bootstrap CI**
  (`metrics.bootstrap_ci`, 2000 resamples, 95%). Extinction is reported as a rate.
- **Reproducibility.** Every run records `(git_commit, config, seed,
  environment_hash)`; a result is rebuildable from those alone.

Driver:

```bash
python experiments/run_experiment.py --config <case>.yaml --seeds 0-19 \
    --conditions uniform,born_rich,born_poor \
    --ablations none,freeze_learning,freeze_traits
```

## Operational definitions (§7) — every insight gets a number

| Narrative claim | Operational measure | Column |
|-----------------|--------------------|--------|
| conservative ↔ explorative | heritable exploration trait (continuous) + behavioural readout | `trait_exploration`, `mean_step_displacement` |
| "born into resources" | birthplace endowment scalar (§5) | `birthplace_endowment` |
| "settles and stays forever" | time-to-settle + fraction of lifetime stationary | `time_to_settle`, `fraction_stationary` |
| "explores forever past optimal" | distance travelled after first reaching a Kth-percentile tile | `over_exploration_distance` |
| survival outcome | survival time + reproductive success | `survival_time`, `offspring_count` |

The A2 claim becomes a testable surface:
`survival ~ birthplace_endowment × exploration_trait`, fit across seeds, with the
learning-frozen and trait-frozen ablations as controls.

---

## Per-case design

### A1 — single-agent learning baseline

- **Varied:** seed (world + agent trajectory). Optionally `learning.enabled` to
  contrast learning vs. scripted policy.
- **Fixed:** single agent, traits identical, only moisture + water present.
- **Success criterion ("it works"):** the agent learns to exploit water and
  survives the full horizon, rather than dying of thirst by random walk.
- **Result (seeds 0–5, 1500 ticks):** survives `6/6` seeds to the horizon;
  cause-of-death empty. The learner's `hydration:drink` gain rises above its
  prior — learning, not luck. (With moisture and water *decoupled*, the agent
  dies ~tick 100; colocation + a gradient-cue floor is what makes navigation work
  — documented as the key A1 modeling fix.)

### A2 — population, movement cost, selection

- **Varied:** spawn condition `{uniform, born_rich, born_poor}`; ablation
  `{none, freeze_learning, freeze_traits}`; seed.
- **Fixed:** the world (same environment hash across conditions), movement cost,
  reproduction parameters.
- **Questions:** Does birthplace endowment predict survival/reproduction? Does the
  exploration trait? Is the effect trait, learning, or their interaction?
- **Reads:** `survival_time`, `offspring_count`, `final_population` by condition;
  selected `trait_exploration` distribution of survivors vs. founders.

### A3 — full stationary ecology

- **Varied:** spawn condition; seed. (Ablations available.)
- **Fixed:** everything stationary — fauna don't move, no seasons, no drought.
- **Success criterion ("it works"):** the population is self-sustaining under the
  full need set (energy, hydration, comfort, safety) across most seeds.
- **Result (calibration checks, 2500 ticks):** `0/2–0/3` seeds extinct; the
  population stabilises near carrying capacity (mean ~360–383) — uniformly stable,
  in deliberate contrast to A4 (see the A3→A4 table below).
- **Mortality structure:** logged by cause (`deaths_by_cause`) — comfort-band
  exposure and predation are the dominant pressures here.

### A4 — the non-stationary phase change

- **Varied:** seed; the harshness knobs in sensitivity analysis.
- **Fixed:** the A3 world generator; A4 only *toggles* seasonality, mobile fauna,
  and drought on top.
- **Success criterion ("it is not enough"):** survival is **fragile** — the
  population persists but markedly worse than A3 (lower final population, shorter
  median survival, higher extinction rate). Calibrated to fragility, not collapse,
  per the §9.5 ruling.

#### A3 → A4 contrast (calibration run)

Measured at the 2500-tick horizon (these are turnaround checks at n = 2–5 seeds;
headline numbers warrant ≥ 20 seeds per the discipline above — the small-n rates
here are seed-noisy by ±1 seed):

| Metric | A3 (stationary) | A4 (non-stationary) |
|--------|-----------------|---------------------|
| extinct by horizon | **0 / 2–3 seeds** | **~3 / 5 seeds** |
| mean population over run | ~360–383 (near cap) | 50–379, typ. ~300 then crash |
| min population over run | ~30–38 | **1–58** (teeters at the edge) |
| median individual survival | 176–502 ticks | **113–175 ticks** (high turnover) |
| population trajectory | rises and **stabilises** near carrying capacity | **violent oscillation**; deep recurrent crashes |

**Reading.** A3 is uniformly stable: every seed settles into the comfortable
temperature refuge and sustains near carrying capacity. A4 is **fragile**:
surviving seeds persist *precariously* — substantial populations that crash
deeply (to a handful of agents) and claw back, repeatedly — while a sizeable
fraction of seeds collapse to extinction outright. Individuals live roughly half
as long (constant churn), and the population teeters near zero throughout. This
is "survive it poorly enough that Batch B has something to do" made quantitative:
the physical-needs substrate **alone** cannot reliably survive non-stationarity.

**Why fragility is horizon-dependent (an honest caveat).** Extinction is an
absorbing state, and a deeply-oscillating population eventually hits zero given
enough time — so A4's extinction *rate rises with the reporting horizon*. We fix
the horizon at 2500 ticks, where A4 "survives poorly but not totally"; extending
it drives more seeds extinct. That horizon-dependence **is** the fragility, not an
artefact of it.

**The collapse boundary (sensitivity, §8.5).** A4 sits near a tipping point. The
pre-calibration settings (`season_amplitude` 0.15–0.30, severe drought, 6 fast
mobile predators) produced **uniform collapse** (3/3 extinct, whole-population
die-offs around the first cold season). The calibrated knobs in `config/a4.yaml`
— shallower/shorter seasons, a wider comfort refuge, calmer predators, and faster
reproductive recovery — move the system from *guaranteed collapse* to *precarious
persistence*. The narrowness of that band is itself a finding, and every knob is
config, so the harshness is a dial, not a constant.

---

## Controls / ablations (§8.4)

At minimum, every A2/A3 headline is reported with:

- **freeze_learning** — `learning.enabled: false`. Gains stay at prior; only the
  heritable disposition adapts. Does the **trait alone** reproduce the pattern?
- **freeze_traits** — `traits.fix_identical: true`. Everyone shares one
  disposition; only within-lifetime learning adapts. Does **learning alone**
  reproduce it?

Without these, A2/A3 are stories. If neither alone reproduces a result, it is an
**interaction** — a stronger and more honest finding (§1).

## Sensitivity (§8.5)

Key results must survive reasonable parameter changes, or we report where they
break. Priorities:

1. **A4 harshness** — sweep `season_amplitude`, `drought.onset_prob`,
   `predators.move_prob`. Report how harsh before the population collapses
   entirely (the boundary between "fragile" and "extinct").
2. **Movement cost (A2)** — the conservative↔explorative trade-off is most
   sensitive here; sweep `move_cost_per_tile`.
3. **Learning rate / rule** — `alpha`, and `recency` vs `td0`.
4. **Update scheme** — synchronous vs. sequential (flagged in §4 as able to move
   the A2 result).

All sweeps reuse the experiment driver with single-key config overrides, so
sensitivity is the same machinery as the main runs.
