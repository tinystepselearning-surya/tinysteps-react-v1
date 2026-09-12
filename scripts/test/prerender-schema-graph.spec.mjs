import { beforeEach, describe, expect, it } from 'vitest';
import { applySeo } from '../../src/lib/seo';
import { readPrerenderReadiness } from '../prerender-readiness.mjs';

const route = '/blog/phonics-for-parents-guide';
const canonicalUrl = 'https://tinystepslearning.com' + route;
const title = 'Phonics for Parents: How to Support Reading at Home';
const contract = { canonicalUrl, requireArticle: true, checkArticleMetadata: true, expectedNoindex: false };

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '<div id="root"><article><h1></h1><p></p></article></div>';
  document.querySelector('h1').textContent = title;
  document.querySelector('p').textContent = 'Help children apply taught sounds to fresh words and connected reading. '.repeat(20);
  // Use the real SEO writer, including its canonical WebPage graph normalization.
  applySeo({
    title: title + ' | Tiny Steps Blog',
    description: 'Practical guidance for supporting a child with phonics and reading at home.',
    canonicalPath: route,
    robots: 'index, follow',
    ogType: 'article',
    jsonLd: {
      '@type': 'BlogPosting',
      headline: title,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    },
  });
});

function editGraph(edit) {
  const script = document.getElementById('ts-jsonld');
  const graph = JSON.parse(script.textContent);
  const article = graph.find((node) => node['@type'] === 'BlogPosting');
  const webpage = graph.find((node) => node['@id'] === canonicalUrl + '#webpage');
  edit({ graph, article, webpage });
  script.textContent = JSON.stringify(graph);
}

describe('prerender checks the rendered SEO graph, not only the input object', () => {
  it('accepts the real article-to-WebPage identity produced by applySeo', () => {
    editGraph(({ article, webpage }) => {
      expect(article).not.toHaveProperty('url');
      expect(article.mainEntityOfPage).toEqual({ '@id': canonicalUrl + '#webpage' });
      expect(webpage.url).toBe(canonicalUrl);
    });
    expect(readPrerenderReadiness(contract)).toBe(true);
  });

  it('resolves the same identity inside an explicit @graph container', () => {
    const script = document.getElementById('ts-jsonld');
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': JSON.parse(script.textContent) });
    expect(readPrerenderReadiness(contract)).toBe(true);
  });

  it('rejects a fragment reference with no corresponding WebPage node', () => {
    editGraph(({ graph, webpage }) => graph.splice(graph.indexOf(webpage), 1));
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects a WebPage graph node whose actual url belongs to another article', () => {
    editGraph(({ webpage }) => { webpage.url = canonicalUrl + '-wrong'; });
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects an unrelated entity type even with the expected fragment id and url', () => {
    editGraph(({ webpage }) => { webpage['@type'] = 'Organization'; });
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects an explicit wrong article url despite a valid WebPage reference', () => {
    editGraph(({ article }) => { article.url = canonicalUrl + '-wrong'; });
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('still requires a matching visible headline after graph identity resolves', () => {
    document.querySelector('h1').textContent = 'An unrelated article';
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('still rejects noindex metadata after graph identity resolves', () => {
    document.querySelector('meta[name="robots"]').content = 'noindex, nofollow';
    expect(readPrerenderReadiness(contract)).toBe(false);
  });
});
