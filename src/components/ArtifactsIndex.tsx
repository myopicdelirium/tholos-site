"use client"

import { useMemo, useState } from "react"
import type { Artifact } from "@/lib/artifacts"
import ArtifactCard from "@/components/ArtifactCard"

export default function ArtifactsIndex({ items }: { items: Artifact[] }) {
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter(a => {
      const hay = [
        a.title,
        a.abstract,
        a.status,
        a.venue || "",
        a.keywords.join(" ")
      ].join(" ").toLowerCase()
      return hay.includes(s)
    })
  }, [items, q])

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.28em] text-black/55">Artifacts</div>
          <h1 className="mt-3 text-5xl tracking-tight font-semibold">Research artifacts</h1>
          <p className="mt-3 text-sm leading-7 text-black/55">
            Titles, abstracts, and keywords are public. Full texts are available on request.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none placeholder:text-black/35 focus:border-black/20"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map(a => <ArtifactCard key={a.slug} a={a} />)}
      </div>

      <div className="text-xs text-black/45">
        For full access, open an artifact and request the PDF.
      </div>
    </div>
  )
}
