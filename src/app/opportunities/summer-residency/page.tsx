import type { Metadata } from "next";
import ApplicationForm from "./ApplicationForm";

export const metadata: Metadata = {
  title: "Summer Residency · Myopic Delirium",
  description:
    "From July 5 to August 13, 2027, six undergraduates from the NYC metropolitan area work alongside members of the lab at Stevens Institute of Technology. Shared housing is provided through Hudson Dorms.",
};

export default function SummerResidencyPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-3xl px-6 pt-12 pb-24">
        <div className="space-y-4">
          <div className="smallcaps text-[11px] text-[var(--site-muted)]">
            Opportunities · Summer 2027
          </div>
          <h1 className="md-display text-[46px] leading-[1.04] tracking-[-0.02em] text-[var(--site-ink)]">
            Summer Residency
          </h1>
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            From July 5 to August 13, 2027, we take six undergraduates from the NYC metropolitan
            area to work alongside members of the lab at Stevens Institute of Technology. Shared
            housing is provided through Hudson Dorms.
          </p>
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            Residents are paired with lab members on current work: simulation experiments, agent
            architectures, public instruments, and writing for the site. Strong applicants will
            have working Python, basic probability and statistics, and something they have built
            or written on their own time.
          </p>
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            Selected applicants will receive full program details by email, followed by a call.
          </p>
        </div>

        <div className="mt-12">
          <ApplicationForm />
        </div>
      </section>
    </div>
  );
}
