// Playback loader + types (WO-V3 data contract, browser side).
//
// The non-negotiable rule: the browser REPLAYS logged data; it never
// re-simulates. This module fetches the artifact exported by
// `batch-a/viz/export_playback.py`, validates `format_version`, and decodes the
// packed fields into typed arrays. Nothing here (or downstream) evolves state.

export const SUPPORTED_FORMAT = 1;

export interface PackedField {
  w: number;
  h: number;
  data: Uint8Array; // row-major [y*w + x], 0..255
}

export interface Frame {
  t: number;
  pop: number;
  season: number;
  drought: number;
  // agent: [x, y, energy, hydration, comfort, safety, actionCode], needs 0..255
  agents: number[][];
  // death: [x, y, causeCode]
  deaths: number[][];
}

export interface PlaybackSummary {
  extinct: boolean;
  final_population: number;
  peak_population: number;
  total_births: number;
  median_survival_time: number;
  deaths_by_cause: Record<string, number>;
}

export interface Playback {
  formatVersion: number;
  case: string;
  seed: number;
  gitCommit: string;
  configHash: string;
  grid: number;
  ticks: number;
  stride: number;
  needs: string[];
  actions: string[];
  causes: string[];
  comfortBand: { low: number; high: number } | null;
  fields: {
    moisture?: PackedField;
    temperature?: PackedField;
    risk?: PackedField;
  };
  frames: Frame[];
  summary: PlaybackSummary;
}

function decodeField(f: { w: number; h: number; data: string } | undefined):
  PackedField | undefined {
  if (!f) return undefined;
  const bin = atob(f.data);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return { w: f.w, h: f.h, data: out };
}

export async function loadPlayback(url: string): Promise<Playback> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Playback fetch failed: ${res.status} ${url}`);
  }
  const raw = await res.json();
  if (raw.format_version !== SUPPORTED_FORMAT) {
    throw new Error(
      `Playback format_version ${raw.format_version} unsupported ` +
        `(player supports ${SUPPORTED_FORMAT}). Re-export with the current tool.`,
    );
  }
  return {
    formatVersion: raw.format_version,
    case: raw.case,
    seed: raw.seed,
    gitCommit: raw.git_commit,
    configHash: raw.config_hash,
    grid: raw.grid,
    ticks: raw.ticks,
    stride: raw.stride,
    needs: raw.needs,
    actions: raw.actions,
    causes: raw.causes,
    comfortBand: raw.comfort_band ?? null,
    fields: {
      moisture: decodeField(raw.fields?.moisture),
      temperature: decodeField(raw.fields?.temperature),
      risk: decodeField(raw.fields?.risk),
    },
    frames: raw.frames,
    summary: raw.summary,
  };
}
