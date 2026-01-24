import Link from "next/link";
import { getAllLogbookEntries, getLogbookFacets } from "@/lib/logbook";
import LogbookIndexClient from "./_components/LogbookIndexClient";

export const metadata = {
  title: "Logbook | Myopic Delirium",
  description: "A research-grade ledger: typed entries, traceable provenance, evidence-first reporting.",
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#5f564d]">
      {children}
    </span>
  );
}

export default function LogbookPage() {
  const entries = getAllLogbookEntries();
  const facets = getLogbookFacets(entries);

  const verifiedCount = entries.filter((e) => e.status === "Verified").length;
  const runningCount = entries.filter((e) => e.status === "Running").length;

  const latest = entries.slice(0, 1)[0];
  const latestLine = latest ? `${latest.date} • ${latest.id}` : "";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="flex flex-col gap-10">
        <header className="paper shadow-paper border rule rounded-2xl p-8 grain md-gridplate overflow-hidden">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="text-[11px] uppercase tracking-[0.34em] text-brass">Myopic Delirium</div>
                <h1 className="md-display text-4xl tracking-tight">Logbook</h1>
                <p className="max-w-2xl text-sm text-[#1b1b1b]/80 leading-relaxed">
                  A reproducible ledger for mechanisms, architectures, environments, experiments, validations, and releases—typed, traceable, and anchored to evidence.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="#entries"
                  className="rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#5f564d] hover:text-[#1b1b1b]"
                >
                  Browse entries
                </Link>
                <Link
                  href="#claims"
                  className="rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#5f564d] hover:text-[#1b1b1b]"
                >
                  Claims index
                </Link>
                <Chip>{entries.length} total</Chip>
                <Chip>{verifiedCount} verified</Chip>
                <Chip>{runningCount} running</Chip>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="md-blackplate rounded-2xl border rule h-[160px] w-full" />
              <div className="rounded-2xl border rule p-5">
                <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Latest entry</div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <div className="text-sm font-medium">{latest ? latest.title : "—"}</div>
                  <div className="mono text-[12px] text-[#1b1b1b]/60">{latestLine}</div>
                </div>
                <div className="mt-1 text-[12px] text-[#1b1b1b]/70">{latest ? latest.type : ""}</div>
              </div>
            </div>
          </div>
        </header>

        <section id="claims" className="paper shadow-paper border rule rounded-2xl p-8">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Promotion layer</div>
            <h2 className="md-display text-2xl tracking-tight">Claims index</h2>
            <p className="text-sm text-[#1b1b1b]/80 max-w-3xl leading-relaxed">
              Claims are promoted results: explicit statements with supporting entries, replications, and falsification attempts. This layer reads like a living paper outline.
            </p>
          </div>
          <div className="mt-5 rounded-2xl border rule p-5 text-sm text-[#1b1b1b]/80 leading-relaxed">
            Next step: add a dedicated Claim format (YAML/MD) and render it here, with replication counts and links to run bundles.
          </div>
        </section>

        <section id="entries" className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Ledger</div>
              <h2 className="md-display text-2xl tracking-tight">Entries</h2>
              <p className="text-sm text-[#1b1b1b]/80 leading-relaxed">
                Filter across type, status, and tags. Traverse threads as a timeline, not a feed.
              </p>
            </div>
            <div className="mono text-[12px] text-[#1b1b1b]/60">{entries.length} entries</div>
          </div>

          <LogbookIndexClient initialEntries={entries} facets={facets} />
        </section>
      </div>
    </main>
  );
}
