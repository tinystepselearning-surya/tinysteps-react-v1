import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  FUTURE_SCHEDULE_RECONCILER_REGION,
  FUTURE_SCHEDULE_RECONCILER_SWEEP_SCHEDULE,
  FUTURE_SCHEDULE_RECONCILER_TIME_ZONE,
  MAX_FUTURE_SCHEDULE_SWEEP_ENROLLMENTS,
} from '../src/scheduling/futureScheduleOrchestration';
import {
  MAX_FUTURE_SCHEDULE_EXCEPTION_ROWS,
  MAX_FUTURE_SCHEDULE_FINANCE_IDS,
  MAX_FUTURE_SCHEDULE_SESSION_ROWS_PER_ENROLLMENT,
  shouldIncludeFutureScheduleWindowRow,
} from '../src/scheduling/futureScheduleFirestore';

describe('Brick 5 production Firestore wiring', () => {
  it('keeps every discovery path bounded', () => {
    expect(MAX_FUTURE_SCHEDULE_SESSION_ROWS_PER_ENROLLMENT).toBeGreaterThan(0);
    expect(MAX_FUTURE_SCHEDULE_SESSION_ROWS_PER_ENROLLMENT).toBeLessThanOrEqual(2500);
    expect(MAX_FUTURE_SCHEDULE_EXCEPTION_ROWS).toBeGreaterThan(0);
    expect(MAX_FUTURE_SCHEDULE_FINANCE_IDS).toBeGreaterThan(0);
    expect(MAX_FUTURE_SCHEDULE_SWEEP_ENROLLMENTS).toBe(500);
  });

  it('runs automatic reconciliation in the expected region/timezone once daily', () => {
    expect(FUTURE_SCHEDULE_RECONCILER_REGION).toBe('asia-south1');
    expect(FUTURE_SCHEDULE_RECONCILER_TIME_ZONE).toBe('Asia/Kolkata');
    expect(FUTURE_SCHEDULE_RECONCILER_SWEEP_SCHEDULE).toBe('47 0 * * *');
  });

  it('does not let a provably historical malformed date block the future window', () => {
    expect(shouldIncludeFutureScheduleWindowRow({
      data: {
        date: '2026-02-31',
        startAt: new Date('2026-09-18T10:00:00.000Z'),
      },
      fromYmd: '2026-09-20',
      throughYmd: '2026-10-03',
    })).toBe(false);

    expect(shouldIncludeFutureScheduleWindowRow({
      data: {
        date: '2026-02-31',
        startAt: new Date('2026-09-21T10:00:00.000Z'),
      },
      fromYmd: '2026-09-20',
      throughYmd: '2026-10-03',
    })).toBe(true);

    expect(shouldIncludeFutureScheduleWindowRow({
      data: {date: 'not-a-date'},
      fromYmd: '2026-09-20',
      throughYmd: '2026-10-03',
    })).toBe(true);
  });

  it('uses transaction-backed create/merge operations and exact finance point reads', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduling/futureScheduleFirestore.ts'),
      'utf8',
    );

    expect(source).toContain(".collection('billingCharges').doc(sessionId)");
    expect(source).toContain(".collection('teacherEarnings').doc(sessionId)");
    expect(source).toContain("firestoreTx.create(");
    expect(source).toContain("firestoreTx.set(");
    expect(source).toContain("{merge: true}");
    expect(source).toContain(".where('enrollmentId', '==', args.enrollmentId)");
    expect(source).toContain(
      '.limit(MAX_FUTURE_SCHEDULE_SESSION_ROWS_PER_ENROLLMENT + 1)',
    );
  });

  it('discovers all supported linked exception back-reference fields', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduling/futureScheduleFirestore.ts'),
      'utf8',
    );

    [
      'makeupForSessionId',
      'rescheduledFromSessionId',
      'originalSessionId',
      'sourceSessionId',
      'replacementForSessionId',
    ].forEach((field) => expect(source).toContain(`'${field}'`));
  });

  it('exports only the two intended Brick 5 production entry points', () => {
    const indexSource = readFileSync(
      resolve(process.cwd(), 'functions/src/index.ts'),
      'utf8',
    );

    expect(indexSource).toContain('onFutureScheduleEnrollmentWrite');
    expect(indexSource).toContain('futureScheduleReconcilerEveryTwoHours');
    expect(indexSource).not.toContain('prepareFutureScheduleExecution } from');
    expect(indexSource).not.toContain('executeFutureScheduleReconciliation } from');
  });

  it('keeps enrollment-trigger recursion isolated from scheduleMaterialization pointer writes', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduling/futureScheduleOrchestration.ts'),
      'utf8',
    );
    const comparableStart = source.indexOf('export function futureScheduleEnrollmentComparable');
    const comparableEnd = source.indexOf(
      'export function shouldReconcileFutureScheduleEnrollmentWrite',
    );
    const comparable = source.slice(comparableStart, comparableEnd);

    expect(comparable).not.toContain('scheduleMaterialization');
    expect(comparable).not.toContain('updatedAt');
    expect(source).toContain("document: 'enrollments/{enrollmentId}'");
  });
});
