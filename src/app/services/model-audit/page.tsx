import type { Metadata } from "next";
import Link from "next/link";
import { Rows, Section } from "../_components/sections";

export const metadata: Metadata = {
  title: "Model audit · Services · Myopic Delirium",
  description:
    "An independent audit of a working model. Verification against documentation, robustness of the headline results, and attribution of the fit to the mechanism.",
};

const questions: ReadonlyArray<readonly [string, string]> = [
  ["Verification", "Does the code implement the stated model."],
  ["Robustness", "Do the headline results survive seeds, parameter ranges, and reasonable respecifications."],
  ["Attribution", "How much of the reported fit comes from the mechanism rather than from exogenous inputs, calibration freedom, or initial conditions."],
];

const deliverables: ReadonlyArray<readonly [string, string]> = [
  ["Scope agreement", "One page, signed before work starts. Which model version and commit, which results are in scope, which claims are tested, what counts as a material discrepancy, the reporting rule. Hashed before any run."],
  ["Verification report", "Line by line reconciliation of code against your documentation. Every divergence logged with a severity, meaning cosmetic, material, or result-changing."],
  ["Independent reimplementation", "The core mechanism, built from your documentation without reading your code, then docked against your implementation. Where the two diverge, the divergence is the finding."],
  ["Robustness map", "Seed variation, parameter sensitivity across documented ranges, and the region where the headline results hold and where they break."],
  ["Attribution analysis", "Mechanism contribution isolated from exogenous drivers, calibration freedom, and initialization, with a mean-field comparison."],
  ["Findings memo", "Six to ten pages. Every finding severity-rated, with what it does and does not imply for the published claims. Written so a non-modeler can read it."],
  ["Fix list", "Ranked, with effort estimates. What to repair, what to disclose, what to stop claiming."],
  ["Walkthrough", "Sixty minutes with whoever built the model, plus a separate short session for leadership if you want one."],
];

const schedule: ReadonlyArray<readonly [string, string]> = [
  ["Days 1 to 2", "Intake. Repository, documentation, published claims, the runs behind the headline numbers. Your reported results are reproduced from your own code before anything else. If they do not reproduce, that is finding number one and the audit pauses for a conversation."],
  ["Days 3 to 5", "Verification. Code against documentation, systematically. The divergence log is built."],
  ["Days 5 to 9", "Independent reimplementation of the core mechanism and docking against yours."],
  ["Days 9 to 12", "Robustness. Seeds, sweeps, boundary behaviour, respecification of any choice the documentation left open."],
  ["Days 12 to 14", "Attribution. Ablations, exogenous-input isolation, mean-field comparison."],
  ["Days 14 to 18", "Memo, fix list, internal review."],
  ["Days 18 to 21", "Delivery, walkthrough, one round of written follow-up questions."],
];

const priceTiers: ReadonlyArray<readonly [string, string]> = [
  ["4,000 EUR", "Under 3,000 lines, current documentation, one headline result, reimplementation of one mechanism, no client data."],
  ["5,500 to 6,500 EUR", "Up to 10,000 lines, or two to three headline results, or partial documentation, or a calibration procedure to audit."],
  ["8,000 EUR", "Larger codebases, undocumented sections requiring specification work, client data ingestion, or a calibration pipeline complex enough to audit as its own object."],
];

const severities: ReadonlyArray<readonly [string, string]> = [
  ["Critical", "A published claim is not supported by the code as it exists."],
  ["Material", "A result is real but substantially more fragile or more dependent on an exogenous input than the documentation indicates."],
  ["Minor", "Divergence between code and documentation with no effect on results."],
  ["Advisory", "Practices that will attract criticism even though nothing is currently wrong, such as missing seeds, missing configuration capture, or undocumented parameter choices."],
];

const independence = [
  "We do not audit models we built, contributed to, or advised on.",
  "We do not sell fixes for what we find. The fix list is specified so your team or a third party can act on it. If you want repairs implemented by us, that is a separate engagement quoted only after the audit closes.",
  "No contingent pricing, no success fees, no equity, no retainer tied to a clean opinion.",
  "The kernel and its constitution are public, and the retraction ledger lists our own withdrawn claims.",
];

