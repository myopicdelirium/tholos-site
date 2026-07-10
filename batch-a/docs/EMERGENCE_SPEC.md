# Case C2 — The Evolved Invisible Hand (specification & preregistration)

*The coordination case, rebuilt as what it should have been: the crowd-response is
not written into the decision rule — it is a disposition that must EVOLVE from a
base sense, or be reported as never evolving. Written before the runs. The
first-class outcome this model is built to make possible is that coordination DOES
NOT emerge.*

---

## 0. The trap this document exists to avoid

Case C1 installed the answer. `food ÷ (1 + k·density)` is the Ideal Free
Distribution's equilibrium condition transcribed into the agent's movement rule:
the agent does not discover that crowds dilute reward, it is told, and it obeys.
A coordinated distribution then "emerges" the way a photograph of a sunset emerges
from a photograph of a sunset. It proves nothing about whether self-interested
agents *can* find that equilibrium — only that we can write it down.

> **Governing rule of this case: no term referring to crowds, competitors, or
> density may appear in the decision rule. The agent is given senses and a
> heritable disposition initialized BLIND (no crowd-response). Whether the
> disposition rises, and whether coordination rises with it, is decided by the
> ecology and selection — never by us. A world in which it does NOT emerge must
> be reachable and must be reported.**

This is the C1 analogue of `test_a_pinned`: the pin here is that the behaviour is
selected, not authored.

## 1. Senses, not rules (the principle)

Behaviour must be *developed through senses*, not written in. The agent already
has the two base signals it needs, and neither is a competitor-detector:

  * **perceived food** — `perception.food_here` / the energy cue: what the ground
    at a location *looks* worth (read at the start of the tick, before anyone acts).
  * **realized intake** — `agent.last_intake` / `memory.intake_ema`: what the
    ground *actually* gave after the tick resolved.

The derived sense is their ratio — **foraging efficiency**, `realized ÷ perceived`
— integrated over recent experience. It is a domain-general interoceptive signal:
*"am I getting what this place promised?"* It falls when a spot is contested,
depleted, deceptive, or out of season. Crowding is merely the cause that dominates
here (water is ample, no seasonality, no predators), so a low-efficiency signal is,
in this ecology, the shadow of competition — but the agent never represents
"competitor" or "density." It has prediction error, nothing more. This is the
prediction-error the `QLearner` already runs on, surfaced as a sense.

## 2. The heritable disposition (on the reserved trait seam)

One new heritable trait, `contest_response` ∈ [0, C_max], extends `Traits`
exactly as `exploration` does — sampled at founding, asexual clone-with-mutation
on inheritance (`traits.inherit`), gaussian mutation. **Founders start blind:**
`init_mean = 0` with small `init_sd`, so the disposition exists only as variance
for selection to act on. There is no other change to the decision.

Its single effect: when active, an agent dampens its pull toward *visible* food in
proportion to `contest_response × (1 − efficiency)` — i.e. the more a place has
been paying below what it looked worth, the more an agent so disposed disengages
and lets its other drives (exploration, other needs) carry it elsewhere. At
`contest_response = 0` this is byte-identical to the greedy agent (and to Batch A);
nothing crowd-specific is written — the term is (own perceived food) vs (own
realized intake), both base senses.

**Selection, not authorship, closes the loop.** Vegetation depletes, so contested
ground genuinely underpays; a lineage whose mutated disposition reads that and
relocates eats more, survives more, reproduces more. The disposition climbs — or,
where the gap never opens, drifts on mutation noise and nothing emerges.

Everything ships behind a config flag, default off. **Batch A stays byte-
identical**: when the trait is disabled, no extra RNG draw is taken in
founding/inheritance and the decision path is untouched (extend `test_a_pinned`).

## 3. The measurement that IS the commentary

