# Batch A — foundational ecological cases (A1–A4)

An agent-based model (ABM) of agents that survive a fixed ecology by optimizing
among competing physical needs. Batch A is the **substrate** the lab's later,
humanistic work (Batch B) stands on. It has two success criteria that pull
against each other, and **both are measured, not asserted** (see `docs/`):

1. **It works** — agents demonstrably learn/are selected to exploit the world.
2. **It is not enough** — by A4, survival is fragile under a non-stationary world.

| Case | What it adds | Question it answers |
|------|--------------|---------------------|
| **A1** | Moisture field + water; single agent; learning only | Can an agent *learn* to exploit the environment? |
| **A2** | Population, movement cost, birth/death → **selection** | Does birthplace × disposition predict survival? |
| **A3** | Heat (comfort band), vegetation, prey, predators (risk) | Full **stationary** ecology — does it still work? |
| **A4** | Seasonality, mobile fauna, drought/rebound | The **non-stationary phase change** — survival turns fragile |

## Install & run

```bash
cd batch-a
pip install -r requirements.txt          # numpy + PyYAML (pandas optional, for Parquet)

python -m batch_a run    --config a1.yaml --seed 0     # one run, JSON summary to stdout
python -m batch_a sweep  --config a2.yaml --seeds 0-9  # a seed sweep
python -m batch_a verify --config a1.yaml --seed 0     # determinism self-check
```

Each run writes `runs/<run_id>/`:

- `ticks.csv` — per-tick, per-agent stream (position, state vector, action, traits)
- `summaries.csv` — per-agent lifetime summary (birthplace, settling, survival, …)
- `environment.csv` — per-tick world scalars (water/veg totals, drought, season)
- `config.yaml` — the fully-resolved config (a stranger can rebuild the world)
- `meta.json` — seed, environment hash, code version, git commit, results

A run is reproducible from **(code version, config, seed)** alone — this is the
"never lose it again" guarantee (§10).

## Experiments & ablations

```bash
python experiments/run_experiment.py --config a2.yaml --seeds 0-19 \
    --conditions uniform,born_rich,born_poor \
    --ablations none,freeze_learning,freeze_traits
```

Aggregates across seeds with **median + bootstrap CI** and emits tidy
`*_runs.csv` / `*_aggregate.csv` tables. The ablations are the controls that turn
A2/A3 from stories into results (§1, §8.4):

- **freeze_learning** — Q-values never update; does the *trait* alone reproduce
  the survival pattern?
- **freeze_traits** — everyone identical; does *learning* alone reproduce it?

If neither alone reproduces it, the result is an **interaction** — a stronger,
more honest finding.

## Layout (module seams chosen for Batch B, §10)

```
batch_a/
  rng.py                 # one seeded master → separable streams (env / spawn / …)
  config.py              # base.yaml ← case ← ablation deep-merge + env hash
  environment/
    fields.py            # continuous scalar fields, toroidal gradients
    entities.py          # discrete consumables + prey/predator populations
    world.py             # the shared substrate, layered A1→A4
    dynamics.py          # per-tick update; A4 non-stationarity is a toggle, not a fork
  agent/
    state.py             # extensible homeostatic need vector (B appends needs)
    perception.py        # local gradients + entity presence, radius r
    actions.py           # action REGISTRY, not an enum (B adds share/signal/mate)
    decision.py          # U(a)=Σ wᵢ·Qᵢ(a)−cost−risk; weights behind ONE function
    learning.py          # within-lifetime Qᵢ(a) update; one flag disables it
    traits.py            # heritable exploration disposition + mutation
    memory.py            # stub seam — B's distorting memory plugs in here
    agent.py             # assembles the above; never mutates the world directly
  scheduler.py           # the fixed 8-step tick pipeline (synchronous)
  reproduction.py        # asexual clone-with-mutation (A2+)
  metrics.py             # §7 operational definitions + bootstrap aggregation
  logging/               # §6 observable schema + run recorder
  sim.py                 # build world, spawn founders, run, report
  cli.py                 # run / sweep / verify
config/                  # base.yaml + a1..a4 + ablations/  (NO magic numbers in code)
experiments/             # seed sweeps with cross-seed aggregation
docs/                    # ODD spec, parameter table, experimental design
tests/                   # determinism, config, environment, agent, smoke
```

## Documentation (the §8 "fully reporting" bar)

- **`docs/ODD.md`** — the ODD protocol specification (Overview, Design concepts,
  Details — Grimm/Railsback), written so a stranger could rebuild the model.
- **`docs/PARAMETERS.md`** — every constant, its value, and units. No magic numbers.
- **`docs/EXPERIMENTAL_DESIGN.md`** — per-case design, seeds, aggregation,
  controls/ablations, sensitivity, and how results tie to operational definitions.
- **`docs/DECISIONS.md`** — the §9 decision points and how each was ruled.

**Consolidated report.** `docs/Batch_A_Full_Report.pdf` stitches all of the above
— executive summary, decision record, ODD spec, parameter table, implementation
walkthrough (with live code excerpts), experimental design, results & calibration
narrative, and appendices (file tree + full config listings) — into one typeset
PDF with a table of contents. Rebuild it with:

```bash
pip install reportlab            # plus DejaVu/Liberation TTFs (system fonts)
python docs/build_report.py      # -> docs/Batch_A_Full_Report.pdf
```
