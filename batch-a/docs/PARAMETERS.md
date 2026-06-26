# Batch A — Parameter Table

Every constant, its value, and its units (§8.2). **No magic numbers live in
prose or code** — `config/base.yaml` is the source of truth; per-case configs
override only the deltas noted in the last column. Values below are the base
defaults.

> Units: *frac* = a fraction in [0,1] (need levels, field values); *tiles* =
> grid cells; *ticks* = simulation steps; *prob* = per-event probability.

## World & perception (§2)

| Parameter | Value | Units | Meaning | Case overrides |
|-----------|-------|-------|---------|----------------|
| `world.size` | 64 | tiles | grid is size×size (up to 256 for final runs) | — |
| `world.boundary` | toroidal | — | wrap vs. walls | — |
| `world.perception_radius` (r) | 2 | tiles | bounded Moore radius; local info only | — |
| `perception.gradient_cue_gain` | 8.0 | — | scales gradient magnitude → cue strength | — |
| `perception.gradient_cue_floor` | 0.35 | frac | min cue strength when a gradient direction exists | — |

## Scalar fields (§2.1)

| Parameter | Value | Units | Meaning | Introduced |
|-----------|-------|-------|---------|-----------|
| `fields.moisture.clusters` | 5 | count | wet clusters (when not colocated with water) | A1 |
| `fields.moisture.cluster_sigma` | 6.0 | tiles | spread of each moisture cluster | A1 |
| `fields.moisture.baseline` | 0.05 | frac | field floor | A1 |
| `fields.temperature.gradient_axis` | y | — | axis of the linear temperature gradient | A3 |
| `fields.temperature.low` / `.high` | 0.0 / 1.0 | frac | field values at the two edges | A3 |
| `fields.temperature.comfort_low` / `.high` | 0.30 / 0.70 | frac | comfort band bounds | A3 |
| `fields.temperature.season_amplitude` | 0.0 (A4: 0.15) | frac | peak seasonal offset added to the field | A4 |
| `fields.temperature.season_period` | 365 (A4: 600) | ticks | ticks per seasonal cycle | A4 |
| `fields.risk.predator_sigma` | 4.0 | tiles | spread of each predator's risk halo | A3 |
| `fields.risk.baseline` | 0.0 | frac | ambient risk floor | A3 |

## Consumable & threat entities (§2.2)

| Parameter | Value | Units | Meaning | Introduced |
|-----------|-------|-------|---------|-----------|
| `entities.water.sources` | 6 | count | water source clusters (also seed the moisture peaks) | A1 |
| `entities.water.cluster_sigma` | 2.0 | tiles | source core spread | A1 |
| `entities.water.capacity` | 1.0 | frac | max stored quantity per source tile | A1 |
| `entities.water.regen_per_tick` | 0.05 | frac/tick | restored toward capacity | A1 |
| `entities.water.efficiency` | 1.0 | — | consumed quantity → hydration gain | A1 |
| `entities.vegetation.patches` | 8 | count | vegetation patches | A3 |
| `entities.vegetation.cluster_sigma` | 3.0 | tiles | patch spread | A3 |
| `entities.vegetation.regen_per_tick` | 0.02 | frac/tick | regrowth toward capacity | A3 |
| `entities.vegetation.efficiency` | 0.8 | — | consumed quantity → energy gain | A3 |
| `entities.vegetation.season_gated` | false (A4: true) | — | edible only in-season | A4 |
| `entities.prey.count` | 12 | count | discrete prey | A3 |
| `entities.prey.respawn_ticks` | 80 | ticks | delay before a consumed prey respawns | A3 |
| `entities.prey.efficiency` | 1.0 | — | eating prey → energy gain | A3 |
| `entities.prey.move_prob` | 0.0 (A4: 0.3) | prob | per-tick step probability | A4 |
| `entities.predators.count` | 6 | count | discrete predators | A3 |
| `entities.predators.attack_radius` | 1 | tiles | predation range (Chebyshev) | A3 |
| `entities.predators.predation_prob` | 0.15 | prob | per-tick kill probability in range | A3 |
| `entities.predators.move_prob` | 0.0 (A4: 0.3) | prob | per-tick step probability | A4 |

## Non-stationarity (§2.2, A4)

| Parameter | Value (A4) | Units | Meaning |
|-----------|-----------|-------|---------|
| `nonstationarity.seasonality` | true | — | temperature oscillates; vegetation season-gated |
| `nonstationarity.mobile_fauna` | true | — | prey & predators move |
| `nonstationarity.drought.onset_prob` | 0.0025 | prob | wet→drought flip per tick |
| `nonstationarity.drought.recovery_prob` | 0.012 | prob | drought→wet flip per tick |
| `nonstationarity.drought.dry_regen_factor` | 0.20 | — | water regen multiplier during drought |

