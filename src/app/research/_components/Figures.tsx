"use client";

/**
 * Published figures, drawn live from the published datasets.
 *
 * These charts fetch the same CSV files offered for download on this page and
 * render them client-side — the figure and the data cannot disagree. Styling
 * is deliberately that of a methods section: hairlines, small labels, one
 * accent color (the oxblood used across the instruments for terminal
 * outcomes). If a fetch fails, the figure says so instead of drawing.
 */

import { useEffect, useState } from "react";

const OX = "#8a3033";
const W = 340, H = 220, PAD = { l: 42, r: 12, t: 14, b: 34 };

type Row = Record<string, string>;
function parseCsv(text: string): Row[] {
  const lines = text.trim().split("\n");
  const head = lines[0].split(",");
  return lines.slice(1).map((l) => {
    const cells = l.split(",");
    const r: Row = {};
    head.forEach((h, i) => (r[h] = cells[i]));
    return r;
  });
}
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) * (x - m)))); };

function Fig({ title, caption, children, wide }: { title: string; caption: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <figure className={"m-0 " + (wide ? "sm:col-span-2" : "")}>
      <div className="rounded-xl border border-[var(--site-line)] bg-[var(--site-field-bg)] p-3">
        <div className="text-[11px] font-semibold" style={{ color: "#241d15" }}>{title}</div>
        {children}
      </div>
      <figcaption className="mt-2 max-w-[58ch] text-[11px] leading-relaxed text-[var(--site-muted)]">{caption}</figcaption>
    </figure>
  );
}

function Axis({ x0, x1, y0, y1 }: { x0: number; x1: number; y0: number; y1: number }) {
  return (
    <g stroke="#9a917f" strokeWidth={1}>
      <line x1={x0} y1={y1} x2={x1} y2={y1} />
      <line x1={x0} y1={y0} x2={x0} y2={y1} />
    </g>
  );
}

