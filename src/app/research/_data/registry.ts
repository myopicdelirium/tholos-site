// The working-paper registry: the sober ledger underneath the artifacts.
// Numbering is permanent; revisions bump version, never number.

export type WP = {
  number: string
  slug: string
  title: string
  authors: string[]
  year: string
  version: string
  updated: string
  status: string
  venue?: string
  bibtex: string
  reproducibility?: {
    engine?: string
    data?: [string, string][]
    instrument?: string
    notes?: string
  }
}

export const series = {
  name: "Myopic Delirium Working Papers",
  code: "MD-WP",
  policy:
    "Numbers are assigned once and never reused. Revisions increment the version and are noted in the change line; the number is stable for citation. Full texts are available on request while under review; reproducibility artifacts are public where listed.",
}

export const registry: WP[] = [
  {
    number: "MD-WP-2026-001",
    slug: "irrational-substrates-abm-framework",
    title: "Incorporating the Irrational Substrates of Cognition into an ABM Research Framework",
    authors: ["Felix Tinio"],
    year: "2026",
    version: "v1.1",
    updated: "2026-01-04",
    status: "Submitted",
    venue: "AAMAS 2026",
    bibtex: `@techreport{tinio2026substrates,
  title  = {Incorporating the Irrational Substrates of Cognition into an ABM Research Framework},
  author = {Tinio, Felix},
  year   = {2026},
  number = {MD-WP-2026-001},
  institution = {Myopic Delirium},
  url    = {https://myopicdelirium.com/artifacts/irrational-substrates-abm-framework}
}`,
  },
  {
    number: "MD-WP-2026-002",
    slug: "eine-konfigurierbare-zyklische-oekologie",
    title: "Eine konfigurierbare zyklische Ökologie",
    authors: ["Felix Tinio"],
    year: "2026",
    version: "v1.0",
    updated: "2026-01-04",
    status: "Working paper",
    bibtex: `@techreport{tinio2026oekologie,
  title  = {Eine konfigurierbare zyklische {\\"O}kologie},
  author = {Tinio, Felix},
  year   = {2026},
  number = {MD-WP-2026-002},
  institution = {Myopic Delirium},
  url    = {https://myopicdelirium.com/artifacts/eine-konfigurierbare-zyklische-oekologie}
}`,
  },
  {
    number: "MD-WP-2026-003",
    slug: "attention-budget-constraint-robust-incentives",
    title: "The Attention Budget Constraint and Robust Incentives",
    authors: ["Felix Tinio"],
    year: "2026",
    version: "v1.0",
    updated: "2026-01-27",
    status: "Working paper",
    bibtex: `@techreport{tinio2026attention,
  title  = {The Attention Budget Constraint and Robust Incentives},
  author = {Tinio, Felix},
  year   = {2026},
  number = {MD-WP-2026-003},
  institution = {Myopic Delirium},
  url    = {https://myopicdelirium.com/artifacts/attention-budget-constraint-robust-incentives}
}`,
  },
  {
    number: "MD-WP-2026-004",
    slug: "metrics-memory-mode-persistence",
    title: "Metrics, Memory, and Mode Persistence",
    authors: ["Felix Tinio"],
    year: "2026",
    version: "v1.0",
    updated: "2026-01-22",
    status: "Working paper",
    bibtex: `@techreport{tinio2026metrics,
  title  = {Metrics, Memory, and Mode Persistence},
  author = {Tinio, Felix},
  year   = {2026},
  number = {MD-WP-2026-004},
  institution = {Myopic Delirium},
  url    = {https://myopicdelirium.com/artifacts/metrics-memory-mode-persistence}
}`,
  },
  {
    number: "MD-WP-2026-005",
    slug: "selective-recall-under-metric-pressure",
    title: "Selective Recall under Metric Pressure",
    authors: ["Felix Tinio"],
    year: "2026",
    version: "v1.0",
    updated: "2026-01-22",
    status: "Working paper",
    bibtex: `@techreport{tinio2026recall,
  title  = {Selective Recall under Metric Pressure},
  author = {Tinio, Felix},
  year   = {2026},
  number = {MD-WP-2026-005},
  institution = {Myopic Delirium},
  url    = {https://myopicdelirium.com/artifacts/selective-recall-under-metric-pressure}
}`,
  },
  {
    number: "MD-WP-2026-006",
    slug: "trait-based-selection-specialization-elite-targeted-violence",
    title: "Trait-Based Selection, Specialization, and Elite-Targeted Violence",
    authors: ["Felix Tinio"],
    year: "2026",
    version: "v1.0",
    updated: "2026-01-22",
    status: "Working paper",
    bibtex: `@techreport{tinio2026selection,
  title  = {Trait-Based Selection, Specialization, and Elite-Targeted Violence},
  author = {Tinio, Felix},
  year   = {2026},
  number = {MD-WP-2026-006},
  institution = {Myopic Delirium},
  url    = {https://myopicdelirium.com/artifacts/trait-based-selection-specialization-elite-targeted-violence}
}`,
  },
  {
    number: "MD-WP-2026-007",
    slug: "terminal-commitment-emergent-martyrdom",
    title: "Terminal Commitment: Martyrdom and Self-Destruction as Emergent Properties of Cognitively-Grounded Agents",
    authors: ["Felix Tinio"],
    year: "2026",
    version: "v0.3 (prospectus)",
    updated: "2026-07-08",
    status: "Working paper",
    bibtex: `@techreport{tinio2026terminal,
  title  = {Terminal Commitment: Martyrdom and Self-Destruction as Emergent Properties of Cognitively-Grounded Agents},
  author = {Tinio, Felix},
  year   = {2026},
  number = {MD-WP-2026-007},
  institution = {Myopic Delirium},
  url    = {https://myopicdelirium.com/artifacts/terminal-commitment-emergent-martyrdom}
}`,
    reproducibility: {
      engine: "vigil-1.0 (deterministic; mulberry32 seeds displayed in the instrument)",
      instrument: "/instruments/vigil",
      data: [
        ["Forgetting dose-response, 7 levels × 10 seeds × 20,000 ticks", "/research/data/vigil_forgetting_sweep.csv"],
        ["Devotion dose-response, 5 levels × 10 seeds", "/research/data/vigil_devotion_sweep.csv"],
        ["Ablation matrix (intact / gate ablated / private alarm channel), 10 seeds", "/research/data/vigil_ablation_matrix.csv"],
        ["Phase map, 14×14 cells × 120 cohort trials", "/research/data/vigil_phase_map.csv"],
        ["Machine-readable summary", "/research/data/vigil_summary.json"],
      ],
      notes:
        "Every figure-level claim in the prospectus regenerates from a single headless script; the field engine and the cohort engine are the same update law. Model description follows the ODD protocol (below).",
    },
  },
]
