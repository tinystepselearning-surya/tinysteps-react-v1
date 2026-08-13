// Server-side SEO canonical redirects for retired public article URLs.
// Keep this list deliberately small and high-confidence. The destination pages
// remain the authoritative, self-canonical SEO/AEO/GEO resources.
export const SEO_CANONICAL_REDIRECTS: Readonly<Record<string, string>> = Object.freeze({
  "/blog/child-reads-words-but-does-not-understand-story":
    "/blog/why-child-reads-words-but-does-not-understand-story",
  "/blog/how-long-does-phonics-take":
    "/blog/how-long-does-it-take-child-to-learn-phonics",
  "/blog/june-school-readiness-english-revision-plan":
    "/blog/june-school-reopening-english-readiness-plan",
  "/blog/why-child-answers-only-in-one-word":
    "/blog/child-gives-one-word-answers",
});

export function normalizeSeoPath(value: string): string {
  const raw = String(value || "/").split("?")[0].split("#")[0] || "/";
  if (raw === "/") return "/";
  return raw.replace(/\/+$/, "") || "/";
}

export function resolveSeoCanonicalRedirect(pathname: string): string | null {
  const normalized = normalizeSeoPath(pathname);
  return SEO_CANONICAL_REDIRECTS[normalized] ?? null;
}
