import type { CopenWienArticle } from "./types"

const article: CopenWienArticle = {
  slug: "stress-phenotypes-on-a-single-surface",
  title: "Stress phenotypes on a single surface",
  abstract:
    "A pre-registered agent-based study that separates, by construction, the stress profile an individual brings to its position from the profile the position produces, deriving four recognizable phenotypes as quadrants of one two-parameter surface.",
  authors: ["Bruno Risach", "Felix Tinio"],
  keywords: [
    "agent-based simulation",
    "allostatic load",
    "stress reactivity",
    "social rank and glucocorticoids",
    "bounded attention",
    "pre-registered prediction",
  ],
  status: "Extended abstract",
  year: "2026",
  body: [
    {
      text: "Stress physiology is usually decomposed into three quantities, a resting level, the magnitude of the response to an acute stressor, and the rate of return afterward. The allostatic load framework treats these as separate parameters and identifies a failure to shut off the response as a distinct pathway to damage (McEwen and Stellar 1993, McEwen 1998). Work on rank and glucocorticoids in wild primates reports that profiles differ by social position, though the direction is contested and depends on hierarchy stability and on how rank is maintained (Sapolsky 2005), with at least one study finding elevated basal cortisol in alpha males rather than the reverse (Gesquiere et al. 2011). Work on early environment reports that high reactivity emerges at both extremes of childhood adversity (Boyce and Ellis 2005). The obstacle common to all of it is that rank, cumulative exposure, and constitutional differences covary in observational data, so no field design separates a profile that follows from position from a profile the individual brought to the position.",
    },
    {
      text: "This phase separates them by construction. In the Inversion architecture, safety urgency is perceived peril scaled by the agent's own mitigation, where mitigation is a function of traits drawn once at spawn and immutable for life, and every drive weight relaxes toward its heard urgency at a declared timescale. Two closed-form expressions follow. Resting weight equals peril times one minus mitigation. Excursion under a shock of duration T equals one minus mitigation, times the gap between shock peril and resting peril, times one minus e to the minus T over tau. Calibrated at peril 0.6 in dangerous zones and 0.08 in safe zones, shock peril 0.9, mitigation 0.7 for the strong-born and 0.2 for the weak-born, tau 12, and a 50-tick shock giving a capture fraction of 0.985, the predicted resting weights are 0.18, 0.48, 0.024, and 0.064 for the strong-dangerous, weak-dangerous, strong-safe, and weak-safe cells. The predicted excursions in the same order are 0.09, 0.240, 0.246, and 0.65. The four recognizable phenotypes are quadrants of one two-parameter surface. No personality variable exists in the code, and a static test over the source forbids drive identifiers inside the update function.",
    },
    {
      text: "The ordering across those four values is not uniformly robust, and the limits are declared in advance. Weak-and-safe is the largest responder by a wide margin, because excursion is paid on the gap and agents born in safety carry almost none of the weight beforehand. That ranking survives any plausible calibration. The two middle cells sit within 0.006 of each other and their order is fixed by the safe-zone peril alone. At a safe peril of 0.2 the weak-dangerous cell responds more, and at 0.02 the strong-safe cell does. Only the extreme ranking is registered as a prediction. The middle ordering is reported as calibration-dependent and is not claimed.",
    },
    {
      text: "Three tests are registered. The first treats both expressions as identity checks against the predicted values under a declared tolerance rather than as regressions judged by variance explained, since both relationships hold by construction and a loose bar cannot fail informatively. The second fits a decay constant to each agent's post-shock curve and compares it against that agent's declared tau. No path in the code can slow a relaxation, so any cell median exceeding the declared value by 20 percent halts the phase as an instrument fault or a violation of the law. The third decomposes the stress index into its two components, displayed safety weight and priority-flick rate over 50 ticks, reported separately for every cell. The weight obeys the relaxation law. The flick rate is a near-tie count that obeys nothing in particular, with a predicted baseline of 2 to 6 switches per window and a transient of 3 to 5 times that. Any observed failure to return to baseline must localize to one component.",
    },
    {
      text: "Two mechanisms are named in advance for the elevated asymptote. The first is testimony feedback. Displays enter neighbors' safety urgency scaled by credence and distance, weak agents cluster after a shock, and a mutual cluster is a fixed point of the relaxation law above the solitary baseline. Predicted elevation is 0.15 to 0.25, scaling with cluster size and mean credence, and vanishing in a control arm with testimony severed. The loop gain is computed from declared parameters before any run, and both branches are registered, settlement below unity and divergence to saturation at or above it. The second is attention. At sharpness 2 a small resting weight is gated hard and the excursion shrinks continuously in that weight. Since strong-safe resting urgency is 0.024, weights are never exactly zero and the absorbing case does not arise, so a steep continuous gradient is predicted instead of two modes. Exactly-zero non-responders occur only if some zone carries peril of exactly zero, which is declared as a configuration condition beforehand.",
    },
    {
      text: "Chronic elevation is predicted to carry a survival cost through the attention field instead of through accumulated damage. A raised safety weight competes with hunger under bounded attention, the same arithmetic that starves bereaved agents in this architecture. Against matched controls with equal mitigation and equal hazard exposure, the predicted starvation excess for elevated-asymptote agents is 8 to 20 points at sharpness 2, near zero at sharpness 0, and monotone in sharpness, with a rank correlation between elevation and time to starvation of minus 0.3 to minus 0.5. Cell membership is assigned by birth-environment hazard rate and held fixed, with lifetime exposure reported beside it as a covariate and never in place of it, since migration is expected to move 15 to 30 percent of agents across cell boundaries. Every bar is judged as written, in each seed stage separately, on declared seeds and again on fresh ones, and both branches of every test are reported. Artifacts carry per-run seeds and configuration hashes.",
    },
  ],
}

export default article
