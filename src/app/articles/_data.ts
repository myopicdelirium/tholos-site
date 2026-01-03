export type Article = {
  slug: string
  title: string
  deck: string
  date: string
  tag: string
  body: string[]
}

export const ARTICLES: Article[] = [
  {
    slug: 'field-notes-0001',
    title: 'Field Notes 0001: A Brief Defense of the Unmeasured',
    deck: 'A technical system becomes political the moment it decides what counts.',
    date: '2025-12-27',
    tag: 'Essay',
    body: [
      'This is placeholder text for the full article. Replace this with your actual writing later.',
      'Use this page to set the tone: intellectual, precise, slightly insurgent, not product-marketing.',
      'You can write longform here, embed figures later, and link to mechanisms and experiments.',
      'The goal is not to romanticize ambiguity, but to argue for architectures that can survive it.'
    ],
  },
  {
    slug: 'regimes-and-pressure',
    title: 'Regimes and Pressure: When Metrics Start Steering the Agent',
    deck: 'If you reward one channel, you train the whole organism to speak that dialect.',
    date: '2025-12-21',
    tag: 'Note',
    body: [
      'This is placeholder text for the full article. Replace this with your actual writing later.',
      'Discuss metric pressure as a controlled lever: it can stabilize short-run output while deforming long-run trajectories.',
      'Mention inspectability, ablations, and what it means to attribute behavior to architecture instead of narrative.',
      'Close with a clear promise: the demo is not a toy, it is an argument you can manipulate.'
    ],
  },
  {
    slug: 'travelogue-protocol',
    title: 'Travelogue Protocol: Seeing Institutions in the Wild',
    deck: 'A field journal for how to look: cafés, borders, rituals, and the quiet machinery behind them.',
    date: '2025-11-30',
    tag: 'Travel',
    body: [
      'This is placeholder text for the full article. Replace this with your actual writing later.',
      'Write in vignettes. Keep it observational. Show how politics and meaning hide inside mundane constraints.',
      'Use your travel to enrich the project: the simulation is not detached; it is anchored in lived pattern.',
      'End with a method: how to record, annotate, and operationalize without flattening.'
    ],
  },
  {
    slug: 'on-delirium',
    title: 'On Delirium: Why Irrationality Is the Baseline',
    deck: 'If you want to model humans, start with the refusal to be simplified.',
    date: '2025-10-14',
    tag: 'Essay',
    body: [
      'Placeholder body text.',
      'Talk about bounded attention, memory decay, salience, affect, and why thin optimization fails under institutional measurement.',
      'Tie the concept to the aesthetic: notebooks, marginalia, crossed-out lines, revisions as a first-class artifact.'
    ],
  },
  {
    slug: 'notes-on-legibility',
    title: 'Notes on Legibility: The Violence of Clean Dashboards',
    deck: 'The world gets quieter when your interface only listens to what it can count.',
    date: '2025-09-02',
    tag: 'Note',
    body: [
      'Placeholder body text.',
      'Use this as a short, sharp piece that reads like a marginal note that accidentally became a manifesto.'
    ],
  },
  {
    slug: 'mechanisms-index',
    title: 'Mechanisms Index: What Is Inspectable Here',
    deck: 'A map of the moving parts: needs, attention budgets, memory, and pressure regimes.',
    date: '2025-08-18',
    tag: 'Method',
    body: [
      'Placeholder body text.',
      'This can later become a living reference that links into your Mechanisms and Experiments sections.'
    ],
  },
]
