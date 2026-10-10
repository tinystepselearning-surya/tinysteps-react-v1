import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const src = (file: string) => readFileSync(resolve(process.cwd(), 'functions/src', file), 'utf8');
const sessions = src('sessionsManagementSnapshot.ts');
const payDecision = src('adminAttendanceCorrectionTeacherPayDecision.ts');
const paymentBackfill = src('parentPaymentBackfillWriteMode.ts');
const index = src('index.ts');

describe('R5C2C36 canonical Admin authorization across three operational modules', () => {
  it('canonicalizes all five legacy guards, never falls back to users or claims for Admin authorization', () => {
    for (const [source, count] of [[sessions, 3], [payDecision, 1], [paymentBackfill, 1]] as const) {
      expect(source).toContain('canonicalAdminGuard');
      expect(source).not.toMatch(/from ['"]\.\/helpers\/adminGuard['"]/);
      expect(source).not.toMatch(/await\s+ensureAdmin\(/);
      expect((source.match(/await\s+ensureCanonicalAdmin\(/g) || []).length).toBe(count);
    }
    expect(payDecision).toContain('const uid = await assertAdmin(request.auth);');
    expect(payDecision).toContain('await ensureCanonicalAdmin(auth);');
  });

  it('preserves Sessions Management projected revision and the separately authorized scheduled/triggers', () => {
    expect(sessions).toContain('knownProjectionRevision');
    expect(sessions).toContain('knownSnapshotId');
    expect(sessions).toContain('readProjectedSnapshotWithBaselineFallback');
    for (const name of [
      'getSessionsManagementSnapshot',
      'getSessionsManagementDateSnapshot',
      'adminRefreshSessionsManagementSnapshot',
      'onSessionsManagementEnrollmentWrite',
      'onSessionsManagementClassSessionWrite',
      'refreshSessionsManagementSnapshot4am',
    ]) {
      expect(index).toContain(name);
    }
  });

  it('keeps parent payment backfill write-mode confirmations and drift gates', () => {
    expect(paymentBackfill).toContain("data.mode !== 'write'");
    expect(paymentBackfill).toContain('data.confirmationText !== CONFIRMATION_TEXT');
    expect(paymentBackfill).toContain('data.allowWalletDrift === true');
    expect(paymentBackfill).toContain('data.allowAnomalies === true');
    expect(paymentBackfill).toContain('validateParentPaymentBackfillParentIds');
    expect(index).toContain('applyParentPaymentBackfillForSafeParents');
  });

  it('preserves teacher pay disposition validation and transaction', () => {
    expect(payDecision).toContain('validateDispositionReason');
    expect(payDecision).toContain('db.runTransaction(async (tx) =>');
    expect(index).toContain('prepareAdminAttendanceCorrectionTeacherPayDecision');
    expect(index).toContain('cancelAdminAttendanceCorrectionTeacherPayDecision');
  });
});
