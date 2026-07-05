# Batch A — Execution Tracker

*The single source of truth across sessions. Every session: (1) read NEXT ACTION,
(2) update statuses, (3) append one line to the Handoff Log. Committed to the repo
so nothing slips between the ephemeral containers.*

**▶ NEXT ACTION: run amended WO-2 (cap 2000, ≥20 seeds, within-world βₛ~Rₛ
design); run amended WO-3 (cap 2000, A3-inheritance check) in parallel.** WO-1
and WO-4 done; cap ruling resolved (= 2000). See `docs/WO2_WO3_AMENDMENT.md`.
Compute is the constraint — see the runtime note in that doc / below.

Status: ☐ not started · ◐ in progress · ☑ done · ⊘ blocked

---

## Invariants — must not drift across sessions
- **Replay, never re-simulate in the browser.** Grep-able: no drain / decision rule / reproduction client-side. *(Holds: the player only draws logged frames.)*
- **Determinism:** any run reproducible from `(code, config, seed)`; separable RNG streams.
- **Cause-of-death logged from tick 1**, all cases.
- **Batch B seams preserved:** memory stub, swappable `compute_weights`, action registry.
- **Diagnostics are diagnostics:** report nulls honestly; never tune the world to rescue a result.
- **≥ 20 seeds** for any headline number; median + bootstrap CI.
- **Cap 400 is a confound.** No A1–A4 headline number is publishable until regenerated at a non-binding cap (or with cap-binding seeds flagged). Capacity for oscillating worlds is **cycle-averaged**, not single-tick. *(WO-4; A4 site/report numbers currently marked provisional.)*
- **Visual:** structure not blur; color only where semantic (water = blue, stress/death = rust); one palette source, no color literals elsewhere. *(Player reads the site's CSS tokens at runtime — see V1 note.)*

---

## Track 1 — Science (decides what is *real*)
| ID | Task | Status | Blocked by | Unblocks |
|---|---|---|---|---|
| WO-1 | A1 freeze_learning × gradient 2×2 (§9.1) | ☑ | — | A1 framing, A1 figure, hero copy |
| WO-4 | A3 lift population cap (real capacity vs artifact) | ☑ | — | whether A2/A3 birthplace results mean anything |
| WO-2 | **Amended²:** cap 2000, ≥20 seeds; **crash-robust stable-tick hazard** is primary βₛ (raw demoted); moderator is **volatility** not R_s (pilot r=0.81); **selection promoted to lead**. | ☐ | (B) for compute | the headline result; WO-2 figures |
| WO-3 | **Amended:** cap 2000, deaths-by-cause + A3-inheritance check | ☐ | — | individual vs demographic fragility; A4 redesign call |

## Track 2 — Presentation infrastructure (true regardless of results)
| ID | Task | Status | Blocked by | Unblocks |
|---|---|---|---|---|
| V3-AMEND | Stable agent ids across ticks + per-agent need vectors in the data contract | ☑ | — | player trails + hover-to-inspect |
| V1 | Design tokens → styling. `design/tokens.json` now canonical + read by figures. **Remaining:** site CSS should derive FROM it (one source). | ◐ | — | figures + player styling |
| V3 | Playback exporter (`viz/export_playback.py`) + indexed-frame loader | ☑ | V3-AMEND | the player |
| PLAYER | Build the approved `<SimPlayer>` (locked aesthetic spec) | ☑ | V1, V3 | walking skeleton |
| SKELETON | Export a real A1 run → wire player → a real A1 plate renders | ☑ | V1, V3, PLAYER | proves sim→log→export→replay end-to-end |
| V2-MACH | Figure-pipeline machinery (`design/tokens.json` + `viz/style.py` + `viz/build.py`) | ☑ | — | figures (content deferred) |

**Track-2 note (reconciliation).** The walking skeleton is built and shipped: the
`/batch-a` page replays real logged A1–A4 runs (schema-v2 playback: stable ids,
need vectors, traits, age, per-tick predators, birth/death events; light manifest
+ streamed frames), with the locked ink-on-paper plate, the population-trace-as-
timeline, hover-inspect, layer toggles, keyboard, and reduced-motion. **V1 is only
partial:** the player pulls colors from the site's existing CSS tokens
(`--teal`/`--insurgent`/`--ivory`/`--ink`) at runtime (no color literals in the
player) rather than a standalone `tokens.json`, because the brief was to build in
the site's own system. A canonical `tokens.json` + `viz/style.py` is still needed
for the **Python figure pipeline** (V2-MACH) so figures and player share one source.

**Do NOT start yet** (depend on Track 1 outcomes): WO-V2 *final figure content* · WO-V5 *site narrative & composition*.

---

## WO-1 result (§9.1) — A1 is scripted gradient-following, not learning

2×2, 20 seeds/cell, single-agent A1, 1500-tick horizon. `gradient off` =
`fields.moisture.enabled: false` (water still present, but no gradient cue).
`learning frozen` = `learning.enabled: false`.

| | gradient ON | gradient OFF |
|---|---|---|
| **learning ON** | 100% survive · median 1500 [1500,1500] | 20% survive · median 100 [100,100] |
| **learning FROZEN** | 100% survive · median 1500 [1500,1500] | 20% survive · median 100 [100,100] |

**Reading.** Freezing learning changes survival by **exactly zero** in both
gradient conditions; removing the gradient collapses survival to 20% (death by
thirst ≈ tick 100). So **all** of A1's survival is the scripted moisture-gradient
policy; within-lifetime learning (Q-gain updates on consummatory actions) is
**inert for survival**. This is an honest null.

**Consequences (now actionable):**
- A1 framing / hero copy must **not** claim the agent "learns to survive." (This
  retroactively justifies removing the earlier "learning, not luck" copy.)
- Raw data: `docs/diagnostics/wo1_a1_summary.json`, `docs/diagnostics/wo1_a1_runs.csv`.
  Reproduce: `python -m experiments.wo1_a1_diagnostic --seeds 0-19`.

---

## WO-4 result — cap 400 binds everywhere; true capacity is higher and seed-dependent

A3, caps 400 / 800 / 1500, 5 seeds each, 1500 ticks, `stop_on_extinction: false`.
steady = median per-tick pop over the last 40%; saturation = steady / cap.

| cap | steady (median) [CI] | saturation | per-seed steady |
|-----|----------------------|-----------|-----------------|
| 400 | 400 [389, 400] | **1.00** | 400, 400, 400, 400, 389 |
| 800 | 769 [421, 800] | 0.96 | 800, 769, 515, 800, 421 |
| 1500 | 794 [412, 1500] | 0.53 | 1500, 794, 515, 1500, 412 |

**Reading (bimodal, not a clean verdict):**
- **At cap 400 every world saturates the cap** — so 400 (the default used in *all*
  prior A1–A4 runs) is a **binding ceiling**, not a resource limit. In that sense
  A3-at-400 is ceiling-limited ("too easy" for real resource competition).
- **Carrying capacity is a per-world property.** The *same seeds* behave
  consistently across caps: seed 2 plateaus ≈515 whether cap is 800 or 1500
  (resource-poor world); seeds 0 & 3 fill whatever cap you set (400→800→1500,
  resource-rich). So true capacity ranges from ~500 to ≥1500 depending on the
  procedural water/vegetation layout.
- Some cap-1500 runs were **still climbing** at t=1500 (seed 1 end-slope +44) →
  rich-world capacity may be even higher / needs a longer horizon. Some worlds
  **boom-bust** (seed 4: peak 927 → 412) even though A3 is stationary.

**Caveats:** n=5 (below the 20-seed bar) and the outcome is high-variance/bimodal,
so the capacity *distribution* needs ≥20 seeds to characterize. Raw:
`docs/diagnostics/wo4_a3_cap_{summary.json,runs.csv}`; reproduce
`python -m experiments.wo4_a3_cap --caps 400,800,1500 --seeds 0-4`.

**Consequence for WO-2:** at cap 400 the population is set by the ceiling, so
birthplace/trait advantage is muted (everyone just fills a low ceiling → weak
selection). WO-2 should use a cap high enough not to bind — but then capacity
varies wildly by seed and must be controlled/reported. **Cap choice is a ruling
(see Open decisions).**

## Critical path
Science: **WO-1 ✓ → WO-4 ✓ → WO-2 (blocked on cap ruling) → WO-3.**
Infra: V3-AMEND ✓ → V1 ◐ → V3 ✓ → PLAYER ✓ → SKELETON ✓. Remaining infra: finish V1 (`tokens.json`) with V2-MACH.

## Open decisions
- **COMPUTE — RESOLVED: do (A) *and* (B); they solve different problems.** One
  cap-2000 / 3000-tick A3 run = **415 s**; full WO-2 ≈ 10–12 h, WO-3 ≈ 2–3 h.
  - **(A) = trusted numbers now.** Run the amended WO-2/WO-3 on the current
    (trusted scalar) implementation, checkpointed. In-container this is a
    stop/start grind (relaunch after each restart; checkpoint resumes). Zero
    correctness risk. Started as a βₛ~Rₛ **pilot** (uniform × none × 8 seeds).
  - **(B) = the fast path, as infrastructure.** Vectorize the perception hot path
    (~10–30×). Needed regardless of container — every large-N run (WO-2/3,
    A4-regen, all Batch B memory/attention sweeps) depends on it. Build it, then
    **diff it against (A)'s reference runs** (a real trusted reference, not a
    smoke test).
  - **Verification bar for (B) — no-regression, not correctness.** Bit-identity
    proves "no regression from current behavior," NOT that the science is
    correct: scalar & vectorized descend from the same source and can agree while
    both wrong. A green diff must never be read as validating the model. Prove
    **bit-identical full tick stream** across boundary-stressing cases at the
    **full 3000-tick horizon** (divergence is cumulative): toroidal wraps, edge
    agents, argmax tie-breaking, on **both a rich and a poor world**. Harness:
    `experiments/verify_perception.py`.
  - **Pilot policy:** read early seeds as they land; if βₛ~Rₛ is huge and clean,
    that informs whether 20 is confirmatory — a call made *after* data, never a
    pre-emptive spec cut. (C) reduce-spec stays rejected.
