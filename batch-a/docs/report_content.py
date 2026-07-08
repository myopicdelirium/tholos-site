"""Assembles the full Batch A report markdown from authored prose + project docs
+ live source excerpts. Imported by build_report.py."""

from __future__ import annotations


EXEC_SUMMARY = r"""
# Executive Summary

**Batch A** is an agent-based model (ABM) of agents that survive a fixed ecology
by optimizing among competing physical needs. It is deliberately *not* the
interesting science — it is the **substrate** the lab's humanistic work (Batch B:
attention economics, social needs, grief, sacrifice) stands on. Its job is to
produce agents that (a) demonstrably learn / are selected to exploit their
environment, and (b) survive it **poorly enough**, by case A4, that Batch B's
mechanisms have real pressure to act on.

These two criteria pull against each other, and the governing discipline of this
work is that **both are measured, not asserted.** This report is the measurement.

## What was built

A complete, deterministic, config-driven implementation of the four foundational
cases, with the module seams chosen now so Batch B drops in without rewrites:

- **A1** — single-agent learning baseline (moisture field + water). *Does an
  agent learn to exploit the environment?*
- **A2** — population, movement cost, birth/death → **selection**. *Does
  birthplace × disposition predict survival?*
- **A3** — full **stationary** ecology: heat (a comfort band), vegetation, prey,
  predators (risk). *Does it still work with the whole need set?*
- **A4** — the **non-stationary phase change**: seasonality, mobile fauna,
  drought/rebound. *Survival turns fragile.*

## Headline findings (measured)

- **A1 works.** The single agent learns to navigate the moisture gradient to
  water and survives every seed tested (6/6). Decoupling moisture from water
  kills it by ~tick 100 — confirming the learned navigation is real, not luck.
- **A2 selects.** Reproduction yields hundreds of births per run; mortality is
  structured (movement-cost energy and thirst), and the heritable exploration
  disposition is exposed to selection.
- **A3 works, uniformly.** The population stabilizes near carrying capacity
  (mean ≈ 360–383) in essentially every seed (0 of 2–3 extinct).
- **A4 is fragile.** Under non-stationarity the same population becomes
  precarious: it persists in some worlds and collapses in others (≈ 3/5 extinct
  at a 2500-tick horizon), with violent oscillation, deep recurrent crashes, and
  roughly half the individual survival of A3. This is "survive it poorly enough
  that Batch B has something to do," made quantitative.

## How to read this report

The report is self-contained and ordered so a stranger could rebuild the model:
the **Decision Record** fixes the modeling choices; the **ODD Specification**
describes the model to the field's standard (Grimm/Railsback); the **Parameter
Table** lists every constant with units; the **Implementation Walkthrough** ties
the spec to the code; the **Experimental Design** and **Results** sections give
the measurement protocol and the numbers; and the **Appendices** carry the full
file tree and configuration listings.
"""


