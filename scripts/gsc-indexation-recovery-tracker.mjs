#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ARTIFACTS_DIR = path.join(ROOT, 'artifacts');
const SNAPSHOT_DIR = path.join(ROOT, 'data', 'gsc-indexation-snapshots');
const BRICK6_REPORT = path.join(ARTIFACTS_DIR, 'gsc-revalidation-submission-report.json');
const SITE_ORIGIN = 'https://tinystepslearning.com';

const VALID_STATES = new Set([
  'indexed',
  'crawled-not-indexed',
  'discovered-not-indexed',
  'excluded-noindex',
  'redirect',
  'not-found',
  'soft-404',
  'blocked',
  'duplicate',
  'other',
  'unknown',
]);

const NON_INDEXED_STATES = new Set([
  'crawled-not-indexed',
  'discovered-not-indexed',
  'excluded-noindex',
  'redirect',
  'not-found',
  'soft-404',
  'blocked',
  'duplicate',
  'other',
]);

let failureCount = 0;

function fail(message) {
  failureCount += 1;
  console.error(`ERROR: ${message}`);
}

function normalizePathname(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value).trim(), SITE_ORIGIN);
    if (url.origin !== SITE_ORIGIN) return null;
    const pathname = url.pathname.replace(/\/{2,}/g, '/');
    return pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
  } catch {
    return null;
  }
}

function daysBetween(older, newer) {
  if (!older || !newer) return null;
  const ms = new Date(newer).getTime() - new Date(older).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor(ms / 86_400_000));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function loadBrick6Targets() {
  if (!(await fileExists(BRICK6_REPORT))) {
    throw new Error('Brick 6 report missing. Run scripts/gsc-revalidation-submission-plan.mjs first.');
  }

  const report = await readJson(BRICK6_REPORT);
  const requestNow = report.requestIndexingNow ?? [];
  const wait = report.waitForGoogleRecrawl ?? [];
  const blocked = report.blockedFromSubmission ?? [];

  if (blocked.length > 0) {
    fail(`Brick 6 currently has ${blocked.length} blocked target(s); Brick 7 cannot treat them as recovery-ready.`);
  }

  const targets = [
    ...requestNow.map((row) => ({ ...row, brick6Disposition: 'request-indexing-now' })),
    ...wait.map((row) => ({ ...row, brick6Disposition: 'wait-for-google-recrawl' })),
  ];

  const unique = new Map();
  for (const target of targets) {
    const pathname = normalizePathname(target.path || target.url);
    if (!pathname) {
      fail(`Brick 6 target has an invalid Tiny Steps URL/path: ${target.path || target.url}`);
      continue;
    }
    if (unique.has(pathname)) fail(`Brick 6 target is duplicated: ${pathname}`);
    unique.set(pathname, { ...target, path: pathname, url: `${SITE_ORIGIN}${pathname}` });
  }

  if (unique.size !== 23) {
    fail(`Brick 7 expects 23 Brick 6 recovery targets; found ${unique.size}.`);
  }

  return [...unique.values()];
}

function validateSnapshot(snapshot, fileName, targetPaths) {
  if (!snapshot || typeof snapshot !== 'object') {
    fail(`${fileName}: snapshot must be a JSON object.`);
    return null;
  }

  const observedAt = snapshot.observedAt;
  if (!observedAt || !Number.isFinite(new Date(observedAt).getTime())) {
    fail(`${fileName}: observedAt must be a valid ISO date/date-time.`);
  }

  const source = snapshot.source;
  if (!['gsc-url-inspection', 'gsc-page-indexing-export', 'manual-gsc-review'].includes(source)) {
    fail(`${fileName}: source must be gsc-url-inspection, gsc-page-indexing-export, or manual-gsc-review.`);
  }

  if (!Array.isArray(snapshot.urls)) {
    fail(`${fileName}: urls must be an array.`);
    return null;
  }

  const rows = new Map();
  for (const [index, row] of snapshot.urls.entries()) {
    const pathname = normalizePathname(row?.path || row?.url);
    if (!pathname) {
      fail(`${fileName}: urls[${index}] has an invalid Tiny Steps path/url.`);
      continue;
    }
    if (!targetPaths.has(pathname)) {
      fail(`${fileName}: ${pathname} is not one of the 23 Brick 6 recovery targets.`);
      continue;
    }
    if (rows.has(pathname)) {
      fail(`${fileName}: duplicate URL row for ${pathname}.`);
      continue;
    }

    const state = String(row.state || '').trim().toLowerCase();
    if (!VALID_STATES.has(state)) {
      fail(`${fileName}: ${pathname} has unsupported state "${row.state}".`);
    }

    const requestIndexingAt = row.requestIndexingAt ?? null;
    if (requestIndexingAt && !Number.isFinite(new Date(requestIndexingAt).getTime())) {
      fail(`${fileName}: ${pathname} has invalid requestIndexingAt.`);
    }

    rows.set(pathname, {
      path: pathname,
      state,
      coverageReason: row.coverageReason ?? null,
      requestIndexingAt,
      liveTestPassed: row.liveTestPassed ?? null,
      note: row.note ?? null,
    });
  }

  return {
    fileName,
    observedAt,
    source,
    note: snapshot.note ?? null,
    rows,
  };
}

