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
    <section className="mx-auto max-w-6xl px-6 pt-12 pb-24">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="smallcaps text-[11px] text-[#6a6258]">
            {status}
            {updated ? ` · updated ${updated}` : ""}
            {year ? ` · ${year}` : ""}
          </div>

          <h1 className="mt-4 md-display md-hero-title text-[#191714]">{artifact.title}</h1>

          {authors ? (
            <div className="mt-5 flex items-center gap-3">
              <div className="smallcaps text-[11px] text-[#6a6258]">Authors</div>
              <div className="text-[13px] text-[#3f3a33]">{authors}</div>
            </div>
          ) : null}

          <div className="mt-10 space-y-3">
            <div className="smallcaps text-[11px] text-[#6a6258]">Abstract</div>
            <div className="paper shadow-paper border rule rounded-2xl bg-white/70 p-6 text-[14px] leading-relaxed text-[#3a352f]">
              {artifact.abstract}
            </div>
          </div>

          {artifact.keywords?.length ? (
            <div className="mt-10">
              <div className="smallcaps text-[11px] text-[#6a6258]">Keywords</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {artifact.keywords.map((k) => (
                  <span
                    key={k}
                    className="smallcaps rounded-full border border-[rgba(133,118,101,0.22)] bg-white/55 px-3 py-1 text-[10px] text-[#5c544a]"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-10">
            <div className="smallcaps text-[11px] text-[#6a6258]">Access</div>
            <div className="paper shadow-paper border rule mt-3 rounded-2xl bg-white/55 p-6">
              <p className="text-[13px] leading-relaxed text-[#4b443b]">
                Full text is restricted during active development and submission cycles. Request access on the right.
              </p>
            </div>
          </div>
        </div>

        <div className="paper shadow-paper border rule rounded-2xl bg-white/55 p-6">
          <div className="smallcaps text-[11px] text-[#6a6258]">Preview</div>

          <div className="relative mt-3 overflow-hidden rounded-2xl border rule bg-black/10">
            {previewSrc ? (
              <img src={previewSrc} alt="" className="h-[420px] w-full object-cover blur-[6px] brightness-[0.75]" />
            ) : (
              <div className="h-[420px] w-full bg-black/15" />
            )}

            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/55 p-4 text-white/90">
              <div className="smallcaps text-[10px] opacity-80">Restricted</div>
              <div className="mt-1 text-[13px] leading-snug">
                Preview intentionally obscured. Request full access to read the paper.
              </div>
            </div>
          </div>

          <AccessRequestForm title={artifact.title} slug={slug} />
        </div>
      </div>
    </section>
  )
}
