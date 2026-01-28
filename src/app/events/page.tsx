"use client";

import { useMemo, useState } from "react";

type EventKind = "SALON" | "OPEN FORUM" | "INVITE FORUM" | "WORKING SESSION" | "SPECIAL";
type Venue = "IN-PERSON" | "INVITE-ONLY";

type EventItem = {
  id: string;
  dateISO: string;
  title: string;
  kind: EventKind;
  venue: Venue;
  location: string;
  note?: string;
  capUsed?: number;
  capTotal?: number;
  registerUrl?: string;
  isArchive: boolean;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const m = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getDate()).padStart(2, "0");
  const y = d.getFullYear();
  return `${m} ${day}, ${y}`;
}

function fmtDateShort(iso: string) {
  const d = new Date(iso);
  const m = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getDate()).padStart(2, "0");
  return `${m} ${day}`;
}

export default function EventsPage() {
  const [tab, setTab] = useState<"upcoming" | "archive">("upcoming");
  const [active, setActive] = useState<EventItem | null>(null);

  const upcoming: EventItem[] = useMemo(
    () => [
      {
        id: "MD-EV-20260206-001",
        dateISO: "2026-02-06T18:30:00-05:00",
        title: "Measurement, Trust Decay, and Institutional Attention",
        kind: "SALON",
        venue: "IN-PERSON",
        location: "Hoboken, NJ",
        note: "A closed-format discussion on metric pressure and civic legitimacy.",
        capUsed: 7,
        capTotal: 20,
        registerUrl: "",
        isArchive: false,
      },
    ],
    []
  );

  const archive: EventItem[] = useMemo(() => {
    const xs: EventItem[] = [
      {
        id: "MD-EV-20260118-001",
        dateISO: "2026-01-18T19:00:00-05:00",
        title: "Pulpheads forum",
        kind: "OPEN FORUM",
        venue: "IN-PERSON",
        location: "20 North Blvd, Jersey City, NJ 07310",
        capUsed: 23,
        capTotal: 21,
        isArchive: true,
      },
      {
        id: "MD-EV-20260110-001",
        dateISO: "2026-01-10T19:00:00-05:00",
        title: "Pulpheads forum",
        kind: "OPEN FORUM",
        venue: "IN-PERSON",
        location: "20 North Blvd, Jersey City, NJ 07310",
        capUsed: 20,
        capTotal: 21,
        isArchive: true,
      },
      {
        id: "MD-EV-20260105-001",
        dateISO: "2026-01-05T19:00:00-05:00",
        title: "Pulpheads invite forum",
        kind: "INVITE FORUM",
        venue: "INVITE-ONLY",
        location: "Email for address",
        capUsed: 11,
        capTotal: 15,
        isArchive: true,
      },
      {
        id: "MD-EV-20260103-001",
        dateISO: "2026-01-03T19:00:00-05:00",
        title: "Pulpheads invite forum",
        kind: "INVITE FORUM",
        venue: "INVITE-ONLY",
        location: "Email for address",
        capUsed: 8,
        capTotal: 15,
        isArchive: true,
      },
      {
        id: "MD-EV-20251220-001",
        dateISO: "2025-12-20T19:00:00-05:00",
        title: "Pulpheads open forum",
        kind: "OPEN FORUM",
        venue: "IN-PERSON",
        location: "20 North Blvd, Jersey City, NJ 07310",
        capUsed: 7,
        capTotal: 21,
        isArchive: true,
      },
      {
        id: "MD-EV-20251214-001",
        dateISO: "2025-12-14T19:00:00-05:00",
        title: "Pulpheads open forum",
        kind: "OPEN FORUM",
        venue: "IN-PERSON",
        location: "20 North Blvd, Jersey City, NJ 07310",
        capUsed: 21,
        capTotal: 21,
        isArchive: true,
      },
      {
        id: "MD-EV-20251207-001",
        dateISO: "2025-12-07T19:00:00-05:00",
        title: "Pulpheads open forum",
        kind: "OPEN FORUM",
        venue: "IN-PERSON",
        location: "20 North Blvd, Jersey City, NJ 07310",
        capUsed: 21,
        capTotal: 21,
        isArchive: true,
      },
      {
        id: "MD-EV-20251205-001",
        dateISO: "2025-12-05T19:00:00-05:00",
        title: "Pulpheads open forum",
        kind: "OPEN FORUM",
        venue: "IN-PERSON",
        location: "20 North Blvd, Jersey City, NJ 07310",
        capUsed: 15,
        capTotal: 21,
        isArchive: true,
      },
      {
        id: "MD-EV-20251202-001",
        dateISO: "2025-12-02T19:00:00-05:00",
        title: "Pulpheads invite forum",
        kind: "INVITE FORUM",
        venue: "INVITE-ONLY",
        location: "Invite list",
        capUsed: 6,
        capTotal: 21,
        isArchive: true,
      },
      {
        id: "MD-EV-20251130-001",
        dateISO: "2025-11-30T19:00:00-05:00",
        title: "Pulpheads invite forum",
        kind: "INVITE FORUM",
        venue: "INVITE-ONLY",
        location: "Email for address",
        capUsed: 11,
        capTotal: 16,
        isArchive: true,
      },
      {
        id: "MD-EV-20251128-001",
        dateISO: "2025-11-28T19:00:00-05:00",
        title: "Pulpheads invite forum",
        kind: "INVITE FORUM",
        venue: "INVITE-ONLY",
        location: "Email for address",
        capUsed: 6,
        capTotal: 16,
        isArchive: true,
      },
      {
        id: "MD-EV-20251123-001",
        dateISO: "2025-11-23T18:30:00-05:00",
        title: "Thanksgiving at Dean’s House",
        kind: "SPECIAL",
        venue: "INVITE-ONLY",
        location: "Contact for address",
        note: "Must show up with food to participate. No alcohol allowed.",
        capUsed: 42,
        capTotal: 19,
        isArchive: true,
      },
      {
        id: "MD-EV-20251108-001",
        dateISO: "2025-11-08T19:00:00-05:00",
        title: "Working session",
        kind: "WORKING SESSION",
        venue: "INVITE-ONLY",
        location: "Email for address",
        capUsed: 81,
        capTotal: 70,
        isArchive: true,
      },
      {
        id: "MD-EV-20251106-001",
        dateISO: "2025-11-06T19:00:00-05:00",
        title: "Working session",
        kind: "WORKING SESSION",
        venue: "INVITE-ONLY",
        location: "Email for address",
        capUsed: 92,
        capTotal: 70,
        isArchive: true,
      },
    ];

    xs.sort((a, b) => +new Date(b.dateISO) - +new Date(a.dateISO));
    return xs;
  }, []);

  const list = tab === "upcoming" ? upcoming : archive;
  const count = list.length;

  return (
    <main className="min-h-screen bg-[rgb(var(--ivory))]">
      <section className="relative h-[92vh] min-h-[640px] bg-[#123e63] text-[rgb(var(--ivory))]">
        <div className="mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-6 text-center">
          <div className="text-[11px] uppercase tracking-[0.45em] text-[rgb(var(--ivory))]/70">MYOPIC DELIRIUM</div>
          <h1 className="md-display mt-6 text-[clamp(72px,10vw,140px)] leading-[0.9] tracking-tight">Events</h1>
          <div className="mt-8 max-w-[60ch] text-[13px] leading-relaxed text-[rgb(var(--ivory))]/78">
            Colloquia, salons, and working sessions.
          </div>
          <div className="mt-10 flex items-center gap-3">
            <a className="border rule bg-transparent px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-[rgb(var(--ivory))]/85 hover:bg-white/10 hover:text-[rgb(var(--ivory))]" href="/conduct">
              Customs
            </a>
            <a className="border rule bg-transparent px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-[rgb(var(--ivory))]/85 hover:bg-white/10 hover:text-[rgb(var(--ivory))]" href="/#connect">
              Contact
            </a>
          </div>
          <div className="mt-10 h-px w-24 bg-[rgb(var(--ivory))]/30" />
          <div className="mono mt-6 text-[12px] text-[rgb(var(--ivory))]/55">Scroll for program and archive.</div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="md-display text-3xl tracking-tight text-[#1b1b1b]">Events</div>
            <div className="mt-2 text-[13px] text-[#6b6259]">Archive remains visible. Capacity is displayed per event.</div>
          </div>

          <div className="mono text-[12px] uppercase tracking-[0.28em] text-[#6b6259]">{count} ENTRIES</div>
        </div>

        <div className="mt-7 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={cx(
              "border rule px-4 py-2 text-[11px] uppercase tracking-[0.28em] transition-colors",
              tab === "upcoming" ? "bg-black/5 text-[#1b1b1b]" : "text-[#6b6259] hover:bg-black/5 hover:text-[#1b1b1b]"
            )}
          >
            Upcoming
          </button>
          <button
            type="button"
            onClick={() => setTab("archive")}
            className={cx(
              "border rule px-4 py-2 text-[11px] uppercase tracking-[0.28em] transition-colors",
              tab === "archive" ? "bg-black/5 text-[#1b1b1b]" : "text-[#6b6259] hover:bg-black/5 hover:text-[#1b1b1b]"
            )}
          >
            Archive
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setActive(e)}
              className="group text-left border rule bg-[rgb(var(--ivory))] p-5 shadow-paper transition-transform hover:-translate-y-[1px]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="mono text-[11px] uppercase tracking-[0.34em] text-[#6b6259]">{fmtDateShort(e.dateISO)}</div>
                <div className="mono text-[11px] uppercase tracking-[0.34em] text-[#6b6259]">{e.kind}</div>
              </div>

              <div className="mt-4 md-display text-[18px] leading-snug tracking-tight text-[#1b1b1b]">{e.title}</div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="mono text-[11px] uppercase tracking-[0.34em] text-[#6b6259]">
                  {e.venue}{" "}
                  <span className="mx-2 text-[#6b6259]/50">·</span>{" "}
                  {e.location}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 border-t rule pt-3">
                <div className="text-[12px] text-[#6b6259]">{e.note ? e.note : e.isArchive ? "Archived entry." : "Details inside."}</div>
                <div className="mono text-[12px] text-[#6b6259]">{typeof e.capUsed === "number" && typeof e.capTotal === "number" ? `${e.capUsed}/${e.capTotal}` : ""}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-14 border-t rule pt-6 text-[13px] text-[#6b6259]">
          If you want an invitation or collaboration slot, use <a className="underline decoration-black/20 underline-offset-4 hover:decoration-black/50" href="/#connect">connect</a>.
        </div>
      </section>

      {active ? (
        <div className="fixed inset-0 z-[90]">
          <button type="button" aria-label="Close event" onClick={() => setActive(null)} className="absolute inset-0 bg-black/35" />
          <div className="absolute bottom-0 left-0 right-0">
            <section className="mx-auto w-[min(1100px,96vw)] border rule bg-[rgb(var(--ivory))] shadow-paper">
              <div className="flex items-start justify-between gap-6 p-6">
                <div>
                  <div className="mono text-[11px] uppercase tracking-[0.34em] text-[#6b6259]">{fmtDate(active.dateISO)}</div>
                  <div className="md-display mt-2 text-2xl tracking-tight text-[#1b1b1b]">{active.title}</div>
                  <div className="mono mt-3 text-[11px] uppercase tracking-[0.34em] text-[#6b6259]">
                    {active.kind} <span className="mx-2 text-[#6b6259]/50">·</span> {active.venue} <span className="mx-2 text-[#6b6259]/50">·</span> {active.location}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setActive(null)}
                  className="border rule bg-transparent p-3 text-[#6b6259] hover:bg-black/5 hover:text-[#1b1b1b]"
                >
                  <span className="relative block h-5 w-5">
                    <span className="absolute left-0 top-[9px] block h-[1px] w-5 rotate-45 bg-current" />
                    <span className="absolute left-0 top-[9px] block h-[1px] w-5 -rotate-45 bg-current" />
                  </span>
                </button>
              </div>

              <div className="border-t rule" />

              <div className="grid gap-6 p-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <div className="text-[13px] leading-relaxed text-[#5f564d]">
                    {active.note ? active.note : active.isArchive ? "Recorded in the archive." : "Program details will appear here."}
                  </div>
                </div>

                <div className="border rule bg-white/10 p-5">
                  <div className="text-[11px] uppercase tracking-[0.38em] text-[#6b6259]">Capacity</div>
                  <div className="mt-3 md-display text-2xl tracking-tight text-[#1b1b1b]">
                    {typeof active.capUsed === "number" && typeof active.capTotal === "number" ? `${active.capUsed}/${active.capTotal}` : "—"}
                  </div>
                  <div className="mt-6 border-t rule pt-4">
                    {active.isArchive ? (
                      <div className="mono text-[12px] text-[#6b6259]">Archived.</div>
                    ) : active.registerUrl ? (
                      <a className="inline-flex border rule bg-transparent px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]" href={active.registerUrl}>
                        Register
                      </a>
                    ) : (
                      <div className="mono text-[12px] text-[#6b6259]">Registration by invite or link.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t rule px-6 py-4">
                <div className="mono text-[12px] text-[#6b6259]">Press ESC to close.</div>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="border rule bg-transparent px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