async function loadSnapshots(targetPaths) {
  await fs.mkdir(SNAPSHOT_DIR, { recursive: true });
  const names = (await fs.readdir(SNAPSHOT_DIR))
    .filter((name) => name.endsWith('.json') && !name.startsWith('_'))
    .sort();

  const snapshots = [];
  for (const name of names) {
    const filePath = path.join(SNAPSHOT_DIR, name);
    const snapshot = validateSnapshot(await readJson(filePath), name, targetPaths);
    if (snapshot) snapshots.push(snapshot);
  }

  snapshots.sort((a, b) => new Date(a.observedAt) - new Date(b.observedAt));
  return snapshots;
}

function timelineForPath(pathname, snapshots) {
  const points = [];
  for (const snapshot of snapshots) {
    const row = snapshot.rows.get(pathname);
    if (!row) continue;
    points.push({
      observedAt: snapshot.observedAt,
      source: snapshot.source,
      ...row,
    });
  }
  return points;
}

function classifyMovement(points) {
  if (points.length === 0) return 'awaiting-first-gsc-observation';
  const latest = points.at(-1);
  const previous = points.length > 1 ? points.at(-2) : null;

  if (latest.state === 'indexed') {
    if (previous && previous.state !== 'indexed') return 'recovered-to-indexed';
    return 'indexed';
  }

  if (previous?.state === 'indexed' && latest.state !== 'indexed') return 'regressed-from-indexed';
  if (latest.state === 'unknown') return 'measurement-incomplete';
  if (NON_INDEXED_STATES.has(latest.state)) return 'still-not-indexed';
  return 'measurement-incomplete';
}

function nextAction(target, points) {
  if (points.length === 0) {
    return target.brick6Disposition === 'request-indexing-now'
      ? 'Inspect in GSC, Test live URL, request indexing if the live test is healthy, then record a snapshot.'
      : 'Record the next GSC observation; allow sitemap recrawl initially.';
  }

  const latest = points.at(-1);
  const movement = classifyMovement(points);
  if (movement === 'indexed' || movement === 'recovered-to-indexed') {
    return 'No indexing action. Keep the page stable and continue periodic observation.';
  }
  if (movement === 'regressed-from-indexed') {
    return 'Reinspect immediately in GSC and compare the reported exclusion reason with current site-side readiness.';
  }
  if (['excluded-noindex', 'blocked', 'redirect', 'not-found', 'soft-404'].includes(latest.state)) {
    return 'Investigate the specific GSC exclusion before any new request-indexing attempt.';
  }

  const daysSinceRequest = daysBetween(latest.requestIndexingAt, latest.observedAt);
  if (latest.requestIndexingAt && daysSinceRequest !== null && daysSinceRequest >= 14) {
    return 'Escalate for evidence-led review: compare GSC reason, canonical selection, internal discovery and page intent before changing content.';
  }
  if (latest.requestIndexingAt && daysSinceRequest !== null && daysSinceRequest >= 7) {
    return 'Reinspect in GSC; do not rewrite the page unless the new inspection gives a concrete failure reason.';
  }

  return target.brick6Disposition === 'request-indexing-now'
    ? 'Continue observation after the indexing request; record the next GSC state.'
    : 'Continue sitemap-recrawl observation; manually inspect only if the non-indexed state persists.';
}

