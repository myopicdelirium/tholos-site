import type { Metadata } from "next";
import EngineClient from "./_components/EngineClient";
import data from "./_data/engine.json";

export const metadata: Metadata = {
  title: "Instruments — The Valuation Engine · Myopic Delirium",
  description:
    "A private-market valuation and risk engine you can interrogate: independent marks with credible intervals, a liquidation-preference waterfall, simulated futures, and a denoised risk model — live on a synthetic book.",
};

const reports = [
  ["Valuation & waterfall", "/engine/build-report-valuation.pdf"],
  ["Uncertainty", "/engine/build-report-uncertainty.pdf"],
  ["Exit simulation", "/engine/build-report-exits.pdf"],
  ["Risk model", "/engine/build-report-risk.pdf"],
] as const;

export default function InstrumentsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-12 pb-24">
      <div className="space-y-4">
        <div className="smallcaps text-[11px] text-[#6a6258]">Instruments · No. 1</div>
        <h1 className="md-display text-[54px] leading-[1.02] tracking-[-0.02em] text-[#191714]">
          The Valuation Engine
        </h1>
        <p className="max-w-[70ch] text-[14px] leading-relaxed text-[#4b443b]">
          Private holdings are marked by the people who hold them, and those marks drift optimistic. This instrument
          produces the opposing view: an independent, market-referenced mark for every position — built from listed
          comparables, a defensible marketability discount, and the liquidation-preference waterfall that naive marks
          ignore — then refuses false precision, reporting every value as a distribution and every forward claim as a
          range across assumption sets.
        </p>
        <p className="max-w-[70ch] text-[13px] leading-relaxed text-[#6a6258]">
          Everything below is live output of the engine on its synthetic demonstration book — twelve holdings whose
          true optimism drift is known by construction, so the instrument&rsquo;s readings can be checked against planted
          truth. Seed {data.meta.seed}, as-of {data.meta.as_of}; every number reproduces exactly.
        </p>
      </div>

      <div className="mt-12">
        <EngineClient data={data} />
      </div>

      <div className="mt-16 border-t rule pt-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="smallcaps text-[10px] text-[#6a6258]">Provenance</div>
            <p className="mt-2 max-w-[60ch] text-[12.5px] leading-relaxed text-[#4b443b]">
              Built in seven gated stages, each closed by an acceptance test: schemas and synthetic data with planted
              ground truth; an oracle-checked liquidation waterfall; regression-implied comparables; correlated Monte
              Carlo; a Gaussian-copula exit simulation with a full calibration-honesty audit; a Marchenko–Pastur
              denoised risk model that recovers the planted factor structure. 154 tests. The full desk build adds live
              levers — editable comparable sets, discount assumptions — over the same engines; a hosted release of that
              terminal will follow here.
            </p>
          </div>
          <div>
            <div className="smallcaps text-[10px] text-[#6a6258]">Build reports</div>
            <ul className="mt-2 space-y-1.5">
              {reports.map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-[12.5px] text-[#4b443b] underline decoration-[rgba(133,118,101,0.4)] underline-offset-4 hover:text-[#191714]"
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
  );
}
