# §9.1 decision memo — what to do about A1's inert learning

*Status: EVIDENCE IN — the full-20's freeze_learning column has landed and it is
decisive (see "Resolution evidence" below). Decision owner: you; the memo's
recommendation is now grounded rather than provisional.*

## Resolution evidence (WO-2 full-20, 2026-07-06)

**Learning is NOT decorative in A3 — freezing it reverses the direction of
selection on exploration.** Survivor−founder trait drift, median across seeds,
stable in every spawn condition:

| ablation | trait drift (median) | reading |
|---|---|---|
| none | **−0.349** | with learning ON, exploration is selected DOWN hard |
| freeze_learning | **+0.237** | with learning OFF, exploration is selected UP |
| freeze_traits | 0.0 | mechanical zero (no variation to select on) — instrument validates |

Learning and heritable exploration are **substitutes**: when agents can learn,
wandering is a cost and conservatives win; when they cannot, exploration is the
only adaptation channel left and it becomes what selection favours. This is
exactly the interaction case the decision record anticipated ("if neither
channel alone reproduces a result, that result is an interaction — reported as
such").

**Consequence for §9.1: option (a) is now evidenced, not just default.** A1's
learning is inert *because A1's world is too simple to make it bind* (WO-1),
and it demonstrably binds once the world is rich enough (A3). The published
framing — "A1 = reactive baseline; learning is substrate" — stands with data
behind it. (b1) discoverable-value remains attractive as a *Batch B* experiment,
not an A1 retrofit. (b2)/(b3) are off the table.

## The finding (WO-1, settled)

Freezing learning changes A1 survival by **zero** (rows identical); removing the
moisture gradient collapses it (columns differ). Mechanistically: the Q-value
`learned_gain` multiplies a perceptual affordance that is already sufficient to
drive correct behavior — drinking when thirsty on water needs no learning, and
gradient-following is hard-wired in perception (`_gradient_cue`), not learned.
A1's learning adjusts the *magnitude* of utilities whose *argmax* is already
right. It is decorative for survival in A1's world.

## Why this matters beyond A1

- Batch B's mechanisms (distorting memory, attachment) are supposed to act
  *through* valuation. If valuation is decorative at baseline, B's effects risk
  being decorative too — or worse, only measurable through the same inert channel.
- The published A1 framing must not imply "the agent learns to survive."
  (Current published framing — "A1 = reactive baseline / scripted
  gradient-following" — is already honest on this.)

## Options

**(a) Accept: A1 is the reactive baseline; learning is substrate, not result.**
  - Cheapest; already the published framing; WO-1 stands as the evidence.
  - Learning must then *earn its keep in A2–A4*: the freeze_learning ablation in
    the WO-2 grid is the direct test. **The full-20 decides this** — if
    `freeze_learning` cells show no survival/selection difference from `none`
    in A3 either, learning is decorative everywhere in Batch A, and (a) hardens
    into "Batch A agents do not need to learn; Batch B introduces the first
    load-bearing valuation."
  - Risk: a reviewer asks why a learning mechanism exists that never binds.

**(b) Give A1 a survival-relevant learnable.** Candidates, least→most invasive:
  1. **Learned consummatory value**: two visually-identical water classes, one
     brackish (half gain). Value must be discovered by drinking. Learning then
     binds directly to intake efficiency. (New entity flag + affordance lookup;
     ~day of work; leaves A2–A4 untouched if gated to A1 variant config.)
  2. **Learned navigation**: replace the hard-wired gradient cue with a
     cue whose gain must be calibrated by experience (Q on "follow moisture").
     Makes the WO-1 2×2 genuinely 2×2. (Touches perception/decision seam; medium.)
  3. **Drop learning from A1 entirely** and introduce it in A2 with (b1)-style
     discoverable value. Cleanest narrative ("mechanisms enter when they can
     bind") but rewrites the batch structure.

## Evidence still to come (free — already in the grind)

The WO-2 `freeze_learning` ablation × 20 seeds is running now. Read it before
deciding: if learning is inert in A3 too, (a)-hardened or (b3) are the honest
choices and (b1)/(b2) become Batch-B-adjacent work. If learning DOES move A3
survival/selection, (a) is fully defensible as published: "learning binds once
the world is rich enough to have something to learn."

## Recommendation

Hold the call until the full-20's `freeze_learning` column is read (days, not
weeks). Default to **(a)**, upgraded by that evidence; put **(b1)** on the
Batch B runway as the first load-bearing valuation experiment rather than a
retrofit to A1. Do not pick (b2)/(b3) unless the ablation shows learning inert
across ALL of Batch A — only then is the mechanism's existence indefensible
as shipped.
