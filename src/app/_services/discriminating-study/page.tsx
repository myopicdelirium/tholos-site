import type { Metadata } from "next";
import Link from "next/link";
import { Rows, Section } from "../_components/sections";

export const metadata: Metadata = {
  title: "Discriminating study · Services · Myopic Delirium",
  description:
    "Several mechanisms can produce the same pattern. The study determines which candidates can produce yours, where the survivors predict different things, and which one the existing evidence favours.",
};

const questions: ReadonlyArray<readonly [string, string]> = [
  ["Coverage", "Which candidate mechanisms can produce the pattern at all, and which cannot."],
  ["Discrimination", "Where the survivors make different predictions, meaning the observables that separate them."],
  ["Adjudication", "Which survivor the existing evidence favours, and what evidence would settle what remains open."],
];

const deliverables: ReadonlyArray<readonly [string, string]> = [
  ["Candidate registration", "The rival mechanisms named and specified before any of them is built, with the pattern, the statistics, pass and fail criteria for each candidate, and the pre-committed discrimination protocol. Signed and hashed before runs."],
  ["Mechanism library", "Each candidate implemented as a working model on a shared substrate, same world, same measurement apparatus, same run budget. Comparability is enforced by construction."],
  ["Coverage table", "Every candidate against every target statistic, with pass, fragile, or fail per cell, and the parameter region for each."],
  ["Discrimination map", "The observables where surviving candidates diverge, each with the predicted direction and magnitude per mechanism, and an assessment of whether the divergence is measurable with instruments you could realistically field."],
  ["Adjudication section", "What your existing data already says about those observables, which candidates it is compatible with, and which it strains."],
  ["Sensitivity appendix", "Whether the ranking survives seed variation, parameter ranges, and reasonable respecification of each candidate. A ranking that flips inside plausible ranges is reported as flipping."],
  ["Measurement proposal", "The study design that would discriminate between whatever survives. Instruments, quantities, sample requirements, expected discriminating power."],
  ["Technical report", "25 to 40 pages. Full specifications for every candidate and a complete reproduction appendix."],
  ["Executive summary", "Four pages, written for people who will not open the technical report."],
  ["Walkthrough", "Two sessions, one technical, one for leadership."],
];

const sources: ReadonlyArray<readonly [string, string]> = [
  ["Yours", "The mechanism you believe."],
  ["The literature's", "The established rival accounts in your domain, drawn from primary sources, with the specific papers cited in the registration."],
  ["Ours", "Any mechanism the formalization process surfaces that nobody in the debate has stated."],
];

const schedule: ReadonlyArray<readonly [string, string]> = [
  ["Week 1", "Candidate identification and specification. Literature extraction, formalization of every candidate, the shared substrate defined, target statistics fixed, criteria signed and hashed."],
  ["Weeks 2 to 3", "Implementation. Every candidate built and verified against its specification, goldens and unit tests per candidate, controls per candidate."],
  ["Week 4", "Coverage runs. Every candidate against every statistic across declared parameter ranges. Failures logged, survivors identified."],
  ["Week 5", "Discrimination. Systematic search for observables where survivors diverge, then quantification of the divergence and its measurability."],
  ["Week 6", "Adjudication and sensitivity. Existing evidence mapped onto the discriminating observables, ranking stability tested."],
  ["Weeks 7 to 8", "Report, summary, measurement proposal, internal review, delivery, walkthroughs."],
];

const priceTiers: ReadonlyArray<readonly [string, string]> = [
  ["15,000 EUR", "Three candidates, one target statistic, specifications available in the literature, no client data, four to five weeks."],
  ["18,000 to 21,000 EUR", "Four candidates, or two target statistics, or one candidate requiring specification from scratch, or client data ingestion."],
  ["25,000 EUR", "Five to six candidates, multiple statistics, network or spatial structure, or a discrimination search across a large observable space."],
];

const outcomes: ReadonlyArray<readonly [string, string]> = [
  ["Elimination", "Some candidates cannot produce the pattern. This removes stories from the debate, possibly including yours."],
  ["Discrimination achieved", "Survivors diverge on measurable observables. The report lists them and the design to test them."],
  ["Underdetermination", "Survivors produce the pattern and agree everywhere currently measurable. This is reported plainly. It means the pattern cannot adjudicate the debate and different data is needed. It is common."],
  ["Coverage failure", "No candidate produces the pattern, including the literature's. The generating mechanism is not yet in the debate. Rare."],
];

const controls = [
  "The candidate set is fixed at registration and cannot change afterward, in either direction. No adding a rival, no dropping a survivor.",
  "Discrimination criteria are pre-committed before any candidate runs.",
  "Rival specifications are drawn from cited primary sources, and the citations are in the registration where you and any critic can check them.",
  "Where a rival's specification is unclear in the literature, the ambiguity is resolved in the rival's favour and logged.",
  "If your mechanism is eliminated, the executive summary says so.",
  "No contingent pricing, no success fees, no discount for a favourable ranking.",
  "Client input into rival specification is logged and disclosed in the report.",
];

