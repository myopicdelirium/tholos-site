import type { Artifact } from "./types"

const a: Artifact = {
  slug: "attention-budget-constraint-robust-incentives",
  title: "Attention as a Budget Constraint and the Design of Robust Incentives",
  status: "Working paper",
  year: "2025",
  updated: "2025-10-14",
  authors: ["Felix Tinio"],
  keywords: ["Attention", "Incentives", "Robustness", "Goodhart", "Tail Risk"],
  abstract: `This paper develops a multitask model in which attention is the primary scarce resource. A decision-maker allocates a fixed stock of attention between a measured task, which produces observable output rewarded by a metric, and a robustness task, reducing the probability of a rare loss but does not affect the metric. A planner chooses the strength of metric-based incentives, α, anticipating how this shifts attention across tasks. Higher α values raise measured performance but this diverts attention away from robustness, increasing tail risk in a Goodhart type trade off. Money only matters through attention technology. Each dollar purchases additional attention units so that the marginal value of money is proportional to the shadow value of attention. This paper characterizes the optimal metric weight α* while showing how it depends on the attention budget and the severity of losses, and it derives comparative statistics for measured output, disaster probability, welfare, and the value of money.`,
  previewImage: "/artifacts/attention-budget-constraint-robust-incentives/page1.png",
  contactEmail: "myopicdelirium@gmail.com",
}

export default a