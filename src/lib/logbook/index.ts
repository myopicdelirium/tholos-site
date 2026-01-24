import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type LogbookType =
  | "Experiment"
  | "Result"
  | "Mechanism Spec"
  | "Architecture Spec"
  | "Environment Spec"
  | "Validation Report"
  | "Ablation"
  | "Performance"
  | "Incident"
  | "Release Note"
  | "Paper Draft Note"
  | "Meeting Note"
  | "Field Note";

export type LogbookStatus =
  | "Planned"
  | "Running"
  | "Verified"
  | "Rejected"
  | "Shipped";

export type LogbookArtifact = {
  label: string;
  href: string;
};

export type LogbookEntry = {
  id: string;
  title: string;
  date: string;
  type: LogbookType;
  status: LogbookStatus;
  authors: string[];
  tags: string[];
  summary: string;
  repo?: { branch?: string; commit?: string };
  run?: { bundle?: string; seeds?: (string | number)[]; params?: string };
  artifacts?: LogbookArtifact[];
  related?: { parents?: string[]; children?: string[] };
  confidence?: "Low" | "Medium" | "High";
  body: string;
};

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "logbook");

function listMarkdownFiles(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => path.join(CONTENT_DIR, f));
}

function normalizeEntry(raw: any, body: string): LogbookEntry {
  const id = String(raw.id ?? "").trim();
  if (!id) throw new Error("Logbook entry missing required frontmatter field: id");

  const title = String(raw.title ?? "").trim() || id;
  const date = String(raw.date ?? "").trim();
  if (!date) throw new Error(`Logbook entry ${id} missing required frontmatter field: date`);

  const type = String(raw.type ?? "Experiment") as LogbookType;
  const status = String(raw.status ?? "Planned") as LogbookStatus;

  const authors = Array.isArray(raw.authors) ? raw.authors.map(String) : raw.authors ? [String(raw.authors)] : [];
  const tags = Array.isArray(raw.tags) ? raw.tags.map(String) : raw.tags ? [String(raw.tags)] : [];
  const summary = String(raw.summary ?? "").trim();

  const repo =
    raw.repo && typeof raw.repo === "object"
      ? {
          branch: raw.repo.branch ? String(raw.repo.branch) : undefined,
          commit: raw.repo.commit ? String(raw.repo.commit) : undefined,
        }
      : undefined;

  const run =
    raw.run && typeof raw.run === "object"
      ? {
          bundle: raw.run.bundle ? String(raw.run.bundle) : undefined,
          seeds: Array.isArray(raw.run.seeds)
            ? raw.run.seeds.map((x: any) => (typeof x === "number" ? x : String(x)))
            : raw.run.seeds
              ? [String(raw.run.seeds)]
              : undefined,
          params: raw.run.params ? String(raw.run.params) : undefined,
        }
      : undefined;

  const artifacts: LogbookArtifact[] | undefined =
    Array.isArray(raw.artifacts)
      ? raw.artifacts
          .filter((a: any) => a && typeof a === "object")
          .map((a: any) => ({ label: String(a.label ?? "Artifact"), href: String(a.href ?? "#") }))
      : undefined;

  const related =
    raw.related && typeof raw.related === "object"
      ? {
          parents: Array.isArray(raw.related.parents) ? raw.related.parents.map(String) : undefined,
          children: Array.isArray(raw.related.children) ? raw.related.children.map(String) : undefined,
        }
      : undefined;

  const confidence = raw.confidence ? (String(raw.confidence) as "Low" | "Medium" | "High") : undefined;

  return {
    id,
    title,
    date,
    type,
    status,
    authors,
    tags,
    summary,
    repo,
    run,
    artifacts,
    related,
    confidence,
    body,
  };
}

export function getAllLogbookEntries(): LogbookEntry[] {
  const files = listMarkdownFiles();
  const entries: LogbookEntry[] = [];

  for (const fp of files) {
    const src = fs.readFileSync(fp, "utf8");
    const parsed = matter(src);
    entries.push(normalizeEntry(parsed.data, parsed.content.trim()));
  }

  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1));
  return entries;
}

export function getLogbookEntryById(id: string): LogbookEntry | null {
  const entries = getAllLogbookEntries();
  return entries.find((e) => e.id === id) ?? null;
}

export function getLogbookFacets(entries: LogbookEntry[]) {
  const types = Array.from(new Set(entries.map((e) => e.type))).sort();
  const statuses = Array.from(new Set(entries.map((e) => e.status))).sort();
  const tags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort((a, b) => a.localeCompare(b));
  return { types, statuses, tags };
}
