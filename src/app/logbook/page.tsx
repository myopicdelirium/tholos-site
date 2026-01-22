import Link from "next/link";
import { getAllLogbookEntries, getLogbookFacets } from "@/lib/logbook";
import LogbookIndexClient from "./_components/LogbookIndexClient";

export const metadata = {
  title: "Logbook | Myopic Delirium",
  description: "A research-grade ledger: typed entries, traceable provenance, evidence-first reporting.",
};

export default function LogbookPage() {
  const entries = getAllLogbookEntries();
  const facets = getLogbookFacets(entries);

  const verified = entries.filter((e) => e.status === "Verified").slice(0, 6);
  const running = entries.filter((e) => e.status === "Running").slice(0, 6);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="flex flex-col gap-10">
        <header className="paper shadow-paper border rule rounded-2xl p-8 grain">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Myopic Delirium</div>
              <h1 className="md-display text-4xl tracking-tight">Logbook</h1>
              <p className="max-w-3xl text-sm text-[#1b1b1b]/80">
                A reproducible, audit-friendly research ledger. Each entry is typed, traceable to code and run bundles, and anchored to evidence.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="#claims" className="rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#5f564d] hover:text-[#1b1b1b]">
                Claims index
              </Link>
              <Link href="#entries" className="rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#5f564d] hover:text-[#1b1b1b]">
                Browse entries
              </Link>
              <span className="rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#5f564d]">
                {entries.length} total
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="paper shadow-paper border rule rounded-2xl p-6">
            <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Latest verified</div>
            <div className="mt-4 flex flex-col gap-3">
              {verified.length === 0 ? (
                <div className="text-sm text-[#1b1b1b]/70">No verified entries yet.</div>
              ) : (
                verified.map((e) => (
                  <Link key={e.id} href={`/logbook/${encodeURIComponent(e.id)}`} className="group block">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-medium group-hover:opacity-80">{e.title}</div>
                      <div className="mono text-[12px] text-[#1b1b1b]/60">{e.date}</div>
                    </div>
                    <div className="text-[12px] text-[#1b1b1b]/70">{e.type}</div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="paper shadow-paper border rule rounded-2xl p-6">
            <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Running / in progress</div>
            <div className="mt-4 flex flex-col gap-3">
              {running.length === 0 ? (
                <div className="text-sm text-[#1b1b1b]/70">Nothing marked as Running.</div>
              ) : (
                running.map((e) => (
                  <Link key={e.id} href={`/logbook/${encodeURIComponent(e.id)}`} className="group block">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-medium group-hover:opacity-80">{e.title}</div>
                      <div className="mono text-[12px] text-[#1b1b1b]/60">{e.date}</div>
                    </div>
                    <div className="text-[12px] text-[#1b1b1b]/70">{e.type}</div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        <section id="claims" className="paper shadow-paper border rule rounded-2xl p-8">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Promotion layer</div>
            <h2 className="md-display text-2xl tracking-tight">Claims index</h2>
            <p className="text-sm text-[#1b1b1b]/80 max-w-3xl">
              Claims are promoted results: explicit statements with supporting entries, replications, and falsification attempts. This is the layer that reads like a living paper outline.
            </p>
          </div>
          <div className="mt-5 rounded-2xl border rule p-5 text-sm text-[#1b1b1b]/80">
            Next step: add a dedicated Claim format (YAML/MD) and render it here. The entry system is already built to support claim promotion and linkage.
          </div>
        </section>

        <section id="entries" className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Ledger</div>
              <h2 className="md-display text-2xl tracking-tight">Entries</h2>
              <p className="text-sm text-[#1b1b1b]/80">
                Search and filter across mechanisms, architectures, environments, experiments, validations, and kernel work.
              </p>
            </div>
          </div>

          <LogbookIndexClient initialEntries={entries} facets={facets} />
        </section>
      </div>
    </main>
  );
}
