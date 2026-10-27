import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hosting = JSON.parse(fs.readFileSync(new URL('../../firebase.json', import.meta.url), 'utf8')).hosting;
const pattern = '^/group-(?:phonics|grammar|public-speaking)-classes-for-kids/?$';

test('GSC group-class hotfix: all and only the three published extensionless pages revalidate', () => {
  const matching = hosting.headers.filter(rule => rule.regex === pattern);
  assert.equal(matching.length, 1, 'one narrow group-class HTML cache rule');
  const regex = new RegExp(pattern);
  for (const type of ['phonics', 'grammar', 'public-speaking']) {
    assert.equal(regex.test('/group-' + type + '-classes-for-kids'), true);
    assert.equal(regex.test('/group-' + type + '-classes-for-kids/'), true);
  }
  for (const url of [
    '/', '/courses', '/pricing', '/phonics', '/grammar', '/speaking',
    '/group-reading-classes-for-kids', '/group-phonics-classes-for-kids/extra',
    '/blog/phonics-summer-plan', '/parent', '/teacher', '/admin',
    '/assets/GroupPublicSpeakingClassesPage-abc123.js',
  ]) assert.equal(regex.test(url), false, 'unexpected group cache coverage: ' + url);
  const value = matching[0].headers.find(header => header.key.toLowerCase() === 'cache-control')?.value ?? '';
  assert.match(value, /no-cache/);
  assert.match(value, /max-age=0/);
  assert.match(value, /must-revalidate/);
});

test('GSC group-class hotfix: JS/CSS asset caching and protected noindex policies remain untouched', () => {
  const find = source => hosting.headers.find(rule => rule.source === source);
  assert.match(find('/assets/**')?.headers.find(item => item.key === 'Cache-Control')?.value ?? '', /immutable/);
  for (const source of ['/parent', '/teacher', '/surya/**']) {
    assert.match(find(source)?.headers.find(item => item.key === 'X-Robots-Tag')?.value ?? '', /noindex/);
  }
});