## Needs (§3.1)

| Need | initial | target | threshold | drain/tick | exposure_gain | recovery |
|------|---------|--------|-----------|-----------|---------------|----------|
| `energy` | 1.0 | 1.0 | 0.25 | 0.004 | — | — |
| `hydration` | 1.0 | 1.0 | 0.25 | 0.010 | — | — |
| `temperature_comfort` | 1.0 | 1.0 | 0.20 | 0.000 | 0.15 | 0.05 |
| `safety` | 1.0 | 1.0 | 0.20 | 0.000 | 0.50 | 0.05 |

All in *frac* (levels) or *frac/tick* (rates). Exposure drain =
`exposure_gain × signal` (comfort: distance outside band; safety: local risk).

## Actions, decision, learning, traits (§3.3–3.6)

| Parameter | Value | Units | Meaning | Case overrides |
|-----------|-------|-------|---------|----------------|
| `actions.rest.amount` | 0.06 | frac/tick | energy restored by resting | — |
| `actions.move_cost_per_tile` | 0.0 (A2+: 0.012) | frac/tile | energy drained per tile moved | A2–A4 |
| `actions.flee_cost_per_tile` | 0.0 (A2+: 0.012) | frac/tile | energy drained per tile fled | A2–A4 |
| `decision.weighting` | deficit_proportional | — | the single swappable weight function | — |
| `decision.epsilon` | 0.05 | prob | base ε for ε-stochastic choice | — |
| `decision.risk_weight` | 1.0 | — | coefficient on Risk(a) in U(a) | — |
| `decision.move_cost_weight` | 1.0 | — | coefficient on MoveCost(a) in U(a) | — |
| `learning.enabled` | true | — | within-lifetime learning on/off (ablation) | freeze_learning |
| `learning.rule` | recency | — | `recency` (delta rule) or `td0` | — |
| `learning.alpha` | 0.2 | — | learning rate | — |
| `learning.gamma` | 0.9 | — | discount (td0 only) | — |
| `learning.gain_init` | 1.0 | — | initial learned gain per (need, action) | — |
| `learning.gain_min` / `.gain_max` | 0.1 / 3.0 | — | gain clamp | — |
| `traits.fix_identical` | false (A1: true) | — | fix all dispositions identical (ablation) | A1, freeze_traits |
| `traits.exploration.init_mean` | 0.5 | frac | mean founder disposition | — |
| `traits.exploration.init_sd` | 0.15 | frac | sd of founder disposition | — |
| `traits.exploration.mutation_sd` | 0.05 | frac | gaussian mutation sd to offspring | — |
| `traits.exploration.epsilon_scale` | 0.30 | — | ε += exploration × this | — |
| `traits.exploration.step_noise_scale` | 0.50 | prob | random-step probability = exploration × this | — |

## Reproduction (§9.4)

| Parameter | Value | Units | Meaning |
|-----------|-------|-------|---------|
| `reproduction.enabled` | false (A2+: true) | — | asexual clone-with-mutation |
| `reproduction.maturity_age` | 60 | ticks | minimum age to reproduce |
| `reproduction.cooldown` | 40 | ticks | ticks between births for one agent |
| `reproduction.readiness_min_need` | 0.6 | frac | all needs must be ≥ this to reproduce |
| `reproduction.energy_cost` | 0.4 | frac | energy spent per offspring |
| `reproduction.offspring_spawn_radius` | 1 | tiles | offspring placement radius around parent |
| `reproduction.max_population` | 400 | count | hard population cap |

## Initialization, logging, metrics (§5–§7)

| Parameter | Value | Units | Meaning |
|-----------|-------|-------|---------|
| `init.n_agents` | 1 (A2+: 40–50) | count | founder population |
| `init.spawn_mode` | uniform | — | `uniform` / `born_rich` / `born_poor` |
| `init.endowment_percentile` | 0.85 | frac | rich/poor spawn cutoff |
| `init.endowment_radius` | 2 | tiles | radius for the birthplace endowment scalar |
| `logging.format` | csv | — | `csv` (always) or `parquet` (needs pandas) |
| `logging.out_dir` | runs | — | `runs/<run_id>/` per run |
| `metrics.settle_displacement_threshold` | 1.5 | tiles | below this counts as "settled" |
| `metrics.settle_window` | 50 | ticks | window displacement must stay low to settle |
| `metrics.resource_percentile_k` | 0.75 | frac | Kth percentile defining a "good" tile |
| `run.max_ticks` | 2000 (per case 1500–4000) | ticks | run horizon (also ends on extinction) |
