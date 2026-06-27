// Shared visual tokens for the Batch A player (WO-V1, site-native).
// These mirror the site palette in src/app/globals.css; keep them in sync.
// One place owns sim colors so figures and the player read as one designed thing.

export const SIM = {
  // instrument panel (a deep "scientific monitor" set into the ivory page)
  bg: "#0b1419",
  bgEdge: "#0e1a20",
  grid: "rgba(180,200,205,0.05)",
  ink: "#f0eae0", // ivory readout text

  // per-need colors (what an agent is "about" — its most urgent deficit)
  need: {
    energy: [206, 170, 92] as const, // brass/amber
    hydration: [54, 170, 198] as const, // teal/cyan
    temperature_comfort: [150, 150, 220] as const, // cold violet
    safety: [214, 96, 74] as const, // insurgent red
  },

  // field ramps (drawn additively on the dark panel)
  field: {
    moisture: [44, 150, 176] as const, // teal water
    tempCold: [78, 116, 196] as const,
    tempWarm: [212, 150, 78] as const,
    risk: [194, 58, 43] as const, // insurgent
  },

  // per-case accent (UI chrome), from the site palette
  case: {
    a1: "#00394f", // teal
    a2: "#3f6f5f",
    a3: "#857665", // brass
    a4: "#c23a2b", // insurgent
  },

  death: "#f4ece0",
} as const;

export type NeedName = keyof typeof SIM.need;
export const NEED_ORDER: NeedName[] = [
  "energy",
  "hydration",
  "temperature_comfort",
  "safety",
];

export const NEED_LABEL: Record<NeedName, string> = {
  energy: "Energy",
  hydration: "Hydration",
  temperature_comfort: "Comfort",
  safety: "Safety",
};
