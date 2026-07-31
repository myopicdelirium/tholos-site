import type { Metadata } from "next";
import Link from "next/link";
import { services } from "./_data/services";

export const metadata: Metadata = {
  title: "Services · Myopic Delirium",
  description:
    "The lab takes paid engagements. Each listing states what is delivered, the schedule, and the price.",
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-24">
        <div className="smallcaps text-[11px] text-[var(--site-muted)]">Services</div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <h1 className="md-display text-[54px] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">
            Services
          </h1>
          <p className="max-w-[52ch] pb-2 text-[14px] leading-relaxed text-[var(--site-body)]">
            The lab takes paid engagements. Each listing states what is delivered, on what
            schedule, and at what price. Prices are fixed at signature and do not move afterward.
          </p>
        </div>

        <div className="mt-10 border-t border-[var(--site-line)]">
          {services.map((s) =>
            s.live && s.slug ? (
              <Link
                key={s.number}
                href={`/services/${s.slug}`}
                className="grid grid-cols-[56px_1fr] items-baseline gap-x-6 border-b border-[var(--site-line)] py-8 transition hover:bg-[var(--site-hover)] md:grid-cols-[56px_1fr_280px]"
              >
                <div className="smallcaps text-[11px] text-[var(--site-accent)]">{s.number}</div>
                <div className="min-w-0">
                  <div className="md-display text-[30px] leading-tight text-[var(--site-ink)]">{s.title}</div>
                  <p className="mt-2 max-w-[72ch] text-[13.5px] leading-relaxed text-[var(--site-body)]">{s.line}</p>
                </div>
                <div className="col-start-2 mt-3 flex gap-8 md:col-start-3 md:mt-0 md:block md:text-right">
                  <div className="smallcaps text-[10px] leading-[2] text-[var(--site-muted)]">{s.duration}</div>
                  <div className="text-[14px] text-[var(--site-ink)]">{s.price}</div>
                </div>
              </Link>
            ) : (
              <div
                key={s.number}
                className="grid grid-cols-[56px_1fr] items-baseline gap-x-6 border-b border-[var(--site-line)] py-8 opacity-50"
              >
                <div className="smallcaps text-[11px] text-[var(--site-muted)]">{s.number}</div>
                <div>
                  <div className="md-display text-[30px] leading-tight text-[var(--site-muted)]">{s.title}</div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--site-muted)]">{s.line}</p>
                </div>
              </div>
            )
          )}
        </div>

        <p className="mt-10 max-w-[72ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
          Engagements begin with an email to myopicdelirium@gmail.com. If a scoping call finds a
          question underspecified, we say so and charge nothing.
        </p>
      </section>
    </div>
  );
}
