import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'functions/src/sessionsManagementSnapshot.ts'),
  'utf8',
);

describe('Sessions Management daily baseline snapshot', () => {
  it('publishes only Today and Tomorrow at the 04:00 IST operational-day boundary', () => {
    expect(source).toContain("const SCHEMA_VERSION = 2;");
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
    expect(source).toContain("raw === 'pending_teacher'");
    expect(source).toContain("raw === 'pending_payment'");
    expect(source).toContain("raw === 'pending_lp'");
    expect(source).toContain("raw === 'pending_lp_assignment'");
    expect(source).toContain("raw === 'enrolled'");
    expect(source).toContain("raw === 'current'");
    expect(source).toContain("raw === 'ongoing'");
    expect(source).toContain("return normalized === 'active' || normalized === 'trial';");
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

  it('publishes current only after all snapshot shards and metadata are written', () => {
    const writeShardsIndex = source.indexOf('const shardIds = await writeSnapshotShards');
    const metaWriteIndex = source.indexOf('await snapshotRef.set(meta)');
    const currentWriteIndex = source.indexOf('await currentRef.set({');
    expect(writeShardsIndex).toBeGreaterThan(-1);
    expect(metaWriteIndex).toBeGreaterThan(writeShardsIndex);
    expect(currentWriteIndex).toBeGreaterThan(metaWriteIndex);
  });
});
