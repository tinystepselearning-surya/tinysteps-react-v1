export type PublicResourceSnapshot = {
  path: string;
  origin: string;
  html: string;
};

/**
 * Captures only substantive, self-canonical prerendered public Phonics,
 * Grammar, Vocabulary or /blog/:slug articles, plus the three published\n * group-class programme pages, before React replaces the HTML.
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

/** Identify rejected dynamic-import and lazy-chunk load errors. */
export function isLazyModuleLoadError(error: unknown): boolean;
