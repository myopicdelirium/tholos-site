"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LogbookEntry } from "@/lib/logbook";

type Facets = { types: string[]; statuses: string[]; tags: string[] };

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Pill({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={cx(
        "rounded-full border rule px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#5f564d]",
        strong && "text-[#1b1b1b] font-medium"
      )}
    >
      {children}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-[0.28em] text-brass">{children}</div>;
}

export default function LogbookIndexClient({
  initialEntries,
  facets,
}: {
  initialEntries: LogbookEntry[];
  facets: Facets;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [tag, setTag] = useState<string>("All");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return initialEntries.filter((e) => {
      if (type !== "All" && e.type !== type) return false;
      if (status !== "All" && e.status !== status) return false;
      if (tag !== "All" && !e.tags.includes(tag)) return false;

      if (!qq) return true;

      const hay = [
        e.id,
        e.title,
        e.date,
        e.type,
        e.status,
        e.summary,
        e.authors.join(" "),
        e.tags.join(" "),
        e.repo?.branch ?? "",
        e.repo?.commit ?? "",
        e.run?.bundle ?? "",
        e.run?.params ?? "",
        (e.run?.seeds ?? []).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(qq);
    });
  }, [initialEntries, q, type, status, tag]);

  const shown = filtered.length;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <aside className="lg:col-span-4">
        <div className="paper shadow-paper border rule rounded-2xl p-6 lg:sticky lg:top-[92px]">
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              <FieldLabel>Filters</FieldLabel>
              <div className="mono text-[12px] text-[#1b1b1b]/60">{shown} shown</div>
            </div>

            <div className="flex flex-col gap-3">
              <FieldLabel>Search</FieldLabel>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="id, title, tag, seed, commit, bundle…"
                className="w-full rounded-2xl border rule bg-transparent px-4 py-3 text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-2">
                <FieldLabel>Type</FieldLabel>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-2xl border rule bg-transparent px-3 py-3 text-sm outline-none"
                >
                  <option value="All">All types</option>
                  {facets.types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <FieldLabel>Status</FieldLabel>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-2xl border rule bg-transparent px-3 py-3 text-sm outline-none"
                >
                  <option value="All">All statuses</option>
                  {facets.statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <FieldLabel>Tag</FieldLabel>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full rounded-2xl border rule bg-transparent px-3 py-3 text-sm outline-none"
                >
                  <option value="All">All tags</option>
                  {facets.tags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t rule pt-4 flex flex-wrap gap-2">
              <Pill>Typed</Pill>
              <Pill>Traceable</Pill>
              <Pill>Evidence-first</Pill>
              <Pill>Reproducible</Pill>
            </div>

            <div className="border-t rule pt-4 flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  setQ("");
                  setType("All");
                  setStatus("All");
                  setTag("All");
                }}
                className="rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#5f564d] hover:text-[#1b1b1b]"
              >
                Reset
              </button>

              <div className="mono text-[12px] text-[#1b1b1b]/60">
                {initialEntries.length} total
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="lg:col-span-8">
        <div className="paper shadow-paper border rule rounded-2xl">
          <div className="border-b rule p-6 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <FieldLabel>Timeline</FieldLabel>
              <div className="text-sm text-[#1b1b1b]/80 leading-relaxed">
                Entries are rendered as a ledger spine. Dates sit on the rail; records attach as cards.
              </div>
            </div>
            <div className="md-blackplate h-[44px] w-[140px] rounded-2xl border rule" />
          </div>

          <div className="md-timeline p-6">
            {filtered.map((e) => (
              <div key={e.id} className="md-timeline-row">
                <div className="md-timeline-rail">
                  <div className="mono text-[12px] text-[#1b1b1b]/60">{e.date}</div>
                  <div className="mono text-[11px] text-[#1b1b1b]/45">{e.id}</div>
                </div>

                <div className="md-timeline-card">
                  <Link
                    href={`/logbook/${encodeURIComponent(e.id)}`}
                    className="block rounded-2xl border rule p-5 hover:opacity-90"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">{e.title}</div>
                          <Pill strong={e.status === "Verified" || e.status === "Shipped"}>{e.status}</Pill>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pill>{e.type}</Pill>
                          {e.confidence ? <Pill>Confidence {e.confidence}</Pill> : null}
                        </div>
                      </div>

                      {e.summary ? (
                        <div className="text-sm text-[#1b1b1b]/85 leading-relaxed">{e.summary}</div>
                      ) : null}

                      <div className="flex flex-wrap gap-2 pt-1">
                        {e.run?.bundle ? <Pill>Bundle {e.run.bundle}</Pill> : null}
                        {e.repo?.commit ? <Pill>Commit {e.repo.commit}</Pill> : null}
                        {e.tags.slice(0, 5).map((t) => (
                          <Pill key={t}>{t}</Pill>
                        ))}
                        {e.tags.length > 5 ? <Pill>+{e.tags.length - 5}</Pill> : null}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            ))}

            {filtered.length === 0 ? (
              <div className="rounded-2xl border rule p-8 text-sm text-[#1b1b1b]/70">
                No entries match your filters.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
