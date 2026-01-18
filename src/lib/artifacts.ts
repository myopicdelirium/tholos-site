import type { Artifact } from "@/content/artifacts/types"
import { artifacts } from "@/content/artifacts"

export type { Artifact }

export function listArtifacts(): Artifact[] {
  return artifacts
}

export function getArtifact(slug: string): Artifact | null {
  return artifacts.find((a) => a.slug === slug) ?? null
}
