"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Row = {
  label: string;
  value: string;
  href?: string;
  note?: string;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function useLockBody(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1100);
        } catch {
          setCopied(false);
        }
      }}
      className={cx(
        "inline-flex items-center justify-center px-3 py-2 text-[11px] uppercase tracking-[0.28em]",
        "border border-black/15 bg-transparent text-black/55 hover:bg-black/5 hover:text-black/75",
        "focus:outline-none focus:ring-2 focus:ring-black/15"
      )}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Rule() {
  return <div className="h-px w-full bg-black/10" />;
}

export default function ConnectLetter() {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const rows: Row[] = useMemo(
    () => [
      {
        label: "General",
        value: "myopicdelirium@gmail.com",
        href: "mailto:myopicdelirium@gmail.com",
        note: "Research, collaboration, press."
      },
      {
        label: "Sponsorship",
        value: "felixtinio@gmail.com",
        href: "mailto:felixtinio@gmail.com",
        note: "Financing, sponsorship, sensitive correspondence."
      },
      {
        label: "Phone",
        value: "+1 (551) 227-8031",
        href: "tel:+15512278031",
        note: "Time-sensitive coordination only."
      },
      {
        label: "GitHub",
        value: "github.com/myopicdelirium",
        href: "https://github.com/myopicdelirium",
        note: "Public artifacts and selected releases."
      }
    ],
    []
  );

  useLockBody(open);

  useEffect(() => {
    const onOpen = () => {
      lastFocusRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    window.addEventListener("md:connect-open", onOpen as EventListener);
    return () => window.removeEventListener("md:connect-open", onOpen as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const el = sheetRef.current?.querySelector<HTMLElement>('[data-autofocus="true"]');
      el?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const root = sheetRef.current;
      if (!root) return;

      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
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
    if (prev) {
      window.setTimeout(() => prev.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close correspondence"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/35"
      />

      <div className="absolute inset-x-0 top-0 px-4 sm:px-6 pt-6 sm:pt-10">
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          className={cx(
            "relative mx-auto w-full max-w-6xl",
            "border border-black/15 shadow-paper",
            "bg-[rgb(var(--ivory))] text-[#1b1b1b]",
            "max-h-[calc(100vh-3.5rem)] overflow-auto"
          )}
          style={{
            animation: "mdDrop 900ms cubic-bezier(0.16, 1, 0.3, 1) both"
          }}
        >
          <style>{`
            @keyframes mdDrop {
              0% { transform: translateY(-110%); opacity: 0.85; }
              70% { transform: translateY(10px); opacity: 1; }
              100% { transform: translateY(0); opacity: 1; }
            }
          `}</style>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(900px 500px at 20% 10%, rgba(0,0,0,0.03), transparent 60%), radial-gradient(900px 520px at 85% 35%, rgba(10,42,74,0.05), transparent 62%), linear-gradient(180deg, rgba(0,0,0,0.015), rgba(0,0,0,0.02))"
            }}
          />

          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className={cx(
              "absolute right-4 top-4 sm:right-6 sm:top-6",
              "h-10 w-10 grid place-items-center",
              "border border-black/15 bg-transparent text-black/55 hover:bg-black/5 hover:text-black/75",
              "focus:outline-none focus:ring-2 focus:ring-black/15"
            )}
            data-autofocus="true"
          >
            <span className="text-[18px] leading-none">×</span>
          </button>

          <div className="relative px-6 sm:px-10 py-10 sm:py-12">
            <div className="flex items-start justify-between gap-6">
              <div className="text-[11px] uppercase tracking-[0.55em] text-black/55">
                MYOPIC DELIRIUM
              </div>
              <div className="text-right text-[11px] uppercase tracking-[0.32em] text-black/45">
                CORRESPONDENCE · 48H WINDOW
              </div>
            </div>

            <div className="mt-6">
              <Rule />
            </div>

            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <div className="text-[11px] uppercase tracking-[0.55em] text-black/45">
                  CONNECT
                </div>
                <h2 className="mt-4 font-serif tracking-tight leading-[0.92] text-[54px] sm:text-[72px] md:text-[86px]">
                  Contact
                </h2>
                <div className="mt-6 max-w-2xl text-[14px] leading-relaxed text-black/62">
                  For research collaboration, events, press, and sponsorship inquiries. If your message is technical, include a short abstract and a link to the relevant page or document.
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href="mailto:myopicdelirium@gmail.com"
                    className="border border-black/15 bg-black/[0.03] px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-black/75 hover:bg-black/5 hover:text-black/85"
                  >
                    Email
                  </a>

                  <Link
                    href="/conduct"
                    className="border border-black/15 bg-transparent px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-black/65 hover:bg-black/5 hover:text-black/80"
                    onClick={() => setOpen(false)}
                  >
                    Customs
                  </Link>

                  <Link
                    href="/events"
                    className="border border-black/15 bg-transparent px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-black/65 hover:bg-black/5 hover:text-black/80"
                    onClick={() => setOpen(false)}
                  >
                    Events
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-4 lg:justify-self-end">
                <div className="inline-flex items-center gap-3">
                  <div className="h-[34px] w-[112px] border border-black/20 bg-[#0a2a4a]" />
                  <div className="text-[11px] uppercase tracking-[0.32em] text-black/55">
                    MD / CONNECT
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <Rule />
            </div>

            <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="text-[11px] uppercase tracking-[0.55em] text-black/45">
                  Channels
                </div>

                <div className="mt-6 border border-black/10 bg-black/[0.015]">
                  <div className="px-6 py-6">
                    <div className="space-y-6">
                      {rows.map((r, i) => (
                        <div key={r.label}>
                          <div className="grid grid-cols-12 items-start gap-4">
                            <div className="col-span-12 sm:col-span-3">
                              <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">
                                {r.label}
                              </div>
                            </div>

                            <div className="col-span-12 sm:col-span-7">
                              {r.href ? (
                                <a
                                  href={r.href}
                                  target={r.href.startsWith("http") ? "_blank" : undefined}
                                  rel={r.href.startsWith("http") ? "noreferrer" : undefined}
                                  className="block text-[20px] sm:text-[22px] font-semibold tracking-tight text-black/85 hover:text-black"
                                >
                                  {r.value}
                                </a>
                              ) : (
                                <div className="text-[20px] sm:text-[22px] font-semibold tracking-tight text-black/85">
                                  {r.value}
                                </div>
                              )}

                              {r.note ? (
                                <div className="mt-2 text-[13px] leading-relaxed text-black/55">
                                  {r.note}
                                </div>
                              ) : null}
                            </div>

                            <div className="col-span-12 sm:col-span-2 flex justify-start sm:justify-end">
                              <CopyButton value={r.value} />
                            </div>
                          </div>

                          {i !== rows.length - 1 ? (
                            <div className="mt-6">
                              <div className="h-px w-full bg-black/10" />
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-[12px] text-black/45">
                  If you are proposing an event, include a preferred date range, expected attendance, and whether the session is public or closed-format.
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="text-[11px] uppercase tracking-[0.55em] text-black/45">
                  Protocol
                </div>

                <div className="mt-6 border border-black/10 bg-black/[0.015]">
                  <div className="px-6 py-6">
                    <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">
                      Correspondence
                    </div>

                    <div className="mt-6 space-y-6 text-[14px] leading-relaxed text-black/65">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.32em] text-black/40">1. Subject</div>
                        <div className="mt-2">Use a specific subject line. If relevant, include Event, Collaboration, or Sponsorship.</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-[0.32em] text-black/40">2. Abstract</div>
                        <div className="mt-2">Three to five sentences: what you want, why it matters, what you need from us.</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-[0.32em] text-black/40">3. Links</div>
                        <div className="mt-2">Prefer links to documents or repositories over heavy attachments.</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-[0.32em] text-black/40">4. Window</div>
                        <div className="mt-2">General correspondence is handled within 48 hours. Phone is reserved for time-sensitive matters.</div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <Rule />
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Link
                        href="/artifacts"
                        className="border border-black/15 bg-black/[0.03] px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-black/75 hover:bg-black/5 hover:text-black/85"
                        onClick={() => setOpen(false)}
                      >
                        Artifacts
                      </Link>

                      <Link
                        href="/events"
                        className="border border-black/15 bg-transparent px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-black/65 hover:bg-black/5 hover:text-black/80"
                        onClick={() => setOpen(false)}
                      >
                        Events
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-black/10 pt-6 text-[12px] text-black/45">
                  Customs outlines participation expectations and conduct.
                </div>
              </div>
            </div>

            <div className="mt-10">
              <Rule />
            </div>

            <div className="mt-6 flex items-center justify-between gap-6 text-[12px] text-black/45">
              <div>© 2026 Myopic Delirium</div>
              <div className="flex items-center gap-6">
                <Link href="/conduct" className="underline decoration-black/20 underline-offset-4 hover:decoration-black/40" onClick={() => setOpen(false)}>
                  Customs
                </Link>
                <Link href="/events" className="underline decoration-black/20 underline-offset-4 hover:decoration-black/40" onClick={() => setOpen(false)}>
                  Events
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
