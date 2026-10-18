export type PublicResourceSnapshot = {
  path: string;
  origin: string;
  html: string;
};

/**
 * Captures only substantive, self-canonical prerendered public Phonics,
 * Grammar, Vocabulary or /blog/:slug articles, before React replaces the HTML.
 * Protected routes, missing pages, noindex and wrong-canonical documents are
 * never eligible for recovery.
 */
export function captureOriginalPublicResource(
  document: Document,
  location: Location | URL,
): PublicResourceSnapshot | null;

export function saveOriginalPublicResource(
  document: Document,
  location: Location | URL,
): boolean;

export function originalResourceForChunkError(
  error: unknown,
  location: Location | URL,
): string | null;
