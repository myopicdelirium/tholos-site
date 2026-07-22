"use client";

import { useState } from "react";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const label = "smallcaps block text-[10px] text-[var(--site-muted)]";
const input =
  "mt-2 w-full rounded-xl border border-[var(--site-line)] bg-transparent px-4 py-3 text-[13px] text-[var(--site-ink)] placeholder:text-[var(--site-muted)] placeholder:opacity-60 focus:border-[var(--site-accent)] focus:outline-none";
const help = "mt-1.5 text-[11px] leading-relaxed text-[var(--site-muted)]";

const GRAD_YEARS = ["2027", "2028", "2029", "2030", "2031"] as const;
const HEARD = [
  "A current member",
  "A friend or classmate",
  "Social media",
  "Search",
  "Other",
] as const;

type Status = "idle" | "submitting" | "sent" | "error";

export default function ApplicationForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [interest, setInterest] = useState("");

  const interestWords = interest.trim() === "" ? 0 : interest.trim().split(/\s+/).length;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/opportunities/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong on our end. Please try again, or email us directly via Connect.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-[var(--site-line)] p-8">
        <div className="smallcaps text-[10px] text-[var(--site-accent)]">Application received</div>
        <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-[var(--site-body)]">
          Thank you. We read every application and will reply by email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--site-line)] p-6 sm:p-8">
      <div className="smallcaps text-[10px] text-[var(--site-accent)]">Application</div>

      {/* Contact */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={label}>Full name *</label>
          <input id="name" name="name" type="text" required autoComplete="name" className={input} />
        </div>
        <div>
          <label htmlFor="email" className={label}>Email *</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={input} />
        </div>
        <div>
          <label htmlFor="phone" className={label}>Phone</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={input} />
          <p className={help}>Optional. Used only to schedule calls.</p>
        </div>
        <div>
          <label htmlFor="location" className={label}>Where you live *</label>
          <input id="location" name="location" type="text" required placeholder="City or town" className={input} />
          <p className={help}>The program is limited to the NYC metropolitan area.</p>
        </div>
      </div>

      <div className="mt-8 h-px w-full bg-[var(--site-line)]" />

      {/* Eligibility */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="school" className={label}>School *</label>
          <input id="school" name="school" type="text" required className={input} />
        </div>
        <div>
          <label htmlFor="gradYear" className={label}>Expected graduation year *</label>
          <select id="gradYear" name="gradYear" required defaultValue="" className={cx(input, "appearance-none")}>
            <option value="" disabled>Select a year</option>
            {GRAD_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="field" className={label}>Field of study *</label>
          <input id="field" name="field" type="text" required className={input} />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-[var(--site-body)]">
          <input
            type="checkbox"
            name="age18"
            value="yes"
            required
            className="mt-[3px] h-4 w-4 shrink-0 accent-[var(--site-accent)]"
          />
          I am 18 or older.
        </label>
        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-[var(--site-body)]">
          <input
            type="checkbox"
            name="available"
            value="yes"
            required
            className="mt-[3px] h-4 w-4 shrink-0 accent-[var(--site-accent)]"
          />
          I can be in Hoboken, in person, for the full six weeks, July 5 to August 13, 2027.
        </label>
      </div>

      <div className="mt-6">
        <span className={label}>Housing *</span>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-8">
          <label className="flex items-center gap-3 text-[13px] text-[var(--site-body)]">
            <input type="radio" name="housing" value="hudson-dorms" required className="h-4 w-4 accent-[var(--site-accent)]" />
            I need housing at Hudson Dorms
          </label>
          <label className="flex items-center gap-3 text-[13px] text-[var(--site-body)]">
            <input type="radio" name="housing" value="commuting" required className="h-4 w-4 accent-[var(--site-accent)]" />
            I will commute
          </label>
        </div>
      </div>

      <div className="mt-8 h-px w-full bg-[var(--site-line)]" />

      {/* Work */}
      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="link" className={label}>Link to something you have built or written *</label>
          <input
            id="link"
            name="link"
            type="url"
            required
            placeholder="https://"
            className={input}
          />
          <p className={help}>A repository, a site, a paper, a project. Anything self-directed.</p>
        </div>
        <div>
          <label htmlFor="link2" className={label}>Second link</label>
          <input id="link2" name="link2" type="url" placeholder="https://" className={input} />
          <p className={help}>Optional.</p>
        </div>
        <div>
          <label htmlFor="experience" className={label}>
            Your experience with Python and probability or statistics *
          </label>
          <textarea
            id="experience"
            name="experience"
            required
            rows={3}
            maxLength={800}
            className={cx(input, "resize-y")}
          />
          <p className={help}>A few sentences is enough.</p>
        </div>
        <div>
          <label htmlFor="interest" className={label}>
            Which part of the lab&rsquo;s work would you want to be on, and why? *
          </label>
          <textarea
            id="interest"
            name="interest"
            required
            rows={6}
            maxLength={1200}
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className={cx(input, "resize-y")}
          />
          <p className={help}>150 words or fewer. Currently {interestWords} {interestWords === 1 ? "word" : "words"}.</p>
        </div>
        <div>
          <label htmlFor="heard" className={label}>How did you hear about the program?</label>
          <select id="heard" name="heard" defaultValue="" className={cx(input, "appearance-none")}>
            <option value="">Prefer not to say</option>
            {HEARD.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Honeypot: hidden from people, filled by bots */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-2xl border border-[var(--site-line)] bg-[var(--site-ink)] px-6 py-4 text-[13px] text-[var(--site-bg)] transition hover:opacity-90 disabled:opacity-50"
        >
          {status === "submitting" ? "Submitting…" : "Submit application"}
        </button>
        <p className="max-w-[44ch] text-[11px] leading-relaxed text-[var(--site-muted)]">
          We use what you enter here only to review your application and contact you about it.
        </p>
      </div>

      {status === "error" && errorMsg ? (
        <p className="mt-4 text-[12.5px] leading-relaxed text-[#8a3033]">{errorMsg}</p>
      ) : null}
    </form>
  );
}