export default function ModelAuditPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-24">
        <div className="smallcaps text-[11px] text-[var(--site-muted)]">
          <Link href="/services" className="hover:text-[var(--site-ink)]">Services</Link> · No. 02
        </div>
        <h1 className="md-display mt-3 text-[54px] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">
          Model audit
        </h1>

        <div className="mt-8 grid gap-8 pb-12 md:grid-cols-2 md:gap-12">
          <p className="text-[15px] leading-relaxed text-[var(--site-body)]">
            An independent examination of a working model against its documentation and its
            published claims. The audit answers three questions, verification, robustness, and
            attribution, and the memo answers each one separately.
          </p>
          <p className="text-[14px] leading-relaxed text-[var(--site-body)]">
            Attribution is the check that removes models from the record. A calibrated model can
            reproduce a target series closely while the agents contribute almost nothing, and the
            field has a known case where most of a celebrated fit came from an exogenous
            environmental series rather than from agent behaviour. That check runs on every audit
            whether or not you ask for it.
          </p>
        </div>

        <Section label="What it answers">
          <Rows rows={questions} labelWidth="140px" />
        </Section>

        <Section label="Deliverables">
          <Rows rows={deliverables} labelWidth="220px" />
        </Section>

        <Section label="Schedule">
          <p className="text-[13.5px] leading-relaxed text-[var(--site-body)]">
            Two to three weeks from scope signature.
          </p>
          <div className="mt-4">
            <Rows rows={schedule} labelWidth="120px" />
          </div>
          <p className="mt-4 max-w-[80ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
            Three weeks is the default. Two weeks applies when the model is under 3,000 lines, the
            documentation is current, and reimplementation is scoped to a single mechanism.
          </p>
        </Section>

        <Section label="What we need from you">
          <ul className="max-w-[80ch] space-y-2 text-[13.5px] leading-relaxed text-[var(--site-body)]">
            <li>Repository access, or a code drop with the exact commit that produced the published results.</li>
            <li>
              Documentation, whatever exists. If none exists, say so at scoping. Undocumented
              models are auditable, but the price moves and the first deliverable becomes a
              written specification.
            </li>
            <li>
              The runs behind the headline numbers, with configurations and seeds if you have
              them. If you do not have them, that is itself a finding.
            </li>
            <li>One named technical contact, roughly four hours total across the engagement.</li>
            <li>One named person with authority to approve scope.</li>
            <li>Whatever you have published, since claims are audited against the model.</li>
          </ul>
        </Section>

        <Section label="Price">
          <p className="max-w-[80ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            4,000 to 8,000 EUR, fixed at scope signature. Payment is upfront and fixed. It is
            never contingent on findings, never reduced for a clean report, and never increased
            for a severe one.
          </p>
          <div className="mt-4">
            <Rows rows={priceTiers} />
          </div>
          <p className="mt-4 max-w-[80ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
            Above roughly 15,000 lines or three mechanisms, the audit becomes a staged engagement
            quoted separately. We say so at scoping rather than after.
          </p>
        </Section>

        <Section label="Finding severities">
          <Rows rows={severities} labelWidth="120px" />
          <p className="mt-4 max-w-[80ch] text-[13.5px] leading-relaxed text-[var(--site-body)]">
            Everything is rated. Nothing is softened, and nothing is inflated to justify the fee.
            An audit licenses the statement that an independent party reproduced your results,
            reimplemented your core mechanism, mapped where your findings hold, and quantified how
            much of the fit the mechanism contributes. It does not establish that the model is
            correct, that the mechanism is the true cause, or that the results generalize beyond
            the settings tested. An audit checks internal validity and reproducibility and says
            nothing about whether the model corresponds to the world.
          </p>
        </Section>

        <Section label="Terms">
          <div className="max-w-[80ch] space-y-4 text-[13.5px] leading-relaxed text-[var(--site-body)]">
            <p>
              The likeliest outcome of a first audit is a material finding. Findings are not
              negotiable. You get factual correction, meaning we misread a file or missed a
              configuration flag, and on open engagements your written response publishes
              alongside the memo. Severity ratings do not change by request.
            </p>
            <p>
              If the audit finds a critical issue in something already published, the decision to
              correct or withdraw is entirely yours and we do not publish over you. What we do not
              do is issue a memo that omits the finding.
            </p>
          </div>
        </Section>

        <Section label="Independence">
          <ul className="max-w-[80ch] space-y-2 text-[13.5px] leading-relaxed text-[var(--site-body)]">
            {independence.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Section>

        <Section label="Publication">
          <p className="max-w-[80ch] text-[13.5px] leading-relaxed text-[var(--site-body)]">
            Closed audits run at the quoted price and nothing publishes. Scope and findings are
            hashed and timestamped, so the sequence is provable to you and to any regulator or
            funder you show it to. Open audits run at minus 15 percent. The scope publishes at
            signature and the memo publishes after a 90-day embargo, with your written response
            attached. Closed is the default.
          </p>
        </Section>

        <Section label="Scope">
          <div className="max-w-[80ch] space-y-4 text-[13.5px] leading-relaxed text-[var(--site-body)]">
            <p>
              Any simulation or formal model with runnable code is auditable, whether agent-based,
              system dynamics, microsimulation, statistical simulation, or a calibrated
              forecasting model. Machine learning training pipelines, closed models where only
              outputs are available, and models whose code we cannot execute are not auditable
              here, and we say so before invoicing.
            </p>
            <p>
              If the code cannot be shared, the audit is limited to documentation review and
              black-box behavioural testing. It is scoped and priced as that, and the memo states
              plainly which of the three questions it could not answer.
            </p>
            <p>
              An audit that finds the mechanism robust is strong external evidence. An audit that
              finds it fragile points at the discriminating study, meaning testing the mechanism
              against rivals that produce the same pattern, quoted separately.
            </p>
          </div>
        </Section>

        <div className="border-t border-[var(--site-line)] pt-6">
          <p className="max-w-[80ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
            Engagements begin with an email to myopicdelirium@gmail.com. Send the repository link
            or the documentation and one line naming the results you want audited. A scoping note
            follows within five working days stating what is auditable, which configuration fits,
            and the fixed price. Nothing is owed until you sign the scope.
          </p>
        </div>
      </section>
    </div>
  );
}
