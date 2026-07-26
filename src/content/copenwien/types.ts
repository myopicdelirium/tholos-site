// CopenWien Chapter — extended abstracts shown in full (no access request).
// Each article is a readable document (the docs equivalent of 3-5 pages).

export type CopenWienBlock =
  | { heading: string }
  | { text: string }

export type CopenWienArticle = {
  slug: string
  title: string
  /** One-paragraph lead shown in the chapter index. */
  abstract: string
  authors?: string[]
  keywords?: string[]
  status?: string
  year?: string
  updated?: string
  /** The extended abstract itself: ordered headings and paragraphs. */
  body: CopenWienBlock[]
}
