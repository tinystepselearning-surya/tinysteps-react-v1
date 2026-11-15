import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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


test('CLI uses isolated git state, skips unchanged pages, retries failures and reports removal', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ts-indexnow-git-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const bare = path.join(root, 'remote.git');
  const work = path.join(root, 'work');
  await fs.mkdir(work);

  const git = (args, cwd = work) => {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    return result.stdout.trim();
  };
  git(['init', '--bare', bare], root);
  git(['init', '-b', 'main'], work);
  git(['config', 'user.email', 'ci@example.invalid']);
  git(['config', 'user.name', 'Test CI']);
  git(['remote', 'add', 'origin', bare]);
  await fs.writeFile(path.join(work, 'README.md'), 'simulated checkout\n');
  await fs.writeFile(path.join(work, '.gitignore'), 'dist/\n');
  git(['add', 'README.md', '.gitignore']);
  git(['commit', '-m', 'test baseline']);
  git(['push', '-u', 'origin', 'main']);
  const sha = git(['rev-parse', 'HEAD']);

  const dist = path.join(work, 'dist');
  await fs.mkdir(path.join(dist, 'phonics'), { recursive: true });
  await fs.writeFile(path.join(dist, 'index.html'), html({ title: 'Home' }));
  await fs.writeFile(path.join(dist, 'phonics', 'index.html'), html());
  const sitemap = async (locations) => fs.writeFile(path.join(dist, 'sitemap.xml'),
    '<urlset>' + locations.map((location) => '<url><loc>' + ROOT + location + '</loc></url>').join('') + '</urlset>');
  await sitemap(['/', '/phonics']);
  const requestsFile = path.join(root, 'requests.txt');
  const preload = path.join(root, 'preload.mjs');
  await fs.writeFile(preload, [
    "import fs from 'node:fs/promises';",
    "globalThis.fetch = async (url) => {",
    "  const address = String(url);",
    "  if (!address.startsWith('https://api.indexnow.org/')) throw new Error('Unexpected fetch: ' + address);",
    "  await fs.appendFile(process.env.MOCK_REQUESTS_FILE, new URL(address).searchParams.get('url') + '\\n');",
    "  return new Response('{}', {status: process.env.MOCK_INDEXNOW_FAIL === '1' ? 400 : 200});",
    "};",
  ].join('\n') + '\n');

  function run({ fail = false } = {}) {
    const result = spawnSync(process.execPath, [
      '--import', preload, path.resolve('scripts/indexnow-submit.mjs'),
    ], {
      cwd: work,
      encoding: 'utf8',
      timeout: 30000,
      env: {
        ...process.env,
        INDEXNOW_KEY: 'TEST-KEY-1234',
        GITHUB_SHA: sha,
        INDEXNOW_DIST: dist,
        INDEXNOW_SITEMAP: path.join(dist, 'sitemap.xml'),
        MOCK_REQUESTS_FILE: requestsFile,
        MOCK_INDEXNOW_FAIL: fail ? '1' : '0',
      },
    });
    assert.equal(result.signal, null, result.stderr || 'CLI was terminated');
    return result;
  }
  const storedState = () => JSON.parse(git(['--git-dir=' + bare, 'show',
    'refs/heads/ci/indexnow-submitted:indexnow-submitted-state.json'], root));
  const requests = async () => (await fs.readFile(requestsFile, 'utf8'))
    .trim().split('\n').filter(Boolean);

  await fs.writeFile(requestsFile, '');
  let result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /baseline established/);
  assert.deepEqual(await requests(), []);
  const initial = storedState();
  assert.equal(Object.keys(initial.pages).length, 2);
  assert.equal(git(['rev-parse', 'HEAD']), sha, 'Current working branch must remain untouched');

  result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no changed canonical URLs/);
  assert.deepEqual(await requests(), []);

  await fs.writeFile(path.join(dist, 'phonics', 'index.html'), html({ text: 'New blending guide' }));
  result = run({ fail: true });
  assert.equal(result.status, 1);
  assert.deepEqual(await requests(), [ROOT + '/phonics']);
  assert.deepEqual(storedState(), initial, 'Failure cannot advance submitted state');

  await fs.writeFile(requestsFile, '');
  result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await requests(), [ROOT + '/phonics']);
  assert.notDeepEqual(storedState(), initial);

  await sitemap(['/']);
  await fs.writeFile(requestsFile, '');
  result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await requests(), [ROOT + '/phonics'], 'Removed URL is notified');

  await fs.writeFile(requestsFile, '');
  result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await requests(), [], 'Accepted notifications are not resent');

  assert.equal(git(['rev-parse', 'HEAD']), sha);
  assert.equal(git(['status', '--porcelain']), '', 'Git state writes do not touch source checkout');
});
