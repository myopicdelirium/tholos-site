"use client";

import { useState } from "react";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const label = "smallcaps block text-[10px] text-[var(--site-muted)]";
const input =
  "mt-2 w-full rounded-xl border border-[var(--site-line)] bg-transparent px-4 py-3 text-[13px] text-[var(--site-ink)] placeholder:text-[var(--site-muted)] placeholder:opacity-60 focus:border-[var(--site-accent)] focus:outline-none";
const help = "mt-1.5 text-[11px] leading-relaxed text-[var(--site-muted)]";

const OVERLAP = [
  ["et", "My working hours mostly overlap Eastern Time"],
  ["cet", "My working hours mostly overlap Central European Time"],
  ["both", "They overlap both"],
  ["limited", "Limited overlap with either"],
] as const;

const STATUS = [
  ["undergraduate", "Undergraduate student"],
  ["graduate", "Graduate student"],
  ["working", "Working"],
  ["other", "Other"],
] as const;

const HOURS = [
  ["5-7", "5 to 7 hours a week"],
  ["8-12", "8 to 12 hours a week"],
  ["13+", "More than 12 hours a week"],
] as const;

const DURATION = [
  ["3-months", "Three months"],
  ["6-months", "Six months"],
  ["year+", "A year or longer"],
] as const;

const WORKSTREAMS = [
  ["simulation", "Simulation and agent architectures"],
  ["instruments", "Instruments and engineering"],
  ["statistics", "Statistics and validation"],
  ["writing", "Writing"],
] as const;

const HUBS = [
  ["nyc", "NYC metropolitan area"],
  ["vienna", "Vienna"],
  ["copenhagen", "Copenhagen"],
] as const;

const HEARD = [
  "A current member",
  "A friend or classmate",
  "Social media",
  "Search",
  "Other",
] as const;

type Status = "idle" | "submitting" | "sent" | "error";

function Select({
  id,
  name,
  required,
  options,
  placeholder,
}: {
  id: string;
  name: string;
  required?: boolean;
  options: ReadonlyArray<readonly [string, string]>;
  placeholder: string;
}) {
  return (
    <select id={id} name={name} required={required} defaultValue="" className={cx(input, "appearance-none")}>
      <option value="" disabled={required}>
        {placeholder}
      </option>
      {options.map(([value, text]) => (
        <option key={value} value={value}>
          {text}
        </option>
      ))}
    </select>
  );
}

export default function RosterForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [track, setTrack] = useState<"remote" | "core" | null>(null);
  const [project, setProject] = useState("");

  const projectWords = project.trim() === "" ? 0 : project.trim().split(/\s+/).length;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/opportunities/roster", {
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
      </div>

      <div className="mt-8 h-px w-full bg-[var(--site-line)]" />

      {/* Location and status */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className={label}>City *</label>
          <input id="city" name="city" type="text" required className={input} />
        </div>
        <div>
          <label htmlFor="country" className={label}>Country *</label>
          <input id="country" name="country" type="text" required className={input} />
        </div>
        <div>
          <label htmlFor="overlap" className={label}>Working hours *</label>
          <Select id="overlap" name="overlap" required options={OVERLAP} placeholder="Select what fits" />
          <p className={help}>The lab works on Eastern and Central European time.</p>
        </div>
        <div>
          <label htmlFor="status" className={label}>Current status *</label>
          <Select id="status" name="status" required options={STATUS} placeholder="Select one" />
        </div>
      </div>

      <div className="mt-8 h-px w-full bg-[var(--site-line)]" />

      {/* Commitment */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="hours" className={label}>Hours per week *</label>
          <Select id="hours" name="hours" required options={HOURS} placeholder="Select a range" />
          <p className={help}>Five hours a week is the floor. State what you can hold, not your best week.</p>
        </div>
        <div>
          <label htmlFor="duration" className={label}>For how long *</label>
          <Select id="duration" name="duration" required options={DURATION} placeholder="Select a duration" />
          <p className={help}>Three months is the minimum.</p>
        </div>
      </div>

      {/* Track */}
      <div className="mt-6">
        <span className={label}>Track *</span>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex items-start gap-3 text-[13px] leading-relaxed text-[var(--site-body)]">
            <input
              type="radio"
              name="track"
              value="remote"
              required
              checked={track === "remote"}
              onChange={() => setTrack("remote")}
              className="mt-[3px] h-4 w-4 shrink-0 accent-[var(--site-accent)]"
            />
            Remote contributor
          </label>
          <label className="flex items-start gap-3 text-[13px] leading-relaxed text-[var(--site-body)]">
            <input
              type="radio"
              name="track"
              value="core"
              required
              checked={track === "core"}
              onChange={() => setTrack("core")}
              className="mt-[3px] h-4 w-4 shrink-0 accent-[var(--site-accent)]"
            />
            Interested in core membership, in person
          </label>
        </div>
        {track === "core" ? (
          <div className="mt-4 max-w-sm">
            <label htmlFor="hub" className={label}>Which hub *</label>
            <Select id="hub" name="hub" required options={HUBS} placeholder="Select a hub" />
            <p className={help}>Core membership is in person; you need to be in or near one of these.</p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 h-px w-full bg-[var(--site-line)]" />

      {/* Work */}
      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="workstream" className={label}>Workstream *</label>
          <Select id="workstream" name="workstream" required options={WORKSTREAMS} placeholder="Select one" />
          <p className={help}>Your stage-two replication is matched to this choice.</p>
        </div>
        <div>
          <label htmlFor="link" className={label}>Link to something you have finished *</label>
          <input id="link" name="link" type="url" required placeholder="https://" className={input} />
          <p className={help}>A repository, a site, a paper, a project. Anything self-directed and done.</p>
        </div>
        <div>
          <label htmlFor="link2" className={label}>Second link</label>
          <input id="link2" name="link2" type="url" placeholder="https://" className={input} />
          <p className={help}>Optional.</p>
        </div>
        <div>
          <label htmlFor="skills" className={label}>Your strongest skill, in a sentence or two *</label>
          <textarea id="skills" name="skills" required rows={3} maxLength={800} className={cx(input, "resize-y")} />
        </div>
        <div>
          <label htmlFor="project" className={label}>
            Which project would you join, and what is the first thing you would do on it? *
          </label>
          <textarea
            id="project"
            name="project"
            required
            rows={6}
            maxLength={1200}
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className={cx(input, "resize-y")}
          />
          <p className={help}>150 words or fewer. Currently {projectWords} {projectWords === 1 ? "word" : "words"}.</p>
        </div>
        <div>
          <label htmlFor="heard" className={label}>How did you hear about the lab?</label>
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
