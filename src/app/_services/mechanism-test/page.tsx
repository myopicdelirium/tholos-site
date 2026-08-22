import type { Metadata } from "next";
import Link from "next/link";
import { Rows, Section } from "../_components/sections";

export const metadata: Metadata = {
  title: "Mechanism test · Services · Myopic Delirium",
  description:
    "You claim a mechanism drives a pattern. We build the minimal working version and report whether the pattern emerges, under pass and fail criteria signed before anything runs.",
};

const deliverables = [
  {
    name: "Registration page",
    body: "One page. The causal chain as arrows, the target statistic, pass and fail thresholds, parameter sources, run count, reporting rule. Signed by both parties and hashed into the repository before any verdict run exists.",
  },
  {
    name: "Model specification",
    body: "State variables, agent types, update rules per arrow, interaction structure, a parameter table with a source on every line, schedule, target statistic, control definition. Written to ODD convention. Independently implementable.",
  },
  {
    name: "Verdict memo",
    body: "Three pages. The chain as tested, the verdict, the region of parameter space where it holds and where it fails, the updated assumptions list, the limits paragraph.",
  },
  {
    name: "Reproduction appendix",
    body: "Seeds, configuration hashes, repository tag, run logs. Your analyst can pull it and reproduce the numbers bit for bit.",
  },
  {
    name: "Walkthrough",
    body: "Thirty minutes, live, once the memo is delivered.",
  },
];

const schedule: ReadonlyArray<readonly [string, string]> = [
  ["Day 1", "Formalization. The chain becomes the specification. Every ambiguity is resolved by decision and logged. Every parameter is sourced to your text, to cited literature, or flagged free with a documented range. The pattern becomes a computable statistic with the signed thresholds attached."],
  ["Day 2", "Build. Implementation on the existing kernel, with unit tests and golden runs confirming the code matches the specification. A control twin is built, the same world with the mechanism disabled or scrambled. Without a control there is no verdict."],
  ["Day 3", "Shakedown. Mean-field comparison, since a mechanism reproduced by three equations did not need agents, and the memo would say so. Parameter sweep across the documented ranges on declared exploration seeds."],
  ["Day 4", "Verdict runs. Fresh seeds, the pre-registered run count, mechanism against control, the verdict computed against the signed thresholds, and a check on whether the verdict flips anywhere inside the plausible ranges."],
  ["Days 5 to 7", "Memo, appendix, internal review."],
  ["Days 8 to 10", "Buffer, delivery, walkthrough."],
];

const priceTiers: ReadonlyArray<readonly [string, string]> = [
  ["2,500 EUR", "Three or fewer free parameters, one public target statistic, no data ingestion, full mixing or a simple neighbourhood structure."],
  ["3,000 to 3,500 EUR", "Four to six free parameters, or two target statistics, or an explicit network structure, or a second control specification."],
  ["4,000 EUR", "Client data ingestion, heterogeneous agent types drawn from your survey, or a mechanism with feedback across more than three arrows."],
];

const verdicts: ReadonlyArray<readonly [string, string]> = [
  ["Pass, robust", "The pattern emerges with the mechanism, fails to emerge in the control, and holds across the declared parameter ranges."],
  ["Pass, fragile", "The pattern emerges in part of the declared space. The memo states which part and what has to be true of the world for the story to work. This is the most common outcome, and it converts a qualitative story into a set of conditions."],
  ["Fail", "The pattern does not emerge anywhere in the declared space, with the control differentiating."],
  ["Void", "A verification fault is found after registration, meaning the code did not implement the signed specification. The fault is written up and disclosed regardless of which way it cut. You choose a re-run at no charge or a full refund."],
];

const controls = [
  "Criteria are signed and hashed before any verdict run exists. The hash is public at signature and timestamps the criteria against the result.",
  "Parameters are fixed from stated sources before runs. No parameter is ever adjusted by observing whether the pattern appeared. This is enforced structurally in the kernel.",
  "Exploration runs use declared seeds. Verdict runs use fresh seeds. Both sets are reported.",
  "Post-hoc observations are flagged as post-hoc in the memo and carry no verdict weight.",
  "The mechanism is written from your stated story, including the parts we would have built differently.",
];

