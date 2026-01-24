"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LogbookEntry } from "@/lib/logbook";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function uniq(xs: string[]) {
  return Array.from(new Set(xs));
}

export default function LogbookIndexClient({ initialEntries }: { initialEntries: LogbookEntry[] }) {
  const types = useMemo(() => uniq(initialEntries.map((e) => e.type)).sort(), [initialEntries]);
  const statuses = useMemo(() => uniq(initialEntries.map((e) => e.status)).sort(), [initialEntries]);
  const tags = useMemo(() => uniq(initialEntries.flatMap((e) => e.tags)).sort((a, b) => a.localeCompare(b)), [initialEntries]);

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

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <aside className="lg:col-span-4">
        <div className="border-t rule pt-6 lg:sticky lg:top-[92px]">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Filters</div>
            <div className="mono text-[12px] text-[#1b1b1b]/60">{filtered.length} shown</div>
          </div>

          <div className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Search</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="id, title, tag, commit, bundle…"
                className="w-full border rule bg-transparent px-4 py-3 text-sm outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Type</div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rule bg-transparent px-3 py-3 text-sm outline-none"
              >
                <option value="All">All</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Status</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rule bg-transparent px-3 py-3 text-sm outline-none"
              >
                <option value="All">All</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Tag</div>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full border rule bg-transparent px-3 py-3 text-sm outline-none"
              >
                <option value="All">All</option>
                {tags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t rule pt-5 flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  setQ("");
                  setType("All");
                  setStatus("All");
                  setTag("All");
                }}
                className="text-[11px] uppercase tracking-[0.28em] text-[#5f564d] hover:text-[#1b1b1b]"
              >
                Reset
              </button>
              <div className="mono text-[12px] text-[#1b1b1b]/55">{initialEntries.length} total</div>
            </div>
          </div>
        </div>
      </aside>

      <section className="lg:col-span-8">
        <div className="md-timeline">
          {filtered.map((e) => (
            <div key={e.id} className="md-timeline-row">
              <div className="md-timeline-rail">
                <div className="mono text-[12px] text-[#1b1b1b]/60">{e.date}</div>
                <div className="mono text-[11px] text-[#1b1b1b]/45">{e.id}</div>
              </div>

              <div className="border-b rule pb-7">
                <Link href={`/logbook/${encodeURIComponent(e.id)}`} className="block">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium">{e.title}</div>
                        <div className="text-[12px] text-[#1b1b1b]/70">
                          {e.type}
                          <span className="md-sep"> • </span>
                          {e.status}
                          {e.confidence ? <span className="md-sep"> • </span> : null}
                          {e.confidence ? `Confidence ${e.confidence}` : null}
                        </div>
                      </div>

                      <div className="mono text-[12px] text-[#1b1b1b]/55">
                        {e.run?.bundle ? `Bundle ${e.run.bundle}` : ""}
                        {e.run?.bundle && e.repo?.commit ? <span className="md-sep"> • </span> : null}
                        {e.repo?.commit ? `Commit ${e.repo.commit}` : ""}
                      </div>
                    </div>

                    {e.summary ? (
                      <div className="text-sm text-[#1b1b1b]/80 leading-relaxed">{e.summary}</div>
                    ) : null}

                    {e.tags.length ? (
                      <div className="mono text-[12px] text-[#1b1b1b]/55">
                        {e.tags.slice(0, 8).join(" / ")}
                        {e.tags.length > 8 ? " / …" : ""}
                      </div>
                    ) : null}
                  </div>
                </Link>
              </div>
            </div>
          ))}

          {filtered.length === 0 ? (
            <div className="border rule p-8 text-sm text-[#1b1b1b]/70">No entries match your filters.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
