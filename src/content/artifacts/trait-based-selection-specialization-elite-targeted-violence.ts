import type { Artifact } from "./types"

const a: Artifact = {
  slug: "trait-based-selection-specialization-elite-targeted-violence",
  title: "Trait-Based Selection, Specialization, and Elite-Targeted Violence in a Skill-Stratified Agent Society",
  status: "Working paper",
  year: "2026",
  updated: "2026-01-04",
  authors: ["Felix Tinio", "Giulia Ambu Apolloni"],
  keywords: ["Selection", "Specialization", "Violence", "Inequality", "ABM"],
  abstract: `We present an agent-based model in which fitness emerges from a coupled architecture of domain skill formation, ecological constraints, and strategic social conflict. Agents differ by domain-specific raw talent and accumulate experience through practice, producing endogenous skill gradients that shape access to resources, survival, and reproduction. In baseline environments with spatially structured yields and nontrivial movement costs, high-skill agents predictably exhibit elevated survival and reproductive success. However, selection does not resolve into a single best type. Instead, persistent inequality in productive capacity induces a bifurcation among low-potential agents into two distinct adaptive responses. One branch canalizes effort into narrow, reliable niches (most commonly fishing) where returns are repeatable, location-bound, and learnable via incremental experience, enabling disadvantaged agents to secure stable subsistence and nonzero reproductive viability despite inferior generalized skill. The second branch adopts dominance-suppression tactics: agents unable to sustain a niche increasingly direct aggression toward higher-trait competitors, including lethal attacks, thereby reducing trait gradients through competitor removal rather than productivity gains. This produces a counterintuitive selection pressure in which high skill can become evolutionarily costly when it is socially salient, shifting the population away from pure “survival of the fittest” toward a regime where visibility, clustering, and defensibility determine whether superior traits translate into long-run fitness. Across seed-replicated runs and targeted ablations, we show that niche depth governs the prevalence of specialization, while the cost and efficacy of violence governs elite-targeting and selection reversal; disabling aggression collapses dominance suppression and concentrates fitness among high-skill agents, whereas flattening niche returns increases aggressive suppression among the disadvantaged. These findings demonstrate that natural selection in agent societies can operate through two competing pathways (productive specialization and destructive equalization) yielding polymorphic populations and macro-regimes that standard optimization-centric ABMs systematically miss.`,
  previewImage: "/artifacts/trait-based-selection-specialization-elite-targeted-violence/page1.png",
  contactEmail: "myopicdelirium@gmail.com",
}

export default a
