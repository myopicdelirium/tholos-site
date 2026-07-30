import Link from "next/link"
import { notFound } from "next/navigation"
import { getCopenWien, listCopenWien } from "@/lib/copenwien"

export function generateStaticParams() {
  return listCopenWien().map((a) => ({ slug: a.slug }))
}

export default async function CopenWienArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getCopenWien(slug)
  if (!article) return notFound()

  const status = (article.status ?? "Extended abstract").toUpperCase()
  const updated = article.updated ? new Date(article.updated).toISOString().slice(0, 10) : null
  const year = article.year ?? (updated ? updated.slice(0, 4) : null)
  const authors = (article.authors ?? []).join(", ")

  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-3xl px-6 pb-28 pt-12">
        <Link
          href="/artifacts"
          className="mb-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]"
        >
          <span aria-hidden>←</span> Artifacts
        </Link>

        <div className="smallcaps text-[11px] text-[var(--site-accent)]">Købenwien Chapter</div>

        <h1 className="mt-4 md-display text-[clamp(30px,4vw,44px)] leading-[1.06] tracking-[-0.01em] text-[var(--site-ink)]">
          {article.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 smallcaps text-[10px] text-[var(--site-muted)]">
          <span>{status}</span>
          {year ? <span>{year}</span> : null}
          {updated ? <span>updated {updated}</span> : null}
        </div>

        {authors ? (
          <div className="mt-4 text-[13px] text-[var(--site-body)]">{authors}</div>
        ) : null}

        <div className="mt-8 h-px w-full bg-[var(--site-line)]" />

        <div className="mt-8">
          {article.body.map((block, i) =>
            "heading" in block ? (
              <h2
                key={i}
                className="md-display mt-11 first:mt-0 text-[20px] leading-[1.2] tracking-[-0.01em] text-[var(--site-ink)]"
              >
                {block.heading}
              </h2>
            ) : (
              <p
                key={i}
                className="mt-5 first:mt-0 max-w-[74ch] text-[15px] leading-[1.85] text-[var(--site-body)]"
              >
                {block.text}
              </p>
            )
          )}
        </div>

        <div className="mt-14 border-t border-[var(--site-line)] pt-6">
          <p className="max-w-[70ch] text-[12.5px] leading-relaxed text-[var(--site-muted)]">
            Additional information and github access requires authorization. We reserve our intellectual property
            rights. We strongly believe in reproducibility and are more than willing to share with parties that contact
            us directly.
          </p>
        </div>
      </section>
    </div>
  )
}
