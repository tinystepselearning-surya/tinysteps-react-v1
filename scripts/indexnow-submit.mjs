#!/usr/bin/env node
import path from 'node:path';
import { loadCanonicalUrls, createPageState, changedUrls, validateState, STATE_VERSION } from './indexnow-change-detection.mjs';

const DEFAULT_HOST = 'tinystepslearning.com';
const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';
const STATE_BRANCH = 'ci/indexnow-submitted';
const STATE_FILE = 'indexnow-submitted-state.json';
const MAX_ATTEMPTS = 3;
const SUBMISSION_GAP_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateKey(key) {
  return /^[A-Za-z0-9-]{8,128}$/.test(key);
}

async function githubRequest(method, route, token, body, allow404 = false) {
  const response = await fetch('https://api.github.com' + route, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'TinySteps-IndexNow/2.0',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  if (allow404 && response.status === 404) return null;
  if (!response.ok) {
    throw new Error('GitHub IndexNow state request failed (' + response.status + '): ' +
      (await response.text()).slice(0, 350));
  }
  return response.json();
}

async function readSubmittedState(repo, token, host) {
  const root = '/repos/' + repo;
  const ref = await githubRequest('GET', root + '/git/ref/heads/' + STATE_BRANCH, token, null, true);
  if (!ref) return { exists: false, sha: null, state: null };
  const file = await githubRequest('GET', root + '/contents/' + STATE_FILE +
    '?ref=' + encodeURIComponent(STATE_BRANCH), token, null, true);
  if (!file) return { exists: true, sha: null, state: null };
  if (file.encoding !== 'base64' || typeof file.content !== 'string') {
    throw new Error('IndexNow state must be a base64-encoded GitHub file.');
  }
  const parsed = JSON.parse(Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8'));
  return { exists: true, sha: file.sha, state: validateState(parsed, host) };
}

async function saveSubmittedState(repo, token, baseSha, prior, state) {
  const root = '/repos/' + repo;
  if (!prior.exists) {
    if (!/^[a-f0-9]{40}$/.test(baseSha)) throw new Error('GITHUB_SHA is required to bootstrap IndexNow state.');
    await githubRequest('POST', root + '/git/refs', token, {
      ref: 'refs/heads/' + STATE_BRANCH,
      sha: baseSha,
    });
  }
  await githubRequest('PUT', root + '/contents/' + STATE_FILE, token, {
    message: 'chore(indexnow): record successfully notified canonical URLs',
    content: Buffer.from(JSON.stringify(state, null, 2) + '\n').toString('base64'),
    branch: STATE_BRANCH,
    ...(prior.sha ? { sha: prior.sha } : {}),
  });
}

function retryDelay(response, attempt) {
  const retryAfter = response?.headers?.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    const millis = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(millis) && millis > 0) return Math.min(millis, 120000);
  }
  return Math.min(1000 * 2 ** (attempt - 1), 10000);
}

async function notifyOne({ endpoint, key, keyLocation, url }) {
  const requestUrl = new URL(endpoint);
  requestUrl.searchParams.set('url', url);
  requestUrl.searchParams.set('key', key);
  requestUrl.searchParams.set('keyLocation', keyLocation);
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response;
    try {
      response = await fetch(requestUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'TinySteps-IndexNow/2.0' },
        signal: AbortSignal.timeout(20000),
      });
      if (response.status === 200 || response.status === 202) return response.status;
      lastError = new Error('IndexNow rejected a URL with HTTP ' + response.status +
        ': ' + (await response.text()).slice(0, 300));
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    if (attempt < MAX_ATTEMPTS) await sleep(retryDelay(response, attempt));
  }
  throw lastError || new Error('Unknown IndexNow submission failure.');
}

async function main() {
  const key = (process.env.INDEXNOW_KEY || '').trim();
  if (!key) {
    console.log('INDEXNOW_KEY not set; skipping IndexNow submission.');
    return;
  }
  if (!validateKey(key)) throw new Error('INDEXNOW_KEY format is invalid.');
  const host = (process.env.INDEXNOW_HOST || DEFAULT_HOST).trim().toLowerCase();
  const keyLocation = (process.env.INDEXNOW_KEY_LOCATION || 'https://' + host + '/' + key + '.txt').trim();
  if (new URL(keyLocation).hostname.toLowerCase() !== host || new URL(keyLocation).protocol !== 'https:') {
    throw new Error('INDEXNOW_KEY_LOCATION must be HTTPS on the submitted host.');
  }

  const token = process.env.GITHUB_TOKEN || '';
  const repo = process.env.GITHUB_REPOSITORY || '';
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required for durable incremental IndexNow state.');
  }

  const distDir = path.resolve(process.cwd(), process.env.INDEXNOW_DIST || 'dist');
  const sitemapPath = path.resolve(process.cwd(), process.env.INDEXNOW_SITEMAP || 'dist/sitemap.xml');
  const urls = await loadCanonicalUrls(sitemapPath, distDir, host);
  if (!urls.length) throw new Error('No canonical URLs found: refusing to overwrite the IndexNow baseline.');
  const { pages, missing } = await createPageState(urls, distDir);
  if (missing.length) {
    console.warn('IndexNow: ' + missing.length +
      ' sitemap URL(s) lack local prerendered HTML; new/deleted URL detection remains active.');
  }

  const next = { version: STATE_VERSION, host, pages };
  const prior = await readSubmittedState(repo, token, host);
  if (!prior.state) {
    // Existing production already submitted its full sitemap. A one-time baseline
    // avoids reporting every old URL as changed when this implementation is enabled.
    await saveSubmittedState(repo, token, process.env.GITHUB_SHA || '', prior, next);
    console.log('IndexNow incremental baseline established for ' + urls.length +
      ' canonical URLs. No historical bulk submission made.');
    return;
  }

  const changed = changedUrls(prior.state, next);
  if (!changed.length) {
    console.log('IndexNow: no changed canonical URLs; no requests sent.');
    return;
  }
  const endpoint = (process.env.INDEXNOW_ENDPOINT || DEFAULT_ENDPOINT).trim();
  if (new URL(endpoint).protocol !== 'https:') throw new Error('INDEXNOW_ENDPOINT must use HTTPS.');
  console.log('IndexNow: notifying ' + changed.length + ' changed/new/deleted URL(s), individually.');
  for (const [index, url] of changed.entries()) {
    const status = await notifyOne({ endpoint, key, keyLocation, url });
    console.log('IndexNow accepted notification ' + (index + 1) + '/' + changed.length +
      ' with HTTP ' + status + '.');
    if (index < changed.length - 1) await sleep(SUBMISSION_GAP_MS);
  }
  // Only advance the durable baseline after every notification is accepted.
  // An interrupted run will retry on the next run or job rerun.
  await saveSubmittedState(repo, token, process.env.GITHUB_SHA || '', prior, next);
  console.log('IndexNow: ' + changed.length + ' notification(s) accepted and state saved.');
}

main().catch((error) => {
  console.error('IndexNow submission failed: ' + error.message);
  process.exit(1);
});
