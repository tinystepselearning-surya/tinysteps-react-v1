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
  "/blog/best-age-to-start-phonics-classes-for-kids": "/blog/what-age-to-start-phonics",
  "/blog/how-tiny-steps-builds-reading-confidence": "/blog/how-phonics-builds-reading-confidence",
  "/blog/week-1-phonics-satpin-launch": "/blog/phonics-satpin-launch",
  "/blog/week-2-phonics-blending-club": "/blog/phonics-blending-club",
  "/blog/week-3-phonics-tricky-words": "/blog/phonics-tricky-words",
  "/blog/week-4-phonics-long-vowels": "/blog/phonics-long-vowels",
  "/blog/week-5-phonics-r-controlled": "/blog/phonics-r-controlled",
  "/blog/week-6-phonics-comprehension": "/blog/phonics-comprehension",
  "/blog/week-16-phonics-summer-plan": "/blog/phonics-summer-plan",
  "/blog/week-19-phonics-multisyllabic": "/blog/phonics-multisyllabic",
  "/blog/week-22-phonics-diagnostics": "/blog/phonics-diagnostics",
  "/blog/week-27-prevent-summer-slide-reading": "/blog/prevent-summer-slide-reading",
  "/blog/week-7-grammar-nouns-to-paragraphs": "/blog/grammar-nouns-to-paragraphs",
  "/blog/week-8-grammar-tenses": "/blog/grammar-tenses",
  "/blog/week-9-grammar-conjunctions": "/blog/grammar-conjunctions",
  "/blog/week-10-grammar-subject-verb": "/blog/grammar-subject-verb",
  "/blog/week-11-grammar-creative-writing": "/blog/grammar-creative-writing",
  "/blog/week-17-grammar-assessment": "/blog/grammar-assessment",
  "/blog/week-20-grammar-editing-camp": "/blog/grammar-editing-camp",
  "/blog/week-23-grammar-speaking-bridge": "/blog/grammar-speaking-bridge",
  "/blog/week-12-speaking-confidence-seeds": "/blog/speaking-confidence-seeds",
  "/blog/week-13-speaking-structure": "/blog/speaking-structure",
  "/blog/week-14-speaking-visual-aids": "/blog/speaking-visual-aids",
  "/blog/week-15-speaking-debate-starters": "/blog/speaking-debate-starters",
  "/blog/week-18-speaking-video-feedback": "/blog/speaking-video-feedback",
  "/blog/week-21-speaking-competition-prep": "/blog/speaking-competition-prep",
  "/blog/week-24-speaking-family-showcase": "/blog/speaking-family-showcase",
  "/blog/week-25-back-to-school-plan": "/blog/back-to-school-english-confidence-plan",
  "/blog/week-26-screen-smart-summer-routine": "/blog/screen-smart-summer-routine-for-kids",
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
