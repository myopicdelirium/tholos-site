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
