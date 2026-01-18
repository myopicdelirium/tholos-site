import Link from "next/link"
import type { Artifact } from "@/lib/artifacts"

export default function ArtifactCard({ a }: { a: Artifact }) {
  return (
    <Link
      href={`/artifacts/${a.slug}`}
      className="block rounded-2xl border border-black/10 bg-white p-6 hover:border-black/20"
    >
      <div className="flex items-baseline justify-between gap-6">
        <div className="text-[11px] uppercase tracking-[0.28em] text-black/55">
          {a.status}{a.venue ? ` · ${a.venue}` : ""}
        </div>
        <div className="text-[11px] uppercase tracking-[0.28em] text-black/40">
          {a.year}
        </div>
      </div>

      <div className="mt-3 text-2xl tracking-tight text-black/90">
        {a.title}
      </div>

      <div className="mt-3 line-clamp-3 text-sm leading-7 text-black/60">
        {a.abstract}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {a.keywords.slice(0, 6).map((k) => (
          <span key={k} className="rounded-full border border-black/10 bg-black/[0.02] px-3 py-1 text-xs text-black/60">
            {k}
          </span>
        ))}
      </div>
    </Link>
  )
}
