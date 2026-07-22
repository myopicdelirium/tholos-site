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
    id: "home-next-to-the-danger",
    title: "Phase 3: the home next to the danger",
    body: [
      "Phase 3 put the home next to the danger. Storms now strike the nests, and the decision code did not change to meet them: core/drives.py and core/action.py have an empty diff this phase, so every death below was produced by machinery that predates the collision. Two populations, identical except that one is bonded to its nest and one is not, ten seeds each: storm mortality 29% against 0%, bonded higher in all ten. The spec demanded a 5 point excess to count as a collision; the model delivered 29.",
      "At storm onset, deaths were zero, and every excess death, fifty of fifty, was an agent that escaped the storm and then went back into it. The bond never pins an agent down; it only ever pulls them back. They died because of home, and not one of them died for it; nothing in these agents can weigh a home against a life yet.",
      "One pre-registered prediction failed, and the failure is worth more than the passes. We predicted that a longer warning before the storm saves lives; as built, it did the opposite, mortality rising from 0.25 to 1.00 as the ramp lengthened, because the harm arrived gradually with the signal, and gradual harm never gives a lagged creature one decisive tick. Splitting the warning from the arrival flips the sign completely, 0.25 down to 0.00; the theory had fused two things the model refuses to keep fused, and that split gets its own entry.",
      "Also in the deviations: with one nest instead of five, crowding starved 22 of 200 agents before any storm existed. Commitment carries a cost even in peacetime.",
    ],
  },
  {
    id: "attachment-and-home",
    title: "Phase 2: attachment and home",
    body: [
      "Our next phase starts with five nests, and every agent is born at one. Attachment grows while an agent is home, about 500 ticks to full, and fades while it is away, about 5,000 ticks. Separation distress is a fourth drive, attachment times distance from home, and returning home is a fifth action. The weight obeys the same one-line law as everything else, tau 60, the slowest thing an agent feels. No new mechanism anywhere.",
      "Before any of this was written, a prep commit recorded per-array hashes of the Phase 1 golden run. With nests set to zero, the Phase 2 code reproduces every Phase 1 behavioral array bit for bit, positions, energy, integrity, fatigue, deaths, all six hashes identical, and the equivalence is enforced as a permanent test. Adding the capacity changed nothing about the creature that lacked it.",
      "The finding: three populations, identical except for attachment at birth, 0, 0.5, and 1, hold average distances from home of 36.1, 11.4, and 9.5. One number, set once, reorganizes how a life uses space. The homerange fell out of missing home under argmax. All five acceptance criteria passed with nothing recalibrated, the first phase where nothing had to be fixed. Phase 3 puts a bonded agent's home next to the danger.",
    ],
  },
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
