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
    <span className={cx("rounded-full border rule px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] text-[#5f564d]", strong && "text-[#1b1b1b] font-medium")}>
      {children}
    </span>
  );
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

  return (
    <div className="paper shadow-paper border rule rounded-2xl">
      <div className="border-b rule p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search: id, title, tag, seed, commit, bundle…"
              className="w-full rounded-2xl border rule bg-transparent px-4 py-3 text-sm outline-none"
            />
            <div className="mono text-[12px] text-[#1b1b1b]/60">{filtered.length} shown</div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

          <div className="flex flex-wrap gap-2">
            <Pill>Typed</Pill>
            <Pill>Traceable</Pill>
            <Pill>Evidence-first</Pill>
            <Pill>Reproducible</Pill>
          </div>
        </div>
      </div>

      <div className="divide-y rule">
        {filtered.map((e) => (
          <Link key={e.id} href={`/logbook/${encodeURIComponent(e.id)}`} className="block p-6 hover:opacity-90">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium">{e.title}</div>
                  <Pill strong={e.status === "Verified" || e.status === "Shipped"}>{e.status}</Pill>
                </div>
                <div className="mono text-[12px] text-[#1b1b1b]/60">
                  {e.date} • {e.id}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Pill>{e.type}</Pill>
                {e.confidence ? <Pill>Confidence {e.confidence}</Pill> : null}
                {e.run?.bundle ? <Pill>Bundle {e.run.bundle}</Pill> : null}
                {e.repo?.commit ? <Pill>Commit {e.repo.commit}</Pill> : null}
              </div>

              {e.summary ? <div className="text-sm text-[#1b1b1b]/85">{e.summary}</div> : null}

              {e.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {e.tags.slice(0, 7).map((t) => (
                    <Pill key={t}>{t}</Pill>
                  ))}
                  {e.tags.length > 7 ? <Pill>+{e.tags.length - 7}</Pill> : null}
                </div>
              ) : null}
            </div>
          </Link>
        ))}

        {filtered.length === 0 ? (
          <div className="p-8 text-sm text-[#1b1b1b]/70">No entries match your filters.</div>
        ) : null}
      </div>
    </div>
  );
}
