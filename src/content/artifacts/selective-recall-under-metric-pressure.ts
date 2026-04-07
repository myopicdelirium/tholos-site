import type { Artifact } from "./types"

const a: Artifact = {
  slug: "selective-recall-under-metric-pressure",
  title: "Selective Recall Under Metric Pressure: Memory Corruption and Mode Persistence as Generators of Path-Dependent Macro-Regimes",
  status: "Working paper",
  year: "2026",
  updated: "2026-01-17",
  authors: ["Felix Tinio", "Henry Marks", "Zachary Zulueta", "Rishab Talusani"],
  keywords: ["Memory", "Metric Pressure", "Path Dependence", "Modes", "Institutions"],
  abstract: `Economic and agent-based models typically treat motivation as continuously revisable and memory as either a ledger or a nuisance. This work argues that these simplifications obscure a key causal surface: internal architecture, specifically, the interaction between persistence-gated motivational modes, bounded memory with decay and valence-conditioned retrieval, and institutional measurement regimes that reward legible proxies rather than long-horizon stability. We introduce an agent that maintains multiple homeostatic states but does not resolve them through instantaneous re-optimization; instead, higher-order drives become eligible only after sustained prerequisite stability and remain open through short-lived shocks, yielding durable “goal phases” without scripting. Memory is implemented as a bounded episodic/summary system whose retrieval is shaped by decay, interference, and affect bias, so that the “remembered past” becomes a selective lens that feeds back into priorities and learning. We study how small early perturbations can snowball into divergent trajectories when selective recall changes what becomes salient at decision time, and how this history dependence interacts with metric pressure to produce regime transitions in stability, churn, and outcome dispersion. Using seed-reproducible runs and a full ablation map that separates storage from distortion, we show that qualitative macro-patterns (commitment under misalignment, punctuated adaptation under metric redefinition, and nonlinear sensitivity to rare events) depend on specific mechanisms rather than on generic parameter inflation.`,
  previewImage: "/artifacts/selective-recall-under-metric-pressure/page1.png",
  contactEmail: "myopicdelirium@gmail.com",
}

export default a
