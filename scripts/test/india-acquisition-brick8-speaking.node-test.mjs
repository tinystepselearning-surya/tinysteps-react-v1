import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('Public Speaking owns classes and communication; spoken English remains distinct', () => {
  const owner = read('src/lib/commercialC2KeywordOwnership.ts');
  const routes = read('src/lib/publicRouteManifest.js');
  const speaking = read('src/pages/speaking.tsx');
  for (const path of ['/speaking', '/spoken-english-classes-for-kids-online', '/group-public-speaking-classes-for-kids']) {
    assert.ok(routes.includes("route('" + path + "', 'static')"), path + ' should remain a public static route');
  }
  assert.match(owner, /id: 'public-speaking-provider'.*canonicalOwnerPath: '\/speaking'/);
  assert.match(owner, /id: 'spoken-english-provider'.*canonicalOwnerPath: '\/spoken-english-classes-for-kids-online'/);
  assert.match(owner, /id: 'communication-provider'.*canonicalOwnerPath: '\/speaking'/);
  assert.match(speaking, /const canonicalPath = '\/speaking'/);
  assert.match(speaking, /const seoTitle = 'Online Public Speaking Classes for Kids \| Live 1:1 \| Tiny Steps'/);
  assert.match(speaking, /to="\/group-public-speaking-classes-for-kids"/);
  assert.match(speaking, /to="\/book-demo"/);
});

test('Public Speaking parent FAQ discloses true group conditions and standard one-to-one', () => {
  const speaking = read('src/pages/speaking.tsx');
  const group = read('src/pages/public/GroupClassPage.tsx');
  assert.match(speaking, /Are Tiny Steps public speaking classes available as live 1:1 or small groups\?/);
  assert.match(speaking, /Standard live 1:1 Public Speaking classes run for \$\{PUBLIC_SESSION_DURATION_LABEL\}/);
  assert.match(speaking, /up to four children per teacher/);
  assert.match(speaking, /matched by communication needs and compatible schedules/);
  assert.match(speaking, /group demos and places depend on a suitable batch forming and are not immediately guaranteed/);
  assert.match(group, /group classes have a maximum of four children per teacher/);
  assert.match(group, /New groups are formed when children with compatible learning levels and schedules are available/);
  assert.match(speaking, /createFAQPageSchema\(faqItems\)/);
});

test('Public Speaking differentiates Spoken English, progress evidence and priced assessment', () => {
  const speaking = read('src/pages/speaking.tsx');
  assert.match(speaking, /What is the difference between spoken English and public speaking classes\?/);
  assert.match(speaking, /dedicated Spoken English programme is the stronger first fit/);
  assert.match(speaking, /SPEAKING_PROGRESS_FRAMEWORK_PATH/);
  assert.match(speaking, /to="\/class-samples"/);
  assert.match(speaking, /to="\/pricing"/);
  assert.match(speaking, /speakingClassPriceLabel/);
});
