import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const source = (file: string) => readFileSync(
  resolve(process.cwd(), 'functions/src', file),
  'utf8',
);
const index = source('index.ts');
const cases = [
  ['recordTeacherPayoutV2.ts', 'recordTeacherPayoutV2'],
  ['voidTeacherOrphanEarnings.ts', 'voidTeacherOrphanEarnings'],
  ['certifyTeacherEarningsSessionCreateFastPath.ts', 'certifyTeacherEarningsSessionCreateFastPath'],
  ['adminCorrectDemoCompletion.ts', 'adminCorrectDemoCompletion'],
] as const;

describe('R5C2C34 bounded teacher finance canonical Admin cutover', () => {
  it.each(cases)('%s has one canonical Admin requester guard and no legacy fallback', (file, name) => {
    const s = source(file);
    expect(s).toContain("from './helpers/canonicalAdminGuard'");
    expect(s).not.toContain("from './helpers/adminGuard'");
    expect(s.match(/await ensureCanonicalAdmin\(request\.auth\);/g)).toHaveLength(1);
    expect(s).not.toContain('await ensureAdmin(request.auth);');
    expect(index).toContain(name);
  });

  it('keeps teacher payout period semantics, idempotency and amount validation', () => {
    const s = source('recordTeacherPayoutV2.ts');
    expect(s).toContain('buildTeacherPayoutPeriod');
    expect(s).toContain('idempotencyKey is required');
    expect(s).toContain('earningMonthKey (YYYY-MM)');
    expect(s).toContain("db.collection('teacherPayouts').doc(payoutDocId)");
  });

  it('preserves the teacher-month scope and transaction for orphan earnings', () => {
    const s = source('voidTeacherOrphanEarnings.ts');
    expect(s).toContain(".where('teacherId', '==', teacherId)");
    expect(s).toContain(".where('monthKey', '==', monthKey)");
    expect(s).toContain('db.runTransaction(async (tx) =>');
  });

  it('preserves certification dry-run default and bounded data scan', () => {
    const s = source('certifyTeacherEarningsSessionCreateFastPath.ts');
    expect(s).toContain('const apply = request.data?.apply === true');
    expect(s).toContain("db.collection('teacherEarnings').limit(maxDocs + 1).get()");
    expect(s).toContain('if (apply)');
  });

  it('preserves demo-correction reason guard and idempotent transaction', () => {
    const s = source('adminCorrectDemoCompletion.ts');
    expect(s).toContain('Correction reason is required');
    expect(s).toContain('db.runTransaction(async (tx) =>');
    expect(s).toContain('accidental_demo_completion');
  });
});
