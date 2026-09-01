import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const guardSource = fs.readFileSync(
  path.resolve(process.cwd(), 'public/seo-indexability-guard.js'),
  'utf8',
);
const appShell = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');

const INDEX = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const NOINDEX = 'noindex, follow';

function createDom(url: string, robots = INDEX) {
  return new JSDOM(
    `<!doctype html><html><head>
      <meta name="robots" content="${robots}">
      <meta name="googlebot" content="${robots}">
      <meta name="bingbot" content="${robots}">
    </head><body></body></html>`,
    { url, runScripts: 'outside-only' },
  );
}

async function flushMutations(dom: JSDOM) {
  await new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0));
}

describe('production SEO indexability hydration guard', () => {
  it('is loaded by the shared application shell before React hydration', () => {
    expect(appShell).toContain('<script defer src="/seo-indexability-guard.js"></script>');
    expect(appShell.indexOf('/seo-indexability-guard.js')).toBeLessThan(
      appShell.indexOf('/src/main.tsx'),
    );
  });

  it('restores an indexable server policy after a transient noindex mutation', async () => {
    const dom = createDom('https://tinystepslearning.com/phonics-fees-india');
    dom.window.eval(guardSource);

    const robots = dom.window.document.head.querySelector('meta[name="robots"]')!;
    const googlebot = dom.window.document.head.querySelector('meta[name="googlebot"]')!;
    robots.setAttribute('content', 'noindex, nofollow');
    googlebot.setAttribute('content', 'noindex');

    const duplicate = dom.window.document.createElement('meta');
    duplicate.setAttribute('name', 'robots');
    duplicate.setAttribute('content', 'noindex');
    dom.window.document.head.appendChild(duplicate);

    await flushMutations(dom);

    for (const name of ['robots', 'googlebot', 'bingbot']) {
      const nodes = dom.window.document.head.querySelectorAll(`meta[name="${name}"]`);
      expect(nodes).toHaveLength(1);
      expect(nodes[0].getAttribute('content')).toBe(INDEX);
    }

    dom.window.close();
  });

  it('preserves an intentional server noindex policy instead of promoting it', async () => {
    const dom = createDom('https://tinystepslearning.com/terms-and-conditions', NOINDEX);
    dom.window.eval(guardSource);

    const robots = dom.window.document.head.querySelector('meta[name="robots"]')!;
    robots.setAttribute('content', INDEX);

    await flushMutations(dom);

    for (const name of ['robots', 'googlebot', 'bingbot']) {
      expect(
        dom.window.document.head.querySelector(`meta[name="${name}"]`)?.getAttribute('content'),
      ).toBe(NOINDEX);
    }

    dom.window.close();
  });

  it('does not interfere with localhost prerender or developer previews', async () => {
    const dom = createDom('http://127.0.0.1:4173/phonics-fees-india');
    dom.window.eval(guardSource);

    const robots = dom.window.document.head.querySelector('meta[name="robots"]')!;
    robots.setAttribute('content', 'noindex, nofollow');

    await flushMutations(dom);

    expect(robots.getAttribute('content')).toBe('noindex, nofollow');
    dom.window.close();
  });
});
