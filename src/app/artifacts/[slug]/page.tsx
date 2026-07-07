import Link from "next/link"
import { getArtifact } from "@/lib/artifacts"
import { notFound } from "next/navigation"
import AccessRequestForm from "./AccessRequestFormClient"

export default async function ArtifactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artifact = getArtifact(slug)
  if (!artifact) return notFound()

  const status = (artifact.status ?? "Working paper").toUpperCase()
  const updated = artifact.updated ? new Date(artifact.updated).toISOString().slice(0, 10) : null
  const year = artifact.year ?? (updated ? updated.slice(0, 4) : "—")
  const authors = (artifact.authors ?? []).join(", ")
  const previewSrc = (artifact as any).previewImage ?? (artifact as any).preview ?? null

  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-24">
        <Link
          href="/artifacts"
          className="mb-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]"
        >
          <span aria-hidden>←</span> Artifacts
        </Link>
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="smallcaps text-[11px] text-[var(--site-muted)]">
              {status}
              {updated ? ` · updated ${updated}` : ""}
              {year ? ` · ${year}` : ""}
            </div>

            <h1 className="mt-4 md-display md-hero-title text-[var(--site-ink)]">{artifact.title}</h1>

            {authors ? (
              <div className="mt-5 flex items-center gap-3">
                <div className="smallcaps text-[11px] text-[var(--site-muted)]">Authors</div>
                <div className="text-[13px] text-[var(--site-body)]">{authors}</div>
              </div>
            ) : null}

            <div className="mt-10 space-y-3">
              <div className="smallcaps text-[11px] text-[var(--site-muted)]">Abstract</div>
              <div className="relative border border-[var(--site-line)] p-6 text-[14px] leading-relaxed text-[var(--site-body)]">
                <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-[var(--site-accent)]" />
                {artifact.abstract}
              </div>
            </div>

            {artifact.keywords?.length ? (
              <div className="mt-10">
                <div className="smallcaps text-[11px] text-[var(--site-muted)]">Keywords</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {artifact.keywords.map((k) => (
                    <span
                      key={k}
                      className="smallcaps rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-3 py-1 text-[10px] text-[var(--site-muted)]"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-10">
              <div className="smallcaps text-[11px] text-[var(--site-muted)]">Access</div>
              <p className="mt-3 max-w-[60ch] text-[13px] leading-relaxed text-[var(--site-body)]">
                Full text is restricted during active development and submission cycles. Request access on the right.
              </p>
            </div>
          </div>

          <div className="relative border border-[var(--site-line)] p-6">
            <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-[var(--site-accent)]" />
            <div className="smallcaps text-[11px] text-[var(--site-muted)]">Preview</div>

            <div className="relative mt-3 overflow-hidden border border-[var(--site-line)] bg-black/20">
              {previewSrc ? (
                <img src={previewSrc} alt="" className="h-[420px] w-full object-cover blur-[6px] brightness-[0.7]" />
              ) : (
                <div className="h-[420px] w-full bg-black/25" />
              )}

              <div className="absolute bottom-4 left-4 right-4 bg-black/55 p-4">
                <div className="smallcaps text-[10px] text-[var(--site-accent)]">Restricted</div>
                <div className="mt-1 text-[13px] leading-snug text-[#efe9dc]">
                  Preview intentionally obscured. Request full access to read the paper.
                </div>
              </div>
            </div>

            <AccessRequestForm title={artifact.title} slug={slug} />
          </div>
        </div>
      </section>
    </div>
  )
}
