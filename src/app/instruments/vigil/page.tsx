import type { Metadata } from "next";
import Link from "next/link";
import Vigil from "./_components/Vigil";

export const metadata: Metadata = {
  title: "Instruments — The Vigil · Myopic Delirium",
  description:
    "A self-measuring agent-based instrument of terminal commitment: a live population in which bereaved agents may die of thirst because a latched search band shields the alarm from attention — beside a phase diagram computed live from the same update law, with one-click mechanism ablations.",
};

export default function VigilPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-24">
        <div className="space-y-4">
          <div className="smallcaps text-[11px] text-[var(--site-muted)]">
            <Link href="/instruments" className="hover:text-[var(--site-ink)]">Instruments</Link> · No. 2
          </div>
          <h1 className="md-display text-[54px] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">
            The Vigil
          </h1>
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            An agent-based model in which no death is chosen. Agents balance thirst, hunger, and predators on one
            attention budget; when a predator takes a child, the parent&rsquo;s search drive latches — an inertial band
            that shields the thirst alarm from attention — and some parents never re-prioritize before the body fails.
            The optimizing agents seeded through the population are the standing control: when their child is taken,
            nothing latches, and they keep drinking. The capacity to grieve and the capacity to perish are the same
            capacity.
          </p>
          <p className="max-w-[70ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
            The instrument measures its own central claim while you watch. Beside the living field, the same update law
            is swept across parameter space — thousands of bereavement cohorts, painted as a phase diagram with a sharp
            boundary between the region where grief releases in time and the region where devotion outlives the body.
            The map&rsquo;s prediction is compared against the field&rsquo;s observed outcomes, live; the mechanism
            toggles remove one component at a time and erase the death region in two different ways. Seeds are shown;
            every run reproduces.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-[rgba(20,16,10,0.12)] bg-[var(--site-field-bg)] p-4 sm:p-6">
          <Vigil />
        </div>

        <div className="mt-16 border-t border-[var(--site-line)] pt-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="smallcaps text-[10px] text-[var(--site-muted)]">The claim</div>
              <p className="mt-2 max-w-[60ch] text-[12.5px] leading-relaxed text-[var(--site-body)]">
                A utility-maximizer cannot be tuned into martyrdom: death is an absorbing state of minimal value, so for
                every finite mission reward there is a survival threshold at which it always, eventually, drinks. Here
                self-destruction is never valued and never scripted — it emerges from the coupling of a persistence
                gate, a shared attention budget, and a body that keeps drying. Ablate the gate and no commitment forms;
                give the alarm a private channel and commitment persists but the dying stops.
              </p>
            </div>
            <div>
              <div className="smallcaps text-[10px] text-[var(--site-muted)]">Provenance</div>
              <p className="mt-2 max-w-[60ch] text-[12.5px] leading-relaxed text-[var(--site-body)]">
                An instrument of the irrational-substrates program — persistence-gated motivation in inertial bands,
                bounded attention, affect-biased memory over an irreversible homeostatic base. The phase map runs 60
                bereavement cohorts per cell under the field&rsquo;s own update rule, time-sliced in the browser;
                validated headlessly against the live field, whose observed martyr rate lands within a few points of
                the map&rsquo;s prediction. Full prospectus:{" "}
                <Link
                  href="/artifacts/terminal-commitment-emergent-martyrdom"
                  className="underline decoration-[var(--site-line)] underline-offset-4 hover:text-[var(--site-ink)]"
                >
                  Terminal Commitment
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
