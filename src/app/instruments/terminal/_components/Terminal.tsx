"use client";

/**
 * The live terminal (P3, widened in P4 to books) — drives the PVE public API.
 *
 * The browser computes NOTHING: every number renders from API payloads whose
 * schemas make lone-number marks unrepresentable. Books are bands and ranges
 * all the way up; mixed-reference books carry a banner naming the illustrative
 * holdings. Export/import moves the entered book as a local JSON file — no
 * accounts, no server-side storage of books beyond the response cache.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Fan, HBars, Heatmap, Hist, PayoffCurve, RangeBars, RangeDots } from "../../_components/charts";

const API = process.env.NEXT_PUBLIC_PVE_API_URL ??
  (process.env.NODE_ENV === "production" ? "https://api.myopicdelirium.com" : "http://127.0.0.1:8620");
const OX = "#8a3033";
const BOOK_FILE_VERSION = 1;
// Session-only recall of the access code; the gate itself is the SERVER's —
// every compute endpoint refuses without the header, so this page holds no secret.
const CODE_KEY = "md-pve-access-code";

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
type CompanyForm = { name: string; sector: string; stage: string; geography: string;
  revenue_ltm: string; revenue_growth_yoy: string; gross_margin: string;
  ebitda_ltm: string; cash_balance: string; monthly_burn: string };
type StakeForm = { owned_class: string; shares_owned: string; cost_basis: string; self_mark: string };
type LastRoundForm = { pre_money: string; post_money: string; amount_raised: string };
type Draft = { company: CompanyForm; classes: ClassRow[]; stake: StakeForm;
  lastRound: LastRoundForm;
  refMode: "pasted" | "synthetic"; comps: CompRow[]; dlomOverride: string; blendOverride: string };

type Band = { low: number; central: number; high: number; alpha: number };
type Density = { edges: number[]; counts: number[] };
type CurvePayload = { equity_values: number[]; owned_class_proceeds: number[];
  segment_slopes: number[]; preference_threshold: number };
type BookBody = {
  nav: Band; nav_density: Density;
  holdings: { name: string; band: Band; dlom_applied: number; illustrative: boolean;
              peer_set: string[]; curve: CurvePayload;
              gap: { relative: number; from_comps: number; from_dlom: number; driver: string } | null }[];
  forward: { tvpi: Band; p_tvpi_target: number; tvpi_target: number;
             target_hit: { low: number; high: number; by_set: Record<string, number> };
             target_irr: number;
             irr: { median: number; iqr_low: number; iqr_high: number } };
  tvpi_density: Density;
  jcurve: { t: number[]; q05: number[]; q25: number[]; q50: number[]; q75: number[]; q95: number[] };
  assumption_set: string;
  sensitivity: { assumption: string; lo: number; hi: number }[];
  risk: { note: string; portfolio_vol_annual: number; effective_bets_risk: number;
          effective_bets_spectrum: number; herfindahl_nav: number; n_signal_factors: number;
          contributions: { name: string; share: number }[];
          exposures: Record<string, Record<string, { nav_share: number; risk_share: number }>>;
          liquidity_ladder: Record<string, number>;
          heatmap: { names: string[]; matrix: number[][] } } | null;
  risk_note: string;
  reference: { illustrative_any: boolean; illustrative_names: string[]; label: string | null };
  scenario_labels: string[];
  oracle: { signal: string };
  method_notes: string[];
  seed: number;
};

const num = (s: string): number | null => (s.trim() === "" ? null : Number(s));

const freshDraft = (): Draft => ({
  company: { name: "Holding " + String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    sector: "SOFTWARE_SAAS", stage: "SERIES_A", geography: "NORDICS",
    revenue_ltm: "12", revenue_growth_yoy: "0.35", gross_margin: "0.72",
    ebitda_ltm: "", cash_balance: "10", monthly_burn: "0.6" },
  classes: [
    { name: "Series A", class_type: "preferred", seniority_rank: 0,
      liquidation_preference_multiple: "1.0", participating: false,
      participation_cap_multiple: "", shares_outstanding: "4", invested_capital: "8" },
    { name: "Common", class_type: "common", seniority_rank: 1,
      liquidation_preference_multiple: "", participating: false,
      participation_cap_multiple: "", shares_outstanding: "10", invested_capital: "0" },
  ],
  stake: { owned_class: "Series A", shares_owned: "2", cost_basis: "6", self_mark: "" },
  lastRound: { pre_money: "", post_money: "", amount_raised: "" },
  refMode: "pasted",
  comps: [
    { ticker: "PEERA", ev_to_revenue: "8.0", ev_to_ebitda: "24", revenue_growth_yoy: "0.35", gross_margin: "0.75" },
    { ticker: "PEERB", ev_to_revenue: "6.5", ev_to_ebitda: "20", revenue_growth_yoy: "0.25", gross_margin: "0.70" },
    { ticker: "PEERC", ev_to_revenue: "9.5", ev_to_ebitda: "", revenue_growth_yoy: "0.45", gross_margin: "0.80" },
    { ticker: "PEERD", ev_to_revenue: "5.0", ev_to_ebitda: "15", revenue_growth_yoy: "0.15", gross_margin: "0.60" },
    { ticker: "PEERE", ev_to_revenue: "7.2", ev_to_ebitda: "22", revenue_growth_yoy: "0.30", gross_margin: "0.72" },
  ],
  dlomOverride: "", blendOverride: "",
});

function draftToApiHolding(d: Draft) {
  const levers: Record<string, number> = {};
  if (d.dlomOverride.trim() !== "") levers.dlom_central = Number(d.dlomOverride);
  if (d.blendOverride.trim() !== "") levers.blend_weight_revenue = Number(d.blendOverride);
  return {
    company: { name: d.company.name, sector: d.company.sector, stage: d.company.stage,
      geography: d.company.geography, revenue_ltm: num(d.company.revenue_ltm),
      revenue_growth_yoy: num(d.company.revenue_growth_yoy),
      gross_margin: num(d.company.gross_margin), ebitda_ltm: num(d.company.ebitda_ltm),
      cash_balance: num(d.company.cash_balance), monthly_burn: num(d.company.monthly_burn) },
    cap_table: d.classes.map((c) => ({
      name: c.name, class_type: c.class_type, seniority_rank: Number(c.seniority_rank),
      liquidation_preference_multiple: num(c.liquidation_preference_multiple),
      participating: c.participating,
      participation_cap_multiple: num(c.participation_cap_multiple),
      shares_outstanding: num(c.shares_outstanding),
      invested_capital: num(c.invested_capital),
    })),
    stake: { owned_class: d.stake.owned_class, shares_owned: num(d.stake.shares_owned),
      cost_basis: num(d.stake.cost_basis) ?? 0, self_mark: num(d.stake.self_mark) },
    ...([d.lastRound.pre_money, d.lastRound.post_money, d.lastRound.amount_raised]
        .some((v) => v.trim() !== "")
      ? { last_round: { round_name: "Last round",
          pre_money: num(d.lastRound.pre_money),
          post_money: num(d.lastRound.post_money),
          amount_raised: num(d.lastRound.amount_raised) } }
      : {}),
    market: d.refMode === "pasted"
      ? { mode: "pasted", comps: d.comps.filter((c) => c.ticker.trim()).map((c) => ({
          ticker: c.ticker.trim().toUpperCase(), ev_to_revenue: num(c.ev_to_revenue),
          ev_to_ebitda: num(c.ev_to_ebitda), revenue_growth_yoy: num(c.revenue_growth_yoy),
          gross_margin: num(c.gross_margin) })) }
      : { mode: "synthetic" },
    ...(Object.keys(levers).length ? { levers } : {}),
  };
}

type ApiHolding = ReturnType<typeof draftToApiHolding>;

function apiHoldingToDraft(h: ApiHolding): Draft {
  const s = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));
  const lr = (h as { last_round?: { pre_money: number | null; post_money: number | null; amount_raised: number | null } }).last_round;
  const levers = (h as { levers?: { dlom_central?: number; blend_weight_revenue?: number } }).levers;
  return {
    company: { name: h.company.name, sector: h.company.sector, stage: h.company.stage,
      geography: h.company.geography, revenue_ltm: s(h.company.revenue_ltm),
      revenue_growth_yoy: s(h.company.revenue_growth_yoy),
      gross_margin: s(h.company.gross_margin), ebitda_ltm: s(h.company.ebitda_ltm),
      cash_balance: s(h.company.cash_balance), monthly_burn: s(h.company.monthly_burn) },
    classes: h.cap_table.map((c) => ({
      name: c.name, class_type: c.class_type as ClassRow["class_type"],
      seniority_rank: c.seniority_rank,
      liquidation_preference_multiple: s(c.liquidation_preference_multiple),
      participating: Boolean(c.participating),
      participation_cap_multiple: s(c.participation_cap_multiple),
      shares_outstanding: s(c.shares_outstanding),
      invested_capital: s(c.invested_capital),
    })),
    stake: { owned_class: h.stake.owned_class, shares_owned: s(h.stake.shares_owned),
      cost_basis: s(h.stake.cost_basis), self_mark: s(h.stake.self_mark) },
    lastRound: { pre_money: s(lr?.pre_money), post_money: s(lr?.post_money),
      amount_raised: s(lr?.amount_raised) },
    refMode: h.market.mode === "synthetic" ? "synthetic" : "pasted",
    comps: (h.market.mode === "pasted" && h.market.comps ? h.market.comps : []).map((c) => ({
      ticker: c.ticker, ev_to_revenue: s(c.ev_to_revenue), ev_to_ebitda: s(c.ev_to_ebitda),
      revenue_growth_yoy: s(c.revenue_growth_yoy), gross_margin: s(c.gross_margin),
    })),
    dlomOverride: s(levers?.dlom_central), blendOverride: s(levers?.blend_weight_revenue),
  };
}

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
const pillCls = (on: boolean) =>
  `rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.18em] ${
    on ? "bg-[#191714] text-[#f4f1ea]" : "bg-white/50 text-[#5f564d] hover:bg-black/5"}`;

export default function Terminal() {
  const [apiUp, setApiUp] = useState<boolean | null>(null);
  const [gateRequired, setGateRequired] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [gateInput, setGateInput] = useState("");
  const [gateChecking, setGateChecking] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(freshDraft());
  const [book, setBook] = useState<Draft[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [curve, setCurve] = useState<{ x: number[]; y: number[]; threshold: number } | null>(null);
  const [curveGuidance, setCurveGuidance] = useState<string[]>([]);
  const [scen, setScen] = useState({ compress: false, window: false, writeoff: false });
  const [assumptionSet, setAssumptionSet] = useState<"base" | "pessimistic" | "optimistic">("base");
  const [seed, setSeed] = useState("20240115");
  const [paths, setPaths] = useState("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [runGuidance, setRunGuidance] = useState<string[]>([]);
  const [result, setResult] = useState<BookBody | null>(null);
  const [openHolding, setOpenHolding] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/health`);
        if (!r.ok) { setApiUp(false); return; }
        const body = await r.json();
        if (body.access_code_required) {
          setGateRequired(true);
          // a code remembered this session still has to pass the server
          const stored = sessionStorage.getItem(CODE_KEY);
          if (stored) {
            const ok = await fetch(`${API}/access-check`,
              { headers: { "x-pve-access-code": stored } });
            if (ok.ok) setCode(stored);
            else sessionStorage.removeItem(CODE_KEY);
          }
        }
        setApiUp(true);
      } catch { setApiUp(false); }
    })();
  }, []);

  const regate = (msg: string) => {
    sessionStorage.removeItem(CODE_KEY);
    setCode(null);
    setGateError(msg);
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const attempt = gateInput.trim();
    if (!attempt) return;
    setGateChecking(true); setGateError(null);
    try {
      const r = await fetch(`${API}/access-check`,
        { headers: { "x-pve-access-code": attempt } });
      if (r.ok) {
        sessionStorage.setItem(CODE_KEY, attempt);
        setCode(attempt);
        setGateInput("");
      } else {
        setGateError("The engine refused that code. Try again.");
        setGateInput("");
      }
    } catch { setApiUp(false); } finally { setGateChecking(false); }
  };

  useEffect(() => {
    if (!running) { setElapsed(0); return; }
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const loadExampleBook = async () => {
    try {
      const r = await fetch(`${API}/example-book`);
      if (!r.ok) throw new Error();
      const payload = await r.json();
      setBook(payload.holdings.map(apiHoldingToDraft));
      setSeed(String(payload.seed ?? "20240115"));
      setScen({ compress: false, window: false, writeoff: false });
      setAssumptionSet("base");
      setPaths("");
      setEditIndex(null);
      setResult(null);
      setRunGuidance([]);
    } catch {
      setRunGuidance(["Couldn't load the example book — is the engine reachable?"]);
    }
  };

  const classPayload = useCallback(() => draftToApiHolding(draft).cap_table, [draft]);

  // the live payoff curve while building (server-computed, debounced)
  useEffect(() => {
    if (!apiUp || (gateRequired && !code)) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`${API}/payoff-curve`, {
          method: "POST",
          headers: { "content-type": "application/json",
            ...(code ? { "x-pve-access-code": code } : {}) },
          body: JSON.stringify({ cap_table: classPayload(), owned_class: draft.stake.owned_class }),
        });
        const body = await r.json();
        if (r.status === 401) {
          regate("The code was refused — it may have been rotated. Enter the current one.");
        } else if (r.status === 422) {
          setCurve(null);
          setCurveGuidance(body.detail?.guidance ?? ["Invalid cap table."]);
        } else if (r.ok) {
          setCurve({ x: body.equity_values, y: body.owned_class_proceeds,
                     threshold: body.preference_threshold });
          setCurveGuidance([]);
        }
      } catch { setApiUp(false); }
    }, 450);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [draft.classes, draft.stake.owned_class, apiUp, classPayload, gateRequired, code]);

  const updateClass = (i: number, patch: Partial<ClassRow>) =>
    setDraft((d) => ({ ...d, classes: d.classes.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  const addToBook = () => {
    if (editIndex !== null) {
      setBook((b) => b.map((h, i) => (i === editIndex ? draft : h)));
      setEditIndex(null);
    } else {
      setBook((b) => [...b, draft]);
    }
    setDraft(freshDraft());
    setResult(null);
  };

  const runBook = async () => {
    const holdings = (book.length ? book : [draft]).map(draftToApiHolding);
    setRunning(true); setRunGuidance([]); setResult(null);
    try {
      const payload = {
        holdings,
        compress_multiples: scen.compress, window_shut: scen.window,
        higher_write_offs: scen.writeoff,
        assumption_set: assumptionSet,
        seed: num(seed) ?? undefined,
        ...(num(paths) !== null ? { n_paths: num(paths) } : {}),
      };
      const r = await fetch(`${API}/book`, {
        method: "POST",
        headers: { "content-type": "application/json",
          ...(code ? { "x-pve-access-code": code } : {}) },
        body: JSON.stringify(payload),
      });
      const body = await r.json();
      if (r.status === 401) {
        regate("The code was refused — it may have been rotated. Enter the current one.");
      } else if (r.status === 422 || r.status === 403) {
        setRunGuidance(body.detail?.guidance ?? ["Invalid input."]);
      } else if (r.status === 429) {
        setRunGuidance(["Rate limit reached — the public tier is deliberately paced. Retry shortly."]);
      } else if (r.ok) {
        setResult(body);
      } else {
        setRunGuidance(["The engine returned an unexpected error."]);
      }
    } catch { setApiUp(false); } finally { setRunning(false); }
  };

  // A.3 — book portability, no accounts: local JSON export/import
  const exportBook = () => {
    const data = { version: BOOK_FILE_VERSION,
      book: book.length ? book : [draft],
      controls: { scen, assumptionSet, seed, paths } };
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pve-book.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importBook = (file: File) => {
    file.text().then((t) => {
      try {
        const data = JSON.parse(t);
        if (data.version !== BOOK_FILE_VERSION || !Array.isArray(data.book)) throw new Error();
        setBook(data.book);
        if (data.controls) {
          setScen(data.controls.scen ?? { compress: false, window: false, writeoff: false });
          setAssumptionSet(data.controls.assumptionSet ?? "base");
          setSeed(data.controls.seed ?? "20240115");
          setPaths(data.controls.paths ?? "");
        }
        setResult(null);
      } catch {
        setRunGuidance(["That file isn't a PVE book export (version " + BOOK_FILE_VERSION + ")."]);
      }
    });
  };

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
  if (apiUp === null) return <Card><Small>Reaching the engine…</Small></Card>;

  if (gateRequired && !code) {
    return (
      <Card>
        <div className="smallcaps text-[10px]" style={{ color: OX }}>Access code</div>
        <p className="mt-2 max-w-[64ch] text-[13.5px] leading-relaxed text-[#4b443b]">
          The engine is live, but it computes only with the code — and the refusal is the
          server&rsquo;s, not this page&rsquo;s. The demonstration above runs on precomputed
          output and needs no code.
        </p>
        <form onSubmit={submitCode} className="mt-4 flex max-w-sm gap-2">
          <label htmlFor="pve-access-code" className="sr-only">Access code</label>
          <input id="pve-access-code" type="password" autoComplete="off"
            className={inputCls} placeholder="Enter code" value={gateInput}
            onChange={(e) => { setGateInput(e.target.value); setGateError(null); }} />
          <button type="submit" disabled={gateChecking || gateInput.trim() === ""}
            className="rounded-full border rule bg-[#191714] px-6 py-2 text-[11px] uppercase tracking-[0.22em] text-[#f4f1ea] transition-opacity disabled:opacity-40">
            {gateChecking ? "Checking…" : "Enter"}
          </button>
        </form>
        {gateError ? (
          <div className="mt-3 text-[12px]" style={{ color: OX }}>{gateError}</div>
        ) : null}
        <Small>Request the code via Connect.</Small>
      </Card>
    );
  }

  const fwd = result?.forward;

  return (
    <div className="space-y-8">
      {/* ------------------ the book shelf --------------------------------- */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="smallcaps text-[10px] text-[#6a6258]">
            Your book · {book.length} holding{book.length === 1 ? "" : "s"}
            {book.length === 0 ? " (the holding below runs solo until you add more)" : ""}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={pillCls(false)} onClick={loadExampleBook}>
              Load the example book
            </button>
            <button type="button" className={pillCls(false)} onClick={exportBook}>Export book</button>
            <button type="button" className={pillCls(false)} onClick={() => fileRef.current?.click()}>
              Import book
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importBook(f); e.target.value = ""; }} />
          </div>
        </div>
        {book.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {book.map((h, i) => (
              <span key={i} className="inline-flex items-center gap-2 rounded-full border rule bg-white/60 px-3 py-1.5 text-[12px] text-[#191714]">
                {h.company.name}
                <span className="text-[10px] text-[#6a6258]">
                  {h.refMode === "synthetic" ? "illustrative" : `${h.comps.filter((c) => c.ticker.trim()).length} comps`}
                </span>
                <button type="button" className="text-[11px] text-[#6a6258] hover:text-[#191714]"
                  onClick={() => { setDraft(h); setEditIndex(i); }}>edit</button>
                <button type="button" aria-label={`remove ${h.company.name}`}
                  className="text-[11px] text-[#6a6258] hover:text-[#8a3033]"
                  onClick={() => setBook((b) => b.filter((_, j) => j !== i))}>✕</button>
              </span>
            ))}
          </div>
        ) : null}
        <Small>No accounts, no server-side storage of your book — export it as a file, keep it,
          re-import it later. Same seed, same result, exactly. Bodies are never logged; the
          computation cache is keyed by hash.</Small>
      </Card>

      {/* ------------------ 1 · the company ------------------------------- */}
      <Card>
        <div className="smallcaps text-[10px] text-[#6a6258]">
          {editIndex !== null ? `Editing — ${draft.company.name}` : "1 · The company"}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={draft.company.name}
              onChange={(e) => setDraft({ ...draft, company: { ...draft.company, name: e.target.value } })} />
          </div>
          {([["sector", SECTORS], ["stage", STAGES], ["geography", GEOS]] as const).map(([k, opts]) => (
            <div key={k}>
              <label className={labelCls}>{k}</label>
              <select className={inputCls} value={draft.company[k]}
                onChange={(e) => setDraft({ ...draft, company: { ...draft.company, [k]: e.target.value } })}>
                {opts.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ").toLowerCase()}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {([["revenue_ltm", "revenue (LTM, M)"], ["revenue_growth_yoy", "growth (YoY)"],
             ["gross_margin", "gross margin (0–1)"], ["ebitda_ltm", "EBITDA (M, opt.)"],
             ["cash_balance", "cash (M)"], ["monthly_burn", "burn (M/mo)"]] as const).map(([k, label]) => (
            <div key={k}>
              <label className={labelCls}>{label}</label>
              <input className={inputCls} inputMode="decimal" value={draft.company[k]}
                onChange={(e) => setDraft({ ...draft, company: { ...draft.company, [k]: e.target.value } })} />
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {([["pre_money", "last round pre-money (M, opt.)"],
             ["post_money", "post-money (M)"],
             ["amount_raised", "raised (M)"]] as const).map(([k, label]) => (
            <div key={k}>
              <label className={labelCls}>{label}</label>
              <input className={inputCls} inputMode="decimal" value={draft.lastRound[k]}
                onChange={(e) => setDraft({ ...draft, lastRound: { ...draft.lastRound, [k]: e.target.value } })} />
            </div>
          ))}
        </div>
        <Small>The last round anchors the exit simulation&rsquo;s valuation base; without it the
          engine falls back to the comps-implied equity and says so in the method notes.</Small>
      </Card>

      {/* ------------------ 2 · cap table + live curve --------------------- */}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card>
          <div className="smallcaps text-[10px] text-[#6a6258]">2 · The cap table</div>
          <Small>Rank 0 is paid first. The curve on the right redraws as you type.</Small>
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
                {draft.classes.map((c, i) => (
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
                        onClick={() => setDraft((d) => ({ ...d, classes: d.classes.filter((_, j) => j !== i) }))}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button"
            className="mt-3 rounded-full border rule bg-white/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[#5f564d] hover:bg-black/5"
            onClick={() => setDraft((d) => ({ ...d, classes: [
              { name: `Series ${String.fromCharCode(65 + d.classes.length - 1)}`, class_type: "preferred",
                seniority_rank: 0, liquidation_preference_multiple: "1.0", participating: false,
                participation_cap_multiple: "", shares_outstanding: "3", invested_capital: "10" },
              ...d.classes.map((c) => ({ ...c, seniority_rank: c.seniority_rank + 1 })),
            ] }))}>
            + add a senior preferred round
          </button>
          {curveGuidance.length > 0 ? <Guidance lines={curveGuidance} /> : null}
        </Card>
        <Card>
          <div className="smallcaps text-[10px] text-[#6a6258]">Your payoff, live</div>
          {curve ? (
            <div className="mt-2"><PayoffCurve x={curve.x} y={curve.y} thresholdX={curve.threshold} /></div>
          ) : (
            <Small>The curve appears once the cap table is coherent.</Small>
          )}
          <div className="mt-4 border-t rule pt-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>class you hold</label>
                <select className={inputCls} value={draft.stake.owned_class}
                  onChange={(e) => setDraft({ ...draft, stake: { ...draft.stake, owned_class: e.target.value } })}>
                  {draft.classes.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>shares owned (M)</label>
                <input className={inputCls} inputMode="decimal" value={draft.stake.shares_owned}
                  onChange={(e) => setDraft({ ...draft, stake: { ...draft.stake, shares_owned: e.target.value } })} />
              </div>
              <div>
                <label className={labelCls}>cost basis (M)</label>
                <input className={inputCls} inputMode="decimal" value={draft.stake.cost_basis}
                  onChange={(e) => setDraft({ ...draft, stake: { ...draft.stake, cost_basis: e.target.value } })} />
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>your current mark (M, opt.)</label>
                <input className={inputCls} inputMode="decimal" value={draft.stake.self_mark}
                  onChange={(e) => setDraft({ ...draft, stake: { ...draft.stake, self_mark: e.target.value } })} />
              </div>
              <div>
                <label className={labelCls}>DLOM override (0–0.85, opt.)</label>
                <input className={inputCls} inputMode="decimal" placeholder="engine default"
                  value={draft.dlomOverride}
                  onChange={(e) => setDraft({ ...draft, dlomOverride: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>revenue-blend weight (0–1, opt.)</label>
                <input className={inputCls} inputMode="decimal" placeholder="engine default"
                  value={draft.blendOverride}
                  onChange={(e) => setDraft({ ...draft, blendOverride: e.target.value })} />
              </div>
            </div>
            <Small>The DLOM default is the middle of three defensible methods
              (empirical / Chaffe / Finnerty), stage-conditional; the override is a lever, not a
              correction of the engine.</Small>
          </div>
        </Card>
      </div>

      {/* ------------------ 3 · market reference --------------------------- */}
      <Card>
        <div className="smallcaps text-[10px] text-[#6a6258]">3 · The market reference</div>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" aria-pressed={draft.refMode === "pasted"} className={pillCls(draft.refMode === "pasted")}
            onClick={() => setDraft({ ...draft, refMode: "pasted" })}>
            Paste your own comps (real mark)
          </button>
          <button type="button" aria-pressed={draft.refMode === "synthetic"} className={pillCls(draft.refMode === "synthetic")}
            onClick={() => setDraft({ ...draft, refMode: "synthetic" })}>
            Synthetic reference (mechanics only)
          </button>
        </div>
        {draft.refMode === "pasted" ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-[12px]">
              <thead>
                <tr className="border-b rule text-left">
                  {["ticker", "EV/Revenue", "EV/EBITDA", "growth (YoY)", "gross margin", ""].map((h, i) => (
                    <th key={i} className="smallcaps px-2 py-2 text-[9px] font-normal text-[#6a6258]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draft.comps.map((c, i) => (
                  <tr key={i} className="border-b rule/50">
                    {(["ticker", "ev_to_revenue", "ev_to_ebitda", "revenue_growth_yoy", "gross_margin"] as const).map((k) => (
                      <td key={k} className="px-2 py-1.5">
                        <input className={inputCls} value={c[k]} inputMode={k === "ticker" ? "text" : "decimal"}
                          onChange={(e) => setDraft((d) => ({ ...d,
                            comps: d.comps.map((r, j) => j === i ? { ...r, [k]: e.target.value } : r) }))} />
                      </td>
                    ))}
                    <td className="px-1 py-1.5">
                      <button type="button" aria-label="remove comp"
                        className="rounded px-2 py-1 text-[11px] text-[#6a6258] hover:bg-black/5"
                        onClick={() => setDraft((d) => ({ ...d, comps: d.comps.filter((_, j) => j !== i) }))}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button"
              className="mt-2 rounded-full border rule bg-white/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[#5f564d] hover:bg-black/5"
              onClick={() => setDraft((d) => ({ ...d, comps: [...d.comps,
                { ticker: "", ev_to_revenue: "", ev_to_ebitda: "", revenue_growth_yoy: "", gross_margin: "" }] }))}>
              + add comp
            </button>
            <Small>Your comparables, your mark. Live comparables run on the private tier.</Small>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border p-4" style={{ borderColor: OX, background: "rgba(138,48,51,0.06)" }}>
            <div className="smallcaps text-[10px]" style={{ color: OX }}>Illustrative — not a real mark</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#4b443b]">
              Marks this holding against the synthetic reference market — mechanics only. In a book,
              the result banner will name every holding that rides this reference.
            </p>
          </div>
        )}
      </Card>

      {/* ------------------ book controls + run ---------------------------- */}
      <Card>
        <div className="smallcaps text-[10px] text-[#6a6258]">The controls</div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <button type="button" className={pillCls(false)} onClick={addToBook}>
            {editIndex !== null ? "Save holding" : "+ Add this holding to the book"}
          </button>
          <div className="flex flex-wrap gap-2">
            {([["compress", "Compress multiples 30%"], ["window", "Exit window shut"],
               ["writeoff", "Write-offs +10pp"]] as const).map(([k, label]) => (
              <button key={k} type="button" aria-pressed={scen[k]} className={pillCls(scen[k])}
                onClick={() => setScen((s0) => ({ ...s0, [k]: !s0[k] }))}>{label}</button>
            ))}
          </div>
          <div>
            <label className={labelCls}>calibration set (headline)</label>
            <select className={inputCls} value={assumptionSet}
              onChange={(e) => setAssumptionSet(e.target.value as typeof assumptionSet)}>
              <option value="base">base</option>
              <option value="pessimistic">pessimistic</option>
              <option value="optimistic">optimistic</option>
            </select>
          </div>
          <div className="w-32">
            <label className={labelCls}>seed (reproducible)</label>
            <input className={inputCls} inputMode="numeric" value={seed}
              onChange={(e) => setSeed(e.target.value)} />
          </div>
          <div className="w-32">
            <label className={labelCls}>paths (≤ 20000)</label>
            <input className={inputCls} inputMode="numeric" placeholder="default" value={paths}
              onChange={(e) => setPaths(e.target.value)} />
          </div>
        </div>
        <Small>Same seed, same result — bit-identical, by construction. The target-hit range always
          spans all three calibration sets; the selector only chooses which distribution leads.</Small>
        <div className="mt-4">
          <button type="button" disabled={running}
            className="rounded-full border rule bg-[#191714] px-6 py-2.5 text-[11px] uppercase tracking-[0.22em] text-[#f4f1ea] transition-opacity disabled:opacity-40"
            onClick={runBook}>
            {running ? `The engine is running… ${elapsed}s` :
              `Run the ${book.length > 1 ? `book (${book.length} holdings)` : "engine"}`}
          </button>
          {running ? (
            <Small>First run on a new book builds each holding&rsquo;s payoff curve and runs
              twelve simulations — typically ~20 seconds, longer if the engine was asleep.
              Repeats of any book you&rsquo;ve run before are instant, exactly, from the cache.</Small>
          ) : null}
        </div>
        {runGuidance.length > 0 ? <Guidance lines={runGuidance} /> : null}
      </Card>

      {/* ------------------ the book result -------------------------------- */}
      {result && fwd ? (
        <div className="space-y-4">
          {result.reference.illustrative_any ? (
            <div className="rounded-xl border p-4" style={{ borderColor: OX, background: "rgba(138,48,51,0.08)" }}>
              <div className="smallcaps text-[11px]" style={{ color: OX }}>{result.reference.label}</div>
            </div>
          ) : null}
          {result.scenario_labels.length ? (
            <div className="text-[11.5px] text-[#6a6258]">
              Active stresses: {result.scenario_labels.join(" · ")} · calibration set: {result.assumption_set}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">Book NAV, with its band</div>
              <div className="mono mt-2 text-[22px] text-[#191714]">
                {result.nav.low.toFixed(1)} – {result.nav.high.toFixed(1)} M
              </div>
              <Small>central {result.nav.central.toFixed(1)} M · {Math.round(result.nav.alpha * 100)}%
                credible interval, correlated aggregation — never a lone number.</Small>
            </Card>
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">Median TVPI · {result.assumption_set}</div>
              <div className="mono mt-2 text-[22px] text-[#191714]">{fwd.tvpi.central.toFixed(2)}x</div>
              <Small>{Math.round(fwd.tvpi.alpha * 100)}% CI [{fwd.tvpi.low.toFixed(2)}, {fwd.tvpi.high.toFixed(2)}]x ·
                P(TVPI ≥ {fwd.tvpi_target}x) = {Math.round(fwd.p_tvpi_target * 100)}%</Small>
            </Card>
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">P(IRR ≥ {Math.round(fwd.target_irr * 100)}%)</div>
              <div className="mono mt-2 text-[22px] text-[#191714]">
                {Math.round(fwd.target_hit.low * 100)}% – {Math.round(fwd.target_hit.high * 100)}%
              </div>
              <Small>across calibration sets, whatever the selector says — IRR is timing-sensitive;
                median {(fwd.irr.median * 100).toFixed(1)}%, IQR [{(fwd.irr.iqr_low * 100).toFixed(1)}%,
                {(fwd.irr.iqr_high * 100).toFixed(1)}%]; mean not shown.</Small>
            </Card>
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">Effective bets</div>
              <div className="mono mt-2 text-[22px] text-[#191714]">
                {result.risk ? result.risk.effective_bets_risk.toFixed(1) : "—"}
              </div>
              <Small>{result.risk
                ? `of ${result.holdings.length} names (risk-based; spectrum ${result.risk.effective_bets_spectrum.toFixed(1)})`
                : result.risk_note}</Small>
            </Card>
          </div>

          <Card className="p-0">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b rule text-left">
                  {["holding", "mark band (M)", "central", "DLOM", "gap", "reference", ""].map((h, i) => (
                    <th key={i} className="smallcaps px-4 py-3 text-[9.5px] font-normal text-[#6a6258]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.holdings.map((h) => (
                  <tr key={h.name} className="border-b rule/50">
                    <td className="px-4 py-2.5 text-[#191714]">{h.name}</td>
                    <td className="mono px-4 py-2.5">{h.band.low.toFixed(2)} – {h.band.high.toFixed(2)}</td>
                    <td className="mono px-4 py-2.5">{h.band.central.toFixed(2)}</td>
                    <td className="mono px-4 py-2.5">{Math.round(h.dlom_applied * 100)}%</td>
                    <td className="mono px-4 py-2.5" style={{ color: h.gap && h.gap.relative < -0.1 ? OX : "#6a6258" }}>
                      {h.gap ? `${(h.gap.relative * 100).toFixed(1)}% (${h.gap.driver})` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[11px]" style={{ color: h.illustrative ? OX : "#6a6258" }}>
                      {h.illustrative ? "ILLUSTRATIVE" : "pasted comps"}
                    </td>
                    <td className="px-4 py-2.5">
                      <button type="button" className="text-[11px] text-[#6a6258] underline hover:text-[#191714]"
                        onClick={() => setOpenHolding(openHolding === h.name ? null : h.name)}>
                        {openHolding === h.name ? "close" : "payoff"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {openHolding ? (() => {
              const h = result.holdings.find((x) => x.name === openHolding);
              return h ? (
                <div className="border-t rule p-4">
                  <div className="smallcaps text-[10px] text-[#6a6258]">{h.name} — payoff vs exit value</div>
                  <div className="mx-auto mt-2 max-w-[560px]">
                    <PayoffCurve x={h.curve.equity_values} y={h.curve.owned_class_proceeds}
                      thresholdX={h.curve.preference_threshold} />
                  </div>
                </div>
              ) : null;
            })() : null}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">Book NAV — an honest band</div>
              <div className="mt-3">
                <Hist edges={result.nav_density.edges} counts={result.nav_density.counts}
                  band={[result.nav.low, result.nav.high]}
                  marks={[{ x: result.nav.central, label: "central", color: "#191714" }]}
                  xLabel="book NAV (M) · correlated Monte Carlo" height={150} />
              </div>
            </Card>
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">Forward TVPI · {result.assumption_set} set</div>
              <div className="mt-3">
                <Hist edges={result.tvpi_density.edges} counts={result.tvpi_density.counts}
                  marks={[{ x: fwd.tvpi.central, label: `median ${fwd.tvpi.central.toFixed(2)}x` }]}
                  xLabel="TVPI (multiple on paid-in)" height={150} />
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">Calibration spread</div>
              <div className="mt-2">
                <RangeDots entries={[
                  { label: "pessimistic", value: fwd.target_hit.by_set.pessimistic },
                  { label: "base", value: fwd.target_hit.by_set.base, emphasized: result.assumption_set === "base" },
                  { label: "optimistic", value: fwd.target_hit.by_set.optimistic },
                ]} />
              </div>
              <Small>{result.oracle.signal}</Small>
            </Card>
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">What the answer is hostage to</div>
              <div className="mt-3">
                <RangeBars rows={result.sensitivity.map((r) => ({
                  label: r.assumption.replace(" (time-to-exit)", ""), lo: r.lo, hi: r.hi }))}
                  baseline={fwd.target_hit.by_set.base} />
              </div>
            </Card>
            <Card>
              <div className="smallcaps text-[10px] text-[#6a6258]">J-curve · fan</div>
              <div className="mt-3">
                <Fan t={result.jcurve.t} q05={result.jcurve.q05} q25={result.jcurve.q25}
                  q50={result.jcurve.q50} q75={result.jcurve.q75} q95={result.jcurve.q95} height={170} />
              </div>
            </Card>
          </div>

          {result.risk ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <div className="smallcaps text-[10px] text-[#6a6258]">Risk contribution</div>
                <div className="mt-3">
                  <HBars rows={result.risk.contributions.map((c) => ({ label: c.name, value: c.share }))} accent />
                </div>
                <Small>portfolio σ {(result.risk.portfolio_vol_annual * 100).toFixed(1)}% annual ·
                  NAV Herfindahl {result.risk.herfindahl_nav.toFixed(3)}</Small>
              </Card>
              <Card>
                <div className="smallcaps text-[10px] text-[#6a6258]">Correlation (denoised)</div>
                <div className="mt-3 flex justify-center">
                  <Heatmap matrix={result.risk.heatmap.matrix} labels={result.risk.heatmap.names} size={260} />
                </div>
                <Small>{result.risk.note}</Small>
              </Card>
              <Card>
                <div className="smallcaps text-[10px] text-[#6a6258]">Expected liquidity</div>
                <div className="mt-3">
                  <HBars rows={Object.entries(result.risk.liquidity_ladder).map(([k, v]) => ({ label: k, value: v }))}
                    rowH={30} />
                </div>
                <Small>share of NAV becoming liquid, from the simulated exit times.</Small>
              </Card>
            </div>
          ) : (
            <Small>{result.risk_note}</Small>
          )}

          <details className="px-1">
            <summary className="cursor-pointer text-[12px] text-[#6a6258] hover:text-[#191714]">
              Method notes (engine, verbatim) · seed {result.seed}
            </summary>
            <ul className="mt-2 space-y-1 text-[11.5px] leading-relaxed text-[#4b443b]">
              {result.method_notes.map((n, i) => <li key={i}>· {n}</li>)}
            </ul>
          </details>
        </div>
      ) : null}
    </div>
  );
}