export default function Figures() {
  const [dose, setDose] = useState<Row[] | null>(null);
  const [map, setMap] = useState<Row[] | null>(null);
  const [abl, setAbl] = useState<Row[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/research/data/vigil_forgetting_sweep.csv").then((r) => r.text()),
      fetch("/research/data/vigil_phase_map.csv").then((r) => r.text()),
      fetch("/research/data/vigil_ablation_matrix.csv").then((r) => r.text()),
    ])
      .then(([a, b, c]) => { setDose(parseCsv(a)); setMap(parseCsv(b)); setAbl(parseCsv(c)); })
      .catch(() => setErr(true));
  }, []);

  if (err) return <div className="text-[12px] text-[var(--site-muted)]">Figures unavailable — the datasets failed to load; the CSV links above remain the source of record.</div>;
  if (!dose || !map || !abl) return <div className="text-[12px] text-[var(--site-muted)]">Drawing figures from the published datasets…</div>;

  const x0 = PAD.l, x1 = W - PAD.r, y0 = PAD.t, y1 = H - PAD.b;
  const ink = "#241d15", muted = "#6a6258", faint = "#9a917f";

  // Figure 1 — dose-response with per-seed points and ±1 sd band
  const levels = [...new Set(dose.map((r) => r.forget_slider))].map(Number).sort((a, b) => a - b);
  const agg = levels.map((lv) => {
    const rs = dose.filter((r) => Number(r.forget_slider) === lv && r.martyr_rate !== "").map((r) => Number(r.martyr_rate));
    return { lv, m: mean(rs), s: sd(rs), rs };
  });
  const dx = (v: number) => x0 + v * (x1 - x0);
  const dy = (v: number) => y1 - v * (y1 - y0);
  const bandPath =
    "M" + agg.map((a) => `${dx(a.lv)},${dy(Math.min(1, a.m + a.s))}`).join(" L") +
    " L" + [...agg].reverse().map((a) => `${dx(a.lv)},${dy(Math.max(0, a.m - a.s))}`).join(" L") + " Z";
  const linePath = "M" + agg.map((a) => `${dx(a.lv)},${dy(a.m)}`).join(" L");

  // Figure 2 — phase map heatmap
  const MN = 14;
  const mx0 = PAD.l, mx1 = W - PAD.r, my0 = PAD.t, my1 = H - PAD.b;
  const cw = (mx1 - mx0) / MN, ch = (my1 - my0) / MN;

  // Figure 3 — ablation strip plot (martyrs per 20k-tick run)
  const conds = ["intact", "gate_ablated", "private_alarm_channel"];
  const condLabel: Record<string, string> = { intact: "intact", gate_ablated: "gate ablated", private_alarm_channel: "private channel" };
  const byCond = conds.map((c) => abl.filter((r) => r.condition === c).map((r) => Number(r.martyr)));
  const maxM = Math.max(1, ...byCond.flat());
  const ay = (v: number) => y1 - (v / maxM) * (y1 - y0);
  const acx = (i: number) => x0 + ((i + 0.5) / conds.length) * (x1 - x0);
  const searchTotals = conds.map((c) => abl.filter((r) => r.condition === c).reduce((s, r) => s + Number(r.search_ticks), 0));

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Fig
        title="Figure 1 — protective forgetting (dose-response)"
        caption="Martyr rate among bereaved agents vs. the forgetting parameter; 10 seeds × 20,000 ticks per level. Line: mean; band: ±1 sd; dots: individual seeds. Drawn from vigil_forgetting_sweep.csv."
      >
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Martyr rate falls monotonically as forgetting increases">
          <Axis x0={x0} x1={x1} y0={y0} y1={y1} />
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <text x={x0 - 6} y={dy(v) + 3} textAnchor="end" fontSize={9} fill={muted}>{Math.round(v * 100)}%</text>
              <line x1={x0} x2={x1} y1={dy(v)} y2={dy(v)} stroke={faint} strokeWidth={0.4} opacity={0.5} />
            </g>
          ))}
          {[0, 0.5, 1].map((v) => (
            <text key={v} x={dx(v)} y={y1 + 14} textAnchor="middle" fontSize={9} fill={muted}>{v}</text>
          ))}
          <text x={(x0 + x1) / 2} y={H - 6} textAnchor="middle" fontSize={9.5} fill={muted}>forgetting (slider fraction) →</text>
          <path d={bandPath} fill={OX} opacity={0.13} />
          <path d={linePath} fill="none" stroke={OX} strokeWidth={1.6} />
          {agg.map((a) =>
            a.rs.map((r, i) => <circle key={a.lv + "-" + i} cx={dx(a.lv)} cy={dy(r)} r={1.6} fill={ink} opacity={0.4} />)
          )}
          {agg.map((a) => <circle key={a.lv} cx={dx(a.lv)} cy={dy(a.m)} r={2.6} fill={OX} />)}
        </svg>
      </Fig>

      <Fig
        title="Figure 2 — the phase boundary"
        caption="Fraction of bereavement cohorts ending in death while latched, per (forgetting, devotion) cell; 120 trials per cell under the field's update law. Drawn from vigil_phase_map.csv."
      >
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Heatmap with a sharp boundary between a high-mortality region at low forgetting and a safe region at high forgetting">
          {map.map((r) => {
            const i = Number(r.i), j = Number(r.j), rate = Number(r.rate || 0);
            return (
              <rect
                key={i + "-" + j}
                x={mx0 + i * cw} y={my0 + j * ch} width={cw + 0.4} height={ch + 0.4}
                fill={rate > 0 ? OX : "#ffffff"} opacity={rate > 0 ? 0.08 + 0.88 * rate : 0}
              />
            );
          })}
          <rect x={mx0} y={my0} width={mx1 - mx0} height={my1 - my0} fill="none" stroke={faint} strokeWidth={1} />
          <text x={(mx0 + mx1) / 2} y={H - 6} textAnchor="middle" fontSize={9.5} fill={muted}>forgetting →</text>
          <text x={12} y={(my0 + my1) / 2} fontSize={9.5} fill={muted} transform={`rotate(-90 12 ${(my0 + my1) / 2})`} textAnchor="middle">devotion →</text>
        </svg>
      </Fig>

      <Fig
        wide
        title="Figure 3 — single-mechanism ablations dissociate commitment from death"
        caption={`Martyrs per run (dots: 10 seeds each; bar: mean). Total search activity across all runs — intact: ${Math.round(searchTotals[0] / 1000)}k ticks; gate ablated: ${searchTotals[1]} (commitment never forms); private alarm channel: ${Math.round(searchTotals[2] / 1000)}k ticks (commitment persists; death does not). Drawn from vigil_ablation_matrix.csv.`}
      >
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Strip plot: martyrs are frequent when intact, zero with the gate ablated, and near zero with a private alarm channel">
          <Axis x0={x0} x1={x1} y0={y0} y1={y1} />
          {[0, Math.ceil(maxM / 2), maxM].map((v) => (
            <text key={v} x={x0 - 6} y={ay(v) + 3} textAnchor="end" fontSize={9} fill={muted}>{v}</text>
          ))}
          <text x={16} y={(y0 + y1) / 2} fontSize={9.5} fill={muted} transform={`rotate(-90 16 ${(y0 + y1) / 2})`} textAnchor="middle">martyrs / run</text>
          {conds.map((c, i) => {
            const vals = byCond[i];
            const m = mean(vals);
            return (
              <g key={c}>
                <line x1={acx(i) - 26} x2={acx(i) + 26} y1={ay(m)} y2={ay(m)} stroke={OX} strokeWidth={2} />
                {vals.map((v, k) => (
                  <circle key={k} cx={acx(i) + (k - vals.length / 2) * 4.6} cy={ay(v)} r={2.2} fill={ink} opacity={0.55} />
                ))}
                <text x={acx(i)} y={y1 + 14} textAnchor="middle" fontSize={9.5} fill={muted}>{condLabel[c]}</text>
              </g>
            );
          })}
        </svg>
      </Fig>
    </div>
  );
}