- **RESOLVED — WO-2 measurement (crash-robust pilot).** Primary estimator =
  stable-tick mortality hazard (grouped Poisson, agent-clustered; Cox-on-age
  cross-check agrees); raw βₛ → sensitivity. Moderator = **volatility** (pilot
  βₛ~volatility r=0.81) not mean capacity (r=−0.23); log per-seed volatility +
  oscillation period in the full 20 and disentangle from R_s. **Selection is the
  lead result** (conservative wins; seed 2 flips under scarcity). Stable-epoch +
  volatility instrument is shared with WO-3 (A3-inheritance). Read:
  `docs/diagnostics/wo2_crashrobust_read.md`.
- **RESOLVED — collinearity gate = SEPARABLE.** corr(R_s, volatility) = −0.28 on
  the 7 pilot worlds, with 3 off-diagonal disentanglers (s2 stable-poor, s5
  volatile-rich, s6). The generator already breaks the capacity↔volatility
  diagonal, so the full-20 (crash-robust hazard + volatility logged) can separate
  βₛ~volatility from βₛ~R_s — **no volatility-at-fixed-capacity axis needed.**
  Plot: `docs/diagnostics/wo2_collinearity_plane.svg`.
- **NEW — full-20 horizon:** extend past 3000 ticks so climbing/crashing worlds
  converge (censored seeds; affordable once B lands). Revisit at run time.
