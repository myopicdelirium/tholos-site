# Retrodiction R1 — Milinski's sticklebacks (preregistration)

*Written and committed BEFORE the run. The predictions below are locked; the
observed outcome is public (Milinski 1979) but no parameter of the model is
calibrated to it. The point is not to match a number metric-for-metric — it is to
set six foragers' circumstances from the real experiment and see whether the
population moves in the same direction the real one did.*

---

## 0. The rule that makes this retrodiction and not fitting

The model is frozen. Its inputs are taken from the experiment; its one foraging
parameter is set from foraging theory, not from Milinski's result; and the
predicted **direction** is stated here, before the run, with the conditions under
which it fails. If the flock splits evenly, or piles onto the poorer patch, or
does not re-track a reversal, R1 fails and we publish the failure.

## 1. The episode (Milinski 1979, *Z. Tierpsychologie* 51:36–40)

Six three-spined sticklebacks in a tank; two feeders at opposite ends deliver
water fleas at **30/min and 6/min — a 5:1 profitability ratio**. Observed: the
fish distributed between the feeders roughly in the ratio of profitabilities (an
Ideal Free Distribution), deviating slightly from the 5:1 ideal in the direction
of **undermatching** (fewer fish at the rich feeder than 5:1 predicts), and when
the feeders were reversed the fish **re-tracked** to the new rich end within
minutes.

## 2. Inputs — fixed from the experiment, nothing tuned to the outcome

- **Foragers:** 6, fixed (no births, no deaths — matching six fish). Energy and
  hydration floored each tick so the flock persists and stays motivated.
- **Two patches, productivity ratio 5:1**, at opposite ends of a small world,
  set by source-tile count. At steady state our depleting patches deliver
  food eaten = food regenerated, so per-capita intake at a patch = (patch
  productivity) ÷ (foragers there) — the same rate-sharing Milinski's non-depleting
  feeders impose. This is the one structural difference between model and
  experiment, and it is declared here, not hidden.
- **Perception radius spans the world** (both patches always assessable) — the
  "ideal" (complete-information) condition IFD is named for, and the condition
  the fish are in.
- **Foraging rule = the model's competitive (per-capita) rule**, `foraging.congestion`,
  with gain **k = 1.0** — a round value chosen because it makes the rule a
  reward-rate assessor, **not** because it reproduces Milinski's undermatching.
  k is frozen before the run and reported whatever it yields.

## 3. The ablation (which built-in agent is being tested)

Two agents are run on the identical world; only the foraging rule differs.

- **Reward-rate assessor (per-capita):** the hypothesis under test — a forager
  that seeks the best food *per competitor*. IFD theory (and Milinski's own reading
  of his fish) predicts this reproduces the pattern.
- **Greedy (raw-food):** the null — a forager that seeks the most food, ignoring
  competitors. Predicted to overcrowd the rich patch and fail to match.

## 4. Preregistered predictions (direction first; magnitude reported, not required)

- **R1.a — matching direction.** The reward-rate flock puts the **majority on the
  rich patch** and its occupancy **rank-correlates with productivity** (rich > poor).
  *Fails if* the split is even (rich share ≤ 55%) or inverted (poor > rich).
- **R1.b — undermatching.** The rich-patch share is **below the 5:1 ideal (83.3%)
  but above 50%** — the same direction of deviation Milinski reported. *Fails if*
  the flock overmatches (≥ 83%) or does not favor the rich patch.
- **R1.c — re-tracking.** After the productivities are **reversed mid-run**, the
  majority **flips to the new rich patch** and re-settles. *Fails if* the flock
  stays on the now-poor patch.
- **R1.d — the null fails.** The greedy agent does **not** produce R1.a–R1.c
  (it overcrowds or clumps). *If greedy matches just as well, the per-capita
  mechanism is not what is doing the work, and R1 is uninformative.*

## 5. What a pass means, and what it does not

A pass means: given six foragers' real circumstances and a rule taken from theory
rather than from the data, the model moves the way the animals moved — majority to
the rich patch, undermatched, re-tracking a reversal — and the greedy alternative
does not. It does **not** mean the model is calibrated to sticklebacks, or that the
undermatching magnitude matches; those are reported honestly as secondary. It is a
directional point of contact: the mechanism is *sufficient* to reproduce a real,
never-fitted regularity, which is the sentence a forecaster cannot say.

