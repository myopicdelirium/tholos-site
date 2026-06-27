// Playback loader (WO-V3 data contract, schema v2, browser side).
//
// The non-negotiable rule: the browser REPLAYS logged data; it never
// re-simulates. The artifact is split into a light *manifest* (population
// series, cap, water cells, comfort band — renders immediately) and a heavy
// *frames* payload (per-agent tracks, predators, birth/death events) that
// streams in after. Nothing here evolves state.

export const SUPPORTED_FORMAT = 2;

// agent record: [id, x, y, energy, hydration, comfort, safety, trait, age]
export type AgentRec = number[];

export interface Frame {
  t: number;
  season: number;
  drought: number;
  agents: AgentRec[];
  predators: number[][]; // [x, y]
  births: number[][]; // [id, x, y]
  deaths: number[][]; // [id, x, y, causeCode]
}

export interface Manifest {
  formatVersion: number;
  case: string;
  seed: number;
  gitCommit: string;
  configHash: string;
  grid: number;
  ticks: number;
  stride: number;
  frameCount: number;
  cap: number;
  population: number[]; // per-tick, full run
  waterCells: number[][]; // [x, y]
  comfortBand: { yLow: number; yHigh: number; label: string } | null;
  needs: string[];
  actions: string[];
  causes: string[];
  stressThreshold: number; // uint8 need level below which an agent is "stressed"
  framesUrl: string;
  summary: {
    extinct: boolean;
    final_population: number;
    peak_population: number;
    total_births: number;
    median_survival_time: number;
    deaths_by_cause: Record<string, number>;
  };
}

function check(raw: { format_version?: number }, what: string) {
  if (raw.format_version !== SUPPORTED_FORMAT) {
    throw new Error(
      `${what} format_version ${raw.format_version} unsupported ` +
        `(player supports ${SUPPORTED_FORMAT}). Re-export with the current tool.`,
    );
  }
}

export async function loadManifest(url: string): Promise<Manifest> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status} ${url}`);
  const raw = await res.json();
  check(raw, "Manifest");
  return {
    formatVersion: raw.format_version,
    case: raw.case,
    seed: raw.seed,
    gitCommit: raw.git_commit,
    configHash: raw.config_hash,
    grid: raw.grid,
    ticks: raw.ticks,
    stride: raw.stride,
    frameCount: raw.frameCount,
    cap: raw.cap,
    population: raw.population,
    waterCells: raw.waterCells,
    comfortBand: raw.comfortBand ?? null,
    needs: raw.needs,
    actions: raw.actions,
    causes: raw.causes,
    stressThreshold: raw.stressThreshold,
    framesUrl: raw.framesUrl,
    summary: raw.summary,
  };
}

export async function loadFrames(
  manifestUrl: string,
  manifest: Manifest,
): Promise<Frame[]> {
  // resolve framesUrl relative to the manifest's directory
  const base = manifestUrl.slice(0, manifestUrl.lastIndexOf("/") + 1);
  const url = base + manifest.framesUrl;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Frames fetch failed: ${res.status} ${url}`);
  const raw = await res.json();
  check(raw, "Frames");
  return raw.frames as Frame[];
}
