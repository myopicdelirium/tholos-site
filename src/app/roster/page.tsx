"use client"

import { useState } from "react"
import { members, type Member } from "./_data"

type SortKey = "default" | "joined" | "team" | "status"
type SortDir = "asc" | "desc"

function sortMembers(list: Member[], key: SortKey, dir: SortDir): Member[] {
  if (key === "default") return list
  const sorted = [...list].sort((a, b) => {
    if (key === "joined") return a.joined.localeCompare(b.joined)
    if (key === "team") return a.teams.join(", ").localeCompare(b.teams.join(", "))
    if (key === "status") {
      const av = a.active ? 0 : 1
      const bv = b.active ? 0 : 1
      return av - bv
    }
    return 0
  })
  return dir === "desc" ? sorted.reverse() : sorted
}

export default function RosterPage() {
  const [sortKey, setSortKey] = useState<SortKey>("default")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDir === "asc") {
        setSortDir("desc")
      } else {
        setSortKey("default")
        setSortDir("asc")
      }
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sorted = sortMembers(members, sortKey, sortDir)

  const arrow = (key: SortKey) => {
    if (sortKey !== key) return "↕"
    return sortDir === "asc" ? "↑" : "↓"
  }

  const headerClass = (key: SortKey) =>
    `cursor-pointer select-none transition-colors hover:text-[var(--site-ink)] ${sortKey === key ? "text-[var(--site-ink)]" : ""}`

  const chevronClass = (key: SortKey) =>
    `inline-flex items-center justify-center ml-1 h-[16px] w-[16px] rounded border border-[var(--site-line)] text-[8px] leading-none ${sortKey === key ? "bg-[var(--site-hover)] text-[var(--site-ink)]" : "bg-transparent text-[var(--site-muted)]"}`

  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-5xl px-6 pt-12 pb-20">
        <div className="smallcaps text-[11px] text-[var(--site-muted)]">People</div>
        <h1 className="mt-2 md-display text-[54px] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">
          Roster
        </h1>
        <p className="mono mt-2 text-[12px] text-[var(--site-muted)]">Updated April 2026</p>

        {/* column headers */}
        <div className="mt-10 hidden sm:grid sm:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.5fr_40px] gap-x-4 border-b border-[var(--site-line)] pb-2 text-[10px] smallcaps text-[var(--site-muted)]">
          <span>Name</span>
          <span>Position</span>
          <span className={headerClass("team")} onClick={() => handleSort("team")}>
            Team<span className={chevronClass("team")}>{arrow("team")}</span>
          </span>
          <span className={headerClass("joined")} onClick={() => handleSort("joined")}>
            Joined<span className={chevronClass("joined")}>{arrow("joined")}</span>
          </span>
          <span>School</span>
          <span className={`text-right ${headerClass("status")}`} onClick={() => handleSort("status")}>
            Status<span className={chevronClass("status")}>{arrow("status")}</span>
          </span>
        </div>

        <ul className="divide-y divide-[var(--site-line)]">
          {sorted.map((m) => (
            <li
              key={m.name}
              className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.5fr_40px] gap-x-4 gap-y-1 py-3 items-baseline"
            >
              <span className={`text-[15px] ${m.active ? "text-[var(--site-ink)]" : "text-[var(--site-muted)]"}`}>
                <span className="mono text-[11px] text-[var(--site-muted)]">...{m.id}</span>{" "}
                {m.name}
              </span>

              <span className="text-[13px] text-[var(--site-body)]">
                {m.positions.join(", ")}
              </span>

              <span className="mono text-[12px] text-[var(--site-muted)]">
                {m.teams.join(", ")}
              </span>

              <span className="mono text-[12px] text-[var(--site-muted)]">
                {m.joined}
              </span>

              <span className="mono text-[12px] text-[var(--site-muted)]">
                {m.school}
              </span>

              <span className="text-right">
                {m.active ? (
                  <span className={`inline-block h-[7px] w-[7px] rounded-full ${m.statusColor === "red" ? "bg-[rgb(var(--insurgent))]" : "bg-[var(--site-accent)]"}`} />
                ) : (
                  <span className="inline-block h-[7px] w-[7px] rounded-full bg-[var(--site-muted)]" />
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