export default function MechanismTestPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-24">
        <div className="smallcaps text-[11px] text-[var(--site-muted)]">
          <Link href="/services" className="hover:text-[var(--site-ink)]">Services</Link> · No. 01
        </div>
        <h1 className="md-display mt-3 text-[54px] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">
          Mechanism test
        </h1>

        <div className="mt-8 grid gap-8 pb-12 md:grid-cols-2 md:gap-12">
          <p className="text-[15px] leading-relaxed text-[var(--site-body)]">
            You claim mechanism M drives pattern P. We build the minimal working version of M and
            report whether P emerges, under pass and fail criteria both sides sign before anything
            runs. You receive the verdict either way.
          </p>
          <p className="text-[14px] leading-relaxed text-[var(--site-body)]">
            The test answers whether your stated causal story is capable of producing the pattern
            you observed. A mechanism written in prose carries assumptions that stay invisible until
            the story is built as running code and made to generate its own outcome. Part of the
            deliverable is the list of decisions your text never made.
          </p>
        </div>

        <Section label="Deliverables">
          <Rows rows={deliverables.map((d) => [d.name, d.body] as const)} />
        </Section>

        <Section label="Schedule">
          <p className="text-[13.5px] leading-relaxed text-[var(--site-body)]">
            Ten working days from signature.
          </p>
          <div className="mt-4">
            <Rows rows={schedule} labelWidth="120px" />
          </div>
          <p className="mt-4 max-w-[80ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
            Accelerated delivery in five working days is available at plus 50 percent, with the
            reduced parameter sweep stated on the registration page so the narrower coverage is on
            the record.
          </p>
        </Section>

        <Section label="What we need from you">
          <ul className="space-y-2 text-[13.5px] leading-relaxed text-[var(--site-body)]">
            <li>The document stating the mechanism, published or internal.</li>
            <li>One scoping call, 90 minutes.</li>
            <li>One named person with authority to approve the criteria.</li>
            <li>Sign-off on the registration page, typically 20 minutes of reading.</li>
            <li>Optionally, any non-public data you want the parameters sourced from.</li>
          </ul>
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--site-muted)]">
            Total client time is roughly two and a half hours across the ten days.
          </p>
        </Section>

        <Section label="Price">
          <p className="max-w-[80ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            2,500 to 4,000 EUR, fixed at signature. The quote is issued before you sign and does not
            move afterward. Overruns are ours. SEK invoicing is available. EU cross-border invoices
            run on reverse charge.
          </p>
          <div className="mt-4">
            <Rows rows={priceTiers} />
          </div>
          <p className="mt-4 max-w-[80ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
            Fixed fee, invoiced in full at signature, runs begin on receipt. No outcome-linked
            pricing, no success fees, no retainers, no discount conditional on the verdict.
          </p>
        </Section>

        <Section label="Verdicts">
          <Rows rows={verdicts} labelWidth="120px" />
          <p className="mt-4 max-w-[80ch] text-[13.5px] leading-relaxed text-[var(--site-body)]">
            A verdict speaks to whether the stated mechanism is sufficient, on its own, to generate
            the stated pattern in a minimal world built to give it every chance. It does not speak
            to your empirical setting, to effect sizes, to forecasts, or to your actual population.
            A failure is logically stronger than a pass. A pass establishes possibility and does not
            rule out rival mechanisms producing the same pattern from different machinery.
            Discriminating between rivals is a separate engagement.
          </p>
        </Section>

        <Section label="Procedure controls">
          <ul className="max-w-[80ch] space-y-2 text-[13.5px] leading-relaxed text-[var(--site-body)]">
            {controls.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Section>

        <Section label="Reproducibility">
          <p className="max-w-[80ch] text-[13.5px] leading-relaxed text-[var(--site-body)]">
            Every run is seeded and every configuration hashed. Replays are bit-identical. You
            receive the specification, the seeds, the hashes, and the repository tag. The kernel and
            its constitution are public. If your analyst wants to attack the implementation, they
            have everything needed to do it.
          </p>
        </Section>

        <Section label="Publication">
          <p className="max-w-[80ch] text-[13.5px] leading-relaxed text-[var(--site-body)]">
            Open engagements run at the quoted price. The registration page publishes at signature
            and the verdict publishes after a 30-day embargo, in full, whichever way it goes. Closed
            engagements run at plus 20 percent and nothing publishes. The registration is still
            hashed and timestamped, so the criteria remain provably pre-committed even though nobody
            else sees them.
          </p>
        </Section>

        <Section label="Scope">
          <div className="max-w-[80ch] space-y-4 text-[13.5px] leading-relaxed text-[var(--site-body)]">
            <p>
              A testable claim is a causal chain of two or more links, stated in text specifically
              enough to quote, ending in an outcome you have measured or observed. Claims with no
              stated mechanism, single-link correlations, purely normative claims, and mechanisms
              whose only content is a statistical relationship already estimated in your own data
              are not testable, and we say so before invoicing. If the scoping call finds the
              question underspecified, we say so and charge nothing. If it is testable but needs
              design work first, that is the feasibility memo, priced separately.
            </p>
            <p>
              A robust pass supports a full study that adds empirical calibration. A fragile pass
              points at the conditions worth measuring next. A failure opens the search for what
              does produce the pattern. All three are the discriminating study, quoted separately.
            </p>
          </div>
        </Section>

        <div className="border-t border-[var(--site-line)] pt-6">
          <p className="text-[13px] leading-relaxed text-[var(--site-muted)]">
            Engagements begin with an email to myopicdelirium@gmail.com. Send the document stating
            the mechanism and we schedule the scoping call.
          </p>
        </div>
      </section>
    </div>
  );
}
