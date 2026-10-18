// SEO/GSC #735: preserve a trustworthy prerendered article when a transient
// JS chunk failure would otherwise replace it with a generic error screen.
// This never substitutes content for another URL or a real missing page.
const allowedResourcePath = /^\/resources\/(?:phonics|grammar|vocabulary)(?:\/[a-z0-9-]+)?$/;
const lazyModuleError = /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|failed to load module script|loading chunk .+ failed/i;
let originalResource = null;

const normalizedPath = (pathname) => pathname.replace(/\/+$/, '') || '/';

export function captureOriginalPublicResource(document, location) {
  const path = normalizedPath(location.pathname);
  if (!allowedResourcePath.test(path)) return null;

  const root = document.getElementById('root');
  const main = root?.querySelector('main');
  const h1 = main?.querySelector('h1');
  const content = (main?.textContent || '').replace(/\s+/g, ' ').trim();
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
  const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
  if (!main || !h1?.textContent?.trim() || content.length < 600) return null;
  if (canonical !== location.origin + path || /\bnoindex\b/i.test(robots)) return null;
  if (/something went wrong|404 - page not found/i.test(content)) return null;

  // Static HTML comes from the site's own prerendered response. We preserve
  // existing anchors and educational content, not interactive React state.
  return { path, origin: location.origin, html: root.innerHTML };
}

export function saveOriginalPublicResource(document, location) {
  originalResource = captureOriginalPublicResource(document, location);
  return Boolean(originalResource);
}

export function originalResourceForChunkError(error, location) {
  const message = String(error?.message || error || '');
  if (!lazyModuleError.test(message) || !originalResource) return null;
  if (originalResource.origin !== location.origin
      || originalResource.path !== normalizedPath(location.pathname)) return null;
  return originalResource.html;
}
