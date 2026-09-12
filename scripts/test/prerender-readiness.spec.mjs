import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureReadyRoute, installPrerenderShell, readPrerenderReadiness } from '../prerender-readiness.mjs';

const canonicalUrl = 'https://tinystepslearning.com/blog/speaking-video-feedback';
const title = 'How Video Feedback Helps Kids Improve Public Speaking';
const description = 'A parent guide to useful video feedback for children.';
const contract = { canonicalUrl, requireArticle: true, checkArticleMetadata: true, expectedNoindex: false };
const paragraph = 'Children review a recording, choose one clear improvement, and try another speech. '.repeat(12);

function readyArticle({ noindex = false } = {}) {
  document.head.innerHTML = `<title>${title} | Tiny Steps Blog</title>
    <link rel="canonical" href="${canonicalUrl}">
    <meta name="description" content="A parent guide to useful video feedback for children.">
    ${['robots', 'googlebot', 'bingbot'].map((name) => `<meta name="${name}" content="${noindex ? 'noindex, follow' : 'index, follow'}">`).join('')}
    <script type="application/ld+json">${JSON.stringify({ '@type': 'BlogPosting', url: canonicalUrl, headline: title, description })}</script>`;
  document.body.innerHTML = `<div id="root"><main><article><h1>${title}</h1><p>${paragraph}</p></article></main></div>`;
}

beforeEach(() => readyArticle());

