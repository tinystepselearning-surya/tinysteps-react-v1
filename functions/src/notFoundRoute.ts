import { onRequest } from "firebase-functions/v2/https";
import { resolveSeoCanonicalRedirect } from "./seoCanonicalRedirects";

const REGION = "asia-south1";
const CANONICAL_ORIGIN = "https://tinystepslearning.com";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export const notFoundRoute = onRequest({region: REGION}, async (request, response) => {
  const requestedPath = request.path || request.originalUrl || "/";
  const canonicalRedirect = resolveSeoCanonicalRedirect(requestedPath);

  if (canonicalRedirect) {
    // Preserve accumulated search/link equity with a real permanent redirect.
    // Do not attach noindex headers to redirects; the canonical destination is
    // the indexable resource search engines should retain.
    response.set("Cache-Control", "public, max-age=3600");
    response.redirect(301, `${CANONICAL_ORIGIN}${canonicalRedirect}`);
    return;
  }

  const escapedPath = escapeHtml(requestedPath);

  response.status(404);
  response.set("Cache-Control", "no-store, max-age=0");
  response.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <title>404 | Tiny Steps Learning</title>
  </head>
  <body>
    <main>
      <h1>Page not found</h1>
      <p>The requested URL does not exist on Tiny Steps Learning.</p>
      <p><code>${escapedPath}</code></p>
    </main>
  </body>
</html>`);
});
