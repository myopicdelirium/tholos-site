import type { Artifact } from "./types"

const a: Artifact = {
  slug: "metrics-memory-mode-persistence",
  title: "Metrics, Memory, and Mode Persistence: Internal Architecture as a Source of Macro Behavior",
  status: "Working paper",
  year: "2026",
  updated: "2026-01-05",
  authors: ["Felix Tinio"],
  keywords: ["Metrics", "Memory", "Mode Persistence", "Institutional Design", "ABM"],
  abstract: `Standard economic and agent-based models often rely on thin optimizers whose behavior is fully characterized by stable preferences and explicit incentives. In this paper, we ask what changes when we do not propose a new objective, but instead enrich the agent’s internal architecture in ways that are plausible, implementable, and explicitly ablatable. We introduce agents with persistence-gated motivation (Maslow-banded inertia), constrained attention, and bounded memory with decay and affect-biased retrieval. Agents act in a fixed ecological environment while facing an institutional measurement regime that rewards a subset of attention-capturable outputs, with “metric pressure” parameterizing the strength of this regime. Across matched environments and incentives, the enriched architecture generates macro-behavioral regimes not observed in baseline controllers: sustained commitment without immediate reward, costly persistence under incentive misalignment, punctuated surges of effort, and strong path dependence in which small early events cascade into divergent trajectories. A sweep over metric pressure reveals a systematic performance–stability tradeoff: measured output can rise while the stability conditions supporting long-horizon trajectories collapse beyond a threshold. A mid-run metric redefinition shock further distinguishes architectures, producing punctuated reorganization when persistence and history-dependent evaluation coexist. These patterns are not imposed as targets; they emerge from the interaction of internal state dynamics and external measurement. The results suggest testable predictions for institutional design: measurement can amplify performance without eroding stability when aligned with internal maintenance, but can induce churn, fragility, and outcome dispersion when legibility competes with the conditions required for durable commitment.`,
  previewImage: "/artifacts/metrics-memory-mode-persistence/page1.png",
  contactEmail: "myopicdelirium@gmail.com",
}

export default a