describe('prerender readiness is based on the requested page, not HTML size', () => {
  it('accepts the real indexable video-feedback article after its SEO effect completes', () => {
    expect(readPrerenderReadiness(contract)).toBe(true);
  });

  it('rejects the #640 not-found document even with headings and more than 2500 bytes', () => {
    document.title = '404 - Page Not Found | Tiny Steps Learning';
    document.querySelector('meta[name="description"]').remove();
    document.querySelectorAll('meta[name="robots"], meta[name="googlebot"], meta[name="bingbot"]')
      .forEach((node) => node.setAttribute('content', 'noindex, nofollow'));
    document.getElementById('root').innerHTML = `<h1>404 - Page Not Found</h1><p>${paragraph.repeat(4)}</p>`;
    expect(document.documentElement.outerHTML.length).toBeGreaterThan(2500);
    expect(readPrerenderReadiness(contract)).toBe(false);
    const state = readPrerenderReadiness({ ...contract, diagnostics: true });
    expect(state.problems).toContain('router rendered an error or not-found page');
    expect(state.problems).toContain('article markup is missing');
  });

  it('rejects an unrelated article left over from an earlier route', () => {
    document.querySelector('link[rel="canonical"]').href = 'https://tinystepslearning.com/blog/satpin-phonics-guide';
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('waits for metadata even when the complete article is already visible', () => {
    const head = document.head.innerHTML;
    document.head.innerHTML = '<title>Tiny Steps Learning</title>';
    expect(readPrerenderReadiness(contract)).toBe(false);
    document.head.innerHTML = head;
    expect(readPrerenderReadiness(contract)).toBe(true);
  });

  it.each(['robots', 'googlebot', 'bingbot'])('rejects a stale noindex directive on %s', (name) => {
    document.querySelector(`meta[name="${name}"]`).setAttribute('content', 'noindex, nofollow');
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('also treats the none directive as noindex', () => {
    document.querySelector('meta[name="robots"]').setAttribute('content', 'none');
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('preserves intentionally noindexed pages instead of forcing everything to index', () => {
    readyArticle({ noindex: true });
    expect(readPrerenderReadiness({ ...contract, expectedNoindex: true })).toBe(true);
    expect(document.querySelector('meta[name="robots"]').content).toBe('noindex, follow');
  });

  it.each(['', '   '])('rejects an empty description (%j)', (value) => {
    document.querySelector('meta[name="description"]').content = value;
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects a stale nonempty title even with the correct article and canonical', () => {
    document.title = 'SATPIN Phonics Guide | Tiny Steps Blog';
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects a stale nonempty description even with the correct article and canonical', () => {
    document.querySelector('meta[name="description"]').content = 'An unrelated guide about vowel sounds.';
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects a missing description identity in otherwise matching schema', () => {
    const script = document.querySelector('script');
    const schema = JSON.parse(script.textContent);
    delete schema.description;
    script.textContent = JSON.stringify(schema);
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects duplicate title elements', () => {
    document.head.append(document.querySelector('title').cloneNode(true));
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects duplicate canonical tags', () => {
    document.head.append(document.querySelector('link[rel="canonical"]').cloneNode());
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects a schema belonging to another article', () => {
    document.querySelector('script').textContent = JSON.stringify({ '@type': 'BlogPosting', url: canonicalUrl + '-wrong', headline: title });
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects a schema headline that does not match the visible document', () => {
    document.querySelector('h1').textContent = 'A different page';
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('waits for valid JSON-LD and supports graph-based schema', () => {
    const article = JSON.parse(document.querySelector('script').textContent);
    document.querySelector('script').textContent = '{invalid';
    expect(readPrerenderReadiness(contract)).toBe(false);
    document.querySelector('script').textContent = JSON.stringify({ '@graph': [article] });
    expect(readPrerenderReadiness(contract)).toBe(true);
  });

  it('does not mistake ordinary prose about loading for a loading placeholder', () => {
    document.querySelector('p').textContent += ' Allow the video to finish loading before playback.';
    expect(readPrerenderReadiness(contract)).toBe(true);
  });

  it('allows static educational pages without article markup but never their 404 fallback', () => {
    const staticContract = { requireArticle: false, checkArticleMetadata: false };
    document.getElementById('root').innerHTML = `<main><h1>Jolly Phonics explained</h1><p>${paragraph}</p></main>`;
    expect(readPrerenderReadiness(staticContract)).toBe(true);
    document.querySelector('h1').textContent = '404 - Page Not Found';
    expect(readPrerenderReadiness(staticContract)).toBe(false);
  });

  it('runs the native browser function after serialization without module closures', () => {
    // Playwright receives native ESM, not Vitest's transformed/coverage wrapper.
    const source = fs.readFileSync(path.join(process.cwd(), 'scripts/prerender-readiness.mjs'), 'utf8');
    const start = source.indexOf('export function readPrerenderReadiness');
    const end = source.indexOf('\n/** Always render', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const nativeFunction = source.slice(start + 'export '.length, end).trim();
    const browserFunction = new Function(`return (${nativeFunction})`)();
    expect(browserFunction(contract)).toBe(true);
    document.querySelector('h1').textContent = '404 - Page Not Found';
    expect(browserFunction(contract)).toBe(false);
  });
});

describe('capture retries invalid documents without writing them', () => {
  function fakePage() {
    return {
      goto: vi.fn().mockResolvedValue({ ok: () => true, status: () => 200 }),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue({ ready: true, problems: [] }),
      content: vi.fn().mockResolvedValue('<html>' + paragraph.repeat(3) + '</html>'),
    };
  }

  it('retries from a clean navigation and captures only the valid retry', async () => {
    const page = fakePage();
    page.waitForFunction.mockRejectedValueOnce(new Error('article readiness timeout'));
    const html = await captureReadyRoute(page, 'http://127.0.0.1:4173/blog/speaking-video-feedback', contract, { retryDelay: 0 });
    expect(html).toContain('<html>');
    expect(page.waitForFunction).toHaveBeenCalledTimes(2);
    expect(page.goto.mock.calls[1][0]).toBe('about:blank');
    expect(page.content).toHaveBeenCalledTimes(1);
  });

  it('fails closed when both attempts remain invalid instead of accepting headings', async () => {
    const page = fakePage();
    page.waitForFunction.mockRejectedValue(new Error('article readiness timeout'));
    page.evaluate.mockResolvedValue({ ready: false, problems: ['router rendered an error or not-found page'] });
    await expect(captureReadyRoute(page, canonicalUrl, contract, { retryDelay: 0 })).rejects.toThrow('not-found page');
    expect(page.waitForFunction).toHaveBeenCalledTimes(2);
    expect(page.content).not.toHaveBeenCalled();
  });

  it('rechecks readiness immediately before serialization', async () => {
    const page = fakePage();
    page.evaluate.mockResolvedValue({ ready: false, problems: ['metadata changed'] });
    await expect(captureReadyRoute(page, canonicalUrl, contract, { maxRetries: 1 })).rejects.toThrow('metadata changed');
    expect(page.content).not.toHaveBeenCalled();
  });

  it('rejects an unsuccessful HTTP navigation before accepting any markup', async () => {
    const page = fakePage();
    page.goto.mockResolvedValue({ ok: () => false, status: () => 500 });
    await expect(captureReadyRoute(page, canonicalUrl, contract, { maxRetries: 1 })).rejects.toThrow('HTTP 500');
    expect(page.waitForFunction).not.toHaveBeenCalled();
    expect(page.content).not.toHaveBeenCalled();
  });
});

describe('prerender input/output isolation', () => {
  it('serves the original shell only for main-document navigation, not assets or frames', async () => {
    const frame = {};
    const page = { route: vi.fn(), mainFrame: () => frame };
    const shell = '<html><body><div id="root"></div><script type="module" src="/assets/app.js"></script></body></html>';
    await installPrerenderShell(page, 'http://127.0.0.1:4173', shell);
    expect(page.route.mock.calls[0][0]).toBe('http://127.0.0.1:4173/**');
    const handler = page.route.mock.calls[0][1];
    for (const [isNavigation, type, requestFrame, expected] of [
      [true, 'document', frame, true],
      [false, 'script', frame, false],
      [true, 'document', {}, false],
    ]) {
      const route = {
        request: () => ({ isNavigationRequest: () => isNavigation, resourceType: () => type, frame: () => requestFrame }),
        fulfill: vi.fn().mockResolvedValue(undefined),
        continue: vi.fn().mockResolvedValue(undefined),
      };
      await handler(route);
      if (expected) expect(route.fulfill).toHaveBeenCalledWith({ status: 200, contentType: 'text/html; charset=utf-8', body: shell });
      else expect(route.continue).toHaveBeenCalledOnce();
    }
  });

  it('connects strict capture before writes and removes the timed-out-markup fallback', () => {
    const driver = fs.readFileSync(path.join(process.cwd(), 'scripts/prerender.mjs'), 'utf8');
    expect(driver).toContain('await installPrerenderShell(page, HOST, originalShell)');
    expect(driver).toContain('const html = await captureReadyRoute(page, url, contract, { maxRetries });\n  await writeRouteHtml(route, html);');
    expect(driver).not.toContain('hasMeaningfulMarkup');
    expect(driver).not.toContain('Falling back to HTML-structure readiness');
    expect(driver).toContain('expectedNoindex: shouldNoindexBlogSlug');
  });
});
