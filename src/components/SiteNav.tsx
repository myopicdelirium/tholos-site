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
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [restrictedOpen, setRestrictedOpen] = useState(false);
  const [theme, setThemeState] = useState<"morning" | "noon" | "evening">("morning");

  const projectItems: NavItem[] = useMemo(
    () => [
      { href: "/artifacts", label: "Artifacts" },
      { href: "/batch-a", label: "Batch A" },
      { href: "/instruments", label: "Instruments" },
    ],
    []
  );

  const restrictedItems: NavItem[] = useMemo(
    () => [
      { href: "/logbook", label: "Logbook" },
      { href: "/roster", label: "Roster" },
      { href: "/events", label: "Events" },
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

  const projectActive = projectItems.some((it) => isActive(it.href));
  const restrictedActive = restrictedItems.some((it) => isActive(it.href));

  useEffect(() => {
    if (open && projectActive) setProjectsOpen(true);
  }, [open, projectActive]);

  useEffect(() => {
    if (open && restrictedActive) setRestrictedOpen(true);
  }, [open, restrictedActive]);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("md-theme");
    } catch {}
    const t = saved === "noon" ? "noon" : saved === "evening" ? "evening" : "morning";
    setThemeState(t);
    document.documentElement.dataset.theme = t;
  }, []);

  const setTheme = (t: "morning" | "noon" | "evening") => {
    setThemeState(t);
    try {
      localStorage.setItem("md-theme", t);
    } catch {}
    const el = document.documentElement;
    el.classList.add("theme-anim");
    el.dataset.theme = t;
    window.setTimeout(() => el.classList.remove("theme-anim"), 550);
  };

  const itemBase =
    "block px-3 py-3 text-[11px] uppercase tracking-[0.32em] transition-colors border border-[var(--nav-line)]";
  const itemState = (active: boolean) =>
    active
      ? "bg-[var(--nav-active-bg)] text-[var(--nav-ink)]"
      : "text-[var(--nav-muted)] hover:bg-[var(--nav-active-bg)] hover:text-[var(--nav-ink)]";
  const groupBase =
    "flex w-full items-center justify-between gap-3 px-3 py-3 text-[11px] uppercase tracking-[0.32em] transition-colors border border-[var(--nav-line)]";

  const Group = (props: {
    label: string;
    active: boolean;
    open: boolean;
    onToggle: () => void;
    items: NavItem[];
  }) => (
    <li>
      <button
        type="button"
        aria-expanded={props.open}
        onClick={props.onToggle}
        className={cx(groupBase, itemState(props.active))}
      >
        <span>{props.label}</span>
        <span aria-hidden className={cx("block text-[10px] transition-transform duration-200", props.open && "rotate-90")}>
          ›
        </span>
      </button>

      {props.open ? (
        <ul className="mt-1 space-y-1 pl-4">
          {props.items.map((it) => (
            <li key={it.href}>
              <Link href={it.href} onClick={() => setOpen(false)} className={cx(itemBase, itemState(isActive(it.href)))}>
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );

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
          <span className={cx("absolute left-0 top-0 block h-[1px] w-5 bg-current transition-transform duration-200", open && "translate-y-[7px] rotate-45")} />
          <span className={cx("absolute left-0 top-[7px] block h-[1px] w-5 bg-current transition-opacity duration-200", open ? "opacity-0" : "opacity-100")} />
          <span className={cx("absolute left-0 top-[14px] block h-[1px] w-5 bg-current transition-transform duration-200", open && "translate-y-[-7px] -rotate-45")} />
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          <aside className="absolute right-0 top-0 h-full w-[min(440px,92vw)] border-l border-[var(--nav-line)] bg-[var(--nav-bg)] shadow-paper">
            <div className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-6">
                <Link href="/" className="group block" onClick={() => setOpen(false)}>
                  <div className="text-[11px] uppercase tracking-[0.45em] text-[var(--site-accent)]">MYOPIC</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.45em] text-[var(--site-accent)]">DELIRIUM</div>
                </Link>

                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="border border-[var(--nav-line)] bg-transparent p-3 text-[var(--nav-muted)] hover:bg-[var(--nav-active-bg)] hover:text-[var(--nav-ink)]"
                >
                  <span className="relative block h-5 w-5">
                    <span className="absolute left-0 top-[9px] block h-[1px] w-5 rotate-45 bg-current" />
                    <span className="absolute left-0 top-[9px] block h-[1px] w-5 -rotate-45 bg-current" />
                  </span>
                </button>
              </div>

              <div className="mt-6 border-t border-[var(--nav-line)]" />

              <nav className="mt-5 flex-1">
                <ul className="space-y-1">
                  <li>
                    <Link href="/" onClick={() => setOpen(false)} className={cx(itemBase, itemState(pathname === "/"))}>
                      Home
                    </Link>
                  </li>

                  <Group label="Projects" active={projectActive} open={projectsOpen} onToggle={() => setProjectsOpen((v) => !v)} items={projectItems} />
                  <Group label="Restricted" active={restrictedActive} open={restrictedOpen} onToggle={() => setRestrictedOpen((v) => !v)} items={restrictedItems} />

                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        window.dispatchEvent(new Event("md:connect-open"));
                      }}
                      className={cx("w-full text-left", itemBase, itemState(false))}
                    >
                      Connect
                    </button>
                  </li>
                </ul>
              </nav>

              <div className="pt-4">
                <div className="flex gap-2">
                  {(["morning", "noon", "evening"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={cx(
                        "flex-1 border border-[var(--nav-line)] px-3 py-2 text-[10px] uppercase tracking-[0.28em] transition-colors",
                        theme === t
                          ? "bg-[var(--nav-active-bg)] text-[var(--nav-ink)]"
                          : "text-[var(--nav-muted)] hover:bg-[var(--nav-active-bg)] hover:text-[var(--nav-ink)]"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
