export default function LogbookPage() {
  const preview = [
    {
      kind: 'RELEASE',
      date: 'YYYY-MM-DD',
      title: 'Build v0.2.0: Title goes here',
      blurb: 'One or two sentences. What shipped. Why it matters. Where it lives.',
    },
    {
      kind: 'PATCH',
      date: 'YYYY-MM-DD',
      title: 'Patch Notes 0004: Title goes here',
      blurb: 'What changed. What improved. What was removed. Keep it tight.',
    },
    {
      kind: 'PAPER',
      date: 'YYYY-MM-DD',
      title: 'Working Paper 002: Title goes here',
      blurb: 'A short abstract-style hint, plus what the next milestone is.',
    },
  ]

  return (
    <main className="px-6 pb-24 pt-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-12">
          <div className="mb-3 text-[11px] tracking-[0.22em] text-neutral-600">
            LOGBOOK
          </div>
          <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-tight text-neutral-900 md:text-6xl">
            Releases, patches, and working paper drops
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-neutral-700">
            Development updates intended for outsiders: what shipped, what changed, what&apos;s next.
          </p>

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white/50 p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-medium text-neutral-900">
                Notice
              </div>
              <div className="text-sm text-neutral-700">
                We&apos;re currently reformatting log entries for consistency and archival clarity.
              </div>
            </div>
          </div>
        </div>

        <section className="mb-14">
          <div className="mb-5 flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] tracking-[0.22em] text-neutral-600">
                FORMAT PREVIEW
              </div>
              <div className="mt-2 text-sm text-neutral-700">
                This is the structure new entries will follow.
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {preview.map((item) => (
              <div
                key={item.kind}
                className="rounded-2xl border border-neutral-200 bg-white/50 p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[11px] tracking-[0.22em] text-neutral-600">
                    {item.kind}
                  </div>
                  <div className="text-[11px] tracking-[0.18em] text-neutral-500">
                    {item.date}
                  </div>
                </div>

                <div className="text-lg font-semibold leading-snug text-neutral-900">
                  {item.title}
                </div>
                <div className="mt-3 text-sm leading-relaxed text-neutral-700">
                  {item.blurb}
                </div>

                <div className="mt-6 text-[11px] tracking-[0.22em] text-neutral-500">
                  PREVIEW ONLY
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white/50 p-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] tracking-[0.22em] text-neutral-600">
              ENTRIES
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
              No published entries yet
            </div>
            <div className="mt-3 text-sm leading-relaxed text-neutral-700">
              We&apos;re standardizing format, metadata, and backfilling older notes. When entries return,
              they&apos;ll be consistent, searchable, and properly archived.
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <div className="rounded-full border border-neutral-200 bg-white/60 px-4 py-2 text-xs tracking-wide text-neutral-700">
                Next: Reformat + publish initial set
              </div>
              <div className="rounded-full border border-neutral-200 bg-white/60 px-4 py-2 text-xs tracking-wide text-neutral-700">
                Then: Tags + chronology + permanent IDs
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
