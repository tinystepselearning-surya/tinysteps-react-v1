import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import http from 'node:http';
import { once } from 'node:events';
import { chromium } from 'playwright';
import { captureReadyRoute, installPrerenderShell, readPrerenderReadiness } from '../prerender-readiness.mjs';

const site = 'https://tinystepslearning.com';
const target = '/blog/speaking-video-feedback';
const neighbor = '/blog/speaking-structure';
const titles = {
  [target]: 'How Video Feedback Helps Kids Improve Public Speaking',
  [neighbor]: 'How Kids Can Structure a Clear Speech',
  '/blog/retry': 'A recovered article',
  '/blog/archive': 'An intentional archive',
};
const shell = '<!doctype html><html><head><title>Loading</title></head><body><div id="root"></div><script src="/app.js"></script></body></html>';
const app = `
const titles = ${JSON.stringify(titles)};
const path = location.pathname;
const title = titles[path];
function errorPage() {
  document.title = '404 - Page Not Found | Tiny Steps Learning';
  document.getElementById('root').innerHTML = '<h1>404 - Page Not Found</h1><p>' + 'Error content. '.repeat(400) + '</p>';
  document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex, nofollow">');
}
function ready() {
  const description = 'Useful guidance for ' + title + '.';
  const robots = path === '/blog/archive' ? 'noindex, follow' : 'index, follow';
  document.head.innerHTML = '<title>' + title + ' | Tiny Steps Blog</title>'
    + '<link rel="canonical" href="${site}' + path + '">'
    + '<meta name="description" content="' + description + '">'
    + ['robots','googlebot','bingbot'].map(name => '<meta name="' + name + '" content="' + robots + '">').join('');
  const schema = document.createElement('script');
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({'@type':'BlogPosting',url:'${site}'+path,headline:title,description});
  document.head.append(schema);
  document.getElementById('root').innerHTML = '<article><h1>' + title + '</h1><p>' + ('Guidance for ' + title + '. ').repeat(30) + '</p></article>';
}
errorPage();
if (path === '${target}') window.releaseArticle = ready;
else if (path === '/blog/retry') fetch('/attempt').then(r => r.json()).then(n => { if (n > 1) ready(); });
else if (title) ready();
`;
let browser;
let server;
let origin;
let savedDocument = shell;
let documentRequests = 0;
let attempts = 0;

before(async () => {
  server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.url === '/app.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(app); }
    else if (req.url === '/attempt') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(++attempts)); }
    else if (req.url === '/missing.js') { res.writeHead(404); res.end('Missing asset'); }
    else if (req.url === '/http-error') { res.writeHead(503); res.end('Unavailable'); }
    else { documentRequests++; res.setHeader('Content-Type', 'text/html'); res.end(savedDocument); }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => {
  if (browser) await browser.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
const contract = (path, noindex = false) => ({ canonicalUrl: site + path, requireArticle: true, checkArticleMetadata: true, expectedNoindex: noindex });
async function isolatedPage(t) {
  const page = await browser.newPage({ serviceWorkers: 'block' });
  t.after(() => page.close());
  await installPrerenderShell(page, origin, shell);
  return page;
}

test('real Chromium rejects the large error document, waits for valid SEO and isolates sequential routes', async (t) => {
  const page = await isolatedPage(t);
  savedDocument = await captureReadyRoute(page, origin + neighbor, contract(neighbor));
  assert.ok(savedDocument.includes(titles[neighbor]));
  const result = captureReadyRoute(page, origin + target, contract(target));
  await page.waitForFunction(() => typeof window.releaseArticle === 'function');
  assert.equal(await page.evaluate(readPrerenderReadiness, contract(target)), false);
  assert.ok((await page.content()).length > 2500);
  await page.evaluate(() => window.releaseArticle());
  const html = await result;
  assert.ok(html.includes(titles[target]));
  assert.ok(!html.includes(titles[neighbor]));
  assert.ok(!html.includes('404 - Page Not Found'));
  assert.equal(documentRequests, 0, 'The mutable output document must not be used as the input shell');
});

test('real Chromium rejects stale nonempty title and description on an otherwise valid article', async (t) => {
  const page = await isolatedPage(t);
  await captureReadyRoute(page, origin + neighbor, contract(neighbor));
  await page.evaluate(() => { document.title = 'An unrelated article | Tiny Steps Blog'; });
  assert.equal(await page.evaluate(readPrerenderReadiness, contract(neighbor)), false);
  await page.evaluate((title) => {
    document.title = title + ' | Tiny Steps Blog';
    document.querySelector('meta[name="description"]').content = 'An unrelated description.';
  }, titles[neighbor]);
  assert.equal(await page.evaluate(readPrerenderReadiness, contract(neighbor)), false);
});

test('real Chromium retries a transient error and captures only the valid document', async (t) => {
  const page = await isolatedPage(t);
  attempts = 0;
  let captures = 0;
  const content = page.content.bind(page);
  page.content = async () => { captures++; return content(); };
  const html = await captureReadyRoute(page, origin + '/blog/retry', contract('/blog/retry'), { readinessTimeout: 1000, retryDelay: 0 });
  assert.equal(attempts, 2);
  assert.equal(captures, 1);
  assert.ok(html.includes(titles['/blog/retry']));
});

test('real Chromium fails closed after bounded retries without capturing invalid output', async (t) => {
  const page = await isolatedPage(t);
  let captures = 0;
  const content = page.content.bind(page);
  page.content = async () => { captures++; return content(); };
  await assert.rejects(captureReadyRoute(page, origin + '/blog/permanent-error', contract('/blog/permanent-error'), { readinessTimeout: 300, retryDelay: 0 }), /not-found page/);
  assert.equal(captures, 0);
});

test('real Chromium preserves intentional noindex and does not mask missing assets', async (t) => {
  const page = await isolatedPage(t);
  await captureReadyRoute(page, origin + '/blog/archive', contract('/blog/archive', true));
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
  assert.equal(await page.evaluate(readPrerenderReadiness, contract('/blog/archive')), false);
  assert.equal(await page.evaluate(() => fetch('/missing.js').then(response => response.status)), 404);
});

test('real Chromium rejects unsuccessful HTTP navigation outside the shell adapter', async (t) => {
  const page = await browser.newPage();
  t.after(() => page.close());
  await assert.rejects(captureReadyRoute(page, origin + '/http-error', contract('/http-error'), { maxRetries: 1 }), /HTTP 503/);
});
