import type { CopenWienArticle } from "@/content/copenwien/types"
import { copenwienArticles } from "@/content/copenwien"

export type { CopenWienArticle }

export function listCopenWien(): CopenWienArticle[] {
  return copenwienArticles
}

export function getCopenWien(slug: string): CopenWienArticle | null {
  return copenwienArticles.find((a) => a.slug === slug) ?? null
}
