import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * ARG-2 callable boundary regression: exercise the real exported onCall handler
 * against an isolated, in-memory Firestore read model. No production access.
 * The Firebase callable wrapper itself is substituted only to invoke the
 * handler deterministically; authorization, input validation and reduction
 * remain the production implementations.
 */
const fixture = vi.hoisted(() => ({
  principals: new Map<string, Record<string, unknown>>(),
  leads: [] as Array<{ id: string; data: Record<string, unknown> }>,
  principalReads: [] as string[],
  leadQueryFields: [] as string[],
}));

vi.mock('firebase-admin', () => {
  type Filter = { field: string; op: string; value: number };
  const getMillis = (value: unknown): number => {
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Date.parse(value);
    return NaN;
  };
  const leadQuery = (filters: Filter[] = [], take = Infinity) => ({
    where: (field: string, op: string, value: number) =>
      leadQuery([...filters, { field, op, value }], take),
    limit: (max: number) => leadQuery(filters, max),
    get: async () => {
      fixture.leadQueryFields.push(filters[0]?.field || '');
      const docs = fixture.leads
        .filter(({ data }) => filters.every(({ field, op, value }) => {
          const timestamp = getMillis(data[field]);
          if (!Number.isFinite(timestamp)) return false;
          return op === '>=' ? timestamp >= value : timestamp < value;
        }))
        .slice(0, take)
        .map(({ id, data }) => ({ id, data: () => data }));
      return { size: docs.length, docs };
    },
  });
  const db = {
    collection: (name: string) => {
      if (name === 'authAccessReadModels') {
        return {
          doc: (uid: string) => ({
            get: async () => {
              fixture.principalReads.push(`authAccessReadModels/${uid}`);
              const data = fixture.principals.get(uid);
              return { exists: Boolean(data), data: () => data };
            },
          }),
        };
      }
      if (name === 'leads') return leadQuery();
      throw new Error('unexpected_collection_' + name);
    },
  };
  const firestore = Object.assign(() => db, {
    Timestamp: { fromMillis: (value: number) => value },
  });
  return { apps: [], initializeApp: () => ({}), firestore };
});

vi.mock('firebase-functions/v2/https', () => ({
  onCall: (_options: unknown, handler: unknown) => handler,
  HttpsError: class HttpsError extends Error {
    constructor(public readonly code: string, message: string) {
      super(message);
    }
  },
}));

import { getProspectiveAcquisitionSummary } from '../src/getProspectiveAcquisitionSummary';

const input = {
  startDateKey: '2026-11-01',
  endDateKey: '2026-11-01',
};
const hash = 'a'.repeat(64);

function principal(
  uid: string,
  roles: string[],
  overrides: Record<string, unknown> = {},
) {
  fixture.principals.set(uid, {
    schemaVersion: 1,
    authority: 'canonical-derived',
    firebaseUid: uid,
    personId: 'person-' + uid,
    personStatus: 'active',
    authStatus: 'active',
    accessActive: true,
    globalRoles: roles,
    schoolAdminOrganisationIds: [],
    sourceAuthIdentityId: 'identity-' + uid,
    ...overrides,
  });
}

function candidate(extra: Record<string, unknown> = {}) {
  fixture.leads.push({
    id: 'lead-a',
    data: {
      source: 'website',
      firstInquiryAt: new Date('2026-11-01T05:00:00Z'),
      receivedAt: new Date('2026-11-01T05:00:00Z'),
      dedupeIdentityKey: hash,
      dedupeCanonicalLeadId: 'lead-a',
      acquisitionChannel: 'chatgpt',
      parentName: 'PRIVATE PARENT',
      childName: 'PRIVATE CHILD',
      primaryPhone: '9876543210',
      ...extra,
    },
  });
}

