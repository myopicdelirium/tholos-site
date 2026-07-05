"use client";

/**
 * The live terminal (Stage P3) — drives the PVE public-tier API.
 *
 * The browser computes NOTHING: the payoff curve, density bins, bands, ranges
 * and bridge numbers all arrive from the backend, whose response schema makes
 * a lone-number mark unrepresentable. This component has no point-only render
 * path — a mark renders as its band or not at all. Synthetic-reference results
 * carry the payload's illustrative flag and render behind a loud banner.
 *
 * If the API is unreachable, the terminal degrades to a clear offline state;
 * the narrative /instruments page above never depends on it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Bridge, Hist, PayoffCurve, RangeDots } from "../../_components/charts";

const API = process.env.NEXT_PUBLIC_PVE_API_URL ?? "http://127.0.0.1:8620";
const OX = "#8a3033";

const SECTORS = ["SOFTWARE_SAAS", "FINTECH", "HEALTHTECH", "CONSUMER", "INDUSTRIAL_TECH",
  "CLEANTECH_ENERGY", "BIOTECH_PHARMA", "MEDIA_GAMING", "LOGISTICS_MOBILITY", "OTHER"];
const STAGES = ["SEED", "SERIES_A", "SERIES_B", "SERIES_C", "GROWTH", "PRE_IPO"];
const GEOS = ["NORDICS", "DACH", "WESTERN_EUROPE", "UK_IRELAND", "NORTH_AMERICA", "REST_OF_WORLD"];

type ClassRow = {
  name: string; class_type: "common" | "preferred"; seniority_rank: number;
  liquidation_preference_multiple: string; participating: boolean;
  participation_cap_multiple: string; shares_outstanding: string; invested_capital: string;
};
type CompRow = { ticker: string; ev_to_revenue: string; ev_to_ebitda: string;
  revenue_growth_yoy: string; gross_margin: string };

type Band = { low: number; central: number; high: number; alpha: number };
type ValuationBody = {
  mark: {
    band: Band; dlom_applied: number; peer_set: string[];
    density: { edges: number[]; counts: number[] };
    chain: { enterprise_value: number; equity_value: number;
             pro_rata_stake: number; waterfall_stake: number };
    gap: { absolute: number; relative: number; from_comps: number;
           from_dlom: number; driver: string } | null;
  };
  payoff_curve: { equity_values: number[]; owned_class_proceeds: number[];
                  segment_slopes: number[]; preference_threshold: number };
  forward: {
    tvpi: Band; p_tvpi_target: number; tvpi_target: number;
    target_hit: { low: number; high: number; by_set: Record<string, number> };
    target_irr: number;
    irr: { median: number; iqr_low: number; iqr_high: number; caveat: string };
  };
  reference: { mode: string; illustrative: boolean; label: string | null };
  oracle: { passed: boolean; checks: Record<string, boolean>; signal: string };
  method_notes: string[];
  seed: number;
};

const num = (s: string): number | null => (s.trim() === "" ? null : Number(s));

const DEFAULT_CLASSES: ClassRow[] = [
  { name: "Series A", class_type: "preferred", seniority_rank: 0,
    liquidation_preference_multiple: "1.0", participating: false,
    participation_cap_multiple: "", shares_outstanding: "4", invested_capital: "8" },
  { name: "Common", class_type: "common", seniority_rank: 1,
    liquidation_preference_multiple: "", participating: false,
    participation_cap_multiple: "", shares_outstanding: "10", invested_capital: "0" },
];
const DEFAULT_COMPS: CompRow[] = [
  { ticker: "PEERA", ev_to_revenue: "8.0", ev_to_ebitda: "24", revenue_growth_yoy: "0.35", gross_margin: "0.75" },
  { ticker: "PEERB", ev_to_revenue: "6.5", ev_to_ebitda: "20", revenue_growth_yoy: "0.25", gross_margin: "0.70" },
  { ticker: "PEERC", ev_to_revenue: "9.5", ev_to_ebitda: "", revenue_growth_yoy: "0.45", gross_margin: "0.80" },
  { ticker: "PEERD", ev_to_revenue: "5.0", ev_to_ebitda: "15", revenue_growth_yoy: "0.15", gross_margin: "0.60" },
  { ticker: "PEERE", ev_to_revenue: "7.2", ev_to_ebitda: "22", revenue_growth_yoy: "0.30", gross_margin: "0.72" },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`paper shadow-paper border rule rounded-2xl p-6 ${className}`}>{children}</div>;
}

function Small({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[11.5px] leading-relaxed text-[#6a6258]">{children}</p>;
}

function Guidance({ lines }: { lines: string[] }) {
  return (
    <div className="mt-3 rounded-xl border rule bg-white/60 p-4">
      <div className="smallcaps text-[10px]" style={{ color: OX }}>The engine&rsquo;s guidance</div>
      <ul className="mt-2 space-y-1.5">
        {lines.map((l, i) => (
          <li key={i} className="text-[12.5px] leading-relaxed text-[#4b443b]">· {l}</li>
        ))}
      </ul>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border rule bg-white/70 px-2.5 py-1.5 text-[12.5px] text-[#191714] " +
  "focus:outline-none focus:ring-2 focus:ring-[#2d5bff]/30";
const labelCls = "smallcaps block text-[9.5px] text-[#6a6258] mb-1";

export default function Terminal() {
  const [apiUp, setApiUp] = useState<boolean | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>(DEFAULT_CLASSES);
  const [curve, setCurve] = useState<{ x: number[]; y: number[]; threshold: number } | null>(null);
  const [curveGuidance, setCurveGuidance] = useState<string[]>([]);
  const [company, setCompany] = useState({ name: "Your company", sector: "SOFTWARE_SAAS",
    stage: "SERIES_A", geography: "NORDICS", revenue_ltm: "12", revenue_growth_yoy: "0.35",
    gross_margin: "0.72", ebitda_ltm: "", cash_balance: "10", monthly_burn: "0.6" });
  const [stake, setStake] = useState({ owned_class: "Series A", shares_owned: "2",
    cost_basis: "6", self_mark: "" });
  const [refMode, setRefMode] = useState<"pasted" | "synthetic">("pasted");
  const [comps, setComps] = useState<CompRow[]>(DEFAULT_COMPS);
  const [running, setRunning] = useState(false);
  const [runGuidance, setRunGuidance] = useState<string[]>([]);
  const [result, setResult] = useState<ValuationBody | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- health: the terminal announces itself or degrades clearly ---------- //
  useEffect(() => {
    fetch(`${API}/health`).then((r) => setApiUp(r.ok)).catch(() => setApiUp(false));
  }, []);

  const classPayload = useCallback(() => classes.map((c) => ({
    name: c.name, class_type: c.class_type, seniority_rank: Number(c.seniority_rank),
    liquidation_preference_multiple: num(c.liquidation_preference_multiple),
    participating: c.participating,
    participation_cap_multiple: num(c.participation_cap_multiple),
    shares_outstanding: num(c.shares_outstanding),
    invested_capital: num(c.invested_capital),
  })), [classes]);

  // ---- the live payoff curve (signature moment), server-computed ---------- //
  useEffect(() => {
    if (!apiUp) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`${API}/payoff-curve`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ cap_table: classPayload(), owned_class: stake.owned_class }),
        });
        const body = await r.json();
        if (r.status === 422) {
          setCurve(null);
          setCurveGuidance(body.detail?.guidance ?? ["Invalid cap table."]);
        } else if (r.ok) {
          setCurve({ x: body.equity_values, y: body.owned_class_proceeds,
                     threshold: body.preference_threshold });
          setCurveGuidance([]);
        }
      } catch {
        setApiUp(false);
      }
    }, 450);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [classes, stake.owned_class, apiUp, classPayload]);

  const updateClass = (i: number, patch: Partial<ClassRow>) =>
    setClasses((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const run = async () => {
    setRunning(true); setRunGuidance([]); setResult(null);
    try {
      const payload = {
        company: { name: company.name, sector: company.sector, stage: company.stage,
          geography: company.geography, revenue_ltm: num(company.revenue_ltm),
          revenue_growth_yoy: num(company.revenue_growth_yoy),
          gross_margin: num(company.gross_margin), ebitda_ltm: num(company.ebitda_ltm),
          cash_balance: num(company.cash_balance), monthly_burn: num(company.monthly_burn) },
        cap_table: classPayload(),
        stake: { owned_class: stake.owned_class, shares_owned: num(stake.shares_owned),
          cost_basis: num(stake.cost_basis) ?? 0, self_mark: num(stake.self_mark) },
        market: refMode === "pasted"
          ? { mode: "pasted", comps: comps.filter((c) => c.ticker.trim()).map((c) => ({
              ticker: c.ticker.trim().toUpperCase(), ev_to_revenue: num(c.ev_to_revenue),
              ev_to_ebitda: num(c.ev_to_ebitda), revenue_growth_yoy: num(c.revenue_growth_yoy),
              gross_margin: num(c.gross_margin) })) }
          : { mode: "synthetic" },
      };
      const r = await fetch(`${API}/valuation`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await r.json();
      if (r.status === 422 || r.status === 403) {
        setRunGuidance(body.detail?.guidance ?? ["Invalid input."]);
      } else if (r.status === 429) {
        setRunGuidance(["Rate limit reached — the public tier is deliberately paced. Retry shortly."]);
      } else if (r.ok) {
        setResult(body);
      } else {
        setRunGuidance(["The engine returned an unexpected error."]);
      }
    } catch {
      setApiUp(false);
    } finally {
      setRunning(false);
    }
  };

  // ---------------- offline state (§5.2) ---------------------------------- //
  if (apiUp === false) {
    return (
      <Card>
        <div className="smallcaps text-[10px]" style={{ color: OX }}>Terminal offline</div>
        <p className="mt-2 max-w-[64ch] text-[13.5px] leading-relaxed text-[#4b443b]">
          The live engine isn&rsquo;t reachable right now. The instrument itself is unaffected —
          the demonstration above runs on precomputed output and doesn&rsquo;t depend on this
          terminal. Try again shortly.
        </p>
      </Card>
    );
  }
  if (apiUp === null) {
    return <Card><Small>Reaching the engine…</Small></Card>;
  }

  const fwd = result?.forward;
  const mark = result?.mark;

  return (
    <div className="space-y-8">
      {/* ------------------ 1 · the company ------------------------------- */}
      <Card>
        <div className="smallcaps text-[10px] text-[#6a6258]">1 · The company</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })} />
          </div>
          {([["sector", SECTORS], ["stage", STAGES], ["geography", GEOS]] as const).map(([k, opts]) => (
            <div key={k}>
              <label className={labelCls}>{k}</label>
              <select className={inputCls} value={company[k]}
                onChange={(e) => setCompany({ ...company, [k]: e.target.value })}>
                {opts.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ").toLowerCase()}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {([["revenue_ltm", "revenue (LTM, M)"], ["revenue_growth_yoy", "growth (YoY, e.g. 0.35)"],
             ["gross_margin", "gross margin (0–1)"], ["ebitda_ltm", "EBITDA (M, optional)"],
             ["cash_balance", "cash (M)"], ["monthly_burn", "burn (M/month)"]] as const).map(([k, label]) => (
            <div key={k}>
              <label className={labelCls}>{label}</label>
              <input className={inputCls} inputMode="decimal" value={company[k as keyof typeof company]}
                onChange={(e) => setCompany({ ...company, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <Small>All optional — the engine handles gaps explicitly rather than guessing silently.</Small>
      </Card>

      {/* ------------------ 2 · the cap table + live curve ----------------- */}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card>
          <div className="smallcaps text-[10px] text-[#6a6258]">2 · The cap table</div>
          <Small>Rank 0 is paid first. The curve on the right redraws as you type — an incoherent
            stack shows itself before any mark is computed.</Small>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[680px] text-[12px]">
              <thead>
                <tr className="border-b rule text-left">
                  {["class", "type", "rank", "pref ×", "part.", "cap ×", "shares (M)", "invested (M)", ""].map((h, i) => (
                    <th key={i} className="smallcaps px-2 py-2 text-[9px] font-normal text-[#6a6258]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map((c, i) => (
                  <tr key={i} className="border-b rule/50">
                    <td className="px-2 py-1.5"><input className={inputCls} value={c.name}
                      onChange={(e) => updateClass(i, { name: e.target.value })} /></td>
                    <td className="px-2 py-1.5">
                      <select className={inputCls} value={c.class_type}
                        onChange={(e) => updateClass(i, { class_type: e.target.value as ClassRow["class_type"] })}>
                        <option value="preferred">preferred</option>
                        <option value="common">common</option>
                      </select>
                    </td>
                    <td className="w-16 px-2 py-1.5"><input className={inputCls} inputMode="numeric"
                      value={c.seniority_rank}
                      onChange={(e) => updateClass(i, { seniority_rank: Number(e.target.value || 0) })} /></td>
                    <td className="w-20 px-2 py-1.5"><input className={inputCls} inputMode="decimal"
                      value={c.liquidation_preference_multiple} placeholder={c.class_type === "common" ? "0" : "1.0"}
                      onChange={(e) => updateClass(i, { liquidation_preference_multiple: e.target.value })} /></td>
                    <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={c.participating}
                      className="accent-[#8a3033]"
                      onChange={(e) => updateClass(i, { participating: e.target.checked })} /></td>
                    <td className="w-20 px-2 py-1.5"><input className={inputCls} inputMode="decimal"
                      value={c.participation_cap_multiple} placeholder="—"
                      onChange={(e) => updateClass(i, { participation_cap_multiple: e.target.value })} /></td>
                    <td className="w-24 px-2 py-1.5"><input className={inputCls} inputMode="decimal"
                      value={c.shares_outstanding}
                      onChange={(e) => updateClass(i, { shares_outstanding: e.target.value })} /></td>
                    <td className="w-24 px-2 py-1.5"><input className={inputCls} inputMode="decimal"
                      value={c.invested_capital}
                      onChange={(e) => updateClass(i, { invested_capital: e.target.value })} /></td>
                    <td className="px-1 py-1.5">
                      <button type="button" aria-label={`remove ${c.name}`}
                        className="rounded px-2 py-1 text-[11px] text-[#6a6258] hover:bg-black/5"
                        onClick={() => setClasses((cs) => cs.filter((_, j) => j !== i))}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button"
            className="mt-3 rounded-full border rule bg-white/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[#5f564d] hover:bg-black/5"
            onClick={() => setClasses((cs) => [
              { name: `Series ${String.fromCharCode(65 + cs.length - 1)}`, class_type: "preferred",
                seniority_rank: 0, liquidation_preference_multiple: "1.0", participating: false,
                participation_cap_multiple: "", shares_outstanding: "3", invested_capital: "10" },
              ...cs.map((c) => ({ ...c, seniority_rank: c.seniority_rank + 1 })),
            ])}>
            + add a senior preferred round
          </button>
          {curveGuidance.length > 0 ? <Guidance lines={curveGuidance} /> : null}
        </Card>
        <Card>
          <div className="smallcaps text-[10px] text-[#6a6258]">Your payoff, live</div>
          {curve ? (
            <div className="mt-2">
              <PayoffCurve x={curve.x} y={curve.y} thresholdX={curve.threshold} />
              <Small>Server-computed on every edit. Each kink is a preference exhausting, a cap
                binding, or a class converting. If the shape surprises you, the cap table doesn&rsquo;t
                say what you think it says.</Small>
            </div>
          ) : (
            <Small>The curve appears once the cap table is coherent.</Small>
          )}
          <div className="mt-4 border-t rule pt-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>class you hold</label>
                <select className={inputCls} value={stake.owned_class}
                  onChange={(e) => setStake({ ...stake, owned_class: e.target.value })}>
                  {classes.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>shares owned (M)</label>
                <input className={inputCls} inputMode="decimal" value={stake.shares_owned}
                  onChange={(e) => setStake({ ...stake, shares_owned: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>cost basis (M)</label>
                <input className={inputCls} inputMode="decimal" value={stake.cost_basis}
                  onChange={(e) => setStake({ ...stake, cost_basis: e.target.value })} />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>your current mark (M, optional — enables the gap read)</label>
              <input className={inputCls} inputMode="decimal" value={stake.self_mark}
                onChange={(e) => setStake({ ...stake, self_mark: e.target.value })} />
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------ 3 · the market reference ----------------------- */}
      <Card>
        <div className="smallcaps text-[10px] text-[#6a6258]">3 · The market reference</div>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" aria-pressed={refMode === "pasted"}
            className={`rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.18em] ${refMode === "pasted" ? "bg-[#191714] text-[#f4f1ea]" : "bg-white/50 text-[#5f564d] hover:bg-black/5"}`}
            onClick={() => setRefMode("pasted")}>
            Paste your own comps (real mark)
          </button>
          <button type="button" aria-pressed={refMode === "synthetic"}
            className={`rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.18em] ${refMode === "synthetic" ? "bg-[#191714] text-[#f4f1ea]" : "bg-white/50 text-[#5f564d] hover:bg-black/5"}`}
            onClick={() => setRefMode("synthetic")}>
            Synthetic reference (mechanics only)
          </button>
        </div>
        {refMode === "pasted" ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-[12px]">
              <thead>
                <tr className="border-b rule text-left">
                  {["ticker", "EV/Revenue", "EV/EBITDA", "growth (YoY)", "gross margin"].map((h, i) => (
                    <th key={i} className="smallcaps px-2 py-2 text-[9px] font-normal text-[#6a6258]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comps.map((c, i) => (
                  <tr key={i} className="border-b rule/50">
                    {(["ticker", "ev_to_revenue", "ev_to_ebitda", "revenue_growth_yoy", "gross_margin"] as const).map((k) => (
                      <td key={k} className="px-2 py-1.5">
                        <input className={inputCls} value={c[k]} inputMode={k === "ticker" ? "text" : "decimal"}
                          onChange={(e) => setComps((rows) => rows.map((r, j) => j === i ? { ...r, [k]: e.target.value } : r))} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button"
              className="mt-2 rounded-full border rule bg-white/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[#5f564d] hover:bg-black/5"
              onClick={() => setComps((rows) => [...rows,
                { ticker: "", ev_to_revenue: "", ev_to_ebitda: "", revenue_growth_yoy: "", gross_margin: "" }])}>
              + add comp
            </button>
            <Small>Your comparables, your mark — the tool takes no data-quality liability it can&rsquo;t
              stand behind. Live comparables run on the private tier.</Small>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border p-4" style={{ borderColor: OX, background: "rgba(138,48,51,0.06)" }}>
            <div className="smallcaps text-[10px]" style={{ color: OX }}>Illustrative — not a real mark</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#4b443b]">
              This mode marks your structure against the synthetic reference market — useful for
              exploring the mechanics, meaningless as a valuation. The result will carry this label.
            </p>
          </div>
        )}
      </Card>

      {/* ------------------ run -------------------------------------------- */}
      <div>
        <button type="button" disabled={running || !curve}
          className="rounded-full border rule bg-[#191714] px-6 py-2.5 text-[11px] uppercase tracking-[0.22em] text-[#f4f1ea] transition-opacity disabled:opacity-40"
          onClick={run}>
          {running ? "The engine is running…" : "Run the engine on this holding"}
        </button>
        {runGuidance.length > 0 ? <Guidance lines={runGuidance} /> : null}
      </div>

      {/* ------------------ the result ------------------------------------- */}
      {result && mark && fwd ? (
        <div className="space-y-4">
          {result.reference.illustrative ? (
            <div className="rounded-xl border p-4" style={{ borderColor: OX, background: "rgba(138,48,51,0.08)" }}>
              <div className="smallcaps text-[11px]" style={{ color: OX }}>
                {result.reference.label}
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">The mark, with its band</div>
              <div className="mono mt-2 text-[22px] text-[#191714]">
                {mark.band.low.toFixed(2)} – {mark.band.high.toFixed(2)} M
              </div>
              <Small>central {mark.band.central.toFixed(2)} M · {Math.round(mark.band.alpha * 100)}%
                credible interval. Never a lone number.</Small>
            </Card>
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">Median TVPI (forward)</div>
              <div className="mono mt-2 text-[22px] text-[#191714]">{fwd.tvpi.central.toFixed(2)}x</div>
              <Small>{Math.round(fwd.tvpi.alpha * 100)}% CI [{fwd.tvpi.low.toFixed(2)}, {fwd.tvpi.high.toFixed(2)}]x</Small>
            </Card>
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">P(IRR ≥ {Math.round(fwd.target_irr * 100)}%)</div>
              <div className="mono mt-2 text-[22px] text-[#191714]">
                {Math.round(fwd.target_hit.low * 100)}% – {Math.round(fwd.target_hit.high * 100)}%
              </div>
              <Small>a range across calibration sets — IRR targets are timing-sensitive.</Small>
            </Card>
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">P(TVPI ≥ {fwd.tvpi_target}x)</div>
              <div className="mono mt-2 text-[22px] text-[#191714]">{Math.round(fwd.p_tvpi_target * 100)}%</div>
              <Small>IRR median {(fwd.irr.median * 100).toFixed(1)}%, IQR
                [{(fwd.irr.iqr_low * 100).toFixed(1)}%, {(fwd.irr.iqr_high * 100).toFixed(1)}%]; mean not shown.</Small>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">The valuation bridge (M)</div>
              <div className="mt-3">
                <Bridge steps={[
                  { label: "peer-implied EV", from: 0, to: mark.chain.enterprise_value },
                  { label: "equity (net debt)", from: mark.chain.enterprise_value, to: mark.chain.equity_value },
                  { label: "pro-rata stake", from: mark.chain.equity_value, to: mark.chain.pro_rata_stake },
                  { label: "preference waterfall", from: mark.chain.pro_rata_stake, to: mark.chain.waterfall_stake },
                  { label: `− DLOM (${Math.round(mark.dlom_applied * 100)}%)`, from: mark.chain.waterfall_stake, to: mark.band.central },
                ]} />
              </div>
              <Small>Peers used: {mark.peer_set.join(", ")}</Small>
            </Card>
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">An honest band vs a point</div>
              <div className="mt-3">
                <Hist edges={mark.density.edges} counts={mark.density.counts}
                  band={[mark.band.low, mark.band.high]}
                  marks={[
                    { x: mark.band.central, label: "market-referenced", color: "#191714" },
                    ...(num(stake.self_mark) !== null
                      ? [{ x: num(stake.self_mark) as number, label: "your mark", color: OX, dash: true }]
                      : []),
                  ]}
                  xLabel="stake value (M) · Monte Carlo over multiple, metric, discount" height={150} />
              </div>
              {mark.gap ? (
                <Small>
                  Gap vs your mark: {(mark.gap.relative * 100).toFixed(1)}% —
                  comps {mark.gap.from_comps >= 0 ? "+" : ""}{mark.gap.from_comps.toFixed(2)} M,
                  discount {mark.gap.from_dlom.toFixed(2)} M ({mark.gap.driver}-driven).
                </Small>
              ) : null}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">Your payoff vs exit value</div>
              <div className="mt-3">
                <PayoffCurve x={result.payoff_curve.equity_values}
                  y={result.payoff_curve.owned_class_proceeds}
                  thresholdX={result.payoff_curve.preference_threshold} />
              </div>
            </Card>
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">The honesty layer — calibration spread</div>
              <div className="mt-2">
                <RangeDots entries={[
                  { label: "pessimistic", value: fwd.target_hit.by_set.pessimistic },
                  { label: "base", value: fwd.target_hit.by_set.base, emphasized: true },
                  { label: "optimistic", value: fwd.target_hit.by_set.optimistic },
                ]} />
              </div>
              <Small>{result.oracle.signal}</Small>
            </Card>
          </div>

          <details className="px-1">
            <summary className="cursor-pointer text-[12px] text-[#6a6258] hover:text-[#191714]">
              Method notes (engine, verbatim)
            </summary>
            <ul className="mt-2 space-y-1 text-[11.5px] leading-relaxed text-[#4b443b]">
              {result.method_notes.map((n: string, i: number) => <li key={i}>· {n}</li>)}
            </ul>
          </details>
        </div>
      ) : null}
    </div>
  );
}
