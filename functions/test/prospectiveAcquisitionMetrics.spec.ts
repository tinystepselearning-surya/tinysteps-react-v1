import { describe, expect, it } from 'vitest';
import {
  summarizeProspectiveLeadCandidates,
} from '../src/prospectiveAcquisitionMetrics';

const start = Date.parse('2026-10-31T18:30:00Z');
const end = Date.parse('2026-11-30T18:30:00Z');
const row = (id: string, identity: string, date: string, extra: Record<string, unknown> = {}) => ({
  id,
  data: {
    source: 'website',
    dedupeCanonicalLeadId: id,
    dedupeIdentityKey: identity,
    firstInquiryAt: date,
    acquisitionChannel: 'google_organic',
    parentName: 'Sensitive Parent',
    primaryPhone: '9876543210',
    childName: 'Sensitive Child',
    ...extra,
  },
});
const hashA = 'a'.repeat(64);
const hashB = 'b'.repeat(64);

describe('prospective parent-child acquisition server projection', () => {
  it('counts siblings as two opportunities but same-child repeat once', () => {
    const summary = summarizeProspectiveLeadCandidates([
      row('a', hashA, '2026-11-05T05:00:00Z'),
      row('a', hashA, '2026-11-05T05:00:00Z'),
      row('b', hashB, '2026-11-07T05:00:00Z', { acquisitionChannel: 'chatgpt' }),
    ], start, end);
    expect(summary.newParentChildEnquiries).toBe(2);
    expect(summary.channels).toEqual({ google_organic: 1, chatgpt: 1 });
  });

  it('does not label an existing October child as newly acquired after returning', () => {
    const summary = summarizeProspectiveLeadCandidates([
      row('old', hashA, '2026-10-20T05:00:00Z', {
        lastInquiryAt: '2026-11-17T05:00:00Z',
        requestedAt: '2026-11-17T05:00:00Z',
      }),
      row('new-sibling', hashB, '2026-11-17T05:00:00Z'),
    ], start, end);
    expect(summary.newParentChildEnquiries).toBe(1);
  });

  it('does not count unresolved canonicalization or merged redirects', () => {
    const summary = summarizeProspectiveLeadCandidates([
      row('pending', '', '2026-11-05T05:00:00Z'),
      row('redirect', hashA, '2026-11-06T05:00:00Z', { dedupeCanonicalLeadId: 'other' }),
    ], start, end);
    expect(summary.newParentChildEnquiries).toBe(0);
    expect(summary.unresolvedCandidateRecords).toBe(2);
  });

  it('uses IST midnight cutover and end-exclusive boundaries', () => {
    const summary = summarizeProspectiveLeadCandidates([
      row('before', hashA, '2026-10-31T18:29:59Z'),
      row('start', hashA, '2026-10-31T18:30:00Z'),
      row('end', hashB, '2026-11-30T18:30:00Z'),
    ], start, end);
    expect(summary.newParentChildEnquiries).toBe(1);
  });

  it('retains older archived acquisition and does not rely on staff statuses', () => {
    const summary = summarizeProspectiveLeadCandidates([
      row('a', hashA, '2026-11-01T01:00:00Z', {
        archived: true, status: 'admitted_confirmed',
      }),
    ], start, end);
    expect(summary.newParentChildEnquiries).toBe(1);
  });

  it('does not treat unknown source as Google or expose customer identity in output', () => {
    const summary = summarizeProspectiveLeadCandidates([
      row('private-doc', hashA, '2026-11-01T01:00:00Z', {
        acquisitionChannel: 'untrusted source string',
      }),
    ], start, end);
    expect(summary.channels).toEqual({ unknown: 1 });
    const output = JSON.stringify(summary);
    expect(output).not.toContain('Sensitive');
    expect(output).not.toContain('9876543210');
    expect(output).not.toContain('private-doc');
    expect(output).not.toContain(hashA);
  });

  it('excludes non-website records', () => {
    const summary = summarizeProspectiveLeadCandidates([
      row('manual', hashA, '2026-11-01T01:00:00Z', { source: 'manual' }),
    ], start, end);
    expect(summary.newParentChildEnquiries).toBe(0);
  });
});
