import * as admin from 'firebase-admin';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

if (!admin.apps.length) admin.initializeApp();

const DEFAULT_LOOKBACK_DAYS = 30;
const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

type NumericMap = Record<string, number>;

type DayRow = {
  dayKey: string;
  totalEvents: number;
  shadowEnabledEvents: number;
  incrementalEnabledEvents: number;
  targetCountTotal: number;
  byLiveOutcome: NumericMap;
  byLiveReason: NumericMap;
  byShadowOutcome: NumericMap;
  byShadowReason: NumericMap;
};

const finiteNonNegative = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const numericMap = (value: unknown): NumericMap => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const output: NumericMap = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, raw]) => {
    const count = finiteNonNegative(raw);
    if (count > 0) output[key] = count;
  });
  return output;
};

/**
 * Production telemetry has existed across two Firestore field-shape conventions:
 * nested maps (for example byShadowOutcome.match) and literal dotted top-level
 * field names (for example "byShadowOutcome.match"). Read both so the audit
 * cannot silently report zero parity when telemetry is present.
 */
const metricMap = (
  data: Record<string, unknown>,
  root: string,
): NumericMap => {
  const output = numericMap(data[root]);
  const prefix = root + '.';

  Object.entries(data).forEach(([key, raw]) => {
    if (!key.startsWith(prefix)) return;
    const metricKey = key.slice(prefix.length).trim();
    if (!metricKey) return;
    const count = finiteNonNegative(raw);
    if (count > 0) output[metricKey] = (output[metricKey] || 0) + count;
  });

  return output;
};

const addMaps = (target: NumericMap, source: NumericMap): void => {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = (target[key] || 0) + value;
  });
};

const ratio = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? Math.round((numerator / denominator) * 1_000_000) / 1_000_000 : null;

async function main(): Promise<void> {
  const requested = Number(process.env.V4_PARITY_LOOKBACK_DAYS || DEFAULT_LOOKBACK_DAYS);
  const lookbackDays = Number.isFinite(requested)
    ? Math.max(1, Math.min(120, Math.floor(requested)))
    : DEFAULT_LOOKBACK_DAYS;

  const snap = await admin
    .firestore()
    .collection('adminStats')
    .doc('parentClassAttendanceV4')
    .collection('days')
    .get();

  const rows: DayRow[] = snap.docs
    .filter((doc) => DAY_KEY_RE.test(doc.id))
    .map((doc) => {
      const data = (doc.data() || {}) as Record<string, unknown>;
      return {
        dayKey: doc.id,
        totalEvents: finiteNonNegative(data.totalEvents),
        shadowEnabledEvents: finiteNonNegative(data.shadowEnabledEvents),
        incrementalEnabledEvents: finiteNonNegative(data.incrementalEnabledEvents),
        targetCountTotal: finiteNonNegative(data.targetCountTotal),
        byLiveOutcome: metricMap(data, 'byLiveOutcome'),
        byLiveReason: metricMap(data, 'byLiveReason'),
        byShadowOutcome: metricMap(data, 'byShadowOutcome'),
        byShadowReason: metricMap(data, 'byShadowReason'),
      };
    })
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    .slice(-lookbackDays);

  const totals = {
    totalEvents: 0,
    shadowEnabledEvents: 0,
    incrementalEnabledEvents: 0,
    targetCountTotal: 0,
    byLiveOutcome: {} as NumericMap,
    byLiveReason: {} as NumericMap,
    byShadowOutcome: {} as NumericMap,
    byShadowReason: {} as NumericMap,
  };

  rows.forEach((row) => {
    totals.totalEvents += row.totalEvents;
    totals.shadowEnabledEvents += row.shadowEnabledEvents;
    totals.incrementalEnabledEvents += row.incrementalEnabledEvents;
    totals.targetCountTotal += row.targetCountTotal;
    addMaps(totals.byLiveOutcome, row.byLiveOutcome);
    addMaps(totals.byLiveReason, row.byLiveReason);
    addMaps(totals.byShadowOutcome, row.byShadowOutcome);
    addMaps(totals.byShadowReason, row.byShadowReason);
  });

  const match = totals.byShadowOutcome.match || 0;
  const mismatch = totals.byShadowOutcome.mismatch || 0;
  const covered = totals.byShadowOutcome.covered || 0;
  const notEvaluable = totals.byShadowOutcome.not_evaluable || 0;
  const skipped = totals.byShadowOutcome.skipped || 0;
  const parityComparable = match + mismatch;
  const shadowEvaluated = match + mismatch + covered + notEvaluable;
  const observedDays = rows.filter((row) => row.totalEvents > 0).length;

  const report = {
    generatedAt: new Date().toISOString(),
    projectId: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || null,
    source: 'adminStats/parentClassAttendanceV4/days/*',
    requestedLookbackDays: lookbackDays,
    observedDays,
    firstObservedDay: rows[0]?.dayKey || null,
    lastObservedDay: rows[rows.length - 1]?.dayKey || null,
    totals,
    derived: {
      parityComparableEvents: parityComparable,
      parityMatchRate: ratio(match, parityComparable),
      mismatchRate: ratio(mismatch, parityComparable),
      shadowEvaluatedEvents: shadowEvaluated,
      shadowEvaluationRate: ratio(shadowEvaluated, totals.shadowEnabledEvents),
      notEvaluableRate: ratio(notEvaluable, totals.shadowEnabledEvents),
      coveredRate: ratio(covered, totals.shadowEnabledEvents),
      skippedRate: ratio(skipped, totals.totalEvents),
      averageTargetsPerEvent: ratio(totals.targetCountTotal, totals.totalEvents),
    },
    perDay: rows,
  };

  const outputPath = resolve(
    process.env.V4_PARITY_OUTPUT_PATH || 'artifacts/parent-class-attendance-v4-parity.json',
  );
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify(report, null, 2));

  // Flat lines remain readable in GitHub logs even when nested objects are sanitized.
  console.log(
    [
      'C3_V4_PARITY',
      'totalEvents=' + totals.totalEvents,
      'shadowEnabledEvents=' + totals.shadowEnabledEvents,
      'incrementalEnabledEvents=' + totals.incrementalEnabledEvents,
      'match=' + match,
      'mismatch=' + mismatch,
      'covered=' + covered,
      'notEvaluable=' + notEvaluable,
      'skipped=' + skipped,
      'parityComparable=' + parityComparable,
    ].join(' '),
  );
  Object.entries(totals.byShadowReason)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .forEach(([reason, count]) => {
      console.log('C3_V4_SHADOW_REASON ' + reason + '=' + count);
    });
  Object.entries(totals.byLiveReason)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .forEach(([reason, count]) => {
      console.log('C3_V4_LIVE_REASON ' + reason + '=' + count);
    });

  console.log('V4 parity report written to ' + outputPath);
}

main().catch((error) => {
  console.error('V4 parity audit failed', error);
  process.exit(1);
});
