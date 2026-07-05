"use client";

/**
 * The Valuation Engine — interactive surface.
 *
 * Every number on this page is real, precomputed output of the seeded engine
 * (pve, stages 0–6): the scenario toggles switch between eight genuinely
 * simulated states; nothing is invented client-side. The one display-side
 * computation is the DLOM slider, which applies the stated linear haircut
 * mark = stake × (1 − d) — shown precisely because it is that simple.
 */

import { useMemo, useState } from "react";
import {
  Bridge, Fan, HBars, Heatmap, Hist, PayoffCurve, RangeBars, RangeDots, Spectrum,
} from "./charts";

type EngineData = typeof import("../_data/engine.json");

const OX = "#8a3033";
const SEA = "#3e6b50";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function fmtM(v: number, d = 1) {
  return `${v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d })} M`;
}

function pct(v: number, d = 1) {
  return `${(v * 100).toFixed(d)}%`;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("paper shadow-paper border rule rounded-2xl p-6", className)}>{children}</div>
  );
}

function SectionHead({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div className="space-y-2">
      <div className="smallcaps text-[10px] text-[#6a6258]">{kicker}</div>
      <h2 className="md-display text-[26px] leading-[1.1] tracking-[-0.01em] text-[#191714]">{title}</h2>
      {note ? <p className="max-w-[68ch] text-[13px] leading-relaxed text-[#4b443b]">{note}</p> : null}
    </div>
  );
}