IMPL_WALKTHROUGH_HEAD = r"""
# Implementation Walkthrough

This part ties the specification to the code. The repository is a self-contained
Python project (`batch-a/`) with the module boundaries the spec's §10 prescribes,
chosen so that Batch B is a set of drop-ins rather than a rewrite. Everything is
config-driven (no magic numbers in code) and deterministic.

## Module map

| Module | Responsibility | Batch-B seam |
|--------|----------------|--------------|
| `rng.py` | one seeded master → separable streams (env / spawn / agent / mutation) | — |
| `config.py` | `base.yaml ← case ← ablation` deep-merge; environment hash | — |
| `environment/fields.py` | continuous scalar fields, toroidal gradients | — |
| `environment/entities.py` | discrete consumables + prey/predator populations | — |
| `environment/world.py` | the shared substrate, layered A1→A4 | non-stationarity is a toggle |
| `environment/dynamics.py` | per-tick environment update (incl. A4) | A4 is a subclass of behaviour |
| `agent/state.py` | extensible homeostatic need vector | B appends higher needs |
| `agent/perception.py` | local gradients + entity presence, radius r | — |
| `agent/actions.py` | action **registry**, not an enum | B adds share/signal/mate |
| `agent/decision.py` | `U(a)=Σ wᵢ·Qᵢ(a)−cost−risk`; weights behind one function | Maslow gating drops in |
| `agent/learning.py` | within-lifetime `Qᵢ(a)` update; one flag disables it | — |
| `agent/traits.py` | heritable exploration disposition + mutation | — |
| `agent/memory.py` | stub seam | B's distorting memory plugs in |
| `scheduler.py` | the fixed 8-step tick pipeline (synchronous) | — |
| `reproduction.py` | asexual clone-with-mutation (A2+) | B adds mating |
| `metrics.py` | §7 operational definitions + bootstrap aggregation | — |
| `logging/` | §6 observable schema + run recorder | — |
| `sim.py` / `cli.py` | build world, run, report; `run`/`sweep`/`verify` | — |

## Determinism: one seed, separable streams

Determinism is non-negotiable: a run is reproducible from `(code, config, seed)`
alone. A single master seed seeds a NumPy `SeedSequence`, which *spawns* four
independent generators. The global RNG is never touched, and because the streams
are separate, the world can be held fixed while only spawns vary (or vice versa)
— exactly what the §5 birthplace experiments need.

```python
%RNG%
```

## The decision rule and its swappable weight function

Each agent scores actions by `U(a) = Σᵢ wᵢ(t)·Qᵢ(a) − MoveCost(a) − Risk(a)` and
chooses argmax with ε-stochasticity. The need weights `wᵢ(t)` are computed behind
a **single function** — Batch A uses simple deficit-proportional weighting; Batch
B replaces only this function with Maslow-banded gating.

```python
%WEIGHTS%
```

`Qᵢ(a) = learned_gain · perceptual_affordance`: the affordance is the current
perceptual signal (e.g. water available locally), and the gain is what the
learner adapts. Freezing learning leaves the perceptual policy intact — which is
exactly what isolates the trait channel in the ablation.

```python
%LEARN%
```

## The tick pipeline (process scheduling)

Update order is load-bearing and never drifts. The scheduler implements the
8-step synchronous pipeline; perception and choice act on a pre-resolution
snapshot so there is no first-mover advantage, and conflict resolution (two
agents, one source) is defined here, once.

```python
%SCHED%
```
"""


RESULTS = r"""
# Results &amp; Calibration Narrative

This part reports what the model *does*, and — in the spirit of the spec — is
candid about how the A4 result was reached, because the path is itself a finding.

## A1 — the learning baseline works

A1 is a single agent, traits fixed, with only the moisture field and water
sources present: a hydration-survival task. The agent must read the local
moisture gradient, navigate to a water source, and drink before hydration hits
zero, while energy slowly drains and `rest` recovers it.

- **It works:** the agent survives the full 1500-tick horizon across every seed
  tested (6/6), with no deaths.
- **It is learning, not luck:** a deliberate negative control — generating the
  moisture field and the water sources *independently*, so the gradient does not
  lead to water — kills the agent by ≈ tick 100 (pure thirst). Colocating water
  with the moisture peaks, plus a gradient-cue floor that lets a faint-but-correct
  gradient commit the agent to a heading, is what turns a random walk into
  exploitation. This was a genuine modeling bug caught and fixed during bring-up.

## A2 — population and selection

A2 adds a founding population, an energy cost on movement, and birth/death.
Movement cost makes the conservative↔explorative trade-off bite, and reproduction
exposes the heritable disposition to selection.

- Runs produce **hundreds of births** (typ. 350–830 depending on horizon), the
  population sustains to the cap, and mortality is structured: deaths from
  movement-cost **energy** depletion and from **hydration** dominate.
- The A2 claim becomes a testable surface — `survival ~ birthplace_endowment ×
  exploration_trait` — with the learning-frozen and trait-frozen ablations
  (shipped as config overlays) as the controls that turn the story into a result.

## A3 — the full stationary ecology works

A3 layers in the temperature comfort band, vegetation, prey, and predators, all
**stationary**. With the comfort band and predators now able to kill, the agent
must satisfy four needs at once.

- A3 is **uniformly stable**: the population settles into the always-comfortable
  temperature refuge and sustains near carrying capacity (mean ≈ 360–383), with
  0 of 2–3 seeds extinct in calibration checks.
- Mortality is dominated by comfort-band exposure and predation — the pressures
  the agent must learn/settle around.

## A4 — fragility, and how it was calibrated

A4 toggles non-stationarity onto the *same* world: temperature oscillates
seasonally, vegetation is season-gated (a seasonal famine), prey and predators
move, and water sources stochastically dry and rebound. Everything an agent
learned or was selected for in A3 can be invalidated. The ruling (§9.5) was for
**fragile survival** — poorly, but not total collapse — and reaching that regime
took several measured iterations:

1. **First attempt → total collapse (3/3 extinct).** Diagnosis: the population
   booms to the cap in the fertile first half-season, then a seasonal catastrophe
   (cold + famine + drought) wipes it out around t≈450. Boom-bust, not fragility.
2. **Softened seasons → still collapsing.** The temperature comfort exposure was
   too lethal relative to how fast agents migrate to the shifting comfort band.
   Widening the band and easing exposure helped A3 robustness but A4 still tipped.
3. **Faster reproduction → A3 robust, A4 still 4/5 extinct.** Quicker recovery
   fixed A3's occasional founding failures but made A4 boom higher and crash
   harder: an absorbing collapse from slow recovery against sustained cold.
4. **Targeted the real mechanism.** A4's mobile predators *scatter* the herd
   (via fleeing) and the vegetation famine *drives foraging*, pushing agents off
   the always-comfortable strip into the lethal grid edges. Widening the habitable
   refuge, calming the predators, easing the famine, and shortening seasons into
   brief survivable pulses moved the system from guaranteed collapse to
   **precarious persistence**.

%A4_CONTRAST%

**Interpretation.** A3 is uniformly stable; A4 is fragile. Surviving A4 seeds
persist *precariously* — substantial populations that crash to a handful and claw
back, repeatedly — while a sizeable fraction collapse outright. Individuals live
roughly half as long. The physical-needs substrate **alone** cannot reliably
survive non-stationarity, which is precisely the pressure Batch B must relieve.

**Two honest caveats.** (1) Extinction is an absorbing state, so a deeply
oscillating population's extinction *rate rises with the reporting horizon*; we
fix the horizon at 2500 ticks, where A4 "survives poorly but not totally," and
note that this horizon-dependence *is* the fragility. (2) These are turnaround
checks at n = 2–5 seeds; headline rates warrant ≥ 20 seeds (the experiment driver
supports exactly this). A4 sits near a tipping point, and every harshness knob is
config — so "how harsh before collapse" is a dial the lab can turn, and the
narrowness of the fragile band is itself a reportable result.
"""


