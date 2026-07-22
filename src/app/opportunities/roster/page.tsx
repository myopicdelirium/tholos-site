import type { Metadata } from "next";
import Link from "next/link";
import RosterForm from "./RosterForm";

export const metadata: Metadata = {
  title: "Roster Application · Myopic Delirium",
  description:
    "An ongoing application to join the lab's projects: remote from anywhere, in person from the NYC metropolitan area, Vienna, or Copenhagen. Three stages: this form, a replication, and a first contribution.",
};

const stages = [
  {
    name: "Stage one: this form",
    body:
      "Short, and read by a person. It tells us where you are, how much time you can hold, and which project you actually want. Selected applicants hear back by email.",
  },
  {
    name: "Stage two: the replication",
    body:
      "You receive one published lab result matched to your workstream and reproduce it: same seed, same output for the simulation and engineering tracks, the same conclusion from the same data for the statistics and writing tracks. You write up what you did and where the docs failed you.",
  },
  {
    name: "Stage three: the first contribution",
    body:
      "One bounded piece of the project you named, with a lab member as your counterpart. When it ships, you are on the roster, and the listing links to what you shipped. That listing is the certification. There is no other one.",
  },
];

export default function RosterPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-3xl px-6 pt-12 pb-24">
        <div className="space-y-4">
          <div className="smallcaps text-[11px] text-[var(--site-muted)]">
            Opportunities · Ongoing
          </div>
          <h1 className="md-display text-[46px] leading-[1.04] tracking-[-0.02em] text-[var(--site-ink)]">
            Roster Application
          </h1>
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            The{" "}
            <Link href="/roster" className="underline decoration-[var(--site-line)] underline-offset-4 hover:text-[var(--site-ink)]">
              roster
            </Link>{" "}
            is the lab&rsquo;s working membership. We take contributors on an ongoing basis: remote
            from anywhere, and in person from the NYC metropolitan area, Vienna, or Copenhagen,
            where core membership is based. Remote work here is written work, so most of it happens
            in documents and repositories, on hours that overlap Eastern or Central European time.
          </p>
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            We expect at least five hours a week, held for at least three months. Joining has three
            stages, and this form is the first.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {stages.map((s) => (
            <div key={s.name} className="rounded-2xl border border-[var(--site-line)] p-5">
              <div className="smallcaps text-[10px] text-[var(--site-accent)]">{s.name}</div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--site-body)]">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <RosterForm />
        </div>
      </section>
    </div>
  );
}
