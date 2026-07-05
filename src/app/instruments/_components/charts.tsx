"use client";

/**
 * Hand-rolled SVG primitives for the engine page. Presentation only — every
 * number arrives precomputed from the seeded engine export.
 */

const INK = "#191714";
const MUTED = "#6a6258";
const BRASS = "rgba(133,118,101,0.9)";
const RULE = "rgba(133,118,101,0.28)";
const OX = "#8a3033"; // the one bold color: your-mark contrast / overmarked

export function Hist({
  edges, counts, width = 460, height = 150, marks = [],
  band, xLabel,
}: {
  edges: number[]; counts: number[]; width?: number; height?: number;
  marks?: { x: number; color?: string; label?: string; dash?: boolean }[];
  band?: [number, number]; xLabel?: string;
}) {
  const x0 = edges[0], x1 = edges[edges.length - 1];
  const maxC = Math.max(...counts, 1);
  const px = (v: number) => ((v - x0) / (x1 - x0)) * width;
  const pad = 18;
  return (
    <svg viewBox={`0 0 ${width} ${height + pad}`} className="w-full" role="img" aria-label={xLabel}>
      {band ? (
        <rect x={px(band[0])} y={0} width={Math.max(px(band[1]) - px(band[0]), 0)} height={height}
          fill="rgba(133,118,101,0.14)" />
      ) : null}
      {counts.map((c, i) => {
        const bx = px(edges[i]);
        const bw = Math.max(px(edges[i + 1]) - bx - 0.6, 0.4);
        const h = (c / maxC) * (height - 8);
        return <rect key={i} x={bx} y={height - h} width={bw} height={h} fill="rgba(25,23,20,0.22)" />;
      })}
      {marks.map((m, i) => (
        <g key={i}>
          <line x1={px(m.x)} x2={px(m.x)} y1={2} y2={height}
            stroke={m.color ?? INK} strokeWidth={1.4} strokeDasharray={m.dash ? "4 3" : undefined} />
          {m.label ? (
            <text x={Math.min(px(m.x) + 4, width - 4)} y={12} fontSize={9.5} fill={m.color ?? INK}
              textAnchor={px(m.x) > width * 0.75 ? "end" : "start"}>{m.label}</text>
          ) : null}
        </g>
      ))}
      <line x1={0} x2={width} y1={height} y2={height} stroke={RULE} />
      {xLabel ? (
        <text x={width / 2} y={height + 14} fontSize={9.5} fill={MUTED} textAnchor="middle">{xLabel}</text>
      ) : null}
    </svg>
  );
}

