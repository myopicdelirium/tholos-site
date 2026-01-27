"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = { href: string; label: string };

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const items: NavItem[] = useMemo(
    () => [
      { href: "/about", label: "About" },
      { href: "/preview", label: "Preview" },
      { href: "/artifacts", label: "Artifacts" },
      { href: "/logbook", label: "Logbook" },
      { href: "/events", label: "Events" },
    ],
    []
  );

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  const openConnect = () => {
    setMenuOpen(false);
    setConnectOpen(true);
    if (typeof window !== "undefined") {
      if (window.location.hash !== "#connect") window.history.replaceState(null, "", "#connect");
    }
  };

  const closeConnect = () => {
    setConnectOpen(false);
    if (typeof window !== "undefined") {
      if (window.location.hash === "#connect") window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#connect") setConnectOpen(true);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const open = menuOpen || connectOpen;
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        closeConnect();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, connectOpen]);

  useEffect(() => {
    const open = menuOpen || connectOpen;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen, connectOpen]);

  return (
    <>
      <button
        type="button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
        className="fixed right-6 top-6 z-[80] group inline-flex h-12 w-12 items-center justify-center border rule bg-[rgb(var(--ivory))]/85 text-[#1b1b1b]/75 shadow-paper backdrop-blur hover:bg-[rgb(var(--ivory))] hover:text-[#1b1b1b] focus:outline-none focus:ring-2 focus:ring-black/15"
      >
        <span className="relative block h-4 w-5">
          <span
            className={cx(
              "absolute left-0 top-0 block h-[1px] w-5 bg-current transition-transform duration-200",
              menuOpen && "translate-y-[7px] rotate-45"
            )}
          />
          <span
            className={cx(
              "absolute left-0 top-[7px] block h-[1px] w-5 bg-current transition-opacity duration-200",
              menuOpen ? "opacity-0" : "opacity-100"
            )}
          />
          <span
            className={cx(
              "absolute left-0 top-[14px] block h-[1px] w-5 bg-current transition-transform duration-200",
              menuOpen && "translate-y-[-7px] -rotate-45"
            )}
          />
        </span>
      </button>

      {menuOpen ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <aside className="absolute right-0 top-0 h-full w-[min(440px,92vw)] border-l rule bg-[rgb(var(--ivory))] shadow-paper">
            <div className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-6">
                <Link href="/" className="group block" onClick={() => setMenuOpen(false)}>
                  <div className="text-[11px] uppercase tracking-[0.45em] text-brass">MYOPIC</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.45em] text-brass">DELIRIUM</div>
                </Link>

                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="border rule bg-transparent p-2 text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                >
                  <span className="relative block h-4 w-4">
                    <span className="absolute left-0 top-[7px] block h-[1px] w-4 rotate-45 bg-current" />
                    <span className="absolute left-0 top-[7px] block h-[1px] w-4 -rotate-45 bg-current" />
                  </span>
                </button>
              </div>

              <div className="mt-6 border-t rule" />

              <nav className="mt-5 flex-1">
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/"
                      onClick={() => setMenuOpen(false)}
                      className={cx(
                        "block px-3 py-3 text-[11px] uppercase tracking-[0.32em] transition-colors border rule",
                        pathname === "/"
                          ? "bg-black/5 text-[#1b1b1b]"
                          : "text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                      )}
                    >
                      Home
                    </Link>
                  </li>

                  {items.map((it) => (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        onClick={() => setMenuOpen(false)}
                        className={cx(
                          "block px-3 py-3 text-[11px] uppercase tracking-[0.32em] transition-colors border rule",
                          isActive(it.href)
                            ? "bg-black/5 text-[#1b1b1b]"
                            : "text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                        )}
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}

                  <li>
                    <button
                      type="button"
                      onClick={openConnect}
                      className="w-full text-left block px-3 py-3 text-[11px] uppercase tracking-[0.32em] transition-colors border rule text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                    >
                      Connect
                    </button>
                  </li>
                </ul>
              </nav>

              <div className="border-t rule pt-4">
                <div className="mono text-[12px] text-[#1b1b1b]/55">Press ESC to close.</div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {connectOpen ? (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            aria-label="Close connect overlay"
            onClick={closeConnect}
            className="absolute inset-0 bg-black/40"
          />

          <div className="absolute left-1/2 top-0 w-[min(1080px,92vw)] -translate-x-1/2 px-0 pt-6">
            <section
              role="dialog"
              aria-modal="true"
              className="overflow-hidden border rule bg-[rgb(var(--ivory))] shadow-paper"
              style={{ transform: "translateY(0)", transition: "transform 520ms ease, opacity 520ms ease" }}
            >
              <div className="flex items-start justify-between gap-6 p-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.45em] text-brass">MD / CONNECT</div>
                  <div className="mt-2 md-display text-3xl tracking-tight text-[#1b1b1b]">Contact</div>
                  <div className="mt-3 max-w-[70ch] text-[13px] leading-relaxed text-[#5f564d]">
                    Research collaboration, events, press, and sponsorship inquiries. If your message is technical, include a short abstract and a link to the relevant page or document.
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close connect"
                  onClick={closeConnect}
                  className="shrink-0 border rule bg-transparent p-3 text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                >
                  <span className="relative block h-5 w-5">
                    <span className="absolute left-0 top-[9px] block h-[1px] w-5 rotate-45 bg-current" />
                    <span className="absolute left-0 top-[9px] block h-[1px] w-5 -rotate-45 bg-current" />
                  </span>
                </button>
              </div>

              <div className="border-t rule" />

              <div className="grid gap-6 p-6 md:grid-cols-2">
                <div className="border rule bg-white/20">
                  <div className="p-5">
                    <div className="text-[11px] uppercase tracking-[0.38em] text-[#6b6259]">Channels</div>

                    <div className="mt-5 space-y-4">
                      <div className="flex items-start justify-between gap-4 border-t rule pt-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.38em] text-[#7b7268]">General</div>
                          <div className="mt-2 text-[18px] tracking-tight text-[#1b1b1b]">myopicdelirium@gmail.com</div>
                          <div className="mt-1 text-[12px] text-[#6b6259]">Research, collaboration, press.</div>
                        </div>
                        <CopyButton value="myopicdelirium@gmail.com" />
                      </div>

                      <div className="flex items-start justify-between gap-4 border-t rule pt-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.38em] text-[#7b7268]">Direct</div>
                          <div className="mt-2 text-[18px] tracking-tight text-[#1b1b1b]">felixtinio@gmail.com</div>
                          <div className="mt-1 text-[12px] text-[#6b6259]">Sponsorship, sensitive correspondence.</div>
                        </div>
                        <CopyButton value="felixtinio@gmail.com" />
                      </div>

                      <div className="flex items-start justify-between gap-4 border-t rule pt-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.38em] text-[#7b7268]">Phone</div>
                          <div className="mt-2 text-[18px] tracking-tight text-[#1b1b1b]">+1 (551) 227-8031</div>
                          <div className="mt-1 text-[12px] text-[#6b6259]">Time-sensitive coordination.</div>
                        </div>
                        <CopyButton value="+1 (551) 227-8031" />
                      </div>

                      <div className="flex items-start justify-between gap-4 border-t rule pt-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.38em] text-[#7b7268]">GitHub</div>
                          <div className="mt-2 text-[18px] tracking-tight text-[#1b1b1b]">github.com/myopicdelirium</div>
                          <div className="mt-1 text-[12px] text-[#6b6259]">Public artifacts and selected releases.</div>
                        </div>
                        <CopyButton value="https://github.com/myopicdelirium" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rule bg-white/10">
                  <div className="p-5">
                    <div className="text-[11px] uppercase tracking-[0.38em] text-[#6b6259]">Protocol</div>

                    <div className="mt-5 space-y-4 border-t rule pt-4 text-[13px] leading-relaxed text-[#5f564d]">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.38em] text-[#7b7268]">Subject</div>
                        <div className="mt-2">Use a specific subject line. If relevant, include Event, Collaboration, or Sponsorship.</div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-[0.38em] text-[#7b7268]">Abstract</div>
                        <div className="mt-2">Three to five sentences: what you want, why it matters, what you need from us.</div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-[0.38em] text-[#7b7268]">Links</div>
                        <div className="mt-2">Prefer links to documents or repositories over heavy attachments.</div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-[0.38em] text-[#7b7268]">Window</div>
                        <div className="mt-2">General correspondence is handled within 48 hours. Phone is reserved for time-sensitive matters.</div>
                      </div>
                    </div>

                    <div className="mt-6 border-t rule pt-4 flex flex-wrap gap-3">
                      <a className="border rule bg-transparent px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]" href="mailto:myopicdelirium@gmail.com">
                        Email
                      </a>
                      <Link className="border rule bg-transparent px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]" href="/conduct" onClick={closeConnect}>
                        Customs
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          closeConnect();
                          router.push("/events");
                        }}
                        className="border rule bg-transparent px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                      >
                        Events
                      </button>
                    </div>

                    <div className="mt-4 mono text-[12px] text-[#1b1b1b]/45">Press ESC to close.</div>
                  </div>
                </div>
              </div>

              <div className="border-t rule p-5 text-[12px] text-[#6b6259]">© 2026 Myopic Delirium</div>
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CopyButton(props: { value: string }) {
  const [ok, setOk] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(props.value);
          setOk(true);
          window.setTimeout(() => setOk(false), 900);
        } catch {}
      }}
      className="border rule bg-transparent px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
    >
      {ok ? "Copied" : "Copy"}
    </button>
  );
}
