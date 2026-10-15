import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PUBLIC_REDIRECT_MANIFEST, PUBLIC_ROUTE_MANIFEST } from '../../src/lib/publicRouteManifest.js';

const hosting = JSON.parse(fs.readFileSync(new URL('../../firebase.json', import.meta.url), 'utf8')).hosting;
const expectedAlias = '/free-games';
const canonicalHub = '/free-english-games-for-kids';
const liveChildGame = '/free-games/word-meaning-flashcards';

test('GSC hard-404 games alias redirects permanently to its canonical practice hub', () => {
  assert.deepEqual(
    hosting.redirects.filter(({ source }) => source === expectedAlias),
    [{ source: expectedAlias, destination: canonicalHub, type: 301 }],
  );
  assert.deepEqual(
    PUBLIC_REDIRECT_MANIFEST.filter(({ source }) => source === expectedAlias),
    [{ source: expectedAlias, destination: canonicalHub, status: 301 }],
  );
});

test('redirect does not take ownership of the live vocabulary game subroute', () => {
  assert.equal(hosting.redirects.some(({ source }) => source === liveChildGame), false);
  assert.equal(PUBLIC_REDIRECT_MANIFEST.some(({ source }) => source === liveChildGame), false);
  assert.equal(PUBLIC_ROUTE_MANIFEST.find(({ path }) => path === liveChildGame)?.indexable, true);
  assert.equal(PUBLIC_ROUTE_MANIFEST.find(({ path }) => path === canonicalHub)?.indexable, true);
});
