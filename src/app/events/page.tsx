"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EVENTS, type EventRecord } from "./events.data";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(d);
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

function isPast(e: EventRecord) {
  const t = new Date(e.dateEnd ?? e.dateStart).getTime();
  if (Number.isNaN(t)) return false;
  return t < Date.now();
}

function normalizeRegisterHref(h?: string) {
  if (!h) return "";
  const s = String(h).trim();
  if (!s) return "";
  return s;
}

function cap(e: EventRecord) {
  const capacity = typeof e.capacity === "number" && e.capacity > 0 ? e.capacity : 20;
  const registered = typeof e.registered === "number" && e.registered >= 0 ? e.registered : 0;
  const clamped = Math.max(0, Math.min(registered, capacity));
  return { capacity, registered: clamped };
}

type TabKey = "Upcoming" | "Archive";

export default function EventsPage() {
  const [tab, setTab] = useState<TabKey>("Upcoming");
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [intro, setIntro] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...EVENTS];
    copy.sort((a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime());
    return copy;
  }, []);

  const upcoming = useMemo(() => {
    return sorted.filter((e) => (e.status ? e.status === "Upcoming" : !isPast(e)));
  }, [sorted]);

  const archive = useMemo(() => {
    return sorted.filter((e) => (e.status ? e.status === "Archive" : isPast(e)));
  }, [sorted]);

  const list = tab === "Upcoming" ? upcoming : archive;

  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), 980);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [selected]);

  return (
    <>
      <style jsx global>{`
        :root {
          --events-blue: #0f3a63;
        }
        @keyframes eventsDrop {
          0% {
            transform: translate3d(0, -100%, 0);
            opacity: 1;
          }
          55% {
            transform: translate3d(0, 0, 0);
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 1;
          }
        }
        @keyframes eventsFade {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes eventsTitleRise {
          0% {
            transform: translate3d(0, 18px, 0);
            opacity: 0;
          }
          60% {
            transform: translate3d(0, 0, 0);
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 1;
          }
        }
      `}</style>

      {intro ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[90] pointer-events-none"
          style={{
            animation: "eventsFade 320ms ease-out 820ms both"
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: "var(--events-blue)",
              animation: "eventsDrop 760ms cubic-bezier(0.2, 0.9, 0.2, 1) both"
            }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-6xl px-6 pb-16">
              <div
                className="text-[#f3f0ea]"
                style={{
                  animation: "eventsTitleRise 760ms cubic-bezier(0.2, 0.9, 0.2, 1) both"
                }}
              >
                <div className="text-[11px] uppercase tracking-[0.45em] text-[#f3f0ea]/75">
                  MYOPIC DELIRIUM
                </div>
                <div className="mt-4 font-serif tracking-tight leading-[0.9] text-[52px] sm:text-[72px] md:text-[92px]">
                  Events
                </div>
                <div className="mt-6 max-w-2xl text-[13px] leading-relaxed text-[#f3f0ea]/80">
                  Colloquia, salons, and working sessions.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="w-full border-b rule">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-5">
              <div className="text-[11px] uppercase tracking-[0.45em] text-brass">Participation</div>
              <div className="mt-4 font-serif tracking-tight leading-[1.05] text-[32px] text-[#1b1b1b]/90">
                Small by design.
              </div>
              <div className="mt-4 text-[13px] leading-relaxed text-[#1b1b1b]/70">
                Seats are finite. If an event is closed-format, assume non-attribution unless stated otherwise.
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="border rule px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.32em] text-[#1b1b1b]/55">Code of conduct</div>
                  <div className="mt-2 text-[13px] text-[#1b1b1b]/75">
                    <Link href="/conduct" className="underline underline-offset-4">
                      Read the policy
                    </Link>
                  </div>
                </div>

                <div className="border rule px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.32em] text-[#1b1b1b]/55">Registration</div>
                  <div className="mt-2 text-[13px] text-[#1b1b1b]/75">
                    Some sessions are invite-only. Otherwise, use the Register link inside the event.
                  </div>
                </div>

                <div className="border rule px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.32em] text-[#1b1b1b]/55">Inquiries</div>
                  <div className="mt-2 text-[13px] text-[#1b1b1b]/75">
                    <Link href="/connect" className="underline underline-offset-4">
                      Connect
                    </Link>{" "}
                    for collaboration or hosting.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-6 pb-28 pt-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="font-serif tracking-tight text-[34px] text-[#1b1b1b]/90">Events</h1>
            <div className="mono mt-2 text-[12px] text-[#1b1b1b]/55">
              Archive remains visible. Capacity is displayed per event.
            </div>
          </div>

          <div className="hidden sm:block text-[11px] uppercase tracking-[0.24em] text-[#1b1b1b]/45">
            {list.length} entries
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("Upcoming")}
            className={cx(
              "border rule px-3 py-2 text-[11px] uppercase tracking-[0.24em] transition-colors",
              tab === "Upcoming"
                ? "bg-black/5 text-[#1b1b1b]"
                : "bg-transparent text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
            )}
          >
            Upcoming
          </button>
          <button
            type="button"
            onClick={() => setTab("Archive")}
            className={cx(
              "border rule px-3 py-2 text-[11px] uppercase tracking-[0.24em] transition-colors",
              tab === "Archive"
                ? "bg-black/5 text-[#1b1b1b]"
                : "bg-transparent text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
            )}
          >
            Archive
          </button>

          <div className="ml-auto sm:hidden text-[11px] uppercase tracking-[0.24em] text-[#1b1b1b]/45">
            {list.length} entries
          </div>
        </div>

        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((e) => {
            const seats = cap(e);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelected(e)}
                className={cx(
                  "group text-left border rule bg-[rgb(var(--ivory))] p-4 shadow-paper transition-colors",
                  "hover:bg-[rgb(var(--ivory))]/85"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[11px] uppercase tracking-[0.32em] text-brass">
                    {fmtDate(e.dateStart)}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#1b1b1b]/45">
                    {e.type}
                  </div>
                </div>

                <div className="mt-3 font-serif leading-snug tracking-tight text-[16px] text-[#1b1b1b]/90">
                  {e.title}
                </div>

                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.22em] text-[#5f564d]">
                  {e.mode ? <span>{e.mode}</span> : null}
                  {e.location ? <span>{e.location}</span> : null}
                  {fmtTime(e.dateStart) ? <span>{fmtTime(e.dateStart)}</span> : null}
                </div>

                <div className="mt-3 flex items-end justify-between gap-4">
                  <div className="text-[12px] leading-relaxed text-[#1b1b1b]/60">
                    {e.blurb ? e.blurb : "Details"}
                  </div>
                  <div className="mono text-[12px] text-[#1b1b1b]/55">
                    {seats.registered}/{seats.capacity}
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        <div className="mt-12 border-t rule pt-6">
          <div className="mono text-[12px] text-[#1b1b1b]/55">
            If you want an invitation or collaboration slot, use{" "}
            <Link href="/connect" className="underline underline-offset-4">
              connect
            </Link>
            .
          </div>
        </div>

        {selected ? (
          <div className="fixed inset-0 z-[80]">
            <button
              type="button"
              aria-label="Close event details"
              className="absolute inset-0 bg-black/35"
              onClick={() => setSelected(null)}
            />
            <div className="absolute inset-x-0 bottom-0">
              <div className="mx-auto w-full max-w-6xl px-6 pb-6">
                <div className="border rule bg-[rgb(var(--ivory))] shadow-paper">
                  <div className="flex items-start justify-between gap-6 p-5">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.32em] text-brass">
                        {fmtDate(selected.dateStart)}
                        {fmtTime(selected.dateStart) ? `   ${fmtTime(selected.dateStart)}` : ""}
                      </div>
                      <div className="mt-2 font-serif tracking-tight text-[22px] text-[#1b1b1b]/90">
                        {selected.title}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.22em] text-[#5f564d]">
                        <span>{selected.type}</span>
                        {selected.mode ? <span>{selected.mode}</span> : null}
                        {selected.location ? <span>{selected.location}</span> : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label="Close"
                      onClick={() => setSelected(null)}
                      className={cx(
                        "relative inline-flex h-10 w-10 items-center justify-center",
                        "border rule bg-transparent text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]",
                        "focus:outline-none focus:ring-2 focus:ring-black/15",
                        "shadow-paper"
                      )}
                    >
                      <span className="absolute block h-[1px] w-5 rotate-45 bg-current" />
                      <span className="absolute block h-[1px] w-5 -rotate-45 bg-current" />
                    </button>
                  </div>

                  <div className="border-t rule px-5 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-[0.32em] text-[#1b1b1b]/55">
                        Seats
                      </div>
                      <div className="mono text-[12px] text-[#1b1b1b]/55">
                        {cap(selected).registered}/{cap(selected).capacity}
                      </div>
                    </div>

                    {selected.description ? (
                      <div className="mt-4 text-[13px] leading-relaxed text-[#1b1b1b]/70">
                        {selected.description}
                      </div>
                    ) : null}

                    {selected.speakers && selected.speakers.length ? (
                      <div className="mt-5">
                        <div className="text-[11px] uppercase tracking-[0.32em] text-[#1b1b1b]/55">
                          Speakers
                        </div>
                        <ul className="mt-2 space-y-1 text-[13px] text-[#1b1b1b]/75">
                          {selected.speakers.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {selected.reading && selected.reading.length ? (
                      <div className="mt-5">
                        <div className="text-[11px] uppercase tracking-[0.32em] text-[#1b1b1b]/55">
                          Reading
                        </div>
                        <ul className="mt-2 space-y-2">
                          {selected.reading.map((r) => {
                            const href = (r.href ?? "").trim();
                            return (
                              <li key={r.title} className="text-[13px] text-[#1b1b1b]/75">
                                {href ? (
                                  <a
                                    href={href}
                                    className="underline underline-offset-4"
                                    target={href.startsWith("http") ? "_blank" : undefined}
                                    rel={href.startsWith("http") ? "noreferrer" : undefined}
                                  >
                                    {r.title}
                                  </a>
                                ) : (
                                  <span>{r.title}</span>
                                )}
                                {r.author ? (
                                  <span className="text-[#1b1b1b]/45">{`  ${r.author}`}</span>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}

                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      {normalizeRegisterHref(selected.registerHref) ? (
                        <a
                          href={normalizeRegisterHref(selected.registerHref)}
                          className="border rule bg-black/5 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-[#1b1b1b] hover:bg-black/10"
                          target={String(selected.registerHref).trim().startsWith("http") ? "_blank" : undefined}
                          rel={String(selected.registerHref).trim().startsWith("http") ? "noreferrer" : undefined}
                        >
                          Register
                        </a>
                      ) : (
                        <Link
                          href="/connect"
                          className="border rule bg-black/5 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-[#1b1b1b] hover:bg-black/10"
                        >
                          Inquiries
                        </Link>
                      )}

                      <div className="ml-auto mono text-[12px] text-[#1b1b1b]/55">
                        Press ESC to close.
                      </div>
                    </div>

                    <div className="mt-6 border-t rule pt-4">
                      <div className="mono text-[12px] text-[#1b1b1b]/55">
                        By attending, you agree to the{" "}
                        <Link href="/conduct" className="underline underline-offset-4">
                          code of conduct
                        </Link>
                        .
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
