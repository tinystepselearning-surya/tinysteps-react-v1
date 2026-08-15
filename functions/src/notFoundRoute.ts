import { onRequest } from "firebase-functions/v2/https";

const REGION = "asia-south1";
const SITE_ORIGIN = "https://tinystepslearning.com";

// Canonical consolidation redirects for retired blog URLs. These requests only
// reach this function after Firebase static-file resolution, so surviving
// prerendered canonical posts continue to be served directly by Hosting.
const CANONICAL_BLOG_REDIRECTS: Record<string, string> = {
  "/blog/child-knows-letter-sounds-but-cannot-read": "/blog/why-child-knows-letter-sounds-but-cannot-read-words",
  "/blog/can-child-master-english-in-10-days": "/blog/can-child-improve-english-in-10-days",
  "/blog/why-child-answers-only-in-one-word": "/blog/child-gives-one-word-answers",
  "/blog/child-reads-words-but-does-not-understand-story": "/blog/why-child-reads-words-but-does-not-understand-story",
  "/blog/june-school-readiness-english-revision-plan": "/blog/june-school-reopening-english-readiness-plan",
  "/blog/how-long-does-it-take-child-to-learn-phonics": "/blog/how-long-does-phonics-take",
  "/blog/best-online-phonics-classes-for-kids": "/blog/how-to-choose-phonics-classes",
  "/blog/best-phonics-classes-for-kids": "/blog/how-to-choose-phonics-classes",
  "/blog/phonics-grammar-speaking-connected-english-communication": "/blog/how-phonics-grammar-and-communication-work-together",
  "/blog/engage-children-phonics-grammar-speaking-at-home": "/blog/how-to-engage-kids-in-english-learning-at-home",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizePath(value: string) {
  const raw = value.split("?")[0].split("#")[0] || "/";
  if (raw.length > 1 && raw.endsWith("/")) return raw.slice(0, -1);
  return raw;
}

export const notFoundRoute = onRequest({region: REGION}, async (request, response) => {
  const rawPath = normalizePath(request.path || request.originalUrl || "/");
  const canonicalPath = CANONICAL_BLOG_REDIRECTS[rawPath];

  if (canonicalPath) {
    response.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
    response.redirect(301, `${SITE_ORIGIN}${canonicalPath}`);
    return;
  }

  const requestedPath = escapeHtml(rawPath);
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
      <p><code>${requestedPath}</code></p>
    </main>
  </body>
</html>`);
});
