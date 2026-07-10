# The Dependence Case — Specification and Preregistration

*The hoarding/inequality question, built as what it actually is: a project about
agents who can depend on one another — and coordinate, or fail to. Written before
the sweep. The claims below are preregistered, and the first-class outcome this
model is built to make possible is that durable inequality DOES NOT form.*

---

## 0. The trap this document exists to avoid

"Inequality is engineered scarcity; the deprived stabilize what starves them" is a
conclusion with a politics, and its seductiveness is the danger. A model whose
hoarding capacity, power mechanism, and payoffs are all specified so that hoarding
dominates does not *find* inequality — it *restates its parameters wearing a lab
coat*. Therefore the governing rule of this case:

> **A world in which hoarding does not pay, collapses, or never starts must be a
> live, reachable outcome of the same mechanism — and the headline must contain
> at least one such world. If every swept world produces durable inequality, the
> result is void and must be reported as void, not published.**

This is the dependence analogue of `test_a_pinned`: the pin here is *falsifiability
of the thesis itself*.

## 1. Why hoarding is not the mechanism (dependence is)

Hoarding a regenerating resource is trivial — any agent with storage does it, and
it proves nothing. The interesting step is the one after: surplus becoming
**leverage over other agents' behaviour**. That step does not work on a Batch-A
agent at all. A deprived Batch-A agent that can't reach water simply *dies*; it
does not submit to whoever holds the water. Submission — doing what the holder
wants in exchange for access — requires the deprived agent to

  (a) model that a specific other agent controls its access,
  (b) predict that compliance yields access, and
  (c) value future access enough to override present autonomy.

That is a minimal model-of-other plus an intertemporal bargain. **The engine of
this case is dependence, and dependence is a cognitive capacity, not a resource
fact.** The build is therefore "the minimal agent that can be made dependent,"
with hoarding as one thing agents may *discover* they can do with it.

Empirical precondition, already established: the IFD probe (`experiments/ifd_probe`)
showed these agents cannot coordinate even for their own distributional benefit —
no substrate for collective assessment. That documented incapacity is the floor
this case builds on: the deprived cannot break a hoard for the same reason the
foragers could not flow to the rich patch.

## 2. The minimal cognitive substrate (in the reserved seams)

**M1 — belief about a controller (theory of mind, minimal).** Not general ToM:
exactly one learned expectation per nearby agent — "complying with agent X
restores my access." The existing Q-learner already learns action→need-gain over
tiles; here the action space gains `submit(neighbor)`, whose realized payoff is
access granted by that neighbor. The learner's discounting *is* the intertemporal
bargain (c). No new machinery — the learner pointed at agents instead of tiles.

**M2 — enclosure (the hoarding verb).** An agent may `claim` resource tiles it
stands on. Claimed tiles are harvestable only by the claimant and those it has
`grant`ed. Claiming and *holding* cost energy per tick, scaling with the number of
tiles held AND the number of excluded agents nearby — the **maintenance overhead**
of exclusion. A claim lapses if the holder stops paying.

**M3 — submit / grant (the dependence relation).** A deprived agent adjacent to a
claimed tile may `submit` — forgo autonomy this tick (do what the holder's field
directs, or transfer harvested surplus) in exchange for access. The holder may
`grant` or `deny`. A granted agent harvests; the relation is the unit of power.

**M4 — exit (the escape valve, load-bearing for falsifiability).** A deprived
agent may leave and seek *unclaimed* resource elsewhere. If unclaimed resource is
abundant and ubiquitous, submission never pays and hoarding yields no leverage —
this is the primary null condition, and it must be genuinely reachable.

