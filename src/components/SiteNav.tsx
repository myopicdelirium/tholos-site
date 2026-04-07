"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = { href: string; label: string };

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items: NavItem[] = useMemo(
    () => [
      { href: "/artifacts", label: "Artifacts" },
      { href: "/logbook", label: "Logbook" },
      { href: "/roster", label: "Roster" },
      { href: "/events", label: "Events" },
      { href: "/connect", label: "Connect" },
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

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="fixed right-6 top-6 z-[80] group inline-flex h-12 w-12 items-center justify-center border rule bg-[rgb(var(--ivory))]/85 text-[#1b1b1b]/75 shadow-paper backdrop-blur hover:bg-[rgb(var(--ivory))] hover:text-[#1b1b1b] focus:outline-none focus:ring-2 focus:ring-black/15"
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

      {open ? (
        <div className="fixed inset-0 z-[90]">
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
                  className="border rule bg-transparent p-3 text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                >
                  <span className="relative block h-5 w-5">
                    <span className="absolute left-0 top-[9px] block h-[1px] w-5 rotate-45 bg-current" />
                    <span className="absolute left-0 top-[9px] block h-[1px] w-5 -rotate-45 bg-current" />
                  </span>
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
                    <li key={it.href}>
                      {it.href === "/connect" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            window.dispatchEvent(new Event("md:connect-open"));
                          }}
                          className={cx(
                            "block w-full text-left px-3 py-3 text-[11px] uppercase tracking-[0.32em] transition-colors border rule",
                            "text-[#5f564d] hover:bg-black/5 hover:text-[#1b1b1b]"
                          )}
                        >
                          {it.label}
                        </button>
                      ) : (
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
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="border-t rule pt-4">
                <div className="mono text-[12px] text-[#1b1b1b]/55">Press ESC to close.</div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
