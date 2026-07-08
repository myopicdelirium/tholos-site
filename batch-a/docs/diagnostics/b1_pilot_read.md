# B1 pilot — results read against the preregistration

104 cells (9 grief × 3 baseline + private-channel, 8 seeds each). Martyr rate =
deaths by self-neglect (energy OR hydration) *while the grief latch holds*, over
bereaved parents; baseline = matched non-bereaved parents in the same worlds.
Medians over seeds. Full data: `b1_summary.json`, `b1_runs.csv`.

## Verdicts (preregistered C1–C5, reported honestly — including the misses)

**C1 — emergence: SUPPORTED, strongly.** Bereaved parents die at their vigil far
above the matched baseline in every grief cell. At slots=1: **0.82 vs 0.31**
(2.6×), consistent across decay. No death is scripted; it is the coupling. The
vigil-death rate (any cause, incl. predation at the loss site) is 0.89–0.97 — a
latched parent almost never survives the vigil.

**C2 — bandwidth gate: SUPPORTED but NON-MONOTONIC, and this is the finding.**
The prediction was strong→weak→absent over slots 1→2→3. Observed (mid decay):
**0.82 → 0.47 → 0.50**. The *drop from 1 to 2 is real and large* — a second slot
lets the thirst alarm sit beside grief and be acted on. But slot 3 does **not**
continue down; it plateaus (~0.50), still well above the ~0.29 baseline. Reading:
one slot is the knife-edge (grief alone crowds the band); beyond two slots, added
bandwidth stops helping because the *bereaved parent keeps re-selecting grief
into the band* — the latch competes on drive magnitude, and at drive ≫ any
deficit it wins a slot regardless of how many exist. Martyrdom is gated by
whether the alarm gets *any* slot, not by total bandwidth. C2's spirit holds
(narrow band → martyrdom); its monotonic form is falsified.

**C3 — persistence gate: NOT SUPPORTED as stated.** Prediction: fast decay
releases in time (grief without martyrdom). Observed: martyr rate barely moves
with decay (slots=1: 0.82/0.82/0.76 over slow/mid/fast), and *released* counts
stay low (0/1/18 of ~420). Why: the body's clocks are faster than even the fast
latch. Median vigil length at death is ~65 ticks; thirst empties in 100, energy
in 250 — the parent dies at the vigil long before a 183-tick latch would have
released. The phase boundary C3 predicted exists in parameter space but lies at
*faster decay than the body's failure time* — off the swept grid. A real result:
**with these homeostatic clocks, the latch does not need to be permanent to be
fatal; it only needs to outlast the body, which is easy.** (Follow-up: sweep
decay ≫ 0.012, or slow the drains, to locate the release boundary.)

**C4 — latch ablation: SUPPORTED.** grief off → martyr rate collapses to the
baseline 0.36 (there are no latched deaths at all; the "rate" shown is the
world's own parent self-neglect). The phenomenon is the latch, not the loss.

**C5 — private channel: SUPPORTED, cleanly — the signature result.** Exempting
hydration from the attention budget (the alarm gets a channel grief cannot
crowd out) collapses thirst-martyrdom specifically: **thirst deaths 0.33 → 0.04**
while the vigil persists (vigil-death 0.99, median length unchanged). The deaths
do not stop — they **re-route to energy** (0.49 → 0.78), the need still inside
the contested budget. This is the mechanism's fingerprint: martyrdom is the
*shielding of an alarm by a latched drive*, not the grief itself. Protect one
alarm and the body dies through the next unguarded one. It reproduces the
Vigil's second ablation on the real substrate — and sharpens it, by showing the
death is displaced rather than prevented.

## Headline

On a substrate where no death is chosen, a bereavement latch competing in a
bounded attention budget produces death-by-vigil at 2.6× the matched baseline;
the effect is switched off by removing the latch (C4) and *displaced but not
removed* by giving one alarm a private channel (C5) — proving the mechanism is
attentional shielding. The two gradient predictions (monotonic bandwidth C2,
persistence-release C3) did **not** hold as written: bandwidth past one slot
stops mattering because a high-drive latch always claims a slot, and the latch is
fatal at every swept persistence because the body fails faster than the latch
releases. Both misses are informative and are the first questions for the n≥20
confirmation (sweep slots≥1 with drive-capped grief; sweep decay past the body's
failure time).

## Limits

Pilot n=8; boundary cells warrant n≥20 + bootstrap CIs before headline framing.
Cap 250 binds (documented; the outcome is per-agent). The bereavement signal
carries the loss site by construction (no discovery modeled). Reproduce:
`python -m experiments.b1_sweep --seeds 0-7`.
