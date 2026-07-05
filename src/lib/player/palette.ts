// Player tokens, read from the site's WO-V1 design tokens at runtime — NOT
// hardcoded. The plate is ink-on-paper; exactly two colours carry data:
// the site's water blue (--teal, only ever water) and rust (--insurgent, only
// ever stress & death). Everything else is ink at varying alpha.

export type RGB = [number, number, number];

export interface Tokens {
  paper: RGB; // --ivory
  ink: RGB; // --ink
  water: RGB; // --teal
  rust: RGB; // --insurgent
  brass: RGB; // --brass
}

const FALLBACK: Tokens = {
  paper: [240, 234, 224],
  ink: [12, 14, 16],
  water: [0, 57, 79],
  rust: [194, 58, 43],
  brass: [133, 118, 101],
};

function readVar(name: string, fallback: RGB): RGB {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!raw) return fallback;
  const parts = raw.split(/[\s,]+/).map(Number);
  return parts.length === 3 && parts.every((n) => !Number.isNaN(n))
    ? (parts as RGB)
    : fallback;
}

// Read once on the client; the site declares these as "R G B" triplets on :root.
export function readTokens(): Tokens {
  return {
    paper: readVar("--ivory", FALLBACK.paper),
    ink: readVar("--ink", FALLBACK.ink),
    water: readVar("--teal", FALLBACK.water),
    rust: readVar("--insurgent", FALLBACK.rust),
    brass: readVar("--brass", FALLBACK.brass),
  };
}

export function rgba([r, g, b]: RGB, a: number): string {
  return `rgba(${r},${g},${b},${a})`;
}

export const NEED_LABELS = ["Energy", "Hydration", "Comfort", "Safety"] as const;