## 6. Method

One run per condition, several seeds, mean split over the steady-state window; the
reversal at the midpoint; determinism and provenance as everywhere else (seeded
streams, committed harness, this spec pinned before the numbers exist).

## 7. Results log (honest, appended as runs happen)

**R1 (per-capita rule, foraging memory OFF) — FAILED.** 8 seeds. Ideal 0.833.

| agent | rich-patch share (pre) | share on new-rich (post-reversal) |
|---|---|---|
| per-capita | 0.55 | 0.48 |
| greedy | 0.61 | 0.56 |

Against the preregistered predictions: **R1.a** marginal (0.55 barely favors rich,
near chance); **R1.c re-tracking FAILS** (0.48 — the flock did not flip to the new
rich feeder); **R1.d FAILS** (greedy 0.61 ≥ per-capita 0.55 — the mechanism did not
beat the null). Reported as a failure, not tuned.

**Diagnosis (a real model property, not a bug).** Our agents perceive *standing
food*, which is capped at capacity on every source tile, so a 5:1 productivity ratio
encoded as *tile-count* is invisible to instantaneous perception — a rich-patch tile
and a poor-patch tile both read 1.0, and both rules simply walk to the nearest food.
The 5:1 lives only in the *flow* (a rich patch regenerates more total food, so feeds
more foragers before per-capita intake drops), and the flow is legible only through
*realized intake over time* — the `foraging.memory` channel (intake-rate EMA), which
R1's preregistration deliberately held off. Milinski's fish perceive the delivery
*rate* directly; R1's agents were given no rate signal. The failure is therefore
informative: it says what an agent must be able to sense to reach an IFD.

**R1b — preregistered here, before running.** Same episode, same inputs, same
predictions (R1.a–R1.d). One change, motivated by the diagnosis: enable
`foraging.memory` so the agent tracks its own realized intake rate — the perceptible
analogue of Milinski's feeder rate — and can prefer the patch that has been feeding
it better. The per-capita rule stays on (competition), memory adds rate-perception.
Greedy (raw standing food, no memory) remains the null. If R1b reproduces the
matching + undermatching + re-tracking that R1 could not, the finding is precise:
*the IFD is reproduced by an agent that perceives intake rate, and not by one that
perceives only standing food* — a statement about required cognition, earned against
real data. If R1b also fails, the model cannot yet reproduce Milinski, and we say so.

**R1b (rate-perceiving, foraging memory ON) — ALSO FAILED.** Rich-patch share
0.56 (pre) / 0.50 (post), essentially identical to R1 and still below greedy's
0.61. Memory did not rescue it. **We say so: the model does not reproduce Milinski
under either preregistered configuration.**

**The deeper diagnosis — a real representational gap, and the useful finding.**
The two failures share one root. Milinski's richness is a *per-location delivery
rate*: a lone fish at the 30/min feeder eats five times as fast as one at the 6/min
feeder, an enormous per-individual signal even with no competitor present. Our model
has no such thing. Patch richness is encoded as *tile-count* over a field whose
every source tile caps at the same capacity, so a lone forager eats about equally
well at either patch; the 5:1 only appears **in the aggregate under crowding** (more
tiles feed more foragers before depletion), which six sparse fish never generate
strongly enough. Stock is not rate. The model represents *depletable standing
resource*, which is the right physics for a population eating down a range — and the
wrong physics for a rate-matching feeder experiment. This is not a tuning failure; it
is a statement of what the model can and cannot currently be pointed at.

**Consequence for the retrodiction program (honest pivot).** The clean-in-the-field
choice (IFD) is a poor match for *this* model's representation. The episodes that are
mechanistically native to a depletable-stock + density-dependent-mortality model are
the **population overshoot-and-collapse** cases — St. Matthew reindeer, Soay sheep —
where the generating process *is* eat-down-the-resource. Reproducing Milinski would
require adding per-patch delivery-rate differentiation (a model extension, its own
preregistered piece of work), not a stage tweak. Recommended: lead the retrodiction
program with the reindeer overshoot, whose physics the model already has, and treat
rate-differentiated foraging as a separate, later capability. R1 stands as a
published negative result with a precise, load-bearing diagnosis.
