import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { deliverSubmission } from "@/lib/deliver";

// Applications are emailed (see src/lib/deliver.ts). Production runs on a
// read-only filesystem, so the local ndjson append is kept for development
// convenience only and is never allowed to fail the request.

const REQUIRED = [
  "name",
  "email",
  "location",
  "school",
  "gradYear",
  "field",
  "housing",
  "link",
  "experience",
  "interest",
] as const;

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
  if (data.age18 !== "yes" || data.available !== "yes") {
    return NextResponse.json({ ok: false, error: "eligibility not confirmed" }, { status: 400 });
  }

  const record = {
    receivedAt: new Date().toISOString(),
    opportunity: "summer-residency-2027",
    name: data.name,
    email: data.email,
    phone: data.phone ?? "",
    location: data.location,
    school: data.school,
    gradYear: data.gradYear,
    field: data.field,
    age18: true,
    available: true,
    housing: data.housing,
    link: data.link,
    link2: data.link2 ?? "",
    experience: data.experience,
    interest: data.interest,
    heard: data.heard ?? "",
  };

  // Local convenience copy; best effort, never fatal (read-only in production).
  if (process.env.NODE_ENV !== "production") {
    try {
      const dir = path.join(process.cwd(), "data");
      await mkdir(dir, { recursive: true });
      await appendFile(path.join(dir, "applications.ndjson"), JSON.stringify(record) + "\n", "utf8");
    } catch {
      /* ignore — email below is the system of record */
    }
  }

  try {
    await deliverSubmission({
      subject: `Summer Residency application — ${record.name}`,
      record,
      replyTo: typeof record.email === "string" ? record.email : undefined,
    });
  } catch (err) {
    // Never silently lose an application: log the full record so it can be
    // recovered from the deployment logs if email delivery is down.
    console.error("[opportunities/apply] delivery failed:", err);
    console.error("[opportunities/apply] undelivered record:", JSON.stringify(record));
    return NextResponse.json({ ok: false, error: "delivery failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
