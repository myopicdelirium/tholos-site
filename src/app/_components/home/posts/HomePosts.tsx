"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { posts } from "./posts";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function HomePosts() {
  const railRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const open = openId != null;
  const post = posts.find((p) => p.id === openId) ?? null;

  // ---- rail scroll state (arrows only appear when there is somewhere to go) ----
  const updateArrows = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = railRef.current;
    if (!el) return;
    const on = () => updateArrows();
    el.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      el.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [updateArrows]);

  const slide = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 320), behavior: "smooth" });
  };

  const openPost = (id: string, e: React.MouseEvent<HTMLElement>) => {
    lastFocusRef.current = (e.currentTarget as HTMLElement) ?? (document.activeElement as HTMLElement);
    setOpenId(id);
  };
  const close = () => setOpenId(null);

  // ---- pop-down behaviour (mirrors ConnectLetter) ----
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>('[data-autofocus="true"]')?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const root = sheetRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter((n) => !n.hasAttribute("disabled") && n.tabIndex !== -1);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) return;
    const prev = lastFocusRef.current;
    if (prev) window.setTimeout(() => prev.focus(), 0);
  }, [open]);

  const showArrows = canLeft || canRight;

  return (
    <section className="bg-[var(--site-bg)] px-6 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div aria-hidden className="h-[2px] w-14 bg-[var(--site-accent)]" />
            <h2 className="md-display mt-6 text-[clamp(24px,3vw,38px)] leading-[1.05] tracking-[-0.01em] text-[var(--site-ink)]">
              Articles
            </h2>
          </div>
          {showArrows ? (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                aria-label="Previous articles"
                onClick={() => slide(-1)}
                disabled={!canLeft}
                className="grid h-11 w-11 place-items-center border border-[var(--site-line)] text-[var(--site-ink)] transition-colors hover:bg-[var(--site-hover)] disabled:cursor-default disabled:opacity-25"
              >
                <span aria-hidden className="text-[15px]">←</span>
              </button>
              <button
                type="button"
                aria-label="More articles"
                onClick={() => slide(1)}
                disabled={!canRight}
                className="grid h-11 w-11 place-items-center border border-[var(--site-line)] text-[var(--site-ink)] transition-colors hover:bg-[var(--site-hover)] disabled:cursor-default disabled:opacity-25"
              >
                <span aria-hidden className="text-[15px]">→</span>
              </button>
            </div>
          ) : null}
        </div>

        <div
          ref={railRef}
          className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {posts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={(e) => openPost(p.id, e)}
              className="group flex w-[clamp(280px,32vw,400px)] shrink-0 snap-start flex-col text-left outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--site-accent)]"
            >
              <div className="relative flex h-full flex-col border border-[var(--site-line)] p-6 transition-colors group-hover:border-[var(--site-accent)]">
                <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-[var(--site-accent)]" />
                <h3 className="md-display line-clamp-2 min-h-[2.6em] text-[20px] leading-snug text-[var(--site-ink)] transition-colors group-hover:text-[var(--site-accent)]">
                  {p.title}
                </h3>
                <p className="mt-3 line-clamp-4 text-[13px] leading-relaxed text-[var(--site-body)]">
                  {p.body[0]}
                </p>
                <span className="mt-5 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--site-muted)] transition-colors group-hover:text-[var(--site-accent)]">
                  Read
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {open && post ? (
        <div className="fixed inset-0 z-[100]">
          <button type="button" aria-label="Close article" onClick={close} className="absolute inset-0 bg-black/45" />

          <div className="absolute inset-x-0 top-0 px-4 pt-6 sm:px-6 sm:pt-10">
            <div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="md-post-title"
              data-mddrop
              className="relative z-[1] mx-auto max-h-[88vh] w-full max-w-3xl overflow-y-auto border border-[var(--nav-line)] bg-[var(--nav-bg)] text-[var(--nav-ink)] shadow-paper"
              style={{ animation: "mdDrop 900ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
            >
              <style>{`@keyframes mdDrop {0% { transform: translateY(-110%); opacity: 0.85; }70% { transform: translateY(10px); opacity: 1; }100% { transform: translateY(0); opacity: 1; }}@media (prefers-reduced-motion: reduce){[data-mddrop]{animation:none !important;}}`}</style>

              <button
                type="button"
                aria-label="Close"
                onClick={close}
                data-autofocus="true"
                className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center border border-[var(--nav-line)] bg-transparent text-[var(--nav-muted)] hover:bg-[var(--nav-active-bg)] hover:text-[var(--nav-ink)] focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <span className="text-[18px] leading-none">&times;</span>
              </button>

              <div className="px-6 py-10 sm:px-12">
                <h2
                  id="md-post-title"
                  className="max-w-[26ch] font-serif text-[32px] leading-[1.06] tracking-tight text-[var(--nav-ink)] sm:text-[42px]"
                >
                  {post.title}
                </h2>

                <div className="mt-7 h-px w-full bg-[var(--nav-line)]" />

                <div className="mt-7 space-y-5">
                  {post.body.map((para, i) => (
                    <p key={i} className="max-w-[68ch] text-[15px] leading-[1.8] text-[var(--nav-ink)] opacity-90">
                      {para}
                    </p>
                  ))}
                </div>

                <div className="mt-10 flex items-center justify-between text-[12px] text-[var(--nav-muted)]">
                  <div>&copy; 2026 Myopic Delirium</div>
                  <div className="mono">Press ESC to close.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