export function PayoffCurve({
  x, y, markX, markY, proRataSlope, thresholdX, width = 460, height = 190,
}: {
  x: number[]; y: number[]; markX?: number; markY?: number; proRataSlope?: number;
  thresholdX?: number; width?: number; height?: number;
}) {
  const x1 = x[x.length - 1];
  const yMax = Math.max(y[y.length - 1], (proRataSlope ?? 0) * x1, 1e-9) * 1.06;
  const px = (v: number) => (v / x1) * (width - 8) + 4;
  const py = (v: number) => height - 14 - (v / yMax) * (height - 26);
  const path = x.map((xv, i) => `${i === 0 ? "M" : "L"}${px(xv).toFixed(1)},${py(y[i]).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="stake proceeds vs exit value">
      {proRataSlope !== undefined ? (
        <>
          <line x1={px(0)} y1={py(0)} x2={px(x1)} y2={py(proRataSlope * x1)}
            stroke={MUTED} strokeWidth={1} strokeDasharray="4 3" opacity={0.75} />
          <text x={width - 8} y={py(proRataSlope * x1) - 5} fontSize={9.5} fill={MUTED} textAnchor="end">naive pro-rata</text>
        </>
      ) : null}
      {thresholdX !== undefined && thresholdX > 0 && thresholdX < x1 ? (
        <>
          <line x1={px(thresholdX)} x2={px(thresholdX)} y1={10} y2={height - 14}
            stroke={OX} strokeWidth={1} strokeDasharray="5 3" opacity={0.8} />
          <text x={px(thresholdX) + 4} y={18} fontSize={9} fill={OX}>your preference covered</text>
        </>
      ) : null}
      <path d={path} fill="none" stroke={INK} strokeWidth={1.8} />
      {markX !== undefined && markY !== undefined ? (
        <>
          <circle cx={px(markX)} cy={py(markY)} r={4.5} fill={OX} />
          <text x={Math.min(px(markX) + 7, width - 4)} y={py(markY) - 7} fontSize={9.5} fill={OX}
            textAnchor={px(markX) > width * 0.7 ? "end" : "start"}>today</text>
        </>
      ) : null}
      <line x1={0} x2={width} y1={height - 14} y2={height - 14} stroke={RULE} />
      <text x={width / 2} y={height - 2} fontSize={9.5} fill={MUTED} textAnchor="middle">exit equity value (M)</text>
    </svg>
  );
}

export function Bridge({ steps, width = 560, height = 210 }: {
  steps: { label: string; from: number; to: number }[]; width?: number; height?: number;
}) {
  const maxV = Math.max(...steps.map((s) => Math.max(s.from, s.to))) * 1.08;
  const n = steps.length;
  const bw = Math.min(64, (width - 40) / n - 14);
  const py = (v: number) => height - 26 - (v / maxV) * (height - 44);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="valuation bridge">
      {steps.map((s, i) => {
        const cx = 24 + (i + 0.5) * ((width - 40) / n);
        const top = py(Math.max(s.from, s.to));
        const hgt = Math.max(Math.abs(py(s.from) - py(s.to)), 2);
        const isFinal = i === n - 1;
        const falls = s.to < s.from;
        return (
          <g key={s.label}>
            {i > 0 ? (
              <line x1={24 + (i - 0.5) * ((width - 40) / n) + bw / 2} y1={py(s.from)}
                x2={cx - bw / 2} y2={py(s.from)} stroke={RULE} strokeWidth={1} />
            ) : null}
            <rect x={cx - bw / 2} y={top} width={bw} height={hgt}
              fill={isFinal ? OX : falls ? "rgba(25,23,20,0.20)" : BRASS}
              opacity={isFinal ? 0.92 : 1} rx={1.5} />
            <text x={cx} y={top - 6} fontSize={10} fill={INK} textAnchor="middle" className="mono">
              {s.to.toFixed(s.to >= 100 ? 0 : 1)}
            </text>
            <text x={cx} y={height - 12} fontSize={8.6} fill={MUTED} textAnchor="middle">
              {s.label.length > 16 ? s.label.slice(0, 15) + "…" : s.label}
            </text>
          </g>
        );
      })}
      <line x1={0} x2={width} y1={height - 26} y2={height - 26} stroke={RULE} />
    </svg>
  );
}

export function Fan({
  t, q05, q25, q50, q75, q95, width = 460, height = 190,
}: {
  t: number[]; q05: number[]; q25: number[]; q50: number[]; q75: number[]; q95: number[];
  width?: number; height?: number;
}) {
  const tMin = t[0], tMax = t[t.length - 1];
  const vMin = Math.min(...q05), vMax = Math.max(...q95);
  const px = (v: number) => ((v - tMin) / (tMax - tMin)) * (width - 8) + 4;
  const py = (v: number) => 8 + (1 - (v - vMin) / (vMax - vMin)) * (height - 34);
  const area = (lo: number[], hi: number[]) =>
    t.map((tv, i) => `${i === 0 ? "M" : "L"}${px(tv).toFixed(1)},${py(hi[i]).toFixed(1)}`).join(" ") +
    [...t].reverse().map((tv, ri) => {
      const i = t.length - 1 - ri;
      return `L${px(tv).toFixed(1)},${py(lo[i]).toFixed(1)}`;
    }).join(" ") + "Z";
  const line = t.map((tv, i) => `${i === 0 ? "M" : "L"}${px(tv).toFixed(1)},${py(q50[i]).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="J-curve fan">
      <path d={area(q05, q95)} fill="rgba(133,118,101,0.12)" />
      <path d={area(q25, q75)} fill="rgba(133,118,101,0.22)" />
      <path d={line} fill="none" stroke={INK} strokeWidth={1.7} />
      <line x1={4} x2={width - 4} y1={py(0)} y2={py(0)} stroke={MUTED} strokeWidth={0.8} strokeDasharray="3 3" />
      <line x1={px(0)} x2={px(0)} y1={8} y2={height - 26} stroke={RULE} strokeWidth={1} />
      <text x={px(0) + 4} y={height - 30} fontSize={9} fill={MUTED}>today</text>
      <line x1={0} x2={width} y1={height - 24} y2={height - 24} stroke={RULE} />
      <text x={width / 2} y={height - 10} fontSize={9.5} fill={MUTED} textAnchor="middle">years · cumulative net cash flow (M)</text>
    </svg>
  );
}

export function RangeDots({
  entries, width = 460, height = 66, format = (v: number) => `${Math.round(v * 100)}%`,
}: {
  entries: { label: string; value: number; emphasized?: boolean }[];
  width?: number; height?: number; format?: (v: number) => string;
}) {
  const px = (v: number) => v * (width - 60) + 30;
  const vals = entries.map((e) => e.value);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="range across assumption sets">
      <line x1={px(Math.min(...vals))} x2={px(Math.max(...vals))} y1={height / 2 - 6} y2={height / 2 - 6}
        stroke="rgba(133,118,101,0.35)" strokeWidth={5} strokeLinecap="round" />
      {entries.map((e) => (
        <g key={e.label}>
          <circle cx={px(e.value)} cy={height / 2 - 6} r={e.emphasized ? 6 : 4}
            fill={e.emphasized ? INK : BRASS} />
          <text x={px(e.value)} y={height / 2 - 16} fontSize={10} fill={INK} textAnchor="middle" className="mono">
            {format(e.value)}
          </text>
          <text x={px(e.value)} y={height / 2 + 14} fontSize={8.6} fill={MUTED} textAnchor="middle">
            {e.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function RangeBars({
  rows, width = 460, rowH = 26, format = (v: number) => `${Math.round(v * 100)}%`, baseline,
}: {
  rows: { label: string; lo: number; hi: number }[]; width?: number; rowH?: number;
  format?: (v: number) => string; baseline?: number;
}) {
  const min = Math.min(...rows.map((r) => r.lo), baseline ?? 1) - 0.02;
  const max = Math.max(...rows.map((r) => r.hi), baseline ?? 0) + 0.02;
  const px = (v: number) => ((v - min) / (max - min)) * (width - 190) + 170;
  const height = rows.length * rowH + 8;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="sensitivity ranking">
      {baseline !== undefined ? (
        <line x1={px(baseline)} x2={px(baseline)} y1={2} y2={height - 4} stroke={INK} strokeWidth={1} strokeDasharray="4 3" />
      ) : null}
      {rows.map((r, i) => {
        const y = i * rowH + rowH / 2;
        return (
          <g key={r.label}>
            <text x={162} y={y + 3.5} fontSize={9.5} fill={MUTED} textAnchor="end">{r.label}</text>
            <line x1={px(r.lo)} x2={px(r.hi)} y1={y} y2={y} stroke={BRASS} strokeWidth={7} strokeLinecap="round" />
            <text x={px(r.lo) - 5} y={y + 3.5} fontSize={9} fill={INK} textAnchor="end" className="mono">{format(r.lo)}</text>
            <text x={px(r.hi) + 5} y={y + 3.5} fontSize={9} fill={INK} className="mono">{format(r.hi)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Spectrum({
  values, lambdaPlus, nShow = 12, width = 460, height = 170,
}: {
  values: number[]; lambdaPlus: number; nShow?: number; width?: number; height?: number;
}) {
  const shown = values.slice(0, nShow);
  const maxLog = Math.log10(Math.max(...shown));
  const minLog = Math.log10(Math.max(Math.min(...shown), 1e-3));
  const py = (v: number) =>
    12 + (1 - (Math.log10(Math.max(v, 1e-3)) - minLog) / (maxLog - minLog)) * (height - 44);
  const bw = (width - 30) / nShow - 8;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="eigenvalue spectrum">
      {shown.map((v, i) => {
        const x = 20 + i * ((width - 30) / nShow);
        const signal = v > lambdaPlus;
        return (
          <g key={i}>
            <rect x={x} y={py(v)} width={bw} height={height - 30 - py(v)}
              fill={signal ? OX : "rgba(25,23,20,0.18)"} opacity={signal ? 0.85 : 1} rx={1.5} />
            <text x={x + bw / 2} y={height - 18} fontSize={8.6} fill={MUTED} textAnchor="middle">{i + 1}</text>
          </g>
        );
      })}
      <line x1={14} x2={width - 6} y1={py(lambdaPlus)} y2={py(lambdaPlus)} stroke={OX} strokeWidth={1.1} strokeDasharray="5 3" />
      <text x={width - 8} y={py(lambdaPlus) - 5} fontSize={9.5} fill={OX} textAnchor="end">
        noise ceiling λ⁺
      </text>
      <line x1={0} x2={width} y1={height - 30} y2={height - 30} stroke={RULE} />
      <text x={width / 2} y={height - 4} fontSize={9.5} fill={MUTED} textAnchor="middle">eigenvalue rank (log scale)</text>
    </svg>
  );
}

export function Heatmap({
  matrix, labels, size = 340,
}: { matrix: number[][]; labels: string[]; size?: number }) {
  const n = matrix.length;
  const cell = size / n;
  const color = (v: number) =>
    v >= 0 ? `rgba(138,48,51,${(0.06 + 0.72 * v).toFixed(3)})` : `rgba(70,90,110,${(0.06 + 0.72 * -v).toFixed(3)})`;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[380px]" role="img" aria-label="denoised correlation heatmap">
      {matrix.map((row, i) =>
        row.map((v, j) => (
          <rect key={`${i}-${j}`} x={j * cell} y={i * cell} width={cell - 0.7} height={cell - 0.7} fill={color(v)}>
            <title>{`${labels[i]} × ${labels[j]}: ${v.toFixed(2)}`}</title>
          </rect>
        ))
      )}
    </svg>
  );
}

export function HBars({
  rows, format = (v: number) => `${(v * 100).toFixed(0)}%`, max, width = 460, rowH = 22, accent = false,
}: {
  rows: { label: string; value: number; secondary?: number }[];
  format?: (v: number) => string; max?: number; width?: number; rowH?: number; accent?: boolean;
}) {
  const m = max ?? Math.max(...rows.map((r) => Math.max(r.value, r.secondary ?? 0))) * 1.15;
  const height = rows.length * rowH + 4;
  const px = (v: number) => (v / m) * (width - 200);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
      {rows.map((r, i) => {
        const y = i * rowH + 4;
        return (
          <g key={r.label}>
            <text x={128} y={y + 9} fontSize={9.3} fill={MUTED} textAnchor="end">{r.label}</text>
            {r.secondary !== undefined ? (
              <rect x={136} y={y + 1} width={px(r.secondary)} height={5} fill="rgba(25,23,20,0.18)" rx={1} />
            ) : null}
            <rect x={136} y={y + (r.secondary !== undefined ? 8 : 3)} width={px(r.value)} height={5}
              fill={accent ? OX : BRASS} opacity={accent ? 0.85 : 1} rx={1} />
            <text x={140 + px(Math.max(r.value, r.secondary ?? 0))} y={y + 10} fontSize={9} fill={INK} className="mono">
              {format(r.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
