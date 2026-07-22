// Homepage articles — open in an on-page pop-down (not routes).
// A post is a title and its text. Nothing else: no images, no dates.
// Newest first; the rail shows three at a time and slides to the rest.

export type Post = {
  id: string;
  title: string;
  /** One entry per paragraph. */
  body: string[];
};

export const posts: Post[] = [
  {
    id: "inversion-is-public",
    title: "Inversion is public",
    body: [
      "Inversion is public. github.com/myopicdelirium/inversion holds the constitution, the spec, the tests, the implementation, and the validation, committed in that order. It exists to see whether a commitment could come to outrank survival without anyone writing that outcome into the code. The entire mechanism is w += (u - w) / tau. A weight drifts toward its urgency at a fixed rate, and everything else is bookkeeping.",
      "The constraints predate the agent. Identifiers containing sacrifice, martyr, hero, or altruism fail the build, and the word death appears nowhere in the decision code; a test enforces that. We verified the tests by injecting violations and watching them fail. Fear is deliberately the fastest emotion in the model, tau 12 against 20 for hunger and 30 for tiredness, a handicap against the future result, declared before the result exists. The lags are measured, not assumed: fear fitted at 11.85 ticks against the declared 12, hunger at 20.00 against 20, and across 300,000 recorded decisions every update obeys the law to within 5.6e-17, the noise floor of the machine. Agents already pay for slow feeling: they take damage in the ticks before fear catches up, then retreat. Anyone can rerun all of it with three commands, and every run records its seed, its configuration fingerprint, and its exact code version, bit for bit.",
      "We do not yet have commitments, grief, sacrifice, so nothing has ever died for anything. When commitment arrives, it will be a new column in the same array, under the same law. The point of phase 1 is that the delay is built, measured, and public before anything exists that could exploit it.",
    ],
  },
];
