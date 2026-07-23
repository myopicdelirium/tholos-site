import type { Metadata } from "next";
import LogbookEntries from "./LogbookEntries";

export const metadata: Metadata = {
  title: "Public Logbook · Myopic Delirium",
  description:
    "Every public development entry in one place: what was built, what was registered before it ran, what failed, and what was withdrawn.",
};

export default function PublicLogbookPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-12">
        <div className="space-y-3">
          <div className="smallcaps text-[11px] text-[var(--site-muted)]">Public</div>
          <h1 className="md-display text-[54px] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">
            Logbook
          </h1>
          <p className="max-w-[62ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            Every entry we have made public, newest first. Each one records what was built, what was registered
            before it ran, what the result was, and what did not survive its replication. Nothing here is edited
            after the fact; corrections are written as their own entries.
          </p>
        </div>

        <LogbookEntries />
      </section>
    </div>
  );
}
