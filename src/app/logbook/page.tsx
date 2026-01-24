import Link from "next/link";
import { getAllLogbookEntries } from "@/lib/logbook";
import LogbookIndexClient from "./_components/LogbookIndexClient";

export const metadata = {
  title: "Logbook | Myopic Delirium",
  description: "A research-grade ledger: typed entries, traceable provenance, evidence-first reporting.",
};

function Inner({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-8">{children}</div>;
}

export default function LogbookPage() {
  const entries = getAllLogbookEntries();
  const verifiedCount = entries.filter((e) => e.status === "Verified").length;
  const runningCount = entries.filter((e) => e.status === "Running").length;
  const latest = entries[0];

  return (
    <main className="w-full">
      <header className="paper border-y rule md-gridplate">
        <Inner>
          <div className="py-12">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="text-[11px] uppercase tracking-[0.34em] text-brass">Myopic Delirium</div>
                <h1 className="md-display text-6xl tracking-tight">Logbook</h1>
                <p className="max-w-2xl text-sm text-[#1b1b1b]/80 leading-relaxed">
                  A reproducible ledger for mechanisms, architectures, environments, experiments, validations, and releases—typed, traceable, and anchored to evidence.
                </p>

                <div className="md-inline-actions">
                  <Link href="#entries" className="md-link">
                    Browse entries
                  </Link>
                  <span className="md-sep">/</span>
                  <Link href="#claims" className="md-link">
                    Claims index
                  </Link>
                  <span className="md-sep">/</span>
                  <span className="mono text-[12px] text-[#1b1b1b]/65">
                    {entries.length} total • {verifiedCount} verified • {runningCount} running
                  </span>
                </div>

                <div className="border-t rule pt-6">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Ledger discipline</div>
                  <div className="mt-2 text-sm text-[#1b1b1b]/78 leading-relaxed max-w-2xl">
                    Entries are treated as research records: each one can carry provenance (repo/commit), run bundles, seeds, parameters, and linked artifacts.
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-5">
                <div className="md-blackplate border rule h-[190px] w-full" />
                <div className="border rule">
                  <div className="px-6 py-5">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Latest entry</div>
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="text-sm font-medium">{latest ? latest.title : "—"}</div>
                      <div className="text-[12px] text-[#1b1b1b]/70">
                        {latest ? latest.type : ""}
                        {latest ? <span className="md-sep"> • </span> : null}
                        <span className="mono text-[#1b1b1b]/60">{latest ? `${latest.date} • ${latest.id}` : ""}</span>
                      </div>
                      {latest?.summary ? (
                        <div className="text-sm text-[#1b1b1b]/75 leading-relaxed">{latest.summary}</div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mono text-[12px] text-[#1b1b1b]/55">
                  The interface stays quiet. The records do the talking.
                </div>
              </div>
            </div>
          </div>
        </Inner>
      </header>

      <section id="claims" className="paper border-b rule">
        <Inner>
          <div className="py-12">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Promotion layer</div>
                <h2 className="md-display text-4xl tracking-tight">Claims index</h2>
                <p className="text-sm text-[#1b1b1b]/80 leading-relaxed max-w-2xl">
                  Claims are promoted results: explicit statements with supporting entries, replications, and falsification attempts. This layer reads like a living paper outline.
                </p>
              </div>

              <div className="lg:col-span-5">
                <div className="border rule px-6 py-5 text-sm text-[#1b1b1b]/80 leading-relaxed">
                  Next step: add a Claim format and render it here with replication counts and links to run bundles.
                </div>
              </div>
            </div>
          </div>
        </Inner>
      </section>

      <section id="entries" className="paper border-b rule">
        <Inner>
          <div className="py-12">
            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Ledger</div>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <h2 className="md-display text-4xl tracking-tight">Entries</h2>
                <div className="mono text-[12px] text-[#1b1b1b]/60">{entries.length} entries</div>
              </div>
              <p className="text-sm text-[#1b1b1b]/80 leading-relaxed max-w-3xl">
                Filter across type, status, and tags. Records attach to a ledger spine. Metadata stays quiet; the work stays central.
              </p>
            </div>

            <div className="mt-10">
              <LogbookIndexClient initialEntries={entries} />
            </div>
          </div>
        </Inner>
      </section>
    </main>
  );
}