Not "coordination exists." The claim is that a coordinated distribution *assembles
itself out of prediction-error sensitivity under selection*, and can fail to:

  * **disposition trajectory** — population-mean `contest_response` vs evolutionary
    time (generations). Does it rise from 0, and to what value?
  * **coordination trajectory** — matching correlation r (occupancy ~ productivity)
    and payoff CV, over the SAME time. The finding is the *joint* rise: r climbs
    as, and only as, the disposition climbs — the invisible hand assembling.
  * **the null run beside it** — the same plot for the abundant-resource world,
    where neither should move.
  * **selection-off control** — mutation frozen at the blind value: coordination
    must NOT appear, isolating selection (not within-life dynamics) as the cause.

## 4. Preregistered claims (the runs decide; nulls reported honestly)

Sweep axes: resource regime (ubiquitous ↔ patchy-and-depletable), and
selection on/off (mutation vs frozen-blind).

- **C2.0 (the null, must be reachable).** In the abundant/ubiquitous-resource
  world the efficiency gap never opens; `contest_response` drifts, matching r
  stays near its greedy baseline, no coordination emerges. *If coordination
  emerges here, the signal is an artefact — stop and report void.*
- **C2.1 (emergence under scarcity).** In the patchy, depletable world the
  population-mean disposition rises from its blind start and matching r rises with
  it — coordination assembled by selection, no crowd rule anywhere.
- **C2.2 (selection is the cause).** With mutation frozen at blind, coordination
  does not emerge even under scarcity — the rise in C2.1 is selection, not
  within-life learning or geometry.
- **C2.3 (an ESS, not a summit).** Because the advantage of reading crowds shrinks
  as more of the flock reads them (frequency dependence), the disposition settles
  at an intermediate stable value and coordination is partial (undermatching),
  reported as such. A perfect optimum is not expected and its absence is not a
  failure.
- **C2.4 (derived, not gifted).** Remove the efficiency sense (the agent cannot
  compare perceived to realized) and emergence fails under scarcity — proving the
  behaviour is derived from that base sense, and that the model contains no
  competitor-counter to fall back on.

**Falsifiers.** C2.0 emerging voids the model. C2.1 failing (disposition never
rises, or r flat while it rises) means selection cannot find the equilibrium in
this substrate — a real, publishable negative result about the limits of the
invisible hand, not a bug to paper over. C2.2 failing (coordination with selection
off) means something other than selection is doing the work. C2.4 failing means
the behaviour was not derived from the base sense after all.

## 5. What this is not

