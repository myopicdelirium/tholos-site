import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Desk — a private marking engagement · Myopic Delirium",
  description:
    "Quarterly independent marks on your private book: credible bands, exact waterfalls, disclosed assumptions — on a private instance of the valuation engine, for a flat quarterly fee.",
};

const deliverables = [
  {
    name: "The Quarterly Mark",
    body:
      "The report: book NAV with its band, position-by-position marks with the gap against your own carrying values and what drives each gap, your payoff curves, forward distributions, the risk view, and the method notes verbatim.",
  },
  {
    name: "Your private terminal",
    body:
      "An access-coded instance of the live terminal holding your book — rerun it yourself between quarters, stress it, change assumptions, export everything. Same seed, same result, bit-identically: the marks are auditable.",
  },
  {
    name: "The register",
    body:
      "Every parameter behind your marks, with its source and honesty class — public, so you can see exactly what is cited, what is anchored, and what is assumed. A desk that hides its assumptions is selling you its optimism.",
  },
];

const pricing = [
  ["Onboarding (one-time)", "€1,500", "book build, peer sets pinned, private instance, baseline mark, first report"],
  ["The desk, quarterly — books to 8 holdings", "€1,200 / quarter", "the re-mark, the report, one working session, hosting"],
  ["The desk, quarterly — books to 15 holdings", "€2,000 / quarter", "as above"],
  ["The Waterfall Report (one-off, single holding)", "€450", "your class's exact payoff structure and a mark with its band — for the quarter you decide to sell, exercise, or follow on"],
] as const;

export default function DeskPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-5xl px-6 pt-12 pb-24">
        <div className="space-y-4">
          <div className="smallcaps text-[11px] text-[var(--site-muted)]">
            <Link href="/instruments" className="hover:text-[var(--site-ink)]">Instruments · No. 1</Link> · The desk
          </div>
          <h1 className="md-display text-[46px] leading-[1.04] tracking-[-0.02em] text-[var(--site-ink)]">
            The Desk
          </h1>
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            Private holdings are marked by the people who hold them, and those marks drift optimistic. If you hold
            direct positions — as an angel, a founder with stakes in others&rsquo; companies, a family holding company —
            your book is probably carried at whatever the last round said, held together by a spreadsheet that has
            never once computed your liquidation waterfall. Between that spreadsheet and an institutional valuation
            firm at five figures per position per year, there has been nothing.
          </p>
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            The desk is the in-between: each quarter, an independent, market-referenced mark for every position in
            your book — comparables you approve, a defensible marketability discount, and the exact payoff of your
            share class through the waterfall — reported as a credible band, never a lone number, on a{" "}
            <em>private instance of the engine provisioned for you alone</em>.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {deliverables.map((d) => (
            <div key={d.name} className="rounded-2xl border border-[var(--site-line)] p-5">
              <div className="smallcaps text-[10px] text-[#8a3033]">{d.name}</div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--site-body)]">{d.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <div className="smallcaps text-[10px] text-[var(--site-muted)]">See it before you ask</div>
          <div className="mt-3 flex flex-wrap gap-4">
            <a
              href="/desk/sample-quarterly-mark.pdf"
              className="rounded-2xl border border-[var(--site-line)] px-5 py-4 text-[13px] text-[var(--site-ink)] transition hover:bg-[var(--site-hover)]"
            >
              The Quarterly Mark — sample edition (PDF) →
              <div className="mt-1 text-[11.5px] text-[var(--site-muted)]">
                a fictional six-holding book, marked by the live engine — this is the deliverable
              </div>
            </a>
            <a
              href="/desk/engagement.pdf"
              className="rounded-2xl border border-[var(--site-line)] px-5 py-4 text-[13px] text-[var(--site-ink)] transition hover:bg-[var(--site-hover)]"
            >
              The engagement letter (PDF) →
              <div className="mt-1 text-[11.5px] text-[var(--site-muted)]">
                scope, custody, pricing, and what this is not — two pages
              </div>
            </a>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-[var(--site-line)]">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[var(--site-line)]">
                {["engagement", "price", "covers"].map((h) => (
                  <th key={h} className="smallcaps px-4 py-3 text-left text-[9.5px] font-normal text-[var(--site-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricing.map(([a, b, c]) => (
                <tr key={a} className="border-b border-[var(--site-line)] last:border-b-0">
                  <td className="px-4 py-3 text-[12.5px] font-medium text-[var(--site-ink)]">{a}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-[var(--site-ink)]">{b}</td>
                  <td className="px-4 py-3 text-[12px] leading-relaxed text-[var(--site-muted)]">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-[70ch] text-[12px] leading-relaxed text-[var(--site-muted)]">
          Anchors, stated honestly: a single-company 409A runs roughly $2,000–5,000 a year; institutional independent
          fair-value opinions run five figures per position per year; a spreadsheet is free, and does not know what a
          participation cap does to your proceeds. An eight-holding book here is €6,300 in year one — every position,
          every quarter, for less than one institutional opinion on one position.
        </p>

        <div className="mt-10 rounded-2xl border border-[var(--site-line)] p-6">
          <div className="smallcaps text-[10px] text-[#8a3033]">What this is not</div>
          <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-[var(--site-body)]">
            Decision support with disclosed assumptions — not a valuation of record, not an audit opinion, not
            investment advice. The engine&rsquo;s calibration register is{" "}
            <Link href="/instruments/register" className="underline decoration-[var(--site-line)] underline-offset-4 hover:text-[var(--site-ink)]">
              public
            </Link>
            , including which parameters are assumed rather than cited; engagements inherit every improvement as the
            validation roadmap closes. If you need a mark an auditor will sign, the desk will tell you so — and tell
            you who to call.
          </p>
        </div>

        <div className="mt-10">
          <Link
            href="/connect"
            className="inline-block rounded-2xl border border-[var(--site-line)] bg-[var(--site-ink)] px-6 py-4 text-[13px] text-[rgb(var(--ivory))] transition hover:opacity-90"
          >
            Engage via Connect →
          </Link>
          <p className="mt-3 max-w-[60ch] text-[12px] leading-relaxed text-[var(--site-muted)]">
            Describe the book in one paragraph — how many holdings, what stages, whether you carry self-marks. You
            will get a straight answer about fit within two business days.
          </p>
        </div>
      </section>
    </div>
  );
}
