"use client";

import { useState } from "react";
import { APPLICATIONS_ADDRESS } from "@/lib/application-text";

/**
 * Shown when automatic submission fails (for example, before email delivery is
 * configured). The applicant sends the same application from their own mail
 * client, so nothing they typed is lost. Copy is offered alongside the mail
 * link because some clients truncate long mailto bodies.
 */
export default function ManualSend({ subject, text }: { subject: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const mailto = `mailto:${APPLICATIONS_ADDRESS}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(text)}`;

  return (
    <div className="mt-6 rounded-2xl border border-[var(--site-accent)] p-6">
      <div className="smallcaps text-[10px] text-[var(--site-accent)]">Send it directly</div>
      <p className="mt-3 max-w-[62ch] text-[13px] leading-relaxed text-[var(--site-body)]">
        We could not submit this automatically, and we did not want to lose what you wrote. Send the
        same application straight to us — everything you entered is already prepared below.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href={mailto}
          className="rounded-2xl border border-[var(--site-line)] bg-[var(--site-ink)] px-5 py-3 text-[13px] text-[var(--site-bg)] transition hover:opacity-90"
        >
          Open email to send
        </a>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            } catch {
              setCopied(false);
            }
          }}
          className="rounded-2xl border border-[var(--site-line)] px-5 py-3 text-[13px] text-[var(--site-ink)] transition hover:bg-[var(--site-hover)]"
        >
          {copied ? "Copied" : "Copy application"}
        </button>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-[var(--site-muted)]">
        If the email opens empty or cut off, use Copy and paste it into a message to{" "}
        <span className="mono">{APPLICATIONS_ADDRESS}</span>.
      </p>

      <details className="mt-4">
        <summary className="cursor-pointer text-[11.5px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">
          Show what will be sent
        </summary>
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-[11.5px] leading-relaxed text-[var(--site-body)]">
          {text}
        </pre>
      </details>
    </div>
  );
}