- **RESOLVED — WO-2 cap = 2000, within-world design** (WO-2/WO-3 amendment). The
  standalone 20-seed WO-4 re-run is folded into WO-2 (per-seed capacity is a
  byproduct). WO-3 also runs at cap 2000 with the A3-inheritance check.
- **NEW FLAG — A4 numbers provisional.** The A4 contrast on the site/report is
  cap-confounded; mark "provisional" until regenerated at the raised cap.
- **§9.1 model call (raised by WO-1):** A1's learning mechanism is decorative for
  survival. Options: (a) accept "A1 = scripted gradient-following" as the framing
  (learning is a substrate for later cases, not an A1 result); or (b) give A1 a
  learning mechanism that affects a survival-relevant quantity (e.g. learned
  navigation, or a task where consummatory value must be discovered). → your call.
- **Trace-as-timeline:** implemented as the default — the population trace **is**
  the scrubber (per the locked player spec). Resolved unless you want the fallback.
- **A4 redesign:** pending WO-3 (is A4 fragility demographic / synchronized crashes?).

## Source documents
Batch A ODD spec · four diagnostic work orders (WO-1–4) · visualization work
orders (WO-V1–5) · player build spec (locked aesthetic) · this tracker.

---

## Handoff Log (append one line per session)
| Date | Session | What changed | Next pickup |
|---|---|---|---|
| — | planning | Specs + diagnostics + viz work orders + approved player aesthetic authored. Nothing executed yet. | Run WO-1; start V3-AMEND. |
| 2026-06-28 | build | Built + shipped the walking skeleton and beyond: sim (A1–A4), schema-v2 playback exporter, locked-aesthetic `<SimPlayer>` with trace-as-timeline, all four plates live on `/batch-a` (V3-AMEND/V3/PLAYER/SKELETON done). Stripped page copy to labels + key. | Run WO-1. |
| 2026-06-28 | wo-1 | Ran WO-1 (A1 2×2, 20 seeds): **A1 is scripted gradient-following; learning is inert for survival** (§9.1 answered). Committed diagnostic + results + this tracker. | Run WO-4 (A3 cap). |
| 2026-06-28 | wo-4 | Ran WO-4 (A3 caps 400/800/1500, 5 seeds): **cap 400 binds every world; true capacity is seed-dependent (~500 to ≥1500)**. Bimodal — some worlds fill any cap, others plateau. WO-2 blocked on a cap ruling; recommend re-running WO-4 at ≥20 seeds. | Get WO-2 cap ruling; WO-3 can run in parallel. |
| 2026-06-28 | amend | WO-2/WO-3 amendment applied: cap 400 declared a global confound; WO-2 → cap 2000 + within-world βₛ~Rₛ (absorbs 20-seed capacity); WO-3 → cap 2000 + A3-inheritance check, parallel; A4 numbers marked provisional. Saved `docs/WO2_WO3_AMENDMENT.md`. | Run amended WO-2 + WO-3 (compute-bound; checkpointed runners). |
| 2026-06-28 | wo-2 setup | Built + pipeline-validated the checkpointed WO-2 runner (within-world βₛ~Rₛ, ablation decomp) and per-tick deaths-by-cause instrumentation for WO-3. **Compute blocker found:** cap-2000/3000t run = 415 s; full WO-2 ≈ 10–12 h and the container restarts faster than one run finishes → can't complete here. Smoke test (cap 400, below-spec) already shows the predicted negative βₛ~capacity slope. | DECISION NEEDED: run on a stable box, or vectorize perception (~10–30×). |
| 2026-07-05 | a1 figure | A1 figure + figure pipeline (**V2-MACH**) built on settled WO-1 data; `design/tokens.json` now canonical (deterministic SVG + token-swap verified). A1 logbook entry (reactive baseline). **First published section (A1) standing** = plate + figure + logbook; merged to main (PR #18). | Land (B); keep pilot grinding. |
| 2026-07-05 | collinearity | Collinearity check (existing 7 worlds): **SEPARABLE** — corr(R_s,vol)=−0.28, 3 off-diagonal disentanglers (s2 stable-poor, s5 volatile-rich, s6). Full-20 as amended can separate volatility from capacity; no regen/drain axis needed. | Land (B); then full 20 (crash-robust hazard + volatility + extended horizon). |
| 2026-07-05 | crashrobust | Built the crash-robust estimator (stable-tick hazard + Cox cross-check + cycle-avg Rₛ + volatility), validated on the existing pilot (no new compute). **Passes its own no-regression test (7/7);** birthplace hazard tracks **volatility (r=0.81), not capacity (−0.23)** — deeper finding; effect small → **selection leads WO-2**. seed 2 contradiction confirmed real. Amended WO-2 measurement + promoted selection + shared instrument for WO-3. | Land (B); run full 20 with crash-robust hazard + volatility + extended horizon. |
| 2026-07-05 | wo-2 pilot | WO-2 pilot COMPLETE (uniform×none, 8 seeds). βₛ~R_s: r=−0.35 (predicted sign) only after dropping crash/climb-flagged seeds, but **weak & noisy → full 20 warranted** (not "huge & clean"). Strong clean signal instead: **exploration selected down** (trait drift mean −0.33, 7/8 worlds), plausibly scarcity-dependent (poorest seed flips). Durable record: `docs/diagnostics/wo2_pilot_uniform_none_8seed.jsonl`. | Await go-ahead on (B) vectorization; then full WO-2 (20 seeds × 9 cells) + WO-3. |
