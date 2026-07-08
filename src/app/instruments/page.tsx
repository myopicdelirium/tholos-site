import type { Metadata } from "next";
import Link from "next/link";
import EngineClient from "./_components/EngineClient";
import data from "./_data/engine.json";

export const metadata: Metadata = {
  title: "Instruments — The Valuation Engine · Myopic Delirium",
  description:
    "A private-market valuation and risk engine you can interrogate: independent marks with credible intervals, a liquidation-preference waterfall, simulated futures, and a denoised risk model — live on a synthetic book.",
};

const reports = [
  ["The register — every parameter, with provenance", "/instruments/register"],
  ["The user's manual", "/engine/users-manual.pdf"],
  ["Valuation & waterfall", "/engine/build-report-valuation.pdf"],
  ["Uncertainty", "/engine/build-report-uncertainty.pdf"],
  ["Exit simulation", "/engine/build-report-exits.pdf"],
  ["Risk model", "/engine/build-report-risk.pdf"],
] as const;

export default function InstrumentsPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-24">
        <div className="space-y-4">
          <div className="smallcaps text-[11px] text-[var(--site-muted)]">Instruments · No. 1</div>
          <h1 className="md-display text-[54px] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">
            The Valuation Engine
          </h1>
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            Private holdings are marked by the people who hold them, and those marks drift optimistic. This instrument
            produces the opposing view: an independent, market-referenced mark for every position — built from listed
            comparables, a defensible marketability discount, and the liquidation-preference waterfall that naive marks
            ignore — then refuses false precision, reporting every value as a distribution and every forward claim as a
            range across assumption sets.
          </p>
          <p className="max-w-[70ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
            Everything below is live output of the engine on its synthetic demonstration book — twelve holdings whose
            true optimism drift is known by construction, so the instrument&rsquo;s readings can be checked against planted
            truth. Seed {data.meta.seed}, as-of {data.meta.as_of}; every number reproduces exactly.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/instruments/terminal"
            className="block rounded-2xl border border-[var(--site-line)] p-6 transition hover:bg-[var(--site-hover)] hover:translate-y-[-1px]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="smallcaps text-[10px] text-[var(--site-muted)]">The terminal</div>
                <div className="md-display mt-1 text-[22px] leading-tight text-[var(--site-ink)]">
                  Run it on your own holding →
                </div>
              </div>
              <p className="max-w-[46ch] text-[12.5px] leading-relaxed text-[var(--site-muted)]">
                Build a cap table and watch your payoff answer back live; paste your comparables; get a
                mark with its band. Everything below is the demonstration — the terminal is the tool.
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-4">
          <Link
            href="/instruments/vigil"
            className="block rounded-2xl border border-[var(--site-line)] p-6 transition hover:bg-[var(--site-hover)] hover:translate-y-[-1px]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="smallcaps text-[10px] text-[var(--site-muted)]">Instruments · No. 2</div>
                <div className="md-display mt-1 text-[22px] leading-tight text-[var(--site-ink)]">
                  The Vigil →
                </div>
              </div>
              <p className="max-w-[46ch] text-[12.5px] leading-relaxed text-[var(--site-muted)]">
                A self-measuring model of terminal commitment: a living population in which no death is
                scripted, beside a phase diagram computed live from the same law — with one-click
                mechanism ablations.
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-12 rounded-2xl border border-[rgba(20,16,10,0.12)] bg-[var(--site-field-bg)] p-4 sm:p-6">
          <EngineClient data={data} />
        </div>

        <div className="mt-16 border-t border-[var(--site-line)] pt-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="smallcaps text-[10px] text-[var(--site-muted)]">Provenance</div>
              <p className="mt-2 max-w-[60ch] text-[12.5px] leading-relaxed text-[var(--site-body)]">
                Built in seven gated stages, each closed by an acceptance test: schemas and synthetic data with planted
                ground truth; an oracle-checked liquidation waterfall; regression-implied comparables; correlated Monte
                Carlo; a Gaussian-copula exit simulation with a full calibration-honesty audit; a Marchenko–Pastur
                denoised risk model that recovers the planted factor structure. 211 tests. The terminal above is the
                hosted release of the full desk build — the same engines behind an access code, with every lever
                exposed. The register alongside discloses every parameter the engine runs on, with its source and its
                honesty class; what is assumed is labeled assumed.
              </p>
            </div>
            <div>
              <div className="smallcaps text-[10px] text-[var(--site-muted)]">The paper trail</div>
              <ul className="mt-2 space-y-1.5">
                {reports.map(([label, href]) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="text-[12.5px] text-[var(--site-body)] underline decoration-[var(--site-line)] underline-offset-4 hover:text-[var(--site-ink)]"
                    >
                      {label} (PDF)
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
