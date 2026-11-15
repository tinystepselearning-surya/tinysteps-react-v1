import { describe, expect, it } from 'vitest';
import {
  linkedEnrolmentIdsForEvidence,
  summarizeSourcePaymentEvidence,
} from './sourcePaymentEvidence';

const lead = (id: string, enrollmentId?: string) => ({
  id, source: 'website', status: 'admitted_confirmed',
  dedupeCanonicalLeadId: id, enrollmentId: enrollmentId || null,
});

const paidCharge = (enrollmentId: string) => ({
  enrollmentId, paidAmount: 350, paymentIds: ['payment-1'], status: 'partial',
});

describe('source payment evidence — read-only and fail-closed', () => {
  it('counts only explicit canonical lead → enrolment → payment allocation links', () => {
    const leads = [
      lead('lead-a', 'enrollment-a'),
      lead('lead-b', 'enrollment-b'),
      { ...lead('lead-c', 'enrollment-c'), status: 'demo_pending_schedule' },
    ];
    expect(linkedEnrolmentIdsForEvidence(leads)).toEqual(['enrollment-a', 'enrollment-b']);
    const report = summarizeSourcePaymentEvidence(leads, [paidCharge('enrollment-a')]);
    expect(report).toMatchObject({
      admitted: 2, confirmedPaid: 1, unknown: 1, unlinked: 0,
      confirmedLeadIds: ['lead-a'],
    });
  });

  it('leaves unlinked admissions unknown rather than treating them as unpaid', () => {
    const report = summarizeSourcePaymentEvidence([lead('lead-a')], []);
    expect(report).toMatchObject({ admitted: 1, confirmedPaid: 0, unknown: 1, unlinked: 1 });
  });

  it('never credits a duplicate or conflicting lead, or an ambiguous shared enrollment ID', () => {
    const leads = [
      lead('canonical', 'enrollment-1'),
      { ...lead('duplicate', 'enrollment-2'), dedupeCanonicalLeadId: 'canonical' },
      { ...lead('conflict', 'enrollment-3'), dedupeConflict: 'duplicate_review' },
      lead('shared-one', 'enrollment-shared'),
      lead('shared-two', 'enrollment-shared'),
    ];
    const report = summarizeSourcePaymentEvidence(leads, [
      paidCharge('enrollment-1'), paidCharge('enrollment-2'),
      paidCharge('enrollment-3'), paidCharge('enrollment-shared'),
    ]);
    expect(report).toMatchObject({ admitted: 3, confirmedPaid: 1, unknown: 2 });
    expect(report.confirmedLeadIds).toEqual(['canonical']);
  });

  it('rejects payments without an explicit positive allocation, and refunds', () => {
    const leads = [lead('a', 'e-1'), lead('b', 'e-2'), lead('c', 'e-3'), lead('d', 'e-4')];
    const report = summarizeSourcePaymentEvidence(leads, [
      { ...paidCharge('e-1'), paymentIds: [], lastPaymentId: null },
      { ...paidCharge('e-2'), paidAmount: 0 },
      { ...paidCharge('e-3'), status: 'refunded' },
      { ...paidCharge('e-4'), archived: true },
    ]);
    expect(report).toMatchObject({ admitted: 4, confirmedPaid: 0, unknown: 4 });
  });

  it('counts a lead only once for multiple paid courses and ignores unrelated payments', () => {
    const leads = [{ ...lead('a', 'e-1'), enrollmentIds: ['e-1', 'e-2'] }];
    const report = summarizeSourcePaymentEvidence(leads, [
      paidCharge('e-1'), paidCharge('e-2'), paidCharge('different-enrollment'),
    ]);
    expect(report).toMatchObject({ admitted: 1, confirmedPaid: 1, unknown: 0 });
  });
});
