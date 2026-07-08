import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Responsible research — on modeling self-destruction · Myopic Delirium",
  description:
    "How research on emergent self-destruction in artificial agents is framed, bounded, and communicated: non-clinical scope, safe-messaging awareness, and the reasons for studying the mechanism at all.",
};

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-[72ch] text-[13.5px] leading-relaxed text-[var(--site-body)]">{children}</p>;
}

export default function EthicsPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-4xl px-6 pt-12 pb-24">
        <div className="smallcaps text-[11px] text-[var(--site-muted)]">
          <Link href="/research" className="hover:text-[var(--site-ink)]">Research</Link> · responsible research
        </div>
        <h1 className="md-display mt-3 text-[38px] leading-[1.08] tracking-[-0.02em] text-[var(--site-ink)]">
          On modeling self-destruction
        </h1>

        <P>
          Part of this research program studies how artificial agents can come to neglect or destroy themselves as
          an emergent consequence of otherwise ordinary cognitive machinery — persistence, attention, memory. The
          subject sits near real human suffering, and that proximity imposes obligations. This page states how the
          work is bounded and why it is done at all.
        </P>

        <h2 className="md-display mt-10 text-[22px] text-[var(--site-ink)]">What this work is not</h2>
        <P>
          It is not clinical research. The models contain no representation of any person, disorder, or treatment;
          they make no diagnostic or predictive claims about individuals; nothing here is advice, risk assessment,
          or a tool for evaluating anyone&rsquo;s state. The agents are a few hundred lines of arithmetic. When a
          working paper says an agent &ldquo;grieves&rdquo; or &ldquo;dies searching,&rdquo; those words name
          formal states in a specified update law — the anthropomorphic reading is a lens, and the papers say so.
        </P>

        <h2 className="md-display mt-10 text-[22px] text-[var(--site-ink)]">Why study it at all</h2>
        <P>
          Because the reigning formal models cannot represent the phenomenon, and what cannot be represented cannot
          be reasoned about. A utility-maximizing agent can be tuned into any behavior except this one; theories of
          human self-destruction built on such foundations must either bolt the outcome on by assumption or deny it
          mechanism. If self-neglect can instead emerge from the interaction of commitment, bounded attention, and
          memory — the claim our instruments demonstrate — then the protective levers become visible and testable:
          in our models, faster affect decay is protective, interruptible attention is protective, and the depth of
          commitment and the width of its death tail are set by the same parameters. Those are hypotheses the
          empirical literatures on rumination and grief can meet halfway. Durkheim asked the structural version of
          this question in 1897; agent-based modeling can finally ask it with moving parts.
        </P>

        <h2 className="md-display mt-10 text-[22px] text-[var(--site-ink)]">How it is communicated</h2>
        <P>
          Publications and instruments here avoid method detail relevant to human self-harm (there is none to
          give — the agents die of neglecting a hydration variable), avoid romanticizing language in scientific
          claims, and keep the elegiac register of the instruments clearly separated from the analytical register
          of the papers. Media descriptions of this work should not present it as research on human suicide; it is
          research on the failure modes of commitment machinery, human or artificial. We follow the spirit of
          established safe-messaging guidance in everything public-facing.
        </P>

        <h2 className="md-display mt-10 text-[22px] text-[var(--site-ink)]">If you are struggling</h2>
        <P>
          This page is about arithmetic; you are not. If you or someone you know is in crisis: in the United
          States, call or text 988 (Suicide &amp; Crisis Lifeline); in the UK and Ireland, Samaritans at 116 123;
          elsewhere, the International Association for Suicide Prevention maintains a directory of crisis centers
          at iasp.info/resources/Crisis_Centres. These services are free, confidential, and staffed by people who
          want to talk with you.
        </P>

        <P>
          Questions, corrections, or concerns about the framing of this research are welcome:{" "}
          <a href="mailto:myopicdelirium@gmail.com" className="underline decoration-[var(--site-line)] underline-offset-4 hover:text-[var(--site-ink)]">
            myopicdelirium@gmail.com
          </a>
          .
        </P>
      </section>
    </div>
  );
}
