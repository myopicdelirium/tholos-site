"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Row = {
  label: string;
  value: string;
  href?: string;
  note?: string;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
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
        "border border-white/14 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#f4f1ea]/75",
        "hover:bg-white/[0.07] hover:text-[#f4f1ea] focus:outline-none focus:ring-2 focus:ring-white/15"
      )}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Rule() {
  return <div className="h-px w-full bg-white/10" />;
}

export default function ConnectSection() {
  const rows: Row[] = useMemo(
    () => [
      {
        label: "General",
        value: "myopicdelirium@gmail.com",
        href: "mailto:myopicdelirium@gmail.com",
        note: "Research, collaboration, press."
      },
      {
        label: "Direct",
        value: "felixtinio@gmail.com",
        href: "mailto:felixtinio@gmail.com",
        note: "Sponsorship, sensitive correspondence."
      },
      {
        label: "Phone",
        value: "+1 (551) 227-8031",
        href: "tel:+15512278031",
        note: "Time-sensitive coordination."
      },
      {
        label: "GitHub",
        value: "github.com/myopicdelirium",
        href: "https://github.com/myopicdelirium",
        note: "Public artifacts and releases."
      }
    ],
    []
  );

  return (
    <section id="connect" className="relative bg-[#070d16] text-[#f4f1ea]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 700px at 22% 18%, rgba(255,255,255,0.08), transparent 62%), radial-gradient(900px 520px at 82% 40%, rgba(19,58,99,0.48), transparent 62%), linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.55))"
        }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10" />

      <div className="relative">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="relative min-h-[88vh] py-20 flex items-center justify-center">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute left-0 right-0 top-16 h-px bg-white/10" />
              <div className="absolute left-0 right-0 bottom-16 h-px bg-white/10" />
            </div>

            <div className="w-full">
              <div className="text-center">
                <div className="text-[11px] uppercase tracking-[0.55em] text-[#f4f1ea]/55">
                  MYOPIC DELIRIUM
                </div>

                <h2 className="mt-8 font-serif tracking-tight leading-[0.88] text-[#f4f1ea] text-[76px] sm:text-[96px] md:text-[120px]">
                  Contact
                </h2>

                <p className="mx-auto mt-7 max-w-2xl text-[14px] leading-relaxed text-[#f4f1ea]/65">
                  If your message is technical, include a short abstract and a link to the relevant page or document.
                </p>

                <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="mailto:myopicdelirium@gmail.com"
                    className="border border-white/14 bg-white/[0.06] px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-[#f4f1ea] hover:bg-white/[0.10] focus:outline-none focus:ring-2 focus:ring-white/15"
                  >
                    Email
                  </a>

                  <Link
                    href="/conduct"
                    className="border border-white/14 bg-transparent px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-[#f4f1ea]/82 hover:bg-white/[0.06] hover:text-[#f4f1ea] focus:outline-none focus:ring-2 focus:ring-white/15"
                  >
                    Customs
                  </Link>

                  <Link
                    href="/events"
                    className="border border-white/14 bg-transparent px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-[#f4f1ea]/82 hover:bg-white/[0.06] hover:text-[#f4f1ea] focus:outline-none focus:ring-2 focus:ring-white/15"
                  >
                    Events
                  </Link>
                </div>

                <div className="mt-14 flex items-center justify-center">
                  <div className="h-px w-32 bg-white/15" />
                </div>

                <div className="mt-10 text-[12px] text-[#f4f1ea]/42">
                  Scroll for channels and protocol.
                </div>
              </div>
            </div>
          </div>

          <div className="pb-24">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:items-start">
              <div className="md:col-span-7">
                <div className="text-[11px] uppercase tracking-[0.55em] text-[#f4f1ea]/45">
                  CHANNELS
                </div>

                <div className="mt-6 border border-white/10 bg-white/[0.02]">
                  <div className="px-6 py-6">
                    <div className="grid grid-cols-1">
                      {rows.map((r, i) => (
                        <div key={r.label} className="py-6">
                          <div className="grid grid-cols-12 items-start gap-4">
                            <div className="col-span-12 sm:col-span-3">
                              <div className="text-[11px] uppercase tracking-[0.32em] text-[#f4f1ea]/45">
                                {r.label}
                              </div>
                            </div>

                            <div className="col-span-12 sm:col-span-7">
                              {r.href ? (
                                <a
                                  href={r.href}
                                  target={r.href.startsWith("http") ? "_blank" : undefined}
                                  rel={r.href.startsWith("http") ? "noreferrer" : undefined}
                                  className="block text-[20px] sm:text-[22px] font-semibold tracking-tight text-[#f4f1ea] hover:text-white"
                                >
                                  {r.value}
                                </a>
                              ) : (
                                <div className="text-[20px] sm:text-[22px] font-semibold tracking-tight text-[#f4f1ea]">
                                  {r.value}
                                </div>
                              )}

                              {r.note ? (
                                <div className="mt-2 text-[13px] leading-relaxed text-[#f4f1ea]/52">
                                  {r.note}
                                </div>
                              ) : null}
                            </div>

                            <div className="col-span-12 sm:col-span-2 flex justify-start sm:justify-end">
                              <CopyButton value={r.value} />
                            </div>
                          </div>

                          {i !== rows.length - 1 ? <div className="mt-6"><Rule /></div> : null}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <div className="h-px w-full bg-white/10" />
                      <div className="mt-6 text-[12px] leading-relaxed text-[#f4f1ea]/42">
                        If you are proposing an event, include a preferred date range, expected attendance, and whether the session is public or closed-format.
                      </div>
                      <div className="mt-10 text-[12px] text-[#f4f1ea]/35">© 2026 Myopic Delirium</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 md:pt-1">
                <div className="text-[11px] uppercase tracking-[0.55em] text-[#f4f1ea]/45">
                  PROTOCOL
                </div>

                <div className="mt-6 border border-white/10 bg-white/[0.02]">
                  <div className="px-6 py-6">
                    <div className="text-[11px] uppercase tracking-[0.32em] text-[#f4f1ea]/45">
                      Correspondence
                    </div>

                    <div className="mt-5 space-y-6 text-[14px] leading-relaxed text-[#f4f1ea]/70">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.32em] text-[#f4f1ea]/40">1. Subject</div>
                        <div className="mt-2">Use a specific subject line. If relevant, include Event, Collaboration, or Sponsorship.</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-[0.32em] text-[#f4f1ea]/40">2. Abstract</div>
                        <div className="mt-2">Three to five sentences: what you want, why it matters, what you need from us.</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-[0.32em] text-[#f4f1ea]/40">3. Links</div>
                        <div className="mt-2">Prefer links to documents or repositories over heavy attachments.</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-[0.32em] text-[#f4f1ea]/40">4. Window</div>
                        <div className="mt-2">General correspondence is handled within 48 hours. Phone is reserved for time-sensitive matters.</div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <Rule />
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Link
                        href="/artifacts"
                        className="border border-white/14 bg-white/[0.06] px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-[#f4f1ea] hover:bg-white/[0.10] focus:outline-none focus:ring-2 focus:ring-white/15"
                      >
                        Artifacts
                      </Link>

                      <Link
                        href="/events"
                        className="border border-white/14 bg-transparent px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-[#f4f1ea]/82 hover:bg-white/[0.06] hover:text-[#f4f1ea] focus:outline-none focus:ring-2 focus:ring-white/15"
                      >
                        Events
                      </Link>
                    </div>

                    <div className="mt-8 text-[12px] leading-relaxed text-[#f4f1ea]/40">
                      If you are asking for a slot, propose two possible times and specify whether you want a closed-format session.
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-white/10 pt-6 text-[12px] text-[#f4f1ea]/38">
                  For code of conduct and participation expectations, use Customs.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="h-14" />
      </div>
    </section>
  );
}
