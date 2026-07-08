# Struct-of-Arrays rewrite plan — the deferred 10×

*Status: DESIGN ONLY. Do not start while any headline run is in flight or
unreplicated. This document exists so the rewrite is done once, safely, instead
of improvised under compute pressure.*

## Why it's deferred (the decision on record)

(B) vectorized perception bit-identically and delivered ~1.5× — the honest
ceiling of *reference-preserving* optimization, because the remaining time is
Python-object overhead spread across every seam: per-agent `Agent`/`NeedVector`/
`QLearner` objects, dict-of-cues `Perception` records, `config.__getattr__` chains
(3.9M calls/400 ticks), and the per-agent conditional RNG draws in `decide()`.
None of that vectorizes without changing *what is computed in what order* — i.e.
without moving the trusted reference. Moving the reference right before (or
during) a headline run means re-earning correctness on the thing being measured.
That trade was rejected on 2026-07-06; this plan is the payment schedule.

## What the rewrite is

One `Population` object owning parallel arrays; agents become row indices.

| today (AoS) | after (SoA) |
|---|---|
| `Agent.x, Agent.y` | `pop.xy[i]  (int64 [N,2])` |
| `NeedVector` per agent | `pop.needs [N, K] float64` (K fixed per config) |
| `Traits` object | `pop.traits [N, T]` |
| `QLearner` dict | `pop.q [N, needs, actions] float64` |
| `Perception` dataclass + cue dict | `perc.* [N, ...]` arrays (already half-built in `perceive_all`) |
| `decisions: dict[id, Decision]` | `act [N] int8` + `dxdy [N,2]` + `target [N] int8` |
| scheduler loops (drains, learning, deaths) | masked array ops |

The tick pipeline (§4 order) is unchanged; each step becomes one masked pass.

## The two things that CANNOT be preserved bit-for-bit — and the policy

1. **RNG stream order.** `decide()` draws 1–3 variates per agent *conditionally*
   (ε-explore, step-noise, zero-step reroll). Any batched draw strategy
   (pre-drawing N variates per tick, or counter-based RNG keyed on
   `(seed, tick, agent_id, purpose)`) changes the consumption order of
   `rng.agent`. **Policy: adopt counter-based keying** — Philox
   (`np.random.Generator(np.random.Philox(key=...))` per (tick, purpose) or
   `SeedSequence.spawn` per agent-tick) so draws become *order-independent* and
   the new stream is *documented as a new reference* (call it **R2**).
2. **Conflict resolution grouping.** `_resolve_consumable` shuffles claimants
   per tile via `rng.agent.permutation`; same issue, same fix (key the
   permutation on `(seed, tick, tile)`).

Everything else (perception, utilities, drains, learning updates, argmax with
first-max tie-break via `np.argmax`) CAN be preserved exactly, and must be.

## Verification ladder (each rung gates the next)

1. **Freeze R1.** Tag the current scalar implementation + `verify_perception`
   hashes for the 4 bar cases as `reference-r1`. Archive the 20-seed WO-2/WO-3
   checkpoints produced on R1 — these are the scientific anchor.
2. **Component identity (bit-level).** Port perception → already proven. Port
   decision *utilities* (not the draw): for fixed RNG outcomes injected from a
   recorded R1 trace, batched utilities/argmax must equal R1's per-agent values
   bitwise across the 4 bar cases × 200 ticks. Same for drains, learning,
   deaths, reproduction eligibility.
3. **Trace-replay equivalence.** Run R1 recording every RNG variate consumed
   (tiny shim on `RNGStreams`); replay those variates into the SoA engine —
   full 3000-tick stream must be bit-identical on all 4 bar cases. This proves
   the ONLY difference between R1 and R2 is RNG keying.
4. **Distributional equivalence R1 vs R2** (new RNG, same physics): ≥40 seeds
   per case; two-sample tests on the headline set — survival curves (log-rank),
   R_s, volatility, extinct fraction, trait drift, hazard βₛ. Pre-register
   tolerance: no metric shifts by more than its own R1 seed-to-seed IQR, and
   signs/orderings of every published result must hold.
5. **Replication of the published table.** Re-run WO-1/WO-2/WO-3 endpoints on
   R2 at full spec; every published number must land inside its R1 bootstrap CI.
   Publish both columns in the appendix (R1 anchor, R2 fast path).

## Expected payoff & cost

- Perception+decision+drains+learning become ~O(N) NumPy: projected **8–20×**
  at N≈2000 (decide's 3.9s Python tottime → ~0.1s; object/attr overhead gone).
- Cost estimate: the port is a week-scale project plus rungs 2–5; rung 5 is the
  expensive one and is exactly why this waits until the current result set is
  closed and archived.

## Preconditions checklist (all must be true before starting)

- [ ] WO-2 (180 cells) + WO-3 (40 cells) complete, analyzed, published.
- [ ] A4 regenerated at cap 2000; provisional flag retired.
- [ ] `reference-r1` tag + archived checkpoints pushed.
- [ ] A stable machine for rungs 4–5 (≥80 full-spec runs; not the ephemeral box).
- [ ] Batch B requirements reviewed — SoA layout must leave the B seams
      (memory hook, swappable `compute_weights`, action registry) intact.