Not altruism, not morality, not a social force, not a planner. No agent ever
sacrifices for another or is restrained by a norm; `contest_response` makes an
agent forage its OWN interest more accurately, and any fairness in the resulting
distribution is an unpaid by-product — the same cold result as C1, but now the
precondition for it is evolved rather than authored. The altruistic agent (one
that reads another's need and gives up its own payoff) is a separate, later build;
this case is the honest floor it must be measured against.

## 6. Build order (falsifiability first, as Batch A was pinned)

1. Extend `test_a_pinned` to the disabled trait — prove A unmoved (no extra RNG draw).
2. Add the efficiency sense (`memory`) and the `contest_response` trait +
   its single decision effect, behind the flag.
3. Build the **C2.0 null harness first**: the abundant world, selection on;
   show the disposition drifts and no coordination emerges, before any positive
   run can be called a finding.
4. Then the scarcity run (C2.1) and the selection-off control (C2.2); measure the
   joint disposition/coordination trajectories.
5. Then the sense-ablation (C2.4).
6. Only then a visual — and it must show the null (flat) run beside the emergent
   run, disposition and coordination co-rising, or it is a diagram of a foregone
   conclusion.

## 7. Results log (honest, appended as runs happen)

**C2-derived, attempt 1 — NULL at the mechanism level (the derived sense is
inert).** The first build derived the contest signal purely from the agent's own
state: `contest = ref − ema` of foraging efficiency (realized intake ÷ perceived
food). Measured leverage by *forcing* the disposition high in a fixed immortal
flock (no evolution): `w = 0, 1.5, 3.0`. Matching r moved in no consistent
direction (e.g. seed-avg 0.49 → 0.48 → 0.49) and the **mean contest signal was
≈ 0.009** — essentially zero. Diagnosis: competition in this substrate is
*spatially diffuse* — foragers spread across a patch's tiles rather than stacking
on one, and depletion is gradual — so an agent's private intake ≈ what its own
tile holds regardless of the crowd, and the perceived-vs-realized gap never opens.
The elegant "no crowd-perception, derive it from base senses already present"
route **does not carry signal here.** Reported, not tuned away.

Corollary from the same runs: the earlier full-selection probe returned flat
`w` and flat coordination in *all* arms (scarcity, abundant, frozen) — but every
arm hit the population cap (`pop_end 130`), so there was no differential survival
for selection to grip. That probe tested nothing; a fair test needs a genuinely
food-limited world where poor foragers actually die.

**Pivot (C2′).** Keep the falsifiability scaffold (heritable, blind start,
abundant null, frozen control, real mortality) but change what the agent senses.
See the follow-up decision; the derived-sense constraint is retired as empirically
inert, not on principle.

**C2′, the evolvable policy — the invisible hand is representable but NOT
evolvable (the headline result).** The agent scores where to forage as
`g_food·food + g_crowd·density` over two primitive senses, both genes heritable,
`g_crowd` born ~0 (blind). Two facts, both robust:

  1. **The coordinated genome exists and works.** Hand-setting `g_crowd = −1`
     (avoid conspecifics) lifts matching r from ~0.5 (greedy, `g_crowd = 0`) to
     **~0.98 on every seed** — the IFD, as good as the authored C1 rule. The
     linear genome can represent the invisible hand.
  2. **Selection never finds it.** Across every regime — scarcity, abundance,
     the frozen control, and an "avoidance-favorable" regime (large perception so
     social cues are redundant, strong depletion) — and every seed, evolved
     `g_crowd` drifts/selects toward **positive** (herding, up to +0.6), never
     negative. Coordination stays ~0.2–0.5 and sometimes goes negative; it never
     approaches the 0.98 the same genome reaches when set by hand.

**Why (the mechanism).** Food and crowds are collocated — crowds form ON the food
— so "avoid crowds" (`g_crowd < 0`) is, locally, "avoid food," which starves the
avoider. The individually optimal move is toward food, which is toward others
(others mark where food is: local enhancement / social foraging), so the fitness
gradient points *up the herding hill*. The invisible-hand genome is a real fitness
peak, but it is **unreachable by incremental selfish selection from the naive
start** — the path to it runs through lower individual fitness. Coordination that
benefits everyone is not evolvable here; it must be authored (C1).

**Honest caveat.** Every evolution run pinned the population at its cap (patch
standing-stock buffers slow regen, so lowering regen did not make food limit the
population below the cap), which weakens selection strength. The *direction* is
nonetheless unanimous across regimes and mechanistically forced; a genuinely
food-limited run (needs a capacity/patch-size cut, not just slower regen) would
sharpen but not plausibly reverse it, since the gradient sign on `g_crowd` does
not flip with density. Stated as a limit on strength, not a doubt about sign.

**What this answers.** "Can something genuinely emergent be built, or is it
doomed?" — The emergent substrate is real (policy evolves from raw senses, nothing
authored, Batch A pinned, leverage proven). What emerges is *not* the tidy
invisible hand: innocent rules (seek food; others mark food) produce a collective
macro-pattern (herding, overcrowding, distribution worse than random) that no
agent chose and that is collectively worse for all — Schelling/Calhoun, not Smith.
The reassuring coordination is a designer's fiction here; selfish evolution builds
its opposite. That is the uncomfortable, undeniable result — not a failure to
model, but a finding about what self-interest actually optimizes.
