import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

// Submissions are appended to data/roster-applications.ndjson (gitignored — it
// holds applicant PII). NOTE: on serverless hosting this filesystem is
// ephemeral; before launch, wire delivery to email or durable storage here.

const REQUIRED = [
  "name",
  "email",
  "city",
  "country",
  "overlap",
  "status",
  "hours",
  "duration",
  "track",
  "workstream",
  "link",
  "skills",
  "project",
] as const;

const OVERLAP = new Set(["et", "cet", "both", "limited"]);
const STATUS = new Set(["undergraduate", "graduate", "working", "other"]);
const HOURS = new Set(["5-7", "8-12", "13+"]);
const DURATION = new Set(["3-months", "6-months", "year+"]);
const TRACK = new Set(["remote", "core"]);
const WORKSTREAM = new Set(["simulation", "instruments", "statistics", "writing"]);
const HUB = new Set(["nyc", "vienna", "copenhagen"]);

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  // Honeypot: bots fill the hidden field; pretend success and discard.
  if (typeof data.website === "string" && data.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  for (const key of REQUIRED) {
    const v = data[key];
    if (typeof v !== "string" || v.trim() === "") {
      return NextResponse.json({ ok: false, error: `missing field: ${key}` }, { status: 400 });
    }
  }

  const enums: Array<[string, Set<string>]> = [
    ["overlap", OVERLAP],
    ["status", STATUS],
    ["hours", HOURS],
    ["duration", DURATION],
    ["track", TRACK],
    ["workstream", WORKSTREAM],
  ];
  for (const [key, allowed] of enums) {
    if (!allowed.has(data[key] as string)) {
      return NextResponse.json({ ok: false, error: `invalid value: ${key}` }, { status: 400 });
    }
  }
  if (data.track === "core" && !HUB.has(data.hub as string)) {
    return NextResponse.json({ ok: false, error: "core track requires a hub" }, { status: 400 });
  }

  const record = {
    receivedAt: new Date().toISOString(),
    opportunity: "roster",
    name: data.name,
    email: data.email,
    phone: data.phone ?? "",
    city: data.city,
    country: data.country,
    overlap: data.overlap,
    status: data.status,
    hours: data.hours,
    duration: data.duration,
    track: data.track,
    hub: data.track === "core" ? data.hub : "",
    workstream: data.workstream,
    link: data.link,
    link2: data.link2 ?? "",
    skills: data.skills,
    project: data.project,
    heard: data.heard ?? "",
  };

  try {
    const dir = path.join(process.cwd(), "data");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "roster-applications.ndjson"), JSON.stringify(record) + "\n", "utf8");
  } catch (err) {
    console.error("[opportunities/roster] failed to record application:", err);
    return NextResponse.json({ ok: false, error: "storage failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
