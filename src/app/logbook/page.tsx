import Link from "next/link";
import { getAllLogbookEntries } from "@/lib/logbook";
import LogbookIndexClient from "./_components/LogbookIndexClient";

export const metadata = {
  title: "Logbook | Myopic Delirium",
  description: "Versioned research records for mechanisms, architectures, environments, experiments, and validations.",
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
          <div className="py-14">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="text-[11px] uppercase tracking-[0.34em] text-brass">Myopic Delirium</div>
                <h1 className="md-display text-6xl tracking-[-0.02em]">Logbook</h1>
                <p className="max-w-2xl text-sm text-[#1b1b1b]/80 leading-relaxed">
                  A versioned research record for model development. Entries capture what changed, why it changed, and how to reproduce or falsify the result. Each record can link to code, commit hashes, run bundles, seeds, parameters, and artifacts.
                </p>

                <div className="md-inline-actions">
                  <Link href="#entries" className="md-link">Entries</Link>
                  <span className="md-sep">•</span>
                  <Link href="#claims" className="md-link">Claims</Link>
                  <span className="md-sep">•</span>
                  <span className="mono text-[12px] text-[#1b1b1b]/65">
                    Total {entries.length} • Verified {verifiedCount} • Running {runningCount}
                  </span>
                </div>

                <div className="border-t rule pt-7">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Recording standard</div>
                  <div className="mt-2 text-sm text-[#1b1b1b]/78 leading-relaxed max-w-2xl">
                    Each entry should state: objective, method, implementation change, and evidence. If an entry reports results, it must include run identifiers and enough configuration to replicate. If it reports a failure, it should name the failure mode and mitigation.
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="md-blackplate border rule h-[210px] w-full" />

                <div className="md-note">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Latest entry</div>
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="text-sm font-medium">{latest ? latest.title : "—"}</div>

                    {latest ? (
                      <div className="mono text-[12px] text-[#1b1b1b]/60 leading-relaxed">
                        <div>Type: {latest.type}</div>
                        <div>Time: {latest.date} 00:00 UTC</div>
                        <div>ID: {latest.id}</div>
                      </div>
                    ) : null}

                    {latest?.summary ? (
                      <div className="text-sm text-[#1b1b1b]/75 leading-relaxed">{latest.summary}</div>
                    ) : null}
                  </div>
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
                  Claims are promoted statements backed by entries. A claim should link to supporting runs, replications, and any falsification attempts. The purpose is traceability: from statement to evidence to code.
                </p>
              </div>

              <div className="lg:col-span-5">
                <div className="md-note">
                  Not yet populated. Add a claim format and render it here with links to supporting entries and replication counts.
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
                Filter by type, status, and tags. Use the ledger to track implementation decisions, experiment runs, validation work, and incidents.
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