function markdownReport(report) {
  const lines = [
    '# Brick 7 — GSC Indexation Recovery Tracking',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Recovery targets: ${report.counts.targets}`,
    `- Indexed: ${report.counts.indexed}`,
    `- Recovered to indexed: ${report.counts.recovered}`,
    `- Still not indexed: ${report.counts.stillNotIndexed}`,
    `- Regressed from indexed: ${report.counts.regressed}`,
    `- Awaiting first GSC observation: ${report.counts.awaitingObservation}`,
    `- Snapshot files: ${report.counts.snapshots}`,
    '',
    '## URL status',
    '',
    '| URL | Brick 6 lane | Latest GSC state | Movement | Next action |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (const row of report.targets) {
    lines.push(`| ${row.path} | ${row.brick6Disposition} | ${row.latestState} | ${row.movement} | ${row.nextAction.replace(/\|/g, '\\|')} |`);
  }

  lines.push('', '## Measurement rule', '', 'Brick 7 never infers Google indexation from site-side readiness. A URL is counted as indexed only when a recorded GSC observation explicitly says `indexed`.', '');
  return lines.join('\n');
}

async function main() {
  const targets = await loadBrick6Targets();
  const targetPaths = new Set(targets.map((target) => target.path));
  const snapshots = await loadSnapshots(targetPaths);

  const rows = targets.map((target) => {
    const timeline = timelineForPath(target.path, snapshots);
    const latest = timeline.at(-1) ?? null;
    const movement = classifyMovement(timeline);
    return {
      path: target.path,
      url: target.url,
      brick6Disposition: target.brick6Disposition,
      latestState: latest?.state ?? 'unmeasured',
      latestObservedAt: latest?.observedAt ?? null,
      latestCoverageReason: latest?.coverageReason ?? null,
      latestRequestIndexingAt: latest?.requestIndexingAt ?? null,
      movement,
      nextAction: nextAction(target, timeline),
      timeline,
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    measurementPolicy: {
      googleStateSource: 'Recorded GSC observations only.',
      siteReadinessSource: 'Brick 6 revalidation report.',
      noInferenceRule: 'Technical readiness never counts as proof of Google indexation.',
      reviewHeuristics: '7-day reinspect / 14-day evidence-led review are operational checkpoints, not Google indexing guarantees.',
    },
    counts: {
      targets: rows.length,
      snapshots: snapshots.length,
      indexed: rows.filter((row) => row.movement === 'indexed').length,
      recovered: rows.filter((row) => row.movement === 'recovered-to-indexed').length,
      stillNotIndexed: rows.filter((row) => row.movement === 'still-not-indexed').length,
      regressed: rows.filter((row) => row.movement === 'regressed-from-indexed').length,
      awaitingObservation: rows.filter((row) => row.movement === 'awaiting-first-gsc-observation').length,
      measurementIncomplete: rows.filter((row) => row.movement === 'measurement-incomplete').length,
    },
    snapshots: snapshots.map((snapshot) => ({
      fileName: snapshot.fileName,
      observedAt: snapshot.observedAt,
      source: snapshot.source,
      rows: snapshot.rows.size,
    })),
    targets: rows,
  };

  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  await fs.writeFile(path.join(ARTIFACTS_DIR, 'gsc-indexation-recovery-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(ARTIFACTS_DIR, 'gsc-indexation-recovery-report.md'), `${markdownReport(report)}\n`, 'utf8');

  const actionRows = rows
    .filter((row) => !['indexed', 'recovered-to-indexed'].includes(row.movement))
    .map((row) => `${row.url} | ${row.latestState} | ${row.movement} | ${row.nextAction}`);
  await fs.writeFile(
    path.join(ARTIFACTS_DIR, 'gsc-indexation-next-actions.txt'),
    `${[
      '# Tiny Steps — Brick 7 evidence-led indexation next actions',
      '# Do not change a page solely because Google has not indexed it yet; use the recorded GSC reason.',
      '',
      ...actionRows,
      '',
    ].join('\n')}`,
    'utf8',
  );

  console.log(`[gsc-brick7] targets=${report.counts.targets}`);
  console.log(`[gsc-brick7] snapshots=${report.counts.snapshots}`);
  console.log(`[gsc-brick7] indexed=${report.counts.indexed}`);
  console.log(`[gsc-brick7] recovered=${report.counts.recovered}`);
  console.log(`[gsc-brick7] stillNotIndexed=${report.counts.stillNotIndexed}`);
  console.log(`[gsc-brick7] regressed=${report.counts.regressed}`);
  console.log(`[gsc-brick7] awaitingObservation=${report.counts.awaitingObservation}`);

  if (failureCount > 0) process.exit(1);
  console.log('Brick 7 indexation measurement and recovery tracker passed.');
}

main().catch((error) => {
  console.error(`ERROR: ${error.stack || error.message}`);
  process.exit(1);
});
