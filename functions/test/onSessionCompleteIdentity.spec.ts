import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildParentPaymentAllocationPlan } from '../src/parentPaymentAllocator';
import {
  selectUnambiguousLegacyEnrollment,
  validateExactEnrollmentIdentity,
} from '../src/onSessionComplete';

describe('session completion enrollment identity', () => {
  it('accepts an exact enrollment only when child and course both match', () => {
    expect(validateExactEnrollmentIdentity(
      true,
      { kidId: 'kid-1', courseId: 'phonics' },
      'kid-1',
      'phonics',
    )).toEqual({ ok: true });
    expect(validateExactEnrollmentIdentity(
      true,
      { kidId: 'kid-1', courseId: 'grammar' },
      'kid-1',
      'phonics',
    )).toEqual({ ok: false, reason: 'course_mismatch' });
    expect(validateExactEnrollmentIdentity(
      true,
      { kidId: 'kid-2', courseId: 'phonics' },
      'kid-1',
      'phonics',
    )).toEqual({ ok: false, reason: 'kid_mismatch' });
  });

  it('supports legacy studentId and kidIds aliases for exact identity', () => {
    expect(validateExactEnrollmentIdentity(
      true,
      { studentId: 'kid-1', courseId: 'phonics' },
      'kid-1',
      'phonics',
    )).toEqual({ ok: true });
    expect(validateExactEnrollmentIdentity(
      true,
      { kidIds: ['kid-1'], courseId: 'phonics' },
      'kid-1',
      'phonics',
    )).toEqual({ ok: true });
  });

  it('accepts exactly one operational legacy child-course match', () => {
    expect(selectUnambiguousLegacyEnrollment([
      { id: 'phonics-active', data: { kidId: 'kid-1', courseId: 'phonics', status: 'active' } },
      { id: 'grammar-active', data: { kidId: 'kid-1', courseId: 'grammar', status: 'active' } },
      { id: 'phonics-completed', data: { kidId: 'kid-1', courseId: 'phonics', status: 'completed' } },
    ], 'kid-1', 'phonics')).toEqual({ ok: true, enrollmentId: 'phonics-active' });
  });

  it('fails closed instead of ranking ambiguous legacy enrollments', () => {
    expect(selectUnambiguousLegacyEnrollment([
      { id: 'phonics-a', data: { kidId: 'kid-1', courseId: 'phonics', status: 'active' } },
      { id: 'phonics-b', data: { studentId: 'kid-1', courseId: 'phonics', status: 'current' } },
    ], 'kid-1', 'phonics')).toEqual({
      ok: false,
      reason: 'ambiguous',
      candidateIds: ['phonics-a', 'phonics-b'],
    });
  });

  it('does not attach a legacy Phonics session to Grammar or terminal history', () => {
    expect(selectUnambiguousLegacyEnrollment([
      { id: 'grammar-active', data: { kidId: 'kid-1', courseId: 'grammar', status: 'active' } },
      { id: 'phonics-completed', data: { kidId: 'kid-1', courseId: 'phonics', status: 'completed' } },
    ], 'kid-1', 'phonics')).toEqual({
      ok: false,
      reason: 'missing',
      candidateIds: [],
    });
  });

  it('retains enrollment, course, child and session identity in payment allocations', () => {
    const plan = buildParentPaymentAllocationPlan([{
      id: 'session-phonics',
      data: {
        amount: 500,
        status: 'open',
        enrollmentId: 'enr-phonics',
        kidId: 'kid-1',
        courseId: 'phonics',
        sessionId: 'session-phonics',
        monthKey: '2026-07',
      },
    }], 500);

    expect(plan.allocations[0]).toMatchObject({
      enrollmentId: 'enr-phonics',
      kidId: 'kid-1',
      courseId: 'phonics',
      classSessionId: 'session-phonics',
    });
  });

  it('writes enrollment, course, child, teacher and session identity to finance events', () => {
    const revenueSource = readFileSync(join(process.cwd(), 'functions/src/revenue.ts'), 'utf8');
    const chargeStart = revenueSource.indexOf('const chargePayload:');
    const earningStart = revenueSource.indexOf('const earningPayload:');
    const chargePayload = revenueSource.slice(chargeStart, earningStart);
    const earningPayload = revenueSource.slice(earningStart, revenueSource.indexOf('if (!earningSnap.exists)', earningStart));

    ['sessionId', 'enrollmentId', 'kidId', 'parentId', 'teacherId', 'courseId'].forEach((field) => {
      expect(chargePayload).toMatch(new RegExp(`${field}\\s*[:,]`));
      expect(earningPayload).toMatch(new RegExp(`${field}\\s*[:,]`));
    });
  });

  it('performs every reversal transaction read before its first write', () => {
    const revenueSource = readFileSync(join(process.cwd(), 'functions/src/revenue.ts'), 'utf8');
    const reversalStart = revenueSource.indexOf(
      'if ((beforeBillable || beforeAccrued || afterAccrued) && !afterBillable)',
    );
    const reversalEnd = revenueSource.indexOf('function normalizePaymentMethod', reversalStart);
    const reversalSource = revenueSource.slice(reversalStart, reversalEnd);
    const firstWrite = reversalSource.indexOf('tx.set(');
    const readPositions = Array.from(reversalSource.matchAll(/tx\.get\(/g), (match) => match.index);

    expect(reversalStart).toBeGreaterThanOrEqual(0);
    expect(firstWrite).toBeGreaterThanOrEqual(0);
    expect(readPositions.length).toBeGreaterThanOrEqual(3);
    expect(readPositions.every((position) => position < firstWrite)).toBe(true);
  });
});
