import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'functions/src/sessionsManagementSnapshot.ts'),
  'utf8',
);
const projectionSource = readFileSync(
  resolve(process.cwd(), 'functions/src/helpers/sessionsManagementProjection.ts'),
  'utf8',
);

describe('Sessions Management daily baseline snapshot', () => {
  it('publishes only Today and Tomorrow at the 04:00 IST operational-day boundary', () => {
    expect(source).toContain("const SCHEMA_VERSION = 3;");
    expect(source).toContain('const SNAPSHOT_BASELINE_REFRESH_HOUR = 4;');
    expect(source).toContain("schedule: '0 4 * * *'");
    expect(source).toContain('getKolkataBaselineDateKey()');
    expect(source).toContain('SNAPSHOT_BASELINE_REFRESH_HOUR * 60 * 60 * 1000');
    expect(source).toContain(
      'const dateKeys = [baseDateKey, shiftDateKey(baseDateKey, 1)];',
    );
    expect(source).not.toContain('SNAPSHOT_HORIZON_DAYS');
    expect(source).not.toContain('rolloverSessions');
  });

  it('loads the complete enrollment collection once and filters operational admissions without a hard cap', () => {
    expect(source).toContain("db().collection('enrollments').get()");
    expect(source).toContain('isOperationalEnrollmentForSnapshot');
    expect(source).toContain('overallEnrollments: baseEnrollments.length');
    expect(source).not.toContain('OVERALL_ENROLLMENT_LIMIT');
    expect(source).not.toContain("collection('enrollments').limit(");
  });

  it('keeps the operational enrollment aliases aligned with the admin read model', () => {
    expect(projectionSource).toContain("raw === 'pending_teacher'");
    expect(projectionSource).toContain("raw === 'pending_payment'");
    expect(projectionSource).toContain("raw === 'pending_lp'");
    expect(projectionSource).toContain("raw === 'pending_lp_assignment'");
    expect(projectionSource).toContain("raw === 'enrolled'");
    expect(projectionSource).toContain("raw === 'current'");
    expect(projectionSource).toContain("raw === 'ongoing'");
    expect(projectionSource).toContain(
      "return normalized === 'active' || normalized === 'trial';",
    );
  });

  it('fails closed rather than publishing a potentially truncated per-date session snapshot', () => {
    expect(source).toContain('SESSION_LIMIT_PER_DATE');
    expect(source).toContain('session snapshot reached safety limit');
    expect(source).toContain('throw new Error');
  });

  it('rebuilds an old-schema current snapshot instead of serving stale 14-day data', () => {
    expect(source).toContain('if (!meta || meta.schemaVersion !== SCHEMA_VERSION)');
    expect(source).toContain("rebuildSnapshot('bootstrap'");
  });

  it('publishes current and the projection signal only after shards and metadata are written', () => {
    const writeShardsIndex = source.indexOf('const shardIds = await writeSnapshotShards');
    const metaWriteIndex = source.indexOf('await snapshotRef.set(meta)');
    const publishBatchIndex = source.indexOf('const publishBatch = db().batch()');
    const publishCommitIndex = source.indexOf('await publishBatch.commit()');
    expect(writeShardsIndex).toBeGreaterThan(-1);
    expect(metaWriteIndex).toBeGreaterThan(writeShardsIndex);
    expect(publishBatchIndex).toBeGreaterThan(metaWriteIndex);
    expect(publishCommitIndex).toBeGreaterThan(publishBatchIndex);
  });

  it('projects post-baseline changes and protects rebuild races with buildStartedAtMs', () => {
    expect(source).toContain('buildStartedAtMs');
    expect(source).toContain(".where('eventTimeMs', '>=', buildStartedAtMs)");
    expect(source).toContain('readProjectedSnapshotWithBaselineFallback(meta');
    expect(source).toContain('knownProjectionRevision');
    expect(source).toContain('projectionRevision: projectionState.revision');
    expect(source).toContain('await pruneProjectionDeltasBefore(payload.buildStartedAtMs).catch');
    expect(source).toContain('projection_read_failed_using_baseline');
    expect(source).toContain('delta_prune_failed_after_publish');
  });

  it('installs bounded enrollment and Today/Tomorrow session delta triggers', () => {
    expect(source).toContain('onSessionsManagementEnrollmentWrite');
    expect(source).toContain("document: 'enrollments/{enrollmentId}'");
    expect(source).toContain('onSessionsManagementClassSessionWrite');
    expect(source).toContain("document: 'classSessions/{sessionId}'");
    expect(source).toContain('projectionBaselineDateKeys(eventTimeMs)');
    expect(source).toContain('if (!beforeRelevant && !afterRelevant) return;');
  });

  it('serializes delta writes through a monotonic projection revision transaction', () => {
    expect(source).toContain('const nextRevision = Math.max(0, Number(state.revision || 0)) + 1');
    expect(source).toContain('existingEventKey >= delta.eventKey');
    expect(source).toContain("doc(PROJECTION_STATE_DOC)");
  });
});
