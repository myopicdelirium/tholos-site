'use client'

import { useMemo, useState } from 'react'
import type { LogEntry, LogType } from '../_data/entries'

type SortKey = 'date_desc' | 'date_asc' | 'title_asc' | 'type_asc'

const TYPE_LABEL: Record<LogType, string> = {
  release: 'Release',
  patch: 'Patch',
  paper: 'Paper',
  update: 'Update',
}

function typeBadge(type: LogType) {
  const base =
    'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] tracking-[0.22em] uppercase'
  if (type === 'release') return `${base} border-black/15 bg-black/5 text-black/80`
  if (type === 'patch') return `${base} border-black/15 bg-black/5 text-black/80`
  if (type === 'paper') return `${base} border-black/15 bg-black/5 text-black/80`
  return `${base} border-black/15 bg-black/5 text-black/80`
}

function normalize(s: string) {
  return s.toLowerCase().trim()
}

export default function LogbookClient(props: { entries: LogEntry[] }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('date_desc')

  const filtered = useMemo(() => {
    const query = normalize(q)
    const subset = query
      ? props.entries.filter((e) => {
          const hay = normalize(
            [e.title, e.summary, e.type, e.date, ...(e.tags || [])].join(' ')
          )
          return hay.includes(query)
        })
      : props.entries.slice()

    const byDate = (a: LogEntry, b: LogEntry) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()

    subset.sort((a, b) => {
      if (sort === 'date_desc') return byDate(b, a)
      if (sort === 'date_asc') return byDate(a, b)
      if (sort === 'title_asc') return a.title.localeCompare(b.title)
      if (sort === 'type_asc') return a.type.localeCompare(b.type)
      return 0
    })

    return subset
  }, [q, sort, props.entries])

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20">
      <div className="flex flex-col gap-4 border-t border-black/10 pt-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="text-[11px] tracking-[0.28em] uppercase text-black/55">
            Timeline
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-black/85">
            Releases, patches, papers, and field updates
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-black/65">
            A running archive of what shipped, what changed, and what we learned—kept legible for
            outsiders.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[440px]">
          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search logs by title, tag, type, date…"
              className="w-full rounded-xl border border-black/15 bg-white/70 px-4 py-3 text-[14px] text-black/80 outline-none ring-0 placeholder:text-black/35 focus:border-black/25"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] tracking-[0.22em] uppercase text-black/50">
              Sort
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-full rounded-xl border border-black/15 bg-white/70 px-4 py-3 text-[14px] text-black/80 outline-none focus:border-black/25"
            >
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="title_asc">Title (A → Z)</option>
              <option value="type_asc">Type (A → Z)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-10">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white/55 p-8">
            <div className="text-[11px] tracking-[0.28em] uppercase text-black/55">
              Notice
            </div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-black/85">
              Logbook migration in progress
            </h3>
            <p className="mt-2 max-w-3xl text-[15px] leading-7 text-black/65">
              We’re currently reformatting historical entries for consistency and archival clarity.
              This page is the new canonical structure: vertical timeline, searchable, sortable,
              and designed to scale to hundreds of logs.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[11px] top-0 hidden h-full w-px bg-black/10 md:block" />
            <div className="flex flex-col gap-6">
              {filtered.map((e) => (
                <article
                  key={e.id}
                  className="relative rounded-2xl border border-black/10 bg-white/55 p-6 md:pl-10"
                >
                  <div className="absolute left-0 top-7 hidden md:block">
                    <div className="ml-[4px] h-4 w-4 rounded-full border border-black/20 bg-white" />
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={typeBadge(e.type)}>{TYPE_LABEL[e.type]}</span>
                        <span className="text-[12px] tracking-[0.08em] text-black/50">
                          {e.date}
                        </span>
                      </div>

                      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-black/85">
                        {e.title}
                      </h3>

                      <p className="mt-3 text-[15px] leading-7 text-black/65">
                        {e.summary}
                      </p>

                      {e.tags?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {e.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[12px] text-black/60"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0">
                      {e.href ? (
                        <a
                          href={e.href}
                          className="inline-flex items-center gap-2 rounded-xl border border-black/15 bg-white/70 px-4 py-2.5 text-[13px] font-medium text-black/75 hover:border-black/25"
                        >
                          Open
                          <span aria-hidden className="text-black/45">
                            →
                          </span>
                        </a>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/40 px-4 py-2.5 text-[13px] text-black/45">
                          Archived soon
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