export default function DiscriminatingStudyPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-24">
        <div className="smallcaps text-[11px] text-[var(--site-muted)]">
          <Link href="/services" className="hover:text-[var(--site-ink)]">Services</Link> · No. 03
        </div>
        <h1 className="md-display mt-3 text-[54px] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">
          Discriminating study
        </h1>

        <div className="mt-8 grid gap-8 pb-12 md:grid-cols-2 md:gap-12">
          <p className="text-[15px] leading-relaxed text-[var(--site-body)]">
            Several mechanisms can produce the same pattern. The mechanism test establishes that
            your story is capable of producing yours. This study establishes which candidate
            stories the evidence favours, and what to measure to settle what remains open. The
            study answers three questions, and the report answers each one separately.
          </p>
          <p className="text-[14px] leading-relaxed text-[var(--site-body)]">
            A single macro pattern is typically reachable from many different micro rules, so
            showing that one mechanism produces the pattern never shows it is the cause. The most
            useful output is usually the set of observables where the surviving candidates predict
            different things, since that is what makes the next round of empirical work decisive.
          </p>
        </div>

        <Section label="What it answers">
          <Rows rows={questions} labelWidth="150px" />
        </Section>

        <Section label="Deliverables">
          <Rows rows={deliverables} labelWidth="220px" />
        </Section>

        <Section label="Candidates">
          <Rows rows={sources} labelWidth="150px" />
          <p className="mt-4 max-w-[80ch] text-[13.5px] leading-relaxed text-[var(--site-body)]">
            The mix is fixed at registration. Three to six candidates is the working range. Two
            candidates is two mechanism tests rather than a discriminating study, and above six
            the comparison degrades, in which case we say so at scoping. Every candidate is built
            to the same standard, with the same parameter search and the same care as yours.
          </p>
        </Section>

        <Section label="Schedule">
          <p className="text-[13.5px] leading-relaxed text-[var(--site-body)]">
            Four to eight weeks from registration.
          </p>
          <div className="mt-4">
            <Rows rows={schedule} labelWidth="120px" />
          </div>
          <p className="mt-4 max-w-[80ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
            Four weeks applies at three candidates with one target statistic and specifications
            already available in the literature. Eight weeks applies at five or six candidates,
            multiple statistics, or candidates that need specification from scratch.
          </p>
        </Section>

        <Section label="What we need from you">
          <ul className="max-w-[80ch] space-y-2 text-[13.5px] leading-relaxed text-[var(--site-body)]">
            <li>The pattern, with the data behind it.</li>
            <li>Your mechanism and your reading of the rivals, meaning which accounts you consider live.</li>
            <li>One scoping session of three hours, plus roughly two hours weekly through the engagement.</li>
            <li>One named person with authority to approve the registration.</li>
            <li>Any non-public data relevant to the discriminating observables. Often this is where adjudication comes from.</li>
          </ul>
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--site-muted)]">
            Total client time is roughly fifteen to twenty hours across the engagement.
          </p>
        </Section>

        <Section label="Price">
          <p className="max-w-[80ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            15,000 to 25,000 EUR, fixed at registration.
          </p>
          <div className="mt-4">
            <Rows rows={priceTiers} labelWidth="190px" />
          </div>
          <p className="mt-4 max-w-[80ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
            Payment is staged. Fifty percent at registration, thirty percent at the coverage
            table, twenty percent at delivery. Stages are date-triggered and deliverable-triggered,
            never outcome-triggered. Nothing in the coverage table changes what is owed.
          </p>
        </Section>

        <Section label="Outcomes">
          <Rows rows={outcomes} labelWidth="190px" />
          <p className="mt-4 max-w-[80ch] text-[13.5px] leading-relaxed text-[var(--site-body)]">
            The study licenses claims that a specific set of mechanisms can or cannot generate the
            pattern under stated conditions, claims that surviving mechanisms differ on named
            observables, and a research agenda pointed at the quantities that would settle the
            question. It does not establish that the winning mechanism is true, that the
            eliminated ones are false in the world rather than in the modeled world, or that the
            candidate set was exhaustive. The registration names which mechanisms were considered,
            which were excluded, and why. Elimination is stronger evidence than survival. A
            mechanism that survives has demonstrated possibility alongside its rivals.
          </p>
        </Section>

        <Section label="Procedure controls">
          <ul className="max-w-[80ch] space-y-2 text-[13.5px] leading-relaxed text-[var(--site-body)]">
            {controls.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Section>

        <Section label="Publication">
          <p className="max-w-[80ch] text-[13.5px] leading-relaxed text-[var(--site-body)]">
            Open engagements run at the quoted price minus 10 percent. The registration publishes
            at signature and the full report publishes after a 90-day embargo, whichever way it
            lands, with your written response attached. Closed engagements run at the quoted price
            and nothing publishes. The registration and criteria are still hashed and timestamped,
            so pre-commitment remains provable to funders, reviewers, or regulators.
          </p>
        </Section>

        <Section label="Prerequisites">
          <div className="max-w-[80ch] space-y-4 text-[13.5px] leading-relaxed text-[var(--site-body)]">
            <p>
              This study is not sold cold. A mechanism test on at least one candidate, or an audit
              if you have an existing model, comes first. The fee for that prior engagement is
              credited in full against this one.
            </p>
            <p>
              The reason is practical. Most questions that arrive framed as discriminating studies
              turn out, at formalization, to be underspecified in ways a mechanism test exposes in
              ten days for a fraction of the cost. Finding that out in week three of an eight-week
              engagement serves nobody.
            </p>
          </div>
        </Section>

        <div className="border-t border-[var(--site-line)] pt-6">
          <p className="max-w-[80ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
            Engagements begin with an email to myopicdelirium@gmail.com. Send the pattern, your
            mechanism, and the rival accounts you consider live. A scoping note follows within
            five working days naming the candidate set we would register, the target statistics,
            the configuration, and the fixed price. Nothing is owed until you sign the
            registration.
          </p>
        </div>
      </section>
    </div>
  );
}
