# Batch A — Execution Tracker

*The single source of truth across sessions. Every session: (1) read NEXT ACTION,
(2) update statuses, (3) append one line to the Handoff Log. Committed to the repo
so nothing slips between the ephemeral containers.*

**▶ NEXT ACTION: run WO-4 (A3 lift population cap — real capacity vs. artifact).**
WO-1 is done (see below). WO-4 is next on the science critical path and gates
whether the A2/A3 birthplace results (WO-2) mean anything.

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
| WO-4 | A3 lift population cap (real capacity vs artifact) | ☐ | — | whether A2/A3 birthplace results mean anything |
| WO-2 | A2/A3 birthplace × trait sweep, 3 conditions × 3 ablations, ≥20 seeds | ☐ | read *after* WO-4 | the headline result; WO-2 figures |
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

## Critical path
Science: **WO-1 ✓ → WO-4 → WO-2 → WO-3.**
Infra: V3-AMEND ✓ → V1 ◐ → V3 ✓ → PLAYER ✓ → SKELETON ✓. Remaining infra: finish V1 (`tokens.json`) with V2-MACH.

## Open decisions (awaiting your ruling)
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