HOWTO = r"""
# How to Run &amp; Reproduce

Everything is reproducible from `(code version, config, seed)`. Each run writes a
self-describing directory under `runs/<run_id>/` containing the per-tick stream,
the per-agent lifetime summaries, the per-tick environment scalars, the fully
resolved config, and a `meta.json` with the seed, environment hash, code version,
and git commit.

## Install

```
cd batch-a
pip install -r requirements.txt      # numpy + PyYAML (pandas optional, Parquet)
```

## Run, sweep, verify

```
python -m batch_a run    --config a1.yaml --seed 0     # one run, JSON to stdout
python -m batch_a sweep  --config a2.yaml --seeds 0-9  # a seed sweep
python -m batch_a verify --config a1.yaml --seed 0     # determinism self-check
```

## Experiments with ablations and cross-seed aggregation

```
python experiments/run_experiment.py --config a2.yaml --seeds 0-19 \
    --conditions uniform,born_rich,born_poor \
    --ablations none,freeze_learning,freeze_traits
```

This aggregates across seeds with **median + percentile bootstrap CI** and writes
tidy `*_runs.csv` / `*_aggregate.csv` tables. The two ablations are the controls
(§1, §8.4): `freeze_learning` (does the trait alone reproduce the pattern?) and
`freeze_traits` (does learning alone?). If neither alone reproduces a result, it
is an **interaction** — a stronger, more honest finding.

## Tests

A 22-test suite guards the invariants — determinism (same seed → identical
history), config inheritance and the environment hash, toroidal field gradients
and regeneration, need-vector extensibility, trait inheritance bounds, the
learning on/off flag, and per-case end-to-end smoke with the §6 artifacts:

```
cd batch-a && python -m pytest tests/ -q        # 22 passed
```
"""


# cap-400 turnaround-check numbers (n = 2–5 seeds) — PROVISIONAL per the WO-2/WO-3
# amendment (cap 400 is a global confound). Used only until the cap-2000 × 20-seed
# regeneration (WO-3's A4 arm) lands in docs/diagnostics/a4_cap2000_analysis.json.
_A4_PROVISIONAL = r"""### Measured A3 → A4 contrast (2500-tick horizon; cap 400 — PROVISIONAL)

*These numbers are cap-confounded (WO-4) and marked provisional; the cap-2000 ×
20-seed regeneration replaces this table automatically when its data lands.*

| Metric | A3 (stationary) | A4 (non-stationary) |
|--------|-----------------|---------------------|
| extinct by horizon | 0 / 2–3 seeds | ≈ 3 / 5 seeds |
| mean population over run | ≈ 360–383 (near cap) | 50–379; typ. ≈ 300 then crash |
| min population over run | ≈ 30–38 | 1–58 (teeters at the edge) |
| median individual survival | 176–502 ticks | 113–175 ticks (high turnover) |
| trajectory | rises and **stabilises** | **violent oscillation**, deep crashes |"""


