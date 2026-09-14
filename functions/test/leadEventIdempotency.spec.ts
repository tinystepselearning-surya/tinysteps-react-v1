import * as admin from 'firebase-admin';
import { describe, expect, it } from 'vitest';
import {
  hasMeaningfulLeadDemoChange,
  shouldRunOrphanDemoRepair,
} from '../src/leadDemoAutoWorkflow';
import {
  buildLeadCanonicalizationPatch,
  hasMeaningfulDemoLifecycleChange,
} from '../src/leadLifecycle';
import { hasCompleteWebsiteCanonicalMetadata } from '../src/websiteLeadDeduplication';

const timestamp = (iso: string) => admin.firestore.Timestamp.fromDate(new Date(iso));

describe('lead/demo Firestore event idempotency', () => {
  it('locks receivedAt to the original stored cohort anchor and converges without a trigger loop', () => {
    const original = timestamp('2026-08-05T01:12:17.973Z');
    const later = timestamp('2026-08-05T01:12:37.943Z');
    const base = {
      firstInquiryAt: original,
      requestedAt: later,
      createdAt: later,
      status: 'demo_pending_schedule',
      lifecycleVersion: 2,
      primaryPhone: '00966550372174',
      phoneNormalized: '00966550372174',
    };

    expect(buildLeadCanonicalizationPatch({ ...base, receivedAt: later }, { receivedAt: original }))
      .toMatchObject({ receivedAt: original, receivedAtOriginal: original });

    expect(buildLeadCanonicalizationPatch(
      { ...base, receivedAt: original, receivedAtOriginal: original },
      { receivedAt: later },
    )).toEqual({});

    const earlierEdit = timestamp('2026-08-04T01:12:17.973Z');
    expect(buildLeadCanonicalizationPatch(
      { ...base, receivedAt: earlierEdit, receivedAtOriginal: original },
      { receivedAt: original, receivedAtOriginal: original },
    )).toMatchObject({ receivedAt: original });
  });

  it('initializes the immutable backing anchor from receivedAt on a newly created lead', () => {
    const receivedAt = timestamp('2026-08-05T01:12:17.973Z');
    expect(buildLeadCanonicalizationPatch({
      receivedAt,
      status: 'new',
      lifecycleVersion: 2,
    })).toMatchObject({ receivedAtOriginal: receivedAt });
  });

  it('ignores timestamp-only lead and demo updates', () => {
    const beforeLead = {
      source: 'website',
      childName: 'Child',
      primaryPhone: '9999999999',
      demoSessionId: 'lead-1',
      updatedAt: timestamp('2026-08-23T07:00:00Z'),
    };
    const afterLead = {
      ...beforeLead,
      updatedAt: timestamp('2026-08-23T07:01:00Z'),
    };
    expect(hasMeaningfulLeadDemoChange(beforeLead, afterLead, false)).toBe(false);

    const beforeDemo = { leadId: 'lead-1', status: 'open', lastUpdatedAt: beforeLead.updatedAt };
    const afterDemo = { ...beforeDemo, lastUpdatedAt: afterLead.updatedAt };
    expect(hasMeaningfulDemoLifecycleChange(beforeDemo, afterDemo, false)).toBe(false);
    expect(hasMeaningfulDemoLifecycleChange(beforeDemo, { ...afterDemo, status: 'assigned' }, false))
      .toBe(true);
  });

  it('runs demo creation on a real transition but not on unrelated lead writes', () => {
    const before = {
      source: 'website',
      childName: 'Child',
      primaryPhone: '9999999999',
      dedupeCanonicalLeadId: 'lead-1',
      dedupeIdentityKey: 'identity',
    };
    expect(hasMeaningfulLeadDemoChange(before, { ...before, updatedAt: timestamp('2026-08-23T07:01:00Z') }, false))
      .toBe(false);
    expect(hasMeaningfulLeadDemoChange(before, { ...before, demoRepairVersion: 1 }, false))
      .toBe(true);
    expect(hasMeaningfulLeadDemoChange(before, { ...before, demoSessionId: 'demo-1' }, false))
      .toBe(true);
  });

  it('does not run orphan reconciliation for normally linked demos', () => {
    expect(shouldRunOrphanDemoRepair(
      'demo-1',
      { leadId: 'lead-1', childName: 'Child' },
      { leadId: 'lead-1', childName: 'Child', lastUpdatedAt: timestamp('2026-08-23T07:01:00Z') },
      false,
    )).toBe(false);
    expect(shouldRunOrphanDemoRepair(
      'demo-1',
      { leadId: 'demo_demo-1', childName: 'Child' },
      { leadId: 'lead-1', childName: 'Child' },
      false,
    )).toBe(true);
  });

  it('recognizes canonical website metadata that makes lifecycle-only updates no-ops', () => {
    expect(hasCompleteWebsiteCanonicalMetadata('lead-1', 'identity', {
      dedupeCanonicalLeadId: 'lead-1',
      dedupeIdentityKey: 'identity',
      dedupeVersion: 1,
      inquiryCount: 1,
      firstInquiryAt: timestamp('2026-08-01T00:00:00Z'),
      lastInquiryAt: timestamp('2026-08-01T00:00:00Z'),
      programInterests: ['Reading'],
      interestTracks: ['phonics'],
    })).toBe(true);
  });
});
