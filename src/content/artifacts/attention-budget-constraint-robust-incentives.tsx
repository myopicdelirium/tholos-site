"use client";

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
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
      className="border rule px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-[#f3f0ea]/80 hover:bg-white/5 hover:text-[#f3f0ea] focus:outline-none focus:ring-2 focus:ring-white/15"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ConnectSection() {
  const rows: Row[] = useMemo(
    () => [
      {
        label: "General",
        value: "myopicdelirium@gmail.com",
        href: "mailto:myopicdelirium@gmail.com",
        note: "Research, collaboration, press. Typical response within 48 hours."
      },
      {
        label: "Sponsorship",
        value: "felixtinio@gmail.com",
        href: "mailto:felixtinio@gmail.com",
        note: "Financing, sponsorship, sensitive matters."
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

  return (
    <section id="connect" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[#070d16]" />
      <div className="absolute inset-0 opacity-[0.35]" style={{ background: "radial-gradient(900px 520px at 20% 10%, rgba(255,255,255,0.09), transparent 60%), radial-gradient(900px 520px at 85% 35%, rgba(19,58,99,0.35), transparent 62%)" }} />
      <div className="absolute left-0 right-0 top-0 h-px bg-white/10" />
      <div className="absolute left-0 right-0 bottom-0 h-px bg-white/10" />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:items-start">
          <div className="md:col-span-6">
            <div className="text-[11px] uppercase tracking-[0.55em] text-[#f3f0ea]/65">
              CONNECT
            </div>

            <h2 className="mt-4 font-serif tracking-tight leading-[0.92] text-[#f3f0ea] text-[56px] sm:text-[64px] md:text-[72px]">
              Contact
            </h2>

            <p className="mt-6 max-w-xl text-[14px] leading-relaxed text-[#f3f0ea]/72">
              Research correspondence and sponsorship inquiries. If your message is technical, include a short abstract and a link to the relevant page or document.
            </p>

            <div className="mt-10 border-t border-white/10 pt-8">
              <div className="grid grid-cols-1 gap-4">
                {rows.map((r) => (
                  <div key={r.label} className="grid grid-cols-12 items-start gap-4 border-b border-white/10 pb-5">
                    <div className="col-span-12 sm:col-span-3">
                      <div className="text-[11px] uppercase tracking-[0.32em] text-[#f3f0ea]/55">
                        {r.label}
                      </div>
                    </div>

                    <div className="col-span-12 sm:col-span-7">
                      {r.href ? (
                        <a
                          href={r.href}
                          target={r.href.startsWith("http") ? "_blank" : undefined}
                          rel={r.href.startsWith("http") ? "noreferrer" : undefined}
                          className="block text-[18px] sm:text-[20px] font-semibold tracking-tight text-[#f3f0ea] hover:text-white"
                        >
                          {r.value}
                        </a>
                      ) : (
                        <div className="text-[18px] sm:text-[20px] font-semibold tracking-tight text-[#f3f0ea]">
                          {r.value}
                        </div>
                      )}

                      {r.note ? (
                        <div className="mt-1 text-[13px] leading-relaxed text-[#f3f0ea]/55">
                          {r.note}
                        </div>
                      ) : null}
                    </div>

                    <div className="col-span-12 sm:col-span-2 flex justify-start sm:justify-end">
                      <CopyButton value={r.value} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <a
                  href="mailto:myopicdelirium@gmail.com"
                  className="border rule bg-white/5 px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-[#f3f0ea] hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/15"
                >
                  Email
                </a>

                <a
                  href="/connect"
                  className="border rule bg-transparent px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-[#f3f0ea]/85 hover:bg-white/5 hover:text-[#f3f0ea] focus:outline-none focus:ring-2 focus:ring-white/15"
                >
                  Request a slot
                </a>
              </div>

              <div className="mt-10 text-[12px] text-[#f3f0ea]/45">
                © 2026 Myopic Delirium
              </div>
            </div>
          </div>

          <div className="md:col-span-6 md:pt-12">
            <div className="border border-white/12 bg-white/[0.04] shadow-paper">
              <div className="px-6 py-6">
                <div className="text-[11px] uppercase tracking-[0.32em] text-[#f3f0ea]/55">
                  Correspondence protocol
                </div>

                <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-[#f3f0ea]/72">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.32em] text-[#f3f0ea]/45">1. Subject</div>
                    <div className="mt-1">Use a specific subject line. If relevant, include “Event”, “Collaboration”, or “Sponsorship”.</div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-[0.32em] text-[#f3f0ea]/45">2. Abstract</div>
                    <div className="mt-1">Three to five sentences: what you want, why it matters, what you need from us.</div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-[0.32em] text-[#f3f0ea]/45">3. Attachments</div>
                    <div className="mt-1">Prefer links to documents. If you must attach files, keep them minimal.</div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-[0.32em] text-[#f3f0ea]/45">4. Response window</div>
                    <div className="mt-1">General correspondence is handled within 48 hours. Time-sensitive matters should use phone.</div>
                  </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-5 flex flex-wrap items-center gap-3">
                  <a
                    href="/conduct"
                    className="border rule bg-transparent px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-[#f3f0ea]/85 hover:bg-white/5 hover:text-[#f3f0ea] focus:outline-none focus:ring-2 focus:ring-white/15"
                  >
                    Customs
                  </a>
                  <a
                    href="/artifacts"
                    className="border rule bg-white/5 px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-[#f3f0ea] hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/15"
                  >
                    Artifacts
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6 text-[12px] leading-relaxed text-[#f3f0ea]/45">
              If you are proposing an event, include a preferred date range, expected attendance, and whether the session is public or closed-format.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
