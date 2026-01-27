import Link from "next/link";

export default function ConductPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-24 pt-14">
      <h1 className="md-display text-2xl text-[#1b1b1b]/90">Code of Conduct</h1>
      <p className="mono mt-2 text-[12px] text-[#1b1b1b]/55">
        Applies to all Myopic Delirium events, discussions, and working sessions.
      </p>

      <div className="mt-8 space-y-6 text-[13px] leading-relaxed text-[#1b1b1b]/75">
        <section>
          <div className="text-[11px] uppercase tracking-[0.32em] text-[#1b1b1b]/55">1. Intent</div>
          <p className="mt-2">
            We host serious discussion. Disagreement is expected. Disrespect is not. The point is clarity, not dominance.
          </p>
        </section>

        <section>
          <div className="text-[11px] uppercase tracking-[0.32em] text-[#1b1b1b]/55">2. Behavior</div>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Argue the claim. Do not reduce a person.</li>
            <li>No harassment, intimidation, or humiliation as a tactic.</li>
            <li>No recording unless explicitly announced and consented to.</li>
            <li>Respect time, format, and moderation.</li>
          </ul>
        </section>

        <section>
          <div className="text-[11px] uppercase tracking-[0.32em] text-[#1b1b1b]/55">3. Confidentiality</div>
          <p className="mt-2">
            When events are marked closed-format, assume ideas and attendance are not for public attribution without permission.
          </p>
        </section>

        <section>
          <div className="text-[11px] uppercase tracking-[0.32em] text-[#1b1b1b]/55">4. Enforcement</div>
          <p className="mt-2">
            Hosts may remove participants or revoke invitations if conduct undermines the event.
          </p>
        </section>

        <section className="border-t rule pt-6">
          <div className="mono text-[12px] text-[#1b1b1b]/55">
            Questions or concerns:{" "}
            <Link href="/connect" className="underline underline-offset-4">
              connect
            </Link>
            .
          </div>
        </section>
      </div>
    </main>
  );
}
