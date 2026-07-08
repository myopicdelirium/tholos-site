# Batch A — §9 Decision Record

The spec (§9) flagged five modeling decisions where defaults were assumed and a
ruling was needed, plus the project-level questions of scope and location. This
records what was ruled and how it is realized in code.

## §9 decision points

| # | Decision (§) | Ruling | Where it lives |
|---|--------------|--------|----------------|
| 1 | Learning + traits both present, or A1 purely scripted? (§1) | **Both present.** A1 runs as a single-agent *learning* baseline with traits fixed (`traits.fix_identical: true`); A2+ add population, traits, and selection. | `agent/learning.py`, `agent/traits.py`; `config/a1.yaml` |
| 2 | Continuous fields + discrete entities, or discrete tiles only? (§2.1) | **Continuous scalar fields + discrete entities.** Moisture/temperature/risk are scalar fields perceived as gradients; water/vegetation/prey/predators are discrete. | `environment/fields.py`, `environment/entities.py` |
| 3 | Synchronous vs. sequential updating? (§4) | **Synchronous** snapshot updating — no first-mover advantage, reproducible. Flagged because A2's movement-cost result can be sensitive to it. | `scheduler.py` |
| 4 | Reproduction model for A2+ (§9.4) | **Asexual clone-with-mutation.** Simplest model that still yields selection; the action registry + reproduction seam leave room for Batch B's mating. | `reproduction.py`, `agent/traits.py` |
| 5 | How harsh is A4? (§9.5) | **Fragile survival** — the population persists but poorly, leaving pressure for Batch B. Not near-total collapse. All harshness knobs are config in `config/a4.yaml` and were calibrated empirically (see `EXPERIMENTAL_DESIGN.md`). | `config/a4.yaml`, `environment/dynamics.py` |

## Project-level

| Question | Ruling |
|----------|--------|
| Scope of this pass | **Full A1–A4 implementation**, not just A1. |
| Location | A self-contained Python project in `batch-a/` inside the existing repo, on the working branch. Can be split into its own repo later without code changes. |
| Language / deps | Python 3.11; numpy + PyYAML. CSV logging always available; Parquet used opportunistically if pandas is importable. |

## Consequence accepted (§1)

With both learning and traits present, "explorative agents survived" is ambiguous
— trait or learned policy? Batch A's rigor depends on disentangling these by
ablation, which is why `freeze_learning` and `freeze_traits` are first-class
config overlays and the experiment driver runs them as controls. If neither
channel alone reproduces a result, that result is an **interaction** — reported
as such, not papered over.

## Performance & verification rulings (2026-07-06)

| Question | Ruling |
|----------|--------|
| Fast path scope | **Vectorize perception only** (`perception.impl: vectorized`, now default). Decision, RNG draws, and conflict resolution stay on the scalar reference — their conditional per-agent draws cannot be batched without moving the reference. Proven **bit-identical at the full 3000-tick horizon** on seam-straddling wrap, saturated-tie, rich, and poor worlds (`experiments/verify_perception.py`); guarded at field level by `tests/test_perception_equivalence.py`. |
| What bit-identity means | **No-regression, not correctness.** Both impls descend from the same source and can agree while both wrong. A green diff licenses swapping the fast path in; it never validates the model. |
| The deferred 10× | **Struct-of-arrays rewrite is design-frozen** (`docs/SOA_REWRITE_PLAN.md`): it necessarily moves the RNG-consumption reference (R1→R2 via counter-based keying), so it waits until the current result set is closed and archived. Enabling tooling (RNG trace/replay, rung 3) is built and tested (`experiments/rng_trace.py`). |
| Code freeze during headline runs | **`batch_a/` sim internals are frozen while a full-N grind is in flight.** Cells must not span two code versions; each checkpoint row records its `impl` for provenance. |
| Estimator of record for WO-2 βₛ | **Crash-robust stable-tick hazard** (grouped Poisson over stable ticks; Cox-on-age cross-check), fitted inline per cell; raw OLS βₛ demoted to sensitivity. Validated on the pilot (7/7 sign agreement) and on planted-sign synthetic data (`tests/test_wo_instruments.py`). |
| Headline moderator question | Decided by the full-20's **disentangling regression** βₛ ~ z(volatility) + z(capacity) with seed-bootstrap CIs; a moderator wins only if its CI excludes zero (`experiments/analyze_wo2_full20.py`). |
| One palette source | `design/tokens.json` → figures (`viz/style.py`) AND site CSS (`design/build_css.py` → `src/app/tokens.css`); drift is test-guarded. |