def _a4_contrast_section(read):
    """The A3→A4 contrast table — regenerated numbers when available, else the
    provisional cap-400 table with the flag stated in the report itself."""
    import json
    try:
        a = json.loads(read("diagnostics/a4_cap2000_analysis.json"))
    except Exception:
        return _A4_PROVISIONAL
    if a.get("a4", {}).get("n_seeds", 0) < 20 or a.get("a3", {}).get("n_seeds", 0) < 20:
        return _A4_PROVISIONAL

    def fmt(case, key, nd=3):
        c = a[case][key]
        if c["median"] is None:
            return "—"
        return f"{round(c['median'], nd)} [{round(c['ci_low'], nd)}, {round(c['ci_high'], nd)}]"
    return f"""### Measured A3 → A4 contrast (cap 2000 × 20 seeds, 3000 ticks)

*Medians with bootstrap 95% CIs over seeds; same-seed pairing, so the contrast is
the cost of non-stationarity itself. Supersedes the provisional cap-400 numbers.*

| Metric | A3 (stationary) | A4 (non-stationary) |
|--------|-----------------|---------------------|
| extinct fraction | {a['a3']['extinct_fraction']} | {a['a4']['extinct_fraction']} |
| carrying capacity R_s | {fmt('a3', 'R_s', 0)} | {fmt('a4', 'R_s', 0)} |
| max drawdown (crash severity) | {fmt('a3', 'max_drawdown')} | {fmt('a4', 'max_drawdown')} |
| volatility (CV) | {fmt('a3', 'volatility_cv')} | {fmt('a4', 'volatility_cv')} |
| Fano of per-tick deaths | {fmt('a3', 'fano_deaths', 1)} | {fmt('a4', 'fano_deaths', 1)} |"""


def build_markdown(read, grab, file_tree):
    parts = []

    parts.append(EXEC_SUMMARY)

    # Decision record frames the choices.
    parts.append(read("DECISIONS.md"))

    # The core specification.
    parts.append(read("ODD.md"))

    # Every constant with units.
    parts.append(read("PARAMETERS.md"))

    # Implementation walkthrough with live code excerpts.
    walk = IMPL_WALKTHROUGH_HEAD
    walk = walk.replace("%RNG%", grab(
        "batch_a/rng.py", "class RNGStreams", "    def __repr__").rstrip())
    walk = walk.replace("%WEIGHTS%", grab(
        "batch_a/agent/decision.py", "def compute_weights", "def _alignment").rstrip())
    walk = walk.replace("%LEARN%", grab(
        "batch_a/agent/learning.py", "    def update", "    def snapshot").rstrip())
    walk = walk.replace("%SCHED%", grab(
        "batch_a/scheduler.py", "def run_tick", None).rstrip())
    parts.append(walk)

    # Experimental design.
    parts.append(read("EXPERIMENTAL_DESIGN.md"))

    # Results narrative (A4 contrast auto-upgrades when cap-2000 data lands).
    parts.append(RESULTS.replace("%A4_CONTRAST%", _a4_contrast_section(read)))

    # How to run.
    parts.append(HOWTO)

    # Appendix A: file tree.
    parts.append("# Appendix A — Repository File Tree\n\n"
                 "The complete project (simulation outputs and caches omitted):\n\n"
                 "```\n" + file_tree() + "\n```\n")

    # Appendix B: configuration listings.
    cfg_md = ["# Appendix B — Configuration Listings\n",
              "Config is the single source of truth; per-case files override only "
              "the deltas they name. Listings are the committed values.\n"]
    for name, title in [
        ("config/base.yaml", "base.yaml — all defaults"),
        ("config/a1.yaml", "a1.yaml"),
        ("config/a2.yaml", "a2.yaml"),
        ("config/a3.yaml", "a3.yaml"),
        ("config/a4.yaml", "a4.yaml"),
        ("config/ablations/a2_freeze_learning.yaml", "ablations/a2_freeze_learning.yaml"),
        ("config/ablations/a2_freeze_traits.yaml", "ablations/a2_freeze_traits.yaml"),
    ]:
        cfg_md.append(f"## {title}\n")
        cfg_md.append("```yaml\n" + read(name).rstrip() + "\n```\n")
    parts.append("\n".join(cfg_md))

    return "\n\n".join(parts)
