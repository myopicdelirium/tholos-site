# Batch A — Execution Tracker

*The single source of truth across sessions. Every session: (1) read NEXT ACTION,
(2) update statuses, (3) append one line to the Handoff Log. Committed to the repo
so nothing slips between the ephemeral containers.*

**▶ NEXT ACTION: ruling needed — pick the WO-2 cap (see WO-4 result).** WO-1 and
WO-4 are done. WO-4 found the default cap of 400 binds in every world, so WO-2's
cap choice must be settled before it can mean anything. WO-3 (A4 deaths-by-cause)
is independent and can run in parallel.

Status: ☐ not started · ◐ in progress · ☑ done · ⊘ blocked

---

## Invariants — must not drift across sessions
- **Replay, never re-simulate in the browser.** Grep-able: no drain / decision rule / reproduction client-side. *(Holds: the player only draws logged frames.)*
- **Determinism:** any run reproducible from `(code, config, seed)`; separable RNG streams.
- **Cause-of-death logged from tick 1**, all cases.
- **Batch B seams preserved:** memory stub, swappable `compute_weights`, action registry.
- **Diagnostics are diagnostics:** report nulls honestly; never tune the world to rescue a result.
- **≥ 20 seeds** for any headline number; median + bootstrap CI.
- **Visual:** structure not blur; color only where semantic (water = blue, stress/death = rust); one palette source, no color literals elsewhere. *(Player reads the site's CSS tokens at runtime — see V1 note.)*

---

## Track 1 — Science (decides what is *real*)
| ID | Task | Status | Blocked by | Unblocks |
|---|---|---|---|---|
| WO-1 | A1 freeze_learning × gradient 2×2 (§9.1) | ☑ | — | A1 framing, A1 figure, hero copy |
| WO-4 | A3 lift population cap (real capacity vs artifact) | ☑ | — | whether A2/A3 birthplace results mean anything |
| WO-2 | A2/A3 birthplace × trait sweep, 3 conditions × 3 ablations, ≥20 seeds | ⊘ | cap ruling (WO-4) | the headline result; WO-2 figures |
| WO-3 | A4 deaths-by-cause (individual vs demographic fragility) | ☐ | — | whether Batch B can address A4 / A4 redesign call |

## Track 2 — Presentation infrastructure (true regardless of results)
| ID | Task | Status | Blocked by | Unblocks |
|---|---|---|---|---|
| V3-AMEND | Stable agent ids across ticks + per-agent need vectors in the data contract | ☑ | — | player trails + hover-to-inspect |
| V1 | Design tokens → styling (see note) | ◐ | — | figures + player styling |
| V3 | Playback exporter (`viz/export_playback.py`) + indexed-frame loader | ☑ | V3-AMEND | the player |
| PLAYER | Build the approved `<SimPlayer>` (locked aesthetic spec) | ☑ | V1, V3 | walking skeleton |
| SKELETON | Export a real A1 run → wire player → a real A1 plate renders | ☑ | V1, V3, PLAYER | proves sim→log→export→replay end-to-end |
| V2-MACH | Figure-pipeline machinery (style + build target) | ☐ | V1 | figures (content deferred) |

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

## Open decisions (awaiting your ruling)
- **WO-2 cap (raised by WO-4):** cap 400 binds every world; true capacity is
  seed-variable (~500 to ≥1500). Options for WO-2: (a) uncap / very high cap so
  resources set the population (real competition, but capacity varies by seed —
  control by reporting per-seed capacity or by conditioning on it); (b) hold a
  fixed high cap (e.g. 1500) and accept the boom/plateau variance; (c) keep 400
  and reinterpret WO-2 as ceiling-replacement dynamics (weaker selection claim).
  → your call. Also: re-run WO-4 at ≥20 seeds to characterize the capacity
  distribution before committing.
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
