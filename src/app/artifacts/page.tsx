import Link from "next/link"
import { listArtifacts } from "@/lib/artifacts"
import { listCopenWien } from "@/lib/copenwien"

function teaser(text: string, max = 220) {
  const t = (text ?? "").replace(/\s+/g, " ").trim()
  if (t.length <= max) return t
  return t.slice(0, max).replace(/[,\.;:\s]+$/g, "") + "…"
}

export default function ArtifactsPage() {
  const artifacts = listArtifacts()
  const copenwien = listCopenWien()

  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-5xl px-6 pt-12 pb-20">
        <div className="smallcaps text-[11px] text-[var(--site-muted)]">Research</div>
        <h1 className="mt-3 md-display text-[54px] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">Artifacts</h1>

        {/* ── CopenWien Chapter — extended abstracts, shown in full ── */}
        <div className="mt-16">
          <div className="smallcaps text-[11px] text-[var(--site-accent)]">Chapter</div>
          <h2 className="mt-2 md-display text-[32px] leading-[1.06] tracking-[-0.01em] text-[var(--site-ink)]">
            CopenWien
          </h2>
          <p className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            Extended abstracts for next publication cycle. Additional information and github access requires
            authorization. We reserve our intellectual property rights. We strongly believe in reproducibility and are
            more than willing to share with parties that contact us directly.
          </p>

          <div className="mt-8">
            {copenwien.map((a) => {
              const status = (a.status ?? "Extended abstract").toUpperCase()
              const updated = a.updated ? new Date(a.updated).toISOString().slice(0, 10) : null
              const year = a.year ?? (updated ? updated.slice(0, 4) : "—")
              return (
                <Link
                  key={a.slug}
                  href={`/artifacts/copenwien/${a.slug}`}
                  className="relative block border-t border-[var(--site-line)] py-7 pl-7 transition hover:bg-[var(--site-hover)]"
                >
                  <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-[var(--site-accent)]" />

                  <div className="flex items-center justify-between gap-6">
                    <div className="smallcaps text-[10px] text-[var(--site-muted)]">
                      {status}
                      {updated ? ` · updated ${updated}` : ""}
                    </div>
                    <div className="smallcaps text-[10px] text-[var(--site-muted)]">{year}</div>
                  </div>

                  <h3 className="mt-3 md-display text-[22px] leading-[1.18] tracking-[-0.01em] text-[var(--site-ink)]">
                    {a.title}
                  </h3>

                  <p className="mt-3 max-w-[95ch] text-[13px] leading-relaxed text-[var(--site-body)]">
                    {teaser(a.abstract ?? "")}
                  </p>

                  {a.keywords?.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {a.keywords.slice(0, 8).map((k) => (
                        <span
                          key={k}
                          className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-3 py-1 text-[10px] text-[var(--site-muted)]"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── NYC Chapter — the existing artifacts, request access ── */}
        <div className="mt-20">
          <div className="smallcaps text-[11px] text-[var(--site-accent)]">Chapter</div>
          <h2 className="mt-2 md-display text-[32px] leading-[1.06] tracking-[-0.01em] text-[var(--site-ink)]">NYC</h2>
          <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-[var(--site-body)]">
            Titles, abstracts, and limited previews. Full texts are shared selectively during active development and
            submission cycles.
          </p>

          <div className="mt-8">
            {artifacts.map((a) => {
              const status = (a.status ?? "Working paper").toUpperCase()
              const updated = a.updated ? new Date(a.updated).toISOString().slice(0, 10) : null
              const year = a.year ?? (updated ? updated.slice(0, 4) : "—")
              return (
                <Link
                  key={a.slug}
                  href={`/artifacts/${a.slug}`}
                  className="relative block border-t border-[var(--site-line)] py-7 pl-7 transition hover:bg-[var(--site-hover)]"
                >
                  <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-[var(--site-accent)]" />

                  <div className="flex items-center justify-between gap-6">
                    <div className="smallcaps text-[10px] text-[var(--site-muted)]">
                      {status}
                      {updated ? ` · updated ${updated}` : ""}
                    </div>
                    <div className="smallcaps text-[10px] text-[var(--site-muted)]">{year}</div>
                  </div>

                  <h3 className="mt-3 md-display text-[22px] leading-[1.18] tracking-[-0.01em] text-[var(--site-ink)]">
                    {a.title}
                  </h3>

                  <p className="mt-3 max-w-[95ch] text-[13px] leading-relaxed text-[var(--site-body)]">
                    {teaser(a.abstract ?? "")}
                  </p>

                  {a.keywords?.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {a.keywords.slice(0, 8).map((k) => (
                        <span
                          key={k}
                          className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-3 py-1 text-[10px] text-[var(--site-muted)]"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