**M5 — collective break (the coordination the deprived can't muster).** If enough
excluded agents act against one claim *in the same window*, the holder's
maintenance cost exceeds its capacity and the claim collapses — the resource
reverts to open access, better for all the excluded *together*. But each agent's
private incentive is to `submit` (certain access now) rather than join a `refuse`
that pays only if enough others also refuse *this tick* and is wasted otherwise.
This is the atomization gap, and M5's payoff structure must make private submission
individually rational while collective refusal is collectively superior — the
Schelling register, not a thumb on the scale.

**Symmetry (so hierarchy is not scripted).** `claim`/`grant` and `submit`/`refuse`
are available to *every* agent equally. A granted agent may itself claim against
those below it. Nothing forces two classes; strata must emerge or not.

Every mechanism ships behind config flags, default off. **Batch A stays byte-
identical** (extend `test_a_pinned` to cover the new action registry disabled).

## 3. The measurement that IS the commentary

Not "inequality exists." The claim is about the gap between latent and exercised
collective power:

  * **Gini / hoard concentration** over agents (resource access, offspring) — the
    surface inequality.
  * **latent deprived power** = the fraction of contested resource the excluded
    *could* reclaim by collective break (count × regen they outnumber the holder
    on), vs **exercised power** ≈ the fraction they actually reclaim. The gap is
    the finding: *numerous enough to end it, structurally unable to.*
  * **atomization index** = submissions ÷ (submissions + refusals) among the
    deprived — how reliably private bargains beat collective action.
  * **collapse dynamics** — enclosures should fail *suddenly* (coordination
    accidentally igniting), not erode gradually; measure the distribution of
    enclosure-lifetime endings (cliff vs slope).
  * **overhead ceiling** — the hoard size / exclusion count past which maintenance
    cost exceeds hoard value; inequality self-limiting from overhead, not justice.
  * **stratification depth** — number of nested dependence layers that emerge
    (the fractal-sub-hoarding prediction), reported whether it is 1 (no hierarchy)
    or many.

## 4. Preregistered claims (the sweep decides; nulls reported honestly)

Sweep axes: resource concentration (ubiquitous ↔ few patches), maintenance cost,
and a coordination-perception signal (can a deprived agent sense how many others
are also deprived/refusing) — off in the base case, on in the key ablation.

- **D0 (the falsifier, must be reachable).** In the abundant/ubiquitous-resource
  world, hoarding yields no leverage: Gini stays low, atomization index ≈ chance,
  no durable enclosures. *If this world still produces inequality, the model is
  rigged — stop and report void.*
- **D1 (dependence forms only under scarcity+concentration).** Durable enclosures
  and a high atomization index emerge only when resource is concentrated AND exit
  is poor. The transition across the concentration axis is the phase line.
- **D2 (the atomization gap).** Where inequality is durable, latent deprived power
  ≫ exercised power — the deprived hold the aggregate capacity to end it and do
  not, because private submission dominates collective refusal.
- **D3 (coordination ablation — the sharp test).** Switching on the
  coordination-perception signal should cause enclosures to collapse *suddenly*
  and the atomization index to fall. If it does not, the atomization story is
  wrong and must be retracted.
- **D4 (overhead self-limiting).** Enclosure size distributions show a ceiling set
  by maintenance cost, not by resource availability — inequality bounded by the
  cost of exclusion.
- **D5 (emergent stratification, a prediction not a knob).** With symmetric verbs,
  report whether a middle stratum of sub-hoarders emerges unbidden. Either answer
  is a result; a scripted hierarchy is not.

**Falsifiers.** D0 failing voids the model. D1 fails if inequality is
concentration-independent (baked in). D2 fails if exercised ≈ latent (no gap, no
Schelling story). D3 fails if coordination-perception doesn't dissolve enclosures.

## 5. What this is not

Not a claim about human economies; not calibrated to data; not an argument that
inequality is inevitable or that it isn't — the model is built precisely so both
are reachable. It is a mechanism result: the minimal cognitive conditions under
which surplus converts to durable power, the structural reason the many submit to
the few, and the conditions under which that conversion fails.

## 6. Build order (falsifiability first, exactly as Batch A was pinned)

1. Extend `test_a_pinned` to the new disabled registry — prove A unmoved.
2. Build M4 exit + the resource-concentration axis and the **D0 null harness**
   FIRST: demonstrate a world where hoarding does not pay, before any hoarding
   mechanism can be called a finding.
3. Then M2 enclosure + maintenance overhead; confirm D4's ceiling exists.
4. Then M1/M3 the dependence relation; measure D1, D2.
5. Then M5 + the coordination-perception ablation; measure D3, the collapse
   dynamics, D5 stratification.
6. Only then a visual — and it must be able to show the null (no inequality) run
   beside the durable-inequality run, or it is a diagram.
