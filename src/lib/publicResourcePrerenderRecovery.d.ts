export type PublicResourceSnapshot = {
  path: string;
  origin: string;
  html: string;
};

/**
 * Captures only a substantive, self-canonical prerendered Phonics, Grammar or
 * Vocabulary page, before React replaces its server-generated HTML.
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
