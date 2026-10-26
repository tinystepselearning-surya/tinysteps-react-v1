#!/usr/bin/env node
/**
 * Generated AI directory is a CANONICAL-OWNER inventory, not a redirect
 * inventory. Run AFTER "node scripts/generate-rss.mjs" in CI.
 *
 * This test checks source-index consistency; it cannot establish whether
 * Google/Bing have actually indexed a page.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { PUBLIC_REDIRECT_MANIFEST, PUBLIC_ROUTE_MANIFEST } from '../../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../../src/lib/routeSeoRegistry.js';
import { PHONICS_AGE_PROGRAMME_PATHS } from '../../src/lib/phonicsAgeProgrammeRegistry.js';

const NEW_GROUP_COMMERCIAL_PATHS = [
  '/group-phonics-classes-for-kids',
  '/group-grammar-classes-for-kids',
  '/group-public-speaking-classes-for-kids',
];

const root = path.resolve(process.cwd());
const index = JSON.parse(fs.readFileSync(path.join(root, 'public/ai-resource-index.json'), 'utf8'));
const routes = index.corpus?.additional_public_routes || [];
const byPath = new Map(routes.map((item) => [new URL(item.canonical_url).pathname, item]));
const manifestByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((item) => [item.path, item]));

test('canonical directory size and route ownership stay non-duplicated', () => {
  assert.equal(routes.length, 111 + PHONICS_AGE_PROGRAMME_PATHS.length + NEW_GROUP_COMMERCIAL_PATHS.length, 'historical public-route corpus plus approved age and group programmes');
  assert.equal(index.corpus_counts?.connected_public_content, 279 + PHONICS_AGE_PROGRAMME_PATHS.length + NEW_GROUP_COMMERCIAL_PATHS.length, 'historical entire corpus plus approved new group programmes');
  for (const route of PHONICS_AGE_PROGRAMME_PATHS) assert.ok(byPath.has(route), 'published pilot canonical missing: ' + route);
  for (const route of NEW_GROUP_COMMERCIAL_PATHS) assert.ok(byPath.has(route), 'group-class canonical missing: ' + route);
  assert.equal(byPath.size, routes.length, 'one directory entry per canonical public URL');
  for (const alias of PUBLIC_REDIRECT_MANIFEST) {
    if (alias.source !== alias.destination) {
      assert.equal(byPath.has(alias.source), false, `redirect source must not own a directory record: ${alias.source}`);
    }
  }
});

test('legacy Speaking redirects cannot mark indexable canonical course owners noindex', () => {
  for (const [alias, canonical] of [
    ['/courses/basic-public-speaking', '/courses/public-speaking-foundations'],
    ['/courses/advanced-public-speaking', '/courses/public-speaking-excellence'],
  ]) {
    const canonicalRoute = byPath.get(canonical);
    const redirect = PUBLIC_REDIRECT_MANIFEST.find((item) => item.source === alias);
    assert.equal(redirect?.destination, canonical, 'redirect destination in route manifest');
    assert.ok(canonicalRoute, `missing canonical owner ${canonical}`);
    assert.equal(canonicalRoute.indexing_state, 'indexable', canonical);
    assert.equal(canonicalRoute.answer_eligible, true, canonical);
    assert.equal(canonicalRoute.retrieval_role, 'public-canonical', canonical);
    assert.match(canonicalRoute.title, /Public Speaking/, canonical);
    assert.equal(byPath.has(alias), false, 'legacy redirect must not appear as a separate owner');
  }
});

test('every declared canonical owner has matching index policy and answer eligibility', () => {
  let inspected = 0;
  for (const [canonicalPath, item] of byPath) {
    const manifest = manifestByPath.get(canonicalPath);
    const config = ROUTE_SEO_REGISTRY[canonicalPath];
    if (!manifest && !config) continue; // No source-level policy declared.
    const expected = manifest
      ? (manifest.indexable === false ? 'noindex' : 'indexable')
      : (/noindex/i.test(config.robots || '') ? 'noindex' : 'indexable');
    assert.equal(item.indexing_state, expected, `canonical policy mismatch ${canonicalPath}`);
    assert.equal(item.answer_eligible, expected === 'indexable', `answer eligibility mismatch ${canonicalPath}`);
    assert.equal(item.retrieval_role, expected === 'indexable' ? 'public-canonical' : 'supporting-only-noindex',
      `retrieval role mismatch ${canonicalPath}`);
    inspected += 1;
  }
  assert.ok(inspected >= 100, `too few canonical owners with explicit policies (${inspected})`);
});

test('intentional supporting and legal noindex canonical routes remain noindex', () => {
  for (const canonicalPath of [
    '/sitemap', '/privacy-policy', '/terms-and-conditions',
    '/refund-guarantee', '/seasonal/christmas-tree',
  ]) {
    const item = byPath.get(canonicalPath);
    assert.ok(item, `missing intentional noindex owner ${canonicalPath}`);
    assert.equal(item.indexing_state, 'noindex', canonicalPath);
    assert.equal(item.answer_eligible, false, canonicalPath);
    assert.equal(item.retrieval_role, 'supporting-only-noindex', canonicalPath);
  }
});