async function invoke(uid?: string, data: Record<string, unknown> = input) {
  // The mocked onCall exposes the production handler as an invocable function.
  const handler = getProspectiveAcquisitionSummary as unknown as
    (request: { auth: { uid: string } | null; data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  return handler({ auth: uid ? { uid } : null, data });
}

beforeEach(() => {
  fixture.principals.clear();
  fixture.leads.length = 0;
  fixture.principalReads.length = 0;
  fixture.leadQueryFields.length = 0;
});

describe('ARG-2 callable authorization and aggregate privacy boundary', () => {
  it.each(['admin', 'founder'])('allows active canonical %s and returns aggregates only', async (role) => {
    principal('allowed', [role]);
    candidate();
    const result = await invoke('allowed');

    expect(fixture.principalReads).toEqual(['authAccessReadModels/allowed']);
    expect(fixture.leadQueryFields).toEqual([
      'firstInquiryAt', 'receivedAt', 'requestedAt', 'createdAt',
    ]);
    expect(result).toMatchObject({
      startDateKey: '2026-11-01',
      endDateKey: '2026-11-01',
      cutoverDateKey: '2026-11-01',
      newParentChildEnquiries: 1,
      unresolvedCandidateRecords: 0,
      channels: { chatgpt: 1 },
      basis: 'first_observed_canonical_parent_child',
      repeatsAvailable: false,
    });
    const serialized = JSON.stringify(result);
    for (const secret of ['PRIVATE PARENT', 'PRIVATE CHILD', '9876543210', 'lead-a', hash]) {
      expect(serialized).not.toContain(secret);
    }
  });

  it('rejects an unauthenticated request before reading Firestore', async () => {
    await expect(invoke()).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(fixture.principalReads).toEqual([]);
    expect(fixture.leadQueryFields).toEqual([]);
  });

  it.each(['teacher', 'parent', 'learningPartner'])(
    'denies active %s before querying leads', async (role) => {
      principal('denied', [role]);
      candidate();
      await expect(invoke('denied')).rejects.toMatchObject({ code: 'permission-denied' });
      expect(fixture.leadQueryFields).toEqual([]);
    },
  );

  it.each([
    { label: 'suspended Admin', role: 'admin', overrides: { personStatus: 'suspended', authStatus: 'disabled', accessActive: false } },
    { label: 'archived Founder', role: 'founder', overrides: { personStatus: 'archived', authStatus: 'archived', accessActive: false } },
    { label: 'malformed active lifecycle', role: 'admin', overrides: { authStatus: 'disabled', accessActive: true } },
  ])('denies $label and fails closed', async ({ role, overrides }) => {
    principal('inactive', [role], overrides);
    candidate();
    await expect(invoke('inactive')).rejects.toMatchObject({ code: 'permission-denied' });
    expect(fixture.leadQueryFields).toEqual([]);
  });

  it('denies a missing canonical UID principal without legacy fallback', async () => {
    await expect(invoke('missing')).rejects.toMatchObject({ code: 'permission-denied' });
    expect(fixture.principalReads).toEqual(['authAccessReadModels/missing']);
    expect(fixture.leadQueryFields).toEqual([]);
  });

  it('rejects invalid cutover and dates without querying leads', async () => {
    principal('admin1', ['admin']);
    await expect(invoke('admin1', {
      startDateKey: '2026-10-31', endDateKey: '2026-11-01',
    })).rejects.toMatchObject({ code: 'invalid-argument' });
    await expect(invoke('admin1', {
      startDateKey: '2026-11-01', endDateKey: '2027-03-01',
    })).rejects.toMatchObject({ code: 'invalid-argument' });
    await expect(invoke('admin1', {
      startDateKey: '2026-11-31', endDateKey: '2026-11-31',
    })).rejects.toMatchObject({ code: 'invalid-argument' });
    expect(fixture.leadQueryFields).toEqual([]);
  });

  it('refuses a truncated 1201-record timestamp slice rather than returning partial totals', async () => {
    principal('admin1', ['admin']);
    for (let i = 0; i < 1201; i += 1) {
      fixture.leads.push({
        id: 'lead-' + i,
        data: { firstInquiryAt: new Date('2026-11-01T06:00:00Z') },
      });
    }
    await expect(invoke('admin1')).rejects.toMatchObject({ code: 'resource-exhausted' });
  });

  it('keeps unresolved canonicalization separate and unknown channels allowlisted', async () => {
    principal('admin1', ['admin']);
    candidate({ acquisitionChannel: 'not-an-allowlisted-channel' });
    fixture.leads.push({
      id: 'pending',
      data: {
        source: 'website',
        firstInquiryAt: new Date('2026-11-01T07:00:00Z'),
        parentName: 'OTHER PRIVATE PARENT',
      },
    });
    const result = await invoke('admin1');
    expect(result).toMatchObject({
      newParentChildEnquiries: 1,
      unresolvedCandidateRecords: 1,
      channels: { unknown: 1 },
    });
    expect(JSON.stringify(result)).not.toContain('OTHER PRIVATE PARENT');
  });
});
