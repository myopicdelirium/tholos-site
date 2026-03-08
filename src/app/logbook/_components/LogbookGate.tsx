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
    <main className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-[11px] uppercase tracking-[0.55em] text-brass">
          Myopic Delirium
        </div>

        <h1 className="mt-4 md-display text-4xl tracking-tight">
          Logbook
        </h1>

        <p className="mt-4 text-sm text-[#1b1b1b]/60 leading-relaxed">
          This section is not yet public. Enter the access code to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <label
            htmlFor="logbook-code"
            className="block text-[11px] uppercase tracking-[0.32em] text-[#1b1b1b]/45"
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
              className="flex-1 border rule bg-transparent px-4 py-3 text-sm tracking-wide text-[#1b1b1b] placeholder:text-[#1b1b1b]/30 focus:outline-none focus:ring-2 focus:ring-black/15"
              placeholder="Enter code"
            />
            <button
              type="submit"
              className="border rule bg-[#1b1b1b] px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-[rgb(var(--ivory))] hover:bg-[#333] focus:outline-none focus:ring-2 focus:ring-black/15"
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

        <div className="mt-10 h-px w-full bg-black/10" />

        <div className="mt-4 text-[12px] text-[#1b1b1b]/35">
          Request access via Connect.
        </div>
      </div>
    </main>
  );
}
