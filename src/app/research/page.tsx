import type { Metadata } from "next";
import Link from "next/link";
import { registry, series } from "./_data/registry";
import Figures from "./_components/Figures";

export const metadata: Metadata = {
  title: "Research — working papers, methods, and reproducibility · Myopic Delirium",
  description:
    "The ledger underneath the artifacts: the working-paper series with stable citation numbers and BibTeX, the reproducibility policy and public datasets, the ODD model specification, and the responsible-research statement.",
};

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-4xl px-6 pt-12 pb-24">
        <div className="space-y-4">
          <div className="smallcaps text-[11px] text-[var(--site-muted)]">Research</div>
          <h1 className="md-display text-[44px] leading-[1.05] tracking-[-0.02em] text-[var(--site-ink)]">
            The ledger
          </h1>
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            This page is deliberately plain. It exists so that a skeptical reader can check the work rather than
            trust it: stable citation numbers, versioned revisions, the datasets behind every figure-level claim,
            a standard-format model specification, and a statement of how research on self-destruction is handled
            responsibly. The essays and instruments elsewhere on this site sit on top of this ledger, not instead
            of it.
          </p>
        </div>

        <div className="mt-14">
          <h2 className="md-display text-[24px] text-[var(--site-ink)]" id="series">Working-paper series</h2>
          <p className="mt-2 max-w-[70ch] text-[12.5px] leading-relaxed text-[var(--site-muted)]">
            {series.name} ({series.code}). {series.policy}
          </p>
          <div className="mt-6 space-y-5">
            {registry.map((wp) => (
              <div key={wp.number} className="rounded-xl border border-[var(--site-line)] p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="smallcaps text-[10px] text-[var(--site-muted)]">{wp.number}</span>
                  <span className="text-[11px] text-[var(--site-muted)]">{wp.version} · {wp.updated} · {wp.status}{wp.venue ? ` · ${wp.venue}` : ""}</span>
                </div>
                <Link
                  href={`/artifacts/${wp.slug}`}
                  className="mt-1 block text-[15px] leading-snug text-[var(--site-ink)] hover:underline decoration-[var(--site-line)] underline-offset-4"
                >
                  {wp.title}
                </Link>
                <div className="mt-1 text-[12px] text-[var(--site-muted)]">{wp.authors.join(", ")} ({wp.year})</div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-[11.5px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">BibTeX</summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-[var(--site-line)] bg-[var(--site-hover)] p-3 text-[11px] leading-relaxed text-[var(--site-body)]">{wp.bibtex}</pre>
                </details>
                {wp.reproducibility && (
                  <div className="mt-3 border-t border-[var(--site-line)] pt-3">
                    <div className="smallcaps text-[10px] text-[var(--site-muted)]">Reproducibility</div>
                    <div className="mt-1 text-[12px] leading-relaxed text-[var(--site-body)]">
                      Engine {wp.reproducibility.engine}. Live instrument:{" "}
                      <Link href={wp.reproducibility.instrument!} className="underline decoration-[var(--site-line)] underline-offset-4 hover:text-[var(--site-ink)]">
                        {wp.reproducibility.instrument}
                      </Link>
                      . {wp.reproducibility.notes}
                    </div>
                    <ul className="mt-2 space-y-1">
                      {wp.reproducibility.data!.map(([label, href]) => (
                        <li key={href}>
                          <a href={href} className="text-[12px] text-[var(--site-body)] underline decoration-[var(--site-line)] underline-offset-4 hover:text-[var(--site-ink)]">
                            {label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14">
          <h2 className="md-display text-[24px] text-[var(--site-ink)]" id="methods">Methods, in one paragraph</h2>
          <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-[var(--site-body)]">
            The program studies what changes in agent-based models when cognition is treated as a mechanistic
            substrate — persistence-gated motivation in inertial bands, a bounded attention budget without a private
            channel for physiological alarms, affect-biased bounded memory — rather than as a simplifying assumption.
            Claims are established the same way every time: seed-reproducible runs; matched baselines (pure
            optimizers embedded in the same ecology); full ablation maps that remove one mechanism at a time; and
            parameter sweeps reported as distributions across seeds, not single trajectories. Where an instrument is
            published, the instrument and the paper run the same update law, and the instrument shows its seed.
          </p>
          <ul className="mt-4 space-y-2 text-[12.5px] text-[var(--site-body)]">
            <li>
              <Link href="/research/odd-vigil" className="underline decoration-[var(--site-line)] underline-offset-4 hover:text-[var(--site-ink)]">
                Model specification (ODD protocol) — the vigil / Terminal Commitment engine
              </Link>
            </li>
            <li>
              <Link href="/research/ethics" className="underline decoration-[var(--site-line)] underline-offset-4 hover:text-[var(--site-ink)]">
                Responsible-research statement — on modeling self-destruction
              </Link>
            </li>
          </ul>
        </div>

        <div className="mt-14">
          <h2 className="md-display text-[24px] text-[var(--site-ink)]" id="figures">Published figures</h2>
          <p className="mt-2 max-w-[70ch] text-[12.5px] leading-relaxed text-[var(--site-muted)]">
            These figures are rendered in your browser from the same CSV files offered for download above — the
            figure and the data cannot disagree. Engine vigil-1.0; ten seeds per condition; 20,000 ticks per run.
          </p>
          <div className="mt-6">
            <Figures />
          </div>
        </div>

        <div className="mt-14">
          <h2 className="md-display text-[24px] text-[var(--site-ink)]" id="reproducibility">Reproducibility policy</h2>
          <div className="mt-2 max-w-[70ch] space-y-3 text-[13px] leading-relaxed text-[var(--site-body)]">
            <p>
              Every figure-level claim in a working paper is backed by a dataset downloadable from this site,
              generated by a deterministic headless run of the same engine that powers the corresponding instrument.
              Random number generation is mulberry32 throughout; seeds are recorded in the datasets and displayed
              live in the instruments. A claim that cannot be regenerated is treated as unpublished.
            </p>
            <p>
              Model descriptions follow the ODD protocol (Grimm et al.), the standard description format of the
              agent-based modeling community, so that reviewers can audit the model without reading source code —
              and so that discrepancies between description and implementation are checkable rather than deniable.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
