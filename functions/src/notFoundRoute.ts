import { onRequest } from "firebase-functions/v2/https";

const REGION = "asia-south1";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const notFoundRoute = onRequest({region: REGION}, async (request, response) => {
  const requestedPath = escapeHtml(request.path || request.originalUrl || "/");

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
