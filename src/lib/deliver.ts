/**
 * Delivery for opportunity applications.
 *
 * Serverless hosting has a read-only filesystem, so submissions cannot be
 * appended to a local file in production. Applications are emailed instead,
 * via Resend's HTTP API (no SDK dependency — a single fetch).
 *
 * Configuration (Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY     required. Secret key from resend.com.
 *   APPLICATIONS_TO    optional. Defaults to myopicdelirium@gmail.com.
 *   APPLICATIONS_FROM  optional. Defaults to Resend's shared sender, which can
 *                      only deliver to the address that owns the Resend
 *                      account. Verify a domain to send from @myopicdelirium.com.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const DEFAULT_TO = "myopicdelirium@gmail.com";
const DEFAULT_FROM = "Myopic Delirium <onboarding@resend.dev>";

function humanize(key: string) {
  const spaced = key.replace(/([A-Z])/g, " $1").replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Readable plain-text rendering of a submission, one field per block. */
export function formatSubmission(record: Record<string, unknown>) {
  return Object.entries(record)
    .map(([key, value]) => {
      const text = String(value ?? "").trim();
      return `${humanize(key)}\n${text === "" ? "—" : text}`;
    })
    .join("\n\n");
}

export async function deliverSubmission(opts: {
  subject: string;
  record: Record<string, unknown>;
  /** Applicant address, so a reply goes straight back to them. */
  replyTo?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set — cannot deliver the application by email."
    );
  }

  const to = process.env.APPLICATIONS_TO || DEFAULT_TO;
  const from = process.env.APPLICATIONS_FROM || DEFAULT_FROM;

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: opts.subject,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      text: formatSubmission(opts.record),
    }),
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Resend responded ${res.status}: ${detail}`);
  }
}
