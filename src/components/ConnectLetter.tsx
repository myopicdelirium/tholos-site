"use client";

import { useEffect, useRef, useState } from "react";

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
        "border border-[var(--nav-line)] bg-transparent text-[var(--nav-muted)] hover:bg-[var(--nav-active-bg)] hover:text-[var(--nav-ink)]",
        "focus:outline-none focus:ring-2 focus:ring-white/20"
      )}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const channels: Array<{ label: string; value: string; href: string; note?: string }> = [
  {
    label: "Felix Tinio",
    value: "felixtinio@myopicdelirium.com",
    href: "mailto:felixtinio@myopicdelirium.com",
    note: "General inquiries and press.",
  },
  {
    label: "Sales",
    value: "sales@myopicdelirium.com",
    href: "mailto:sales@myopicdelirium.com",
  },
  {
    label: "Invoices",
    value: "invoices@myopicdelirium.com",
    href: "mailto:invoices@myopicdelirium.com",
  },
  {
    label: "Email",
    value: "myopicdelirium@gmail.com",
    href: "mailto:myopicdelirium@gmail.com",
  },
  {
    label: "Phone",
    value: "+1 (551) 227-8031",
    href: "tel:+15512278031",
  },
  {
    label: "GitHub",
    value: "github.com/myopicdelirium",
    href: "https://github.com/myopicdelirium",
  },
];

export default function ConnectLetter() {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

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
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close correspondence"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/40"
      />

      <div className="absolute inset-x-0 top-0 px-4 sm:px-6 pt-6 sm:pt-10">
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          className={cx(
            "relative z-[1] mx-auto w-full max-w-xl",
            "border border-[var(--nav-line)] shadow-paper",
            "bg-[var(--nav-bg)] text-[var(--nav-ink)]"
          )}
          style={{
            animation: "mdDrop 900ms cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <style>{`
            @keyframes mdDrop {
              0% { transform: translateY(-110%); opacity: 0.85; }
              70% { transform: translateY(10px); opacity: 1; }
              100% { transform: translateY(0); opacity: 1; }
            }
          `}</style>

          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className={cx(
              "absolute right-4 top-4 z-10",
              "h-10 w-10 grid place-items-center",
              "border border-[var(--nav-line)] bg-transparent text-[var(--nav-muted)] hover:bg-[var(--nav-active-bg)] hover:text-[var(--nav-ink)]",
              "focus:outline-none focus:ring-2 focus:ring-white/20"
            )}
            data-autofocus="true"
          >
            <span className="text-[18px] leading-none">&times;</span>
          </button>

          <div className="relative px-6 sm:px-8 py-8">
            <div className="text-[11px] uppercase tracking-[0.55em] text-[var(--site-accent)]">
              MYOPIC DELIRIUM
            </div>

            <h2 className="mt-5 font-serif tracking-tight leading-[0.92] text-[42px] sm:text-[54px] text-[var(--nav-ink)]">
              Connect
            </h2>

            <div className="mt-6 h-px w-full bg-[var(--nav-line)]" />

            <div className="mt-6 space-y-5">
              {channels.map((ch, i) => (
                <div key={ch.label}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.32em] text-[var(--nav-muted)]">
                        {ch.label}
                      </div>
                      <a
                        href={ch.href}
                        target={ch.href.startsWith("http") ? "_blank" : undefined}
                        rel={ch.href.startsWith("http") ? "noreferrer" : undefined}
                        className="mt-1 block text-[18px] sm:text-[20px] font-semibold tracking-tight text-[var(--nav-ink)] hover:text-[var(--site-accent)]"
                      >
                        {ch.value}
                      </a>
                      {ch.note ? (
                        <p className="mt-1 text-[11px] leading-relaxed text-[var(--nav-muted)]">{ch.note}</p>
                      ) : null}
                    </div>
                    <div className="mt-4">
                      <CopyButton value={ch.value} />
                    </div>
                  </div>
                  {i !== channels.length - 1 && (
                    <div className="mt-5 h-px w-full bg-[var(--nav-line)]" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 h-px w-full bg-[var(--nav-line)]" />

            <p className="mt-4 text-[11px] leading-relaxed tracking-[0.02em] text-[var(--nav-muted)] opacity-70 max-w-sm">
              This is a temporary, publicly available space encompassing up to model
              6. Models 6.9–11.2 are not publicly available. We reserve our
              intellectual property rights.
            </p>

            <div className="mt-4 flex items-center justify-between text-[12px] text-[var(--nav-muted)]">
              <div>&copy; 2026 Myopic Delirium</div>
              <div className="mono">Press ESC to close.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
