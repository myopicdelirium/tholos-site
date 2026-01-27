"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ConnectLetter from "./ConnectLetter";

type NavItem =
  | { kind: "link"; href: string; label: string }
  | { kind: "action"; id: "connect"; label: string };

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items: NavItem[] = useMemo(
    () => [
      { kind: "link", href: "/about", label: "About" },
      { kind: "link", href: "/preview", label: "Preview" },
      { kind: "link", href: "/artifacts", label: "Artifacts" },
      { kind: "link", href: "/logbook", label: "Logbook" },
      { kind: "link", href: "/events", label: "Events" },
      { kind: "action", id: "connect", label: "Connect" }
    ],
    []
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  const openConnect = () => {
    window.dispatchEvent(new CustomEvent("md:connect-open"));
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b rule bg-[rgb(var(--ivory))]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="select-none md-display text-lg tracking-tight text-[#1b1b1b]/85 hover:text-[#1b1b1b]">
            Tholos.
          </Link>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="group inline-flex h-10 w-10 items-center justify-center border rule bg-transparent text-[#1b1b1b]/75 hover:bg-black/5 hover:text-[#1b1b1b] focus:outline-none focus:ring-2 focus:ring-black/15"
          >
            <span className="relative block h-4 w-5">
              <span
                className={cx(
                  "absolute left-0 top-0 block h-[1px] w-5 bg-current transition-transform duration-200",
                  open && "translate-y-[7px] rotate-45"
                )}
              />
              <span
                className={cx(
                  "absolute left-0 top-[7px] block h-[1px] w-5 bg-current transition-opacity duration-200",
                  open ? "opacity-0" : "opacity-100"
                )}
              />
              <span
                className={cx(
                  "absolute left-0 top-[14px] block h-[1px] w-5 bg-current transition-transform duration-200",
                  open && "translate-y-[-7px] -rotate-45"
                )}
              />
            </span>
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />

          <aside className="absolute right-0 top-0 h-full w-[min(440px,92vw)] border-l rule bg-[rgb(var(--ivory))] shadow-paper">
            <div className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-6">
                <Link href="/" className="group block" onClick={() => setOpen(false)}>
                  <div className="text-[11px] uppercase tracking-[0.45em] text-brass">MYOPIC</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.45em] text-brass">DELIRIUM</div>
                </Link>

                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="border rule bg-transparent px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                >
                  <span className="text-[16px] leading-none">×</span>
                </button>
              </div>

              <div className="mt-6 border-t rule" />

              <nav className="mt-5 flex-1">
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/"
                      onClick={() => setOpen(false)}
                      className={cx(
                        "block px-3 py-3 text-[11px] uppercase tracking-[0.32em] transition-colors border rule",
                        pathname === "/" ? "bg-black/5 text-[#1b1b1b]" : "text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                      )}
                    >
                      Home
                    </Link>
                  </li>

                  {items.map((it) => (
                    <li key={it.kind === "link" ? it.href : it.id}>
                      {it.kind === "link" ? (
                        <Link
                          href={it.href}
                          onClick={() => setOpen(false)}
                          className={cx(
                            "block px-3 py-3 text-[11px] uppercase tracking-[0.32em] transition-colors border rule",
                            isActive(it.href) ? "bg-black/5 text-[#1b1b1b]" : "text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                          )}
                        >
                          {it.label}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            window.setTimeout(() => openConnect(), 50);
                          }}
                          className={cx(
                            "w-full text-left block px-3 py-3 text-[11px] uppercase tracking-[0.32em] transition-colors border rule",
                            "text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                          )}
                        >
                          {it.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="border-t rule pt-4">
                <div className="mono text-[12px] text-[#1b1b1b]/55">
                  Press ESC to close.
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <ConnectLetter />
    </>
  );
}
