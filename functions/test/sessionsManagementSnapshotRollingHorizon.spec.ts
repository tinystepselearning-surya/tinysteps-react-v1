import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'functions/src/sessionsManagementSnapshot.ts'),
  'utf8',
);

describe('Sessions Management rolling-horizon snapshot', () => {
  it('publishes the authoritative 14-day rolling horizon at 04:00 IST', () => {
    expect(source).toContain("const SNAPSHOT_HORIZON_DAYS = 14;");
    expect(source).toContain("schedule: '0 4 * * *'");
    expect(source).toContain('Array.from({ length: SNAPSHOT_HORIZON_DAYS + 1 }');
    expect(source).toContain('shiftDateKey(baseDateKey, index)');
  });

  it('fails closed rather than publishing a potentially truncated per-date snapshot', () => {
    expect(source).toContain('SESSION_LIMIT_PER_DATE');
    expect(source).toContain('session snapshot reached safety limit');
    expect(source).toContain('throw new Error');
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