export default function EngineClient({ data }: { data: EngineData }) {
  const [selectedId, setSelectedId] = useState(data.holdings[0].id);
  const [scen, setScen] = useState({ c: false, w: false, o: false });
  const holding = useMemo(
    () => data.holdings.find((h) => h.id === selectedId) ?? data.holdings[0],
    [data, selectedId]
  );
  const [dlom, setDlom] = useState<number | null>(null);
  const scenKey = `c${scen.c ? 1 : 0}w${scen.w ? 1 : 0}o${scen.o ? 1 : 0}` as keyof EngineData["scenarios"];
  const S = data.scenarios[scenKey];
  const base = data.scenarios.c0w0o0;

  const activeDlom = dlom ?? holding.dlom.central;
  const markAtDlom = holding.bridge.waterfall_stake * (1 - activeDlom);
  const sortedHoldings = useMemo(
    () => [...data.holdings].sort((a, b) => Math.abs(b.gap_rel) - Math.abs(a.gap_rel)),
    [data]
  );

  return (
    <div className="space-y-16">
      {/* ------------------------------ headline ------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="smallcaps text-[10px] text-[#6a6258]">Market-referenced NAV</div>
          <div className="mono mt-2 text-[26px] leading-none text-[#191714]">
            {data.headline.nav_band[0].toFixed(0)}–{data.headline.nav_band[1].toFixed(0)} M
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-[#6a6258]">
            {Math.round(data.meta.alpha * 100)}% credible interval · central {data.headline.nav_central.toFixed(0)} M.
            A range, because an honest mark has one.
          </p>
        </Card>
        <Card>
          <div className="smallcaps text-[10px] text-[#6a6258]">The book&rsquo;s own marks</div>
          <div className="mono mt-2 text-[26px] leading-none text-[#191714]">
            {data.headline.self_total.toFixed(0)} M
            <span className="ml-3 text-[15px]" style={{ color: OX }}>{pct(data.headline.gap_pct)}</span>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-[#6a6258]">
            Self-marks, summed. The gap between the two columns is what this instrument exists to measure.
          </p>
        </Card>
        <Card>
          <div className="smallcaps text-[10px] text-[#6a6258]">Effective bets</div>
          <div className="mono mt-2 text-[26px] leading-none text-[#191714]">{data.risk.eff_bets_risk.toFixed(1)}</div>
          <p className="mt-3 text-[12px] leading-relaxed text-[#6a6258]">
            of {data.meta.n_holdings} names (risk-based). The spectrum view collapses to{" "}
            {data.risk.eff_bets_spectrum.toFixed(1)} — one market factor dominates.
          </p>
        </Card>
        <Card>
          <div className="smallcaps text-[10px] text-[#6a6258]">Factor truth check</div>
          <div className="mono mt-2 text-[26px] leading-none text-[#191714]">
            {data.truth_check.recovered} / {data.truth_check.planted}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-[#6a6258]">
            factors planted in the synthetic market five build-stages ago, recovered by the risk machinery above the
            Marchenko–Pastur noise ceiling.
          </p>
        </Card>
      </div>

      {/* ------------------------------ holdings ------------------------------ */}
      <section className="space-y-6">
        <SectionHead
          kicker="Surface one"
          title="Your mark against the market's"
          note="Twelve synthetic holdings, marked two ways: the book's own carry, and an independent, market-referenced mark built from listed comparables, a marketability discount, and the liquidation-preference waterfall. Sorted by the size of the disagreement. Select a row to interrogate the mark."
        />
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-[12.5px]">
            <thead>
              <tr className="border-b rule text-left">
                {["", "company", "stage", "sector", "your mark", "market mark", "gap", "driver"].map((h, i) => (
                  <th key={i} className="smallcaps px-4 py-3 text-[9.5px] font-normal text-[#6a6258]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h) => {
                const selected = h.id === selectedId;
                const over = h.gap_rel < -0.1;
                const cons = h.gap_rel > 0.1;
                return (
                  <tr
                    key={h.id}
                    onClick={() => { setSelectedId(h.id); setDlom(null); }}
                    className={cx(
                      "cursor-pointer border-b rule/50 transition-colors",
                      selected ? "bg-black/[0.045]" : "hover:bg-black/[0.025]"
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <span className={cx("inline-block h-1.5 w-1.5 rounded-full", selected ? "bg-[#191714]" : "bg-transparent")} />
                    </td>
                    <td className="px-4 py-2.5 text-[#191714]">{h.company}</td>
                    <td className="px-4 py-2.5 text-[#6a6258]">{h.stage.replace("_", " ")}</td>
                    <td className="px-4 py-2.5 text-[#6a6258]">{h.sector.replace(/_/g, " ").toLowerCase()}</td>
                    <td className="mono px-4 py-2.5 text-right text-[#191714]">{h.self_mark.toFixed(2)}</td>
                    <td className="mono px-4 py-2.5 text-right text-[#191714]">{h.mark.toFixed(2)}</td>
                    <td className="mono px-4 py-2.5 text-right font-semibold"
                        style={{ color: over ? OX : cons ? SEA : "#6a6258" }}>
                      {pct(h.gap_rel)}
                    </td>
                    <td className="px-4 py-2.5 text-[#6a6258]">{h.driver}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </section>

      {/* ------------------------------ deep dive ------------------------------ */}
      <section className="space-y-6">
        <SectionHead
          kicker="Surface two"
          title={`The chain of reasoning — ${holding.company}`}
          note="A mark you can interrogate, not a number to trust: the peer-implied enterprise value, the bridge to equity, the cut to this stake — and the part naive marks miss, the preference waterfall — then the marketability discount."
        />
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">The valuation bridge (M)</div>
            <div className="mt-4">
              <Bridge steps={[
                { label: "peer-implied EV", from: 0, to: holding.bridge.ev },
                { label: "equity (net debt)", from: holding.bridge.ev, to: holding.bridge.equity },
                { label: "pro-rata stake", from: holding.bridge.equity, to: holding.bridge.pro_rata },
                { label: "preference waterfall", from: holding.bridge.pro_rata, to: holding.bridge.waterfall_stake },
                { label: `− DLOM (${pct(activeDlom, 0)})`, from: holding.bridge.waterfall_stake, to: markAtDlom },
              ]} />
            </div>
            <div className="mt-5 border-t rule pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <label htmlFor="dlom" className="smallcaps text-[10px] text-[#6a6258]">
                  Marketability discount — drag it
                </label>
                <div className="mono text-[13px] text-[#191714]">
                  {pct(activeDlom, 0)} → mark <span style={{ color: OX }}>{fmtM(markAtDlom, 2)}</span>
                  <span className="ml-2 text-[#6a6258]">(your mark {fmtM(holding.self_mark, 2)})</span>
                </div>
              </div>
              <input
                id="dlom" type="range" min={0} max={0.85} step={0.01} value={activeDlom}
                onChange={(e) => setDlom(parseFloat(e.target.value))}
                className="mt-3 w-full accent-[#8a3033]"
              />
              <p className="mt-2 text-[11.5px] leading-relaxed text-[#6a6258]">
                The discount is a straight haircut on the waterfall&rsquo;d stake — mark = stake × (1 − d). The engine&rsquo;s
                defensible range for this stage: {pct(holding.dlom.low, 0)} (empirical studies) · {pct(holding.dlom.chaffe, 0)}{" "}
                (Chaffe protective put — the central case) · {pct(holding.dlom.high, 0)} (Finnerty average-strike put).
              </p>
            </div>
          </Card>
          <div className="grid gap-4">
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">An honest band vs a point</div>
              <div className="mt-3">
                <Hist
                  edges={holding.density.edges} counts={holding.density.counts}
                  band={holding.density.ci as [number, number]}
                  marks={[
                    { x: holding.mark, label: "market", color: "#191714" },
                    { x: holding.self_mark, label: "your mark", color: OX, dash: true },
                  ]}
                  xLabel="stake value (M) · Monte Carlo over multiple, metric, discount"
                  height={120}
                />
              </div>
            </Card>
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">Payoff vs exit value</div>
              <div className="mt-3">
                <PayoffCurve
                  x={holding.payoff.x} y={holding.payoff.y}
                  markX={holding.payoff.mark_equity} markY={holding.payoff.mark_stake}
                  proRataSlope={holding.payoff.pro_rata_slope}
                  height={150}
                />
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-[#6a6258]">
                The stake is not its pro-rata slice: the preference floor protects it below, conversion caps it above.
              </p>
            </Card>
          </div>
        </div>
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-[240px] flex-1">
              <div className="smallcaps text-[10px] text-[#6a6258]">Where the gap comes from</div>
              <div className="mt-3">
                <HBars
                  rows={[
                    { label: "comps vs your mark", value: Math.abs(holding.gap_comps) },
                    { label: "marketability discount", value: Math.abs(holding.gap_dlom) },
                  ]}
                  format={(v) => `${(holding.gap_comps < 0 && v === Math.abs(holding.gap_comps)) || (holding.gap_dlom < 0 && v === Math.abs(holding.gap_dlom)) ? "−" : "+"}${v.toFixed(2)} M`}
                  accent
                  rowH={26}
                />
              </div>
              <p className="mt-2 text-[11.5px] text-[#6a6258]">
                {holding.driver === "comps-driven"
                  ? "Comps-driven — the market itself disagrees with the mark. The stronger signal."
                  : "DLOM-driven — mostly the marketability discount, not a comps disagreement."}
              </p>
            </div>
            <div className="min-w-[280px] flex-1">
              <div className="smallcaps text-[10px] text-[#6a6258]">The comparables behind it</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {holding.peers.slice(0, 15).map((p) => (
                  <span key={p} className="mono rounded-full border rule bg-white/50 px-2.5 py-0.5 text-[10px] text-[#5c544a]">{p}</span>
                ))}
                {holding.peers.length > 15 ? (
                  <span className="text-[10px] text-[#6a6258]">+{holding.peers.length - 15} more</span>
                ) : null}
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-[11.5px] text-[#6a6258] hover:text-[#191714]">
                  Method notes (engine, verbatim)
                </summary>
                <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-[#4b443b]">
                  {holding.notes.map((n, i) => (<li key={i}>· {n}</li>))}
                </ul>
              </details>
            </div>
          </div>
        </Card>
      </section>

      {/* ------------------------------ forward ------------------------------ */}
      <section className="space-y-6">
        <SectionHead
          kicker="Surface three"
          title="Stress it and watch"
          note="Ten thousand simulated futures per state: exit type, timing, and value coupled through a single latent market factor, every exit priced through each holding's preference waterfall. Flip a stress and every number below switches to a genuinely re-simulated state — nothing is faked client-side."
        />
        <div className="flex flex-wrap gap-3">
          {([
            ["c", "Compress multiples 30%", scen.c],
            ["w", "Exit window shut (~2y longer)", scen.w],
            ["o", "Write-off rate +10pp", scen.o],
          ] as const).map(([k, label, on]) => (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => setScen((s0) => ({ ...s0, [k]: !s0[k as "c" | "w" | "o"] }))}
              className={cx(
                "border rule rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors",
                on ? "bg-[#191714] text-[#f4f1ea]" : "bg-white/50 text-[#5f564d] hover:bg-black/5"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">Median TVPI · primary</div>
            <div className="mono mt-2 text-[24px] text-[#191714]">{S.tvpi_median.toFixed(2)}x</div>
            <p className="mt-2 text-[11.5px] text-[#6a6258]">
              {Math.round(data.meta.alpha * 100)}% CI [{S.tvpi_ci[0].toFixed(2)}, {S.tvpi_ci[1].toFixed(2)}]x —
              a multiple; stable under timing.
            </p>
          </Card>
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">P(TVPI ≥ {data.meta.target_tvpi}x)</div>
            <div className="mono mt-2 text-[24px] text-[#191714]">{pct(S.p_tvpi_target, 0)}</div>
            <p className="mt-2 text-[11.5px] text-[#6a6258]">timing-robust companion target.</p>
          </Card>
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">P(IRR ≥ {pct(data.meta.target_irr, 0)})</div>
            <div className="mono mt-2 text-[24px] text-[#191714]">
              {pct(S.hit_range[0], 0)}–{pct(S.hit_range[1], 0)}
            </div>
            <p className="mt-2 text-[11.5px] text-[#6a6258]">
              a range across calibration sets, never a lone figure — IRR targets are timing-sensitive.
            </p>
          </Card>
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">Today&rsquo;s NAV band</div>
            <div className="mono mt-2 text-[24px] text-[#191714]">
              {S.nav_band[0].toFixed(0)}–{S.nav_band[1].toFixed(0)} M
            </div>
            <p className="mt-2 text-[11.5px] text-[#6a6258]">
              moves only under valuation stresses; timing stresses touch forward returns, not today&rsquo;s value.
            </p>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">Return distribution — TVPI</div>
            <div className="mt-3">
              <Hist edges={S.tvpi_hist.edges} counts={S.tvpi_hist.counts}
                marks={[{ x: S.tvpi_median, label: `median ${S.tvpi_median.toFixed(2)}x` }]}
                xLabel="TVPI (multiple on paid-in)" height={160} />
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-[#6a6258]">
              IRR, secondary and caveated: median {pct(S.irr_median)}, IQR [{pct(S.irr_iqr[0])}, {pct(S.irr_iqr[1])}].
              Its upper tail is annualization of early exits — the mean is deliberately not shown.
            </p>
          </Card>
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">J-curve · fan across paths</div>
            <div className="mt-3">
              <Fan t={S.jcurve.t} q05={S.jcurve.q05} q25={S.jcurve.q25} q50={S.jcurve.q50}
                q75={S.jcurve.q75} q95={S.jcurve.q95} height={200} />
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">The honesty layer — calibration spread</div>
            <div className="mt-2">
              <RangeDots entries={[
                { label: "pessimistic", value: S.hit_by_set.pessimistic },
                { label: "base", value: S.hit_by_set.base, emphasized: true },
                { label: "optimistic", value: S.hit_by_set.optimistic },
              ]} />
            </div>
            <p className="text-[11.5px] leading-relaxed text-[#6a6258]">
              The same simulation under three defensible calibrations{scen.c || scen.w || scen.o ? " (plus your active stresses)" : ""}.
              The spread is the finding.
            </p>
          </Card>
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">What the answer is hostage to</div>
            <div className="mt-3">
              <RangeBars
                rows={data.sensitivity.map((r) => ({ label: r.assumption.replace(" (time-to-exit)", ""), lo: r.lo, hi: r.hi }))}
                baseline={base.hit_by_set.base}
              />
            </div>
            <p className="mt-2 text-[11.5px] text-[#6a6258]">
              One-at-a-time ± flexes of the major exit assumptions, ranked by swing.
            </p>
          </Card>
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">Expected liquidity</div>
            <div className="mt-3">
              <HBars rows={Object.entries(S.ladder).map(([k, v]) => ({ label: k, value: v as number }))} rowH={30} />
            </div>
            <p className="mt-2 text-[11.5px] text-[#6a6258]">
              share of NAV expected to become liquid, from the simulated exit times.
            </p>
          </Card>
        </div>

        <p className="max-w-[78ch] text-[12px] leading-relaxed text-[#6a6258]">
          Calibration disclosure: of {data.audit.total} exit-assumption groups, {data.audit.cited} are purely cited,{" "}
          {data.audit.anchored} are anchored to published data with assumed interpolation, and {data.audit.assumed} are
          fully assumed — including the co-movement loading, the single most important parameter. A precise-looking
          number resting on invented exit assumptions would be confident fiction; the ranges above are the honest form.
        </p>
      </section>

      {/* ------------------------------ risk ------------------------------ */}
      <section className="space-y-6">
        <SectionHead
          kicker="Surface four"
          title="The risk apparatus"
          note="Proxy return series from each holding's comparables, a Marchenko–Pastur denoised correlation matrix, and the concentration the raw holding count hides. The machinery is validated where truth is known: it recovers exactly the factor structure planted in the synthetic market at the start of the build."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">
              Book spectrum — {data.risk.n_signal} signal {data.risk.n_signal === 1 ? "factor" : "factors"} above the noise ceiling
            </div>
            <div className="mt-3">
              <Spectrum values={data.risk.spectrum} lambdaPlus={data.risk.lambda_plus} height={180} />
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-[#6a6258]">
              Universe truth check: {data.truth_check.recovered} of {data.truth_check.planted} planted factors recovered
              (top eigenvalues {data.truth_check.top_eigs.slice(0, 3).join(" · ")} against λ⁺ = {data.truth_check.lambda_plus}).
              The book itself carries fewer — comp baskets diversify away style exposure. That is a finding, not a failure.
            </p>
          </Card>
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">Denoised correlation · holdings ordered by sector</div>
            <div className="mt-3 flex justify-center">
              <Heatmap matrix={data.risk.heatmap.matrix} labels={data.risk.heatmap.labels} />
            </div>
            <p className="mt-2 text-[11.5px] text-[#6a6258]">
              portfolio volatility {pct(data.risk.portfolio_vol)} annual · NAV Herfindahl {data.risk.herf_nav.toFixed(3)}
            </p>
          </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">Risk contribution by holding</div>
            <div className="mt-3">
              <HBars
                rows={data.risk.contributions.slice(0, 8).map((r) => {
                  const h = data.holdings.find((x) => x.id === r.id);
                  return { label: h ? h.company : r.id, value: r.share };
                })}
                accent
              />
            </div>
          </Card>
          <Card>
            <div className="smallcaps text-[10px] text-[#6a6258]">Exposure — NAV share (dark: risk share)</div>
            <div className="mt-3">
              <HBars
                rows={Object.entries(data.risk.exposures.sector)
                  .sort(([, a], [, b]) => (b as { nav_share: number }).nav_share - (a as { nav_share: number }).nav_share)
                  .slice(0, 8)
                  .map(([g, e]) => ({
                    label: g.replace(/_/g, " ").toLowerCase(),
                    value: (e as { nav_share: number }).nav_share,
                    secondary: (e as { risk_share: number }).risk_share,
                  }))}
              />
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
