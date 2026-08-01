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
        </div>

        <div className="mt-12 rounded-2xl border border-[rgba(20,16,10,0.12)] bg-[var(--site-field-bg)] p-4 sm:p-6">
          <Vigil />
        </div>
      </section>
    </div>
  );
}
