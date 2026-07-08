# Batch A — Execution Tracker

*The single source of truth across sessions. Every session: (1) read NEXT ACTION,
(2) update statuses, (3) append one line to the Handoff Log. Committed to the repo
so nothing slips between the ephemeral containers.*

**▶ NEXT ACTION: Batch B is LIVE (case B1). Next science calls, all on the pilot
evidence: (1) n≥20 confirmation on the two boundary cells the pilot re-pointed —
sweep attention slots with a DRIVE-CAPPED grief (C2 non-monotonicity: a high-drive
latch always claims a slot, so bandwidth past 1 stops mattering), and sweep latch
decay PAST the body's failure time (C3: the latch is fatal at every swept decay
because the body fails in ~65t < any swept vigil); (2) B2 attachment-to-place on
the same latch architecture (memory seam); (3) merge cadence — /batch-b shipped.
Batch A remains pinned byte-identical (test_a_pinned) with all B code present.**

Status: ☐ not started · ◐ in progress · ☑ done · ⊘ blocked

---

## Invariants — must not drift across sessions
- **Replay, never re-simulate in the browser.** Grep-able: no drain / decision rule / reproduction client-side. *(Holds: the player only draws logged frames.)*
- **Determinism:** any run reproducible from `(code, config, seed)`; separable RNG streams.
- **Cause-of-death logged from tick 1**, all cases.
- **Batch B seams preserved:** memory stub, swappable `compute_weights`, action registry.
- **Diagnostics are diagnostics:** report nulls honestly; never tune the world to rescue a result.
- **≥ 20 seeds** for any headline number; median + bootstrap CI.
- **Cap 400 is a confound.** No A1–A4 headline number is publishable until regenerated at a non-binding cap (or with cap-binding seeds flagged). Capacity for oscillating worlds is **cycle-averaged**, not single-tick. *(WO-4; RESOLVED — A4 regenerated at cap 2000×20 seeds via WO-3; report table auto-upgraded, provisional flag retired.)*
- **Visual:** structure not blur; color only where semantic (water = blue, stress/death = rust); one palette source, no color literals elsewhere. *(Player reads the site's CSS tokens at runtime — see V1 note.)*

---

## Track 1 — Science (decides what is *real*)
| ID | Task | Status | Blocked by | Unblocks |
|---|---|---|---|---|
| WO-1 | A1 freeze_learning × gradient 2×2 (§9.1) | ☑ | — | A1 framing, A1 figure, hero copy |
| WO-4 | A3 lift population cap (real capacity vs artifact) | ☑ | — | whether A2/A3 birthplace results mean anything |
| WO-2 | **DONE (180/180).** Disentangling regression overturns the pilot: **capacity** is the moderator (+0.73 CI [0.15,1.30]); volatility CI spans zero — the n=7 volatility signal was capacity in disguise. Effect small (R²=0.19). **Selection lead:** drift −0.349; freeze_learning REVERSES it (+0.237) → learning×exploration are substitutes; §9.1 resolved by evidence. ~48% seeds censored at 3000t (stated limitation). | ☑ | — | figures live; §9.1 memo evidenced |
| B1 | **DONE — pilot (104 cells, 8 seeds).** Emergent death-by-vigil 0.82 vs 0.31 matched baseline (C1✓); latch ablation → baseline (C4✓); **private-channel ablation is the signature (C5✓): hydration-martyrdom 0.33→0.04, re-routes to energy 0.78 — the mechanism is attentional SHIELDING, not grief.** Preregistered gradients MISSED honestly: bandwidth non-monotonic (C2 partial), persistence-release off-grid (C3 not supported) — both informative, drive the n≥20. Read: `docs/diagnostics/b1_pilot_read.md`. | ☑ | — | Batch B lives; B2 next |
| WO-3 | **DONE (40/40).** A4 mortality is demographic: Fano 3.75 vs A3 1.82, drawdown 0.872 vs 0.416, 6/20 extinct vs 0/20. **A3-inheritance WEAK (r≈0.13)** → A4 fragility is CREATED by non-stationarity, not inherited from world instability — answers the A4-redesign question. Doubles as the cap-2000 A4 regeneration. | ☑ | — | A4 numbers final; report auto-upgraded |

## Track 2 — Presentation infrastructure (true regardless of results)
| ID | Task | Status | Blocked by | Unblocks |
|---|---|---|---|---|
| V3-AMEND | Stable agent ids across ticks + per-agent need vectors in the data contract | ☑ | — | player trails + hover-to-inspect |
| V1 | Design tokens → styling. **CLOSED:** `design/build_css.py` generates `src/app/tokens.css` from `tokens.json` (legacy names byte-identical, semantic `--ba-*` added); globals.css imports it; drift guarded by `tests/test_design_tokens.py`; Next build green. One palette source: tokens.json → figures AND site/player. | ☑ | — | figures + player styling |
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
- **RESOLVED — (B) landed & verified (`perception.impl: vectorized`).** Batch
  perception (`perceive_all` in `agent/perception.py`) replicates the scalar scan
  element-for-element (`%size` window gathers; argmax/argmin first-occurrence
  matched to the dy-outer/dx-inner scan order and strict `>`/`<` tie-break;
  cue-strength arithmetic written char-for-char). **Bit-identical to scalar at the
  full 3000-tick horizon on all four bar cases** — `wrap_edge` (size-10 grid,
  windows straddle the seam every tick), `tie` (saturated flat-capacity plateau →
  N-way argmax ties), `rich`, `poor`. Only perception is vectorized; decision, RNG
  draws, and conflict resolution stay on the scalar reference (their conditional
  per-agent draws can't be vectorized without moving the reference). **Measured
  ~1.47× at cap 500** (grows with N); the honest ceiling is ~1.7–2×, not 10–30× —
  perception was ~43% of runtime, decision (RNG-bound, unchanged) ~31%. Reproduce:
  `python -m experiments.verify_perception --candidate vectorized --ticks 3000`.
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
| 2026-07-05 | (B) vectorized perception | Built `perceive_all` (batched, behind `perception.impl`) + hardened `verify_perception.py` (added a seam-straddling `wrap_edge` and a saturated `tie` case). **Bit-identical to scalar at full 3000 ticks on all four bar cases (wrap/tie/rich/poor).** Decision+RNG+resolution stay scalar. Measured ~1.47× at cap 500; honest ceiling ~1.7–2× (perception was 43% of runtime; RNG-bound decision unchanged). Fast path is now safe to swap in. | Run full WO-2 (20 seeds × 9 cells, cap 2000, crash-robust hazard + volatility, extended horizon) + WO-3 on `impl: vectorized`, via the checkpoint grind. Regenerate provisional A4 numbers at cap 2000. Close V1 (site CSS ← tokens.json). |
| 2026-07-06 | full-20 launch | Made `perception.impl: vectorized` the **default** (22 tests green). Rebuilt the WO-2 runner for the ephemeral container: `--impl`, `--check-complete`, per-seed volatility_cv/osc_period/end_slope/censored, and the amended **crash-robust hazard fitted INLINE** (per-agent panel consumed in memory, only scalars persisted — verified vs pilot: s0 +0.002, s2 −0.049). Checkpoint → tracked `docs/diagnostics/wo2_full20/` (experiments/results is gitignored) so it survives restarts. **Launched WO-2 full-20** via `run_wo2_grind.sh` (resume-loop + push-per-cell). Horizon kept at 3000 + censoring (extension costs grind time 1:1 here). **(B)'s 1.47× did NOT clear the restart-vs-cell-time blocker** — honest call surfaced to user; running here is attrition, a stable box would finish unattended. | **WO-3 runner does not exist — build `wo3_a4_mortality.py`.** Keep relaunching the grind after restarts. On completion: WO-2 figures, regenerate A4 at cap 2000, close V1. |
| 2026-07-06 | extended build | Full-autonomy sweep while the grind runs (sim code FROZEN mid-grind for provenance). Built: **WO-3 runner** (`wo3_a4_mortality.py` — Fano/burst/drawdown + sign-aware A3-inheritance) + chained launcher (idles until WO-2 completes; both grinds self-push). **WO-2 analyzer** (`analyze_wo2_full20.py` — the disentangling regression βₛ~z(vol)+z(cap) with seed-bootstrap CIs; CI-aware verdict). **A4 regeneration readout** (`analyze_a4_cap2000.py` — paired within-seed A3↔A4 contrast; retires provisional flag at 40/40). **Figures**: WO-2 (selection lead + moderator) and WO-3 (paired-Fano slopegraph + inheritance), registered in `viz.build` behind data gates; A1 SVG regenerated byte-identical. **V1 CLOSED** (tokens.json → tokens.css generator + drift-guard test; Next build green). **Tests 22→41+2**: field-level perceive_all≡perceive on live seam/tie worlds; every WO instrument recovers synthetic ground truth (incl. planted-sign crash-robust recovery). **Docs**: `SOA_REWRITE_PLAN.md` (deferred 10×, 5-rung verification ladder, preconditions) + `A1_LEARNING_DECISION.md` (§9.1 options; full-20 freeze_learning column decides). | Wakeup loop drives completion: at WO-2 180/180 run analyzer+figure+report headline; WO-3 auto-starts; at 40/40 run WO-3 analyzer + A4 readout + figure. Then: report regen, §9.1 call on evidence. |
| 2026-07-07 | full-20 COMPLETE | **WO-2 180/180 + WO-3 40/40 landed** (grind survived a container restart at 154/180 with zero loss — push-per-cell worked). WO-2: **capacity is the moderator** (+0.73 CI[0.15,1.30]; volatility CI spans 0 — pilot story overturned, small effect R²=0.19); **selection×learning interaction** (drift −0.349 on, +0.237 frozen, 0.0 traits-frozen) → **§9.1 resolved: learning binds in A3**; ~48% censored (horizon limitation, stated). WO-3: A4 mortality is **demographic** (Fano 3.75 vs 1.82; drawdown 0.872 vs 0.416; 6/20 vs 0/20 extinct); **inheritance weak (r≈0.13) → non-stationarity CREATES the fragility**; cap-2000 A4 extinct=0.30 (cap-400's ≈0.6 exaggerated it) — **provisional flag retired, report table auto-upgraded**. All three figures final in public/figures. | Read results together; §9.1 sign-off; horizon-extension call; merge for site publication; SoA when preconditions met. |
| 2026-07-07 | Batch B / B1 | Built Batch B on the reserved A seams (kinship, bounded-attention gate in compute_weights, grief latch) all behind default-off flags — **A streams pinned byte-identical** (test_a_pinned). Preregistered C1–C5 (BATCH_B_SPEC.md) BEFORE the sweep. Ran the 104-cell pilot: **C1 emergence ✓ (0.82 vs 0.31), C4 latch-ablation ✓, C5 private-channel ✓ (thirst 0.33→0.04, re-routes to energy — martyrdom is attentional shielding).** C2 non-monotonic + C3 off-grid, reported as honest misses that re-point the n≥20. Site: nav→"Batches", BatchSwitcher, /batch-b page (B1 replay + phase figure), spec + results read. 55 tests green; merged to main. | n≥20 on the two re-pointed boundary questions; B2 attachment-to-place. |
