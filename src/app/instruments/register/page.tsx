import type { Metadata } from "next";
import Link from "next/link";
import data from "./_data/register.json";

export const metadata: Metadata = {
  title: "The Register — every parameter, with provenance · Myopic Delirium",
  description:
    "Every parameter the valuation engine runs on: sources quoted verbatim, classified cited / anchored / assumed, plus the full assumptions log and the complete flattened configuration.",
};

const CLS: Record<string, { color: string; weight: number }> = {
  cited: { color: "#2e5e33", weight: 600 },
  anchored: { color: "var(--site-muted)", weight: 600 },
  assumed: { color: "#8a3033", weight: 600 },
};

function Cls({ cls }: { cls: string }) {
  const s = CLS[cls] ?? CLS.anchored;
  return (
    <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: s.color, fontWeight: s.weight }}>
      {cls}
    </span>
  );
}

const th = "smallcaps px-3 py-2 text-left text-[9.5px] font-normal text-[var(--site-muted)]";
const td = "px-3 py-2 align-top text-[12px] leading-relaxed text-[var(--site-body)]";
const tdMono = td + " font-mono text-[11px] text-[var(--site-ink)]";
const src = "text-[11px] leading-relaxed text-[var(--site-muted)]";

export default function RegisterPage() {
  const { meta } = data;
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-5xl px-6 pt-12 pb-24">
        <div className="space-y-4">
          <div className="smallcaps text-[11px] text-[var(--site-muted)]">
            <Link href="/instruments" className="hover:text-[var(--site-ink)]">Instruments · No. 1</Link> · The register
          </div>
          <h1 className="md-display text-[46px] leading-[1.04] tracking-[-0.02em] text-[var(--site-ink)]">
            The Register
          </h1>
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            Every parameter the valuation engine runs on, with its provenance. Quantitative work usually asserts its
            legitimacy by volume — large datasets, dense tables, an appendix nobody reads. This page is that appendix,
            written honestly: instead of using volume to impress, it uses volume to disclose. Every calibrated parameter
            in the exit simulation appears with its source quoted verbatim; every assumption recorded during an engine
            build is listed; the complete configuration is flattened at the bottom, one row per parameter, nothing
            omitted. If a number in the engine&rsquo;s output depends on a guess, that guess is on this page, labeled.
          </p>
          <p className="max-w-[70ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
            Generated {meta.generated} from the engine&rsquo;s live configuration and assumptions log, seed {meta.seed} —
            the page cannot drift from the engine that serves the terminal. Also available as a{" "}
            <a href="/engine/parameter-register.pdf" className="underline decoration-[var(--site-line)] underline-offset-4 hover:text-[var(--site-ink)]">
              PDF
            </a>.
          </p>
        </div>

        {/* the audit, counted */}
        <div className="mt-10 rounded-2xl border border-[var(--site-line)] p-6">
          <div className="smallcaps text-[10px] text-[var(--site-muted)]">The audit, counted</div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-2">
            {(["cited", "anchored", "assumed"] as const).map((k) => (
              <div key={k} className="flex items-baseline gap-2">
                <span className="font-mono text-[26px] text-[var(--site-ink)]">{meta.audit[k]}</span>
                <Cls cls={k} />
              </div>
            ))}
            <span className="text-[12px] text-[var(--site-muted)]">of {meta.audit.total} calibrated exit-parameter groups</span>
          </div>
          <div className="mt-4 grid gap-2 text-[12px] leading-relaxed text-[var(--site-body)] sm:grid-cols-3">
            <div><Cls cls="cited" /> — the source cites published data with no assumed component.</div>
            <div><Cls cls="anchored" /> — cites published data but marks a level or interpolation ASSUMED. Grounded, not measured.</div>
            <div><Cls cls="assumed" /> — a labeled guess, in the model because a value is required. The methodology gate exists to retire these.</div>
          </div>
          <p className="mt-4 max-w-[70ch] text-[12px] leading-relaxed text-[var(--site-muted)]">
            The engine computes this census of itself on every build and ships it in the assumptions register. A page
            like this one is only trustworthy if it can get worse — new parameters arrive as assumed and are shown as
            such.
          </p>
        </div>

        {/* I — exit calibration */}
        <div className="mt-12">
          <div className="smallcaps text-[10px] text-[#8a3033]">I · The exit calibration, in full</div>
          <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-[var(--site-body)]">
            The forward simulation rests on these groups: stage-conditional exit-type probabilities, age-conditional
            Weibull exit timing, lognormal exit multiples on last-round post-money, and the Gaussian-copula loadings
            that control how much diversification a book really has. Sources verbatim.
          </p>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--site-line)]">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[var(--site-line)]">
                  <th className={th}>stage</th><th className={th}>exit-type probabilities (sum = 1)</th>
                  <th className={th}>class</th><th className={th}>source, verbatim</th>
                </tr>
              </thead>
              <tbody>
                {data.probabilities.map((r) => (
                  <tr key={r.stage} className="border-b border-[var(--site-line)] last:border-b-0">
                    <td className={tdMono}>{r.stage}</td>
                    <td className={td}>
                      {Object.entries(r.values).map(([k, v]) => `${k} ${Number(v).toFixed(3)}`).join(" · ")}
                    </td>
                    <td className={td}><Cls cls={r.cls} /></td>
                    <td className={td}><span className={src}>{r.source}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--site-line)]">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[var(--site-line)]">
                  <th className={th}>stage</th><th className={th}>Weibull time-to-exit</th>
                  <th className={th}>class</th><th className={th}>source, verbatim</th>
                </tr>
              </thead>
              <tbody>
                {data.weibull.map((r) => (
                  <tr key={r.stage} className="border-b border-[var(--site-line)] last:border-b-0">
                    <td className={tdMono}>{r.stage}</td>
                    <td className={td}>shape {r.shape.toFixed(2)}, scale {r.scale.toFixed(2)} y</td>
                    <td className={td}><Cls cls={r.cls} /></td>
                    <td className={td}><span className={src}>{r.source}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--site-line)]">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[var(--site-line)]">
                  <th className={th}>exit type</th><th className={th}>multiple on last post-money (log)</th>
                  <th className={th}>class</th><th className={th}>source, verbatim</th>
                </tr>
              </thead>
              <tbody>
                {data.multiples.map((r) => (
                  <tr key={r.exit_type} className="border-b border-[var(--site-line)]">
                    <td className={tdMono}>{r.exit_type}</td>
                    <td className={td}>mu_log {r.mu_log >= 0 ? "+" : ""}{r.mu_log.toFixed(3)}, sigma_log {r.sigma_log.toFixed(3)}</td>
                    <td className={td}><Cls cls={r.cls} /></td>
                    <td className={td}><span className={src}>{r.source}</span></td>
                  </tr>
                ))}
                <tr>
                  <td className={tdMono}>copula loadings</td>
                  <td className={td}>
                    type {data.copula.type_loading.toFixed(2)}, time {data.copula.time_loading.toFixed(2)}, multiple {data.copula.multiple_loading.toFixed(2)}
                  </td>
                  <td className={td}><Cls cls={data.copula.cls} /></td>
                  <td className={td}><span className={src}>{data.copula.source}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* II — the assumptions log */}
        <div className="mt-12">
          <div className="smallcaps text-[10px] text-[#8a3033]">II · The assumptions register — one engine build, fully logged</div>
          <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-[var(--site-body)]">
            Every assumption a module recorded while the engine and its synthetic reference data were built at seed{" "}
            {meta.seed}: {meta.n_register_entries} entries, append-only, grouped by module. Synthetic-data entries are
            planted ground truth — later stages are tested on recovering them, which is what makes the synthetic book a
            control rather than a decoration.
          </p>
          {data.modules.map((m) => (
            <div key={m.module} className="mt-6">
              <div className="smallcaps text-[10px] text-[var(--site-muted)]">module · {m.module} ({m.entries.length})</div>
              <div className="mt-2 overflow-x-auto rounded-2xl border border-[var(--site-line)]">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-[var(--site-line)]">
                      <th className={th}>name</th><th className={th}>value</th>
                      <th className={th}>units</th><th className={th}>source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.entries.map((e) => (
                      <tr key={e.name} className="border-b border-[var(--site-line)] last:border-b-0">
                        <td className={tdMono}>{e.name}</td>
                        <td className={td}>{e.value}</td>
                        <td className={td}><span className={src}>{e.units ?? "—"}</span></td>
                        <td className={td}><span className={src}>{e.source ?? "—"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* III — the complete configuration */}
        <div className="mt-12">
          <div className="smallcaps text-[10px] text-[#8a3033]">III · Appendix — the complete configuration, flattened</div>
          <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-[var(--site-body)]">
            All {data.config.length} configuration values the engine loads, as dotted paths — every numeric parameter,
            every label, every cap and limit. This is deliberately exhaustive: the reader who wants to know whether a
            number exists that is not disclosed can check that it does not.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--site-line)]">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--site-line)]">
                  <th className={th}>parameter</th><th className={th}>value</th>
                </tr>
              </thead>
              <tbody>
                {data.config.map(([k, v], i) => (
                  <tr key={i} className="border-b border-[var(--site-line)] last:border-b-0">
                    <td className={tdMono + " whitespace-nowrap"}>{k}</td>
                    <td className={td + " font-mono text-[11px]"}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--site-line)] pt-6">
          <p className="max-w-[70ch] text-[12px] leading-relaxed text-[var(--site-muted)]">
            Regenerated with the engine (scripts/export_register_data.py) — the page renders a precomputed export and
            computes nothing. Back to{" "}
            <Link href="/instruments" className="underline decoration-[var(--site-line)] underline-offset-4 hover:text-[var(--site-ink)]">
              the instrument
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
