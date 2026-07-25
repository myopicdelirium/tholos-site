"use client";

import { useState } from "react";
import { posts } from "../_components/home/posts/posts";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function teaser(text: string, max = 240) {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/[,\.;:\s]+$/g, "") + "…";
}

export default function LogbookEntries() {
  const [openIds, setOpenIds] = useState<string[]>([]);
  const allOpen = openIds.length === posts.length;

  const toggle = (id: string) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <>
      <div className="mt-10 flex items-center justify-between gap-6 border-b border-[var(--site-line)] pb-4">
        <div className="smallcaps text-[10px] text-[var(--site-muted)]">
          {posts.length} entries
        </div>
        <button
          type="button"
          onClick={() => setOpenIds(allOpen ? [] : posts.map((p) => p.id))}
          className="smallcaps text-[10px] text-[var(--site-muted)] underline decoration-[var(--site-line)] underline-offset-4 transition-colors hover:text-[var(--site-ink)]"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div>
        {posts.map((p) => {
          const isOpen = openIds.includes(p.id);
          return (
            <article key={p.id} className="relative border-t border-[var(--site-line)] first:border-t-0">
              <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-[var(--site-accent)]" />

              <button
                type="button"
                onClick={() => toggle(p.id)}
                aria-expanded={isOpen}
                aria-controls={`entry-${p.id}`}
                className="block w-full py-7 pl-7 pr-2 text-left outline-none transition hover:bg-[var(--site-hover)] focus-visible:bg-[var(--site-hover)]"
              >
                <div className="flex items-baseline justify-between gap-6">
                  <h2
                    className={cx(
                      "md-display text-[22px] leading-[1.18] tracking-[-0.01em] transition-colors",
                      isOpen ? "text-[var(--site-accent)]" : "text-[var(--site-ink)]"
                    )}
                  >
                    {p.title}
                  </h2>
                  <span className="smallcaps shrink-0 text-[10px] text-[var(--site-muted)]">
                    {isOpen ? "Close" : "Read"}
                  </span>
                </div>

                <div className="mt-2 smallcaps text-[10px] text-[var(--site-muted)]">{p.author}</div>

                {isOpen ? null : (
                  <p className="mt-3 max-w-[92ch] text-[13px] leading-relaxed text-[var(--site-body)]">
                    {teaser(p.body[0])}
                  </p>
                )}
              </button>

              {isOpen ? (
                <div id={`entry-${p.id}`} className="pb-10 pl-7 pr-2">
                  {p.body.map((para, i) => (
                    <p
                      key={i}
                      className={cx(
                        "max-w-[80ch] text-[14px] leading-[1.85] text-[var(--site-body)]",
                        i === 0 ? "" : "mt-5"
                      )}
                    >
                      {para}
                    </p>
                  ))}
                  <div className="mt-7">
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      className="smallcaps text-[10px] text-[var(--site-muted)] underline decoration-[var(--site-line)] underline-offset-4 transition-colors hover:text-[var(--site-ink)]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </>
  );
}
