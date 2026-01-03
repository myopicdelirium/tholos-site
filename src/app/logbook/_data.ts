export type LogEntry = {
  slug: string
  title: string
  deck: string
  date: string
  tag: string
  body: string[]
}

export const LOGBOOK: LogEntry[] = [
  {
    slug: 'build-v0-1-0',
    title: 'Build v0.1.0: Home narrative + hero plates',
    deck: 'Full-width scroll structure established. Hero → About → Articles, with live routing.',
    date: '2025-12-27',
    tag: 'Release',
    body: [
      'This is placeholder text for a release note entry.',
      'Use this page to record what changed, what is stable, and what is still provisional.',
      'Include links to demo snapshots, commits, and any decisions that affect interpretation.'
    ],
  },
  {
    slug: 'patch-notes-0003',
    title: 'Patch Notes 0003: Navigation + section cohesion',
    deck: 'Unified navigation across pages; cleaned overlap; prepared for logbook + demo plates.',
    date: '2025-12-26',
    tag: 'Patch',
    body: [
      'This is placeholder text for patch notes.',
      'Write in terse, factual bullets later if you want: what changed, why, and what it breaks.',
      'This is the right place to document interface semantics and naming conventions.'
    ],
  },
  {
    slug: 'working-paper-001',
    title: 'Working Paper 001: Metric pressure as a controllable regime',
    deck: 'A short release note pointing to a draft argument and the ablation plan.',
    date: '2025-12-20',
    tag: 'Paper',
    body: [
      'This is placeholder text for a working paper release entry.',
      'Summarize the claim, what is measured, what is swept, and what would falsify it.',
      'Link to the full paper later, and pin version numbers to figures and experiments.'
    ],
  },
  {
    slug: 'patch-notes-0002',
    title: 'Patch Notes 0002: Hero typography pass',
    deck: 'Typography tightened for the first plate; background image integration.',
    date: '2025-12-18',
    tag: 'Patch',
    body: [
      'Placeholder body text.',
      'Keep this style compact. Think of it as a lab notebook margin that still reads cleanly.'
    ],
  },
  {
    slug: 'field-update-scope',
    title: 'Field Update: Project scope clarification',
    deck: 'ABM is one instrument. The project also holds philosophy, politics, and travel as first-class material.',
    date: '2025-12-10',
    tag: 'Update',
    body: [
      'Placeholder body text.',
      'Use this to set expectations for readers: this is an intellectual project, not a SaaS landing page.'
    ],
  },
]
