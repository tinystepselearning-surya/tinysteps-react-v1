import fs from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { readPrerenderReadiness } from '../prerender-readiness.mjs';

const articleUrl = 'https://tinystepslearning.com/blog/phonics-for-parents-guide';
const articleTitle = 'Phonics for Parents: What It Is, How It Works, and How to Support Reading at Home';
const articleContract = { canonicalUrl: articleUrl, requireArticle: true, checkArticleMetadata: true, expectedNoindex: false };
const gameContract = { canonicalUrl: 'https://tinystepslearning.com/seasonal/christmas-tree', requireArticle: false, checkArticleMetadata: false };

beforeEach(() => {
  document.head.innerHTML = '<title>Tiny Steps Learning</title>';
  document.body.innerHTML = '<div id="root"></div>';
});

function articlePage(mainEntityOfPage = { '@type': 'WebPage', '@id': articleUrl }, extra = {}) {
  document.head.innerHTML = `<title>${articleTitle} | Tiny Steps Blog</title>
    <link rel="canonical" href="${articleUrl}">
    <meta name="description" content="A parent guide to phonics and supporting reading at home.">
    <meta name="robots" content="index, follow">
    <script type="application/ld+json">${JSON.stringify({ '@type': 'BlogPosting', headline: articleTitle, mainEntityOfPage, ...extra })}</script>`;
  document.getElementById('root').innerHTML = `<article><h1>${articleTitle}</h1><p>${'Support the taught system and check transfer into fresh words. '.repeat(20)}</p></article>`;
}

function gamePage() {
  document.getElementById('root').innerHTML = `<div>
    <div>Christmas Tree Decorator</div>
    <div>Tap Start to enable music and touch controls.</div>
    <button>Start Game</button><button>Reset</button><button>Exit</button>
    <img src="/seasonal/christmas/tree.png" alt="Christmas tree">
    <img src="/seasonal/christmas/gamebg.jpeg" alt="Christmas background">
  </div>`;
}

describe('dedicated research article schema identity', () => {
  it('accepts the existing BlogPosting mainEntityOfPage object without fabricating a url field', () => {
    articlePage();
    expect(readPrerenderReadiness(articleContract)).toBe(true);
    expect(JSON.parse(document.querySelector('script').textContent)).not.toHaveProperty('url');
  });

  it('also accepts a mainEntityOfPage URL string', () => {
    articlePage(articleUrl);
    expect(readPrerenderReadiness(articleContract)).toBe(true);
  });

  it.each([undefined, { '@id': articleUrl + '-wrong' }, { '@type': 'WebPage' }])('rejects missing or wrong article identity: %j', (identity) => {
    articlePage(null, { mainEntityOfPage: identity });
    expect(readPrerenderReadiness(articleContract)).toBe(false);
  });

  it('does not use a correct mainEntityOfPage to hide an explicitly incorrect url', () => {
    articlePage({ '@id': articleUrl }, { url: articleUrl + '-wrong' });
    expect(readPrerenderReadiness(articleContract)).toBe(false);
  });

  it('does not accept a generic WebPage as a substitute for BlogPosting', () => {
    articlePage({ '@id': articleUrl }, { '@type': 'WebPage' });
    expect(readPrerenderReadiness(articleContract)).toBe(false);
  });

  it('tracks the actual dedicated research renderer rather than changing its SEO contract', () => {
    const source = fs.readFileSync(new URL('../../src/pages/blog/PhonicsForParentsResearchPage.tsx', import.meta.url), 'utf8');
    expect(source).toContain("'@type': 'BlogPosting'");
    expect(source).toContain('mainEntityOfPage: {');
    expect(source).toContain("'@id': ARTICLE_URL");
    expect(source).toContain('headline: post.title');
  });
});

describe('seasonal game has a specific start-screen contract, not a heading exemption', () => {
  it('accepts the complete existing start screen without headings or a long article', () => {
    gamePage();
    expect(document.querySelector('h1, h2')).toBeNull();
    expect(readPrerenderReadiness(gameContract)).toBe(true);
  });

  it.each(['button', 'img[alt="Christmas tree"]', 'img[alt="Christmas background"]'])('rejects an incomplete start screen missing %s', (selector) => {
    gamePage();
    document.querySelector(selector).remove();
    expect(readPrerenderReadiness(gameContract)).toBe(false);
  });

  it('rejects a generic large page even at the game URL', () => {
    document.getElementById('root').innerHTML = `<h1>Another page</h1><p>${'Unrelated content. '.repeat(200)}</p>`;
    expect(readPrerenderReadiness(gameContract)).toBe(false);
  });

  it('does not grant the start-screen exception to an unrelated route', () => {
    gamePage();
    expect(readPrerenderReadiness({ ...gameContract, canonicalUrl: 'https://tinystepslearning.com/another-game' })).toBe(false);
  });

  it('still rejects a 404 error document containing stale game markup', () => {
    gamePage();
    document.title = '404 - Page Not Found | Tiny Steps Learning';
    expect(readPrerenderReadiness(gameContract)).toBe(false);
  });

  it('does not change the existing robots policy while checking game readiness', () => {
    gamePage();
    document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex, follow">');
    expect(readPrerenderReadiness(gameContract)).toBe(true);
    expect(document.querySelector('meta[name="robots"]').content).toBe('noindex, follow');
  });
});
