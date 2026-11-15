import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  STATE_VERSION,
  loadCanonicalUrls,
  createPageState,
  fingerprintHtml,
  changedUrls,
  validateState,
} from '../indexnow-change-detection.mjs';

const HOST = 'tinystepslearning.com';
const ROOT = 'https://' + HOST;

function html({ title = 'Phonics', description = 'Read with us', text = 'Learn phonics', className = 'a', bundle = 'first' } = {}) {
  return '<!doctype html><html><head><title>' + title +
    '</title><meta name="description" content="' + description +
    '"><link rel="canonical" href="' + ROOT + '/phonics">' +
    '<script src="/assets/' + bundle + '.js"></script></head><body>' +
    '<header>Common site header</header><main class="' + className + '">' +
    '<h1>' + text + '</h1><a href="/courses">Courses</a>' +
    '<svg><path d="M 1 2"/></svg></main><footer>Footer</footer></body></html>';
}

test('content and SEO metadata changes affect fingerprints; cosmetic changes do not', () => {
  assert.equal(fingerprintHtml(html()), fingerprintHtml(html({ className: 'b', bundle: 'second' })));
  assert.notEqual(fingerprintHtml(html()), fingerprintHtml(html({ text: 'Learn to blend sounds' })));
  assert.notEqual(fingerprintHtml(html()), fingerprintHtml(html({ title: 'Reading' })));
  assert.notEqual(fingerprintHtml(html()), fingerprintHtml(html({ description: 'Different description' })));
  assert.notEqual(fingerprintHtml(html()), fingerprintHtml().replace(/./, 'a'));
});

test('new, modified, deleted URLs are notified; unchanged/missing prerenders are not', () => {
  const a = ROOT + '/a', b = ROOT + '/b', c = ROOT + '/c', d = ROOT + '/d';
  const previous = { pages: { [a]: 'same', [b]: 'old', [c]: null, [d]: 'removed' } };
  const next = { pages: { [a]: 'same', [b]: 'new', [c]: null, [ROOT + '/e']: 'added' } };
  assert.deepEqual(changedUrls(previous, next), [b, d, ROOT + '/e']);
  assert.deepEqual(changedUrls(next, next), []);
});

test('reads nested sitemaps, deduplicates canonical URLs and rejects external hosts', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ts-indexnow-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.writeFile(path.join(dir, 'sitemap.xml'),
    '<sitemapindex><sitemap><loc>' + ROOT + '/sitemap-public.xml</loc></sitemap></sitemapindex>');
  await fs.writeFile(path.join(dir, 'sitemap-public.xml'),
    '<urlset><url><loc>' + ROOT + '/</loc></url>' +
    '<url><loc>' + ROOT + '/phonics</loc></url>' +
    '<url><loc>' + ROOT + '/phonics</loc></url>' +
    '<url><loc>https://evil.example/phonics</loc></url>' +
    '<url><loc>http://' + HOST + '/not-canonical</loc></url></urlset>');
  assert.deepEqual(await loadCanonicalUrls(path.join(dir, 'sitemap.xml'), dir, HOST),
    [ROOT + '/', ROOT + '/phonics']);
});

test('tracks missing prerenders without submitting them repeatedly', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ts-indexnow-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.writeFile(path.join(dir, 'index.html'), html({ title: 'Home' }));
  const { pages, missing } = await createPageState([ROOT + '/', ROOT + '/missing'], dir);
  assert.equal(pages[ROOT + '/'], fingerprintHtml(html({ title: 'Home' })));
  assert.equal(pages[ROOT + '/missing'], null);
  assert.deepEqual(missing, [ROOT + '/missing']);
});

test('validated state is versioned and bound to the canonical hostname', () => {
  const good = { version: STATE_VERSION, host: HOST, pages: { [ROOT + '/']: 'a'.repeat(64) } };
  assert.equal(validateState(good, HOST), good);
  assert.throws(() => validateState({ ...good, host: 'other.example' }, HOST));
  assert.throws(() => validateState({ ...good, version: -1 }, HOST));
  assert.throws(() => validateState({ ...good, pages: { 'https://other.example/': 'b'.repeat(64) } }, HOST));
  assert.throws(() => validateState({ ...good, pages: { [ROOT + '/']: 'bad' } }, HOST));
});
