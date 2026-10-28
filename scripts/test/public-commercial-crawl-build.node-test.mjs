// Run after build:deploy. Prevent correctly routed commercial pages from
// shipping as empty shells, wrong-owner canonicals or omitted sitemap URLs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const ORIGIN = 'https://tinystepslearning.com';
const DIST = path.resolve('dist');
const GROUP = new Map([
  ['/group-phonics-classes-for-kids', 'Live Online Group Phonics Classes for Kids'],
  ['/group-grammar-classes-for-kids', 'Small-Group Online Grammar Classes for Kids'],
  ['/group-public-speaking-classes-for-kids', 'Live Online Group Public Speaking Classes for Kids'],
]);
const CORE = new Map([
  ['/courses', 'Find the Right English Course for Your Child'],
  ['/pricing', 'Online English Classes for Kids: Fees & Pricing'],
  ['/phonics', 'Online Phonics Classes for Kids'],
  ['/grammar', 'Online Grammar Classes for Kids'],
  ['/speaking', 'Online Public Speaking Classes for Kids'],
  ['/reading-classes-for-kids', 'Online Reading Classes for Kids'],
]);
const read = (name) => readFile(path.join(DIST, name), 'utf8');
const xmlLocations = (xml) => [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
function schemaNodes(root) {
  if (!root || typeof root !== 'object') return [];
  if (Array.isArray(root)) return root.flatMap(schemaNodes);
  return [root, ...schemaNodes(root['@graph'])];
}
function contentText(doc) {
  return (doc.querySelector('#root main')?.textContent || '').replace(/\s+/g, ' ').trim();
}

test('commercial SEO contract: nine published owners are uniquely present in the sitemap index', async () => {
  const index = await read('sitemap.xml');
  const children = xmlLocations(index).map((url) => new URL(url).pathname.replace(/^\//, ''));
  assert.ok(children.includes('sitemap-static.xml'), 'static sitemap absent from index');
  const allLocations = (await Promise.all(children.map(async (file) => xmlLocations(await read(file))))).flat();
  for (const route of [...GROUP.keys(), ...CORE.keys()]) {
    const canonical = ORIGIN + route;
    assert.equal(allLocations.filter((url) => url === canonical).length, 1, route + ': sitemap omission or duplicate');
  }
});

test('commercial SEO contract: nine indexable HTML documents have the right canonical, H1 and real text', async () => {
  for (const [route, heading] of [...GROUP, ...CORE]) {
    const html = await read(path.join(route.slice(1), 'index.html'));
    const doc = new JSDOM(html).window.document;
    const canonical = ORIGIN + route;
    assert.equal(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'), canonical, route);
    assert.equal(doc.querySelectorAll('link[rel="canonical"]').length, 1, route + ': duplicated canonical');
    assert.match(doc.title, /Tiny Steps/i, route + ': document title missing brand');
    assert.ok((doc.querySelector('meta[name="description"]')?.getAttribute('content') || '').length >= 60, route);
    assert.doesNotMatch(doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '', /noindex/i, route);
    assert.equal(doc.querySelector('#root main h1')?.textContent?.replace(/\s+/g, ' ').trim(), heading, route);
    assert.ok(contentText(doc).length >= 600, route + ': prerendered commercial content too thin');
    assert.doesNotMatch(contentText(doc).slice(0, 250), /something went wrong|page not found/i, route);
  }
});

test('commercial SEO contract: group-class pages retain semantic breadcrumb and an enquiry link', async () => {
  for (const [route, heading] of GROUP) {
    const html = await read(path.join(route.slice(1), 'index.html'));
    const doc = new JSDOM(html).window.document;
    const main = doc.querySelector('main.group-commercial-page');
    assert.ok(main, route + ': group page wrapper missing');
    assert.equal(main.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim(), heading);
    assert.ok(main.querySelector('a[href*="/book-demo?format=small_group"]'), route + ': signup URL missing');
    const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')]
      .flatMap((element) => { try { return schemaNodes(JSON.parse(element.textContent || 'null')); } catch { return []; } });
    const breadcrumbs = schemas.filter((schema) => schema?.['@type'] === 'BreadcrumbList');
    assert.equal(breadcrumbs.length, 1, route + ': expected one valid BreadcrumbList schema');
    const items = breadcrumbs[0].itemListElement;
    assert.deepEqual(items.map((item) => item.position), [1, 2, 3], route);
    assert.deepEqual(items.map((item) => item.item),
      [ORIGIN + '/', ORIGIN + '/courses', ORIGIN + route], route);
    assert.ok(items.every((item) => typeof item.name === 'string' && item.name.trim()), route);
  }
});
