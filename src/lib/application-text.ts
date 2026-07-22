/**
 * Plain-text rendering of an application. Pure string work with no runtime
 * dependencies, so it is shared by the server (email body) and the client
 * (manual-send fallback when automatic delivery is unavailable).
 */

export const APPLICATIONS_ADDRESS = "myopicdelirium@gmail.com";

function humanize(key: string) {
  const spaced = key.replace(/([A-Z])/g, " $1").replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** One field per block, blank values shown as an em dash. */
export function formatSubmission(record: Record<string, unknown>) {
  return Object.entries(record)
    .map(([key, value]) => {
      const text = String(value ?? "").trim();
      return `${humanize(key)}\n${text === "" ? "—" : text}`;
    })
    .join("\n\n");
}
