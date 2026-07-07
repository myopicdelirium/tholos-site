"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "md-logbook-access";
const PASSCODE = "myopic228";

export default function LogbookGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(STORAGE_KEY) === "1") {
      setUnlocked(true);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value === PASSCODE) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setValue("");
    }
  }

  // Avoid hydration mismatch — render nothing until mounted
  if (!mounted) return null;

  if (unlocked) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--site-bg)] px-6">
      <div className="w-full max-w-sm">
        <div className="text-[11px] uppercase tracking-[0.55em] text-[var(--site-accent)]">
          Myopic Delirium
        </div>

        <h1 className="mt-4 md-display text-4xl tracking-tight text-[var(--site-ink)]">
          Logbook
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-[var(--site-body)]">
          This section is not yet public. Enter the access code to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <label
            htmlFor="logbook-code"
            className="block text-[11px] uppercase tracking-[0.32em] text-[var(--site-muted)]"
          >
            Access code
          </label>

          <div className="mt-2 flex gap-2">
            <input
              id="logbook-code"
              type="password"
              autoFocus
              autoComplete="off"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              className="flex-1 border border-[var(--site-line)] bg-transparent px-4 py-3 text-sm tracking-wide text-[var(--site-ink)] placeholder:text-[var(--site-muted)] focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Enter code"
            />
            <button
              type="submit"
              className="border border-[var(--site-accent)] bg-[var(--site-accent)] px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-[var(--site-on-accent)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              Enter
            </button>
          </div>

          {error && (
            <div className="mt-3 text-[12px] text-[rgb(var(--insurgent))]">
              Incorrect code. Try again.
            </div>
          )}
        </form>

        <div className="mt-10 h-px w-full bg-[var(--site-line)]" />

        <div className="mt-4 text-[12px] text-[var(--site-muted)]">
          Request access via Connect.
        </div>
      </div>
    </main>
  );
}
