import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllLogbookEntries, getLogbookEntryById } from "@/lib/logbook";

export function generateStaticParams() {
  const entries = getAllLogbookEntries();
  return entries.map((e) => ({ id: e.id }));
}

function MetaRow({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] uppercase tracking-[0.28em] text-brass">{k}</div>
      <div className="mono text-[12px] text-[#1b1b1b]/75">{v && v.trim() ? v : "—"}</div>
    </div>
  );
}

export default function LogbookEntryPage({ params }: { params: { id: string } }) {
  const entry = getLogbookEntryById(params.id);
  if (!entry) return notFound();

  const repoLine =
    (entry.repo?.branch ? entry.repo.branch : "") +
    (entry.repo?.commit ? (entry.repo?.branch ? " • " : "") + entry.repo.commit : "");

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/logbook" className="text-[11px] uppercase tracking-[0.28em] text-[#5f564d] hover:text-[#1b1b1b]">
            ← Back to Logbook
          </Link>
          <div className="mono text-[12px] text-[#1b1b1b]/60">
            {entry.date} • {entry.id}
          </div>
        </div>

        <header className="paper shadow-paper border rule rounded-2xl p-8 grain">
          <div className="flex flex-col gap-3">
            <div className="text-[11px] uppercase tracking-[0.28em] text-brass">{entry.type}</div>
            <h1 className="md-display text-4xl tracking-tight">{entry.title}</h1>

            {entry.summary ? (
              <p className="text-sm text-[#1b1b1b]/80 max-w-3xl">{entry.summary}</p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#5f564d]">{entry.status}</span>
              {entry.confidence ? (
                <span className="rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#5f564d]">
                  Confidence {entry.confidence}
                </span>
              ) : null}
              {entry.authors.length ? (
                <span className="rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#5f564d]">
                  {entry.authors.join(", ")}
                </span>
              ) : null}
            </div>

            {entry.tags.length ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {entry.tags.map((t) => (
                  <span key={t} className="rounded-full border rule px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#5f564d]">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="paper shadow-paper border rule rounded-2xl p-6">
            <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Provenance</div>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <MetaRow k="Repo" v={repoLine} />
              <MetaRow k="Run bundle" v={entry.run?.bundle} />
              <MetaRow k="Seeds" v={entry.run?.seeds?.length ? String(entry.run.seeds.join(", ")) : ""} />
              <MetaRow k="Params" v={entry.run?.params} />
            </div>
          </div>

          <div className="paper shadow-paper border rule rounded-2xl p-6">
            <div className="text-[11px] uppercase tracking-[0.28em] text-brass">Artifacts</div>
            <div className="mt-4 flex flex-col gap-2">
              {entry.artifacts?.length ? (
                entry.artifacts.map((a) => (
                  <a key={a.href + a.label} href={a.href} className="rounded-2xl border rule px-4 py-3 text-sm hover:opacity-80">
                    {a.label}
                  </a>
                ))
              ) : (
                <div className="text-sm text-[#1b1b1b]/70">No artifacts linked.</div>
              )}
            </div>
          </div>
        </section>

        <article className="paper shadow-paper border rule rounded-2xl p-8">
          <div className="md-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.body}</ReactMarkdown>
          </div>
        </article>
      </div>
    </main>
  );
}
