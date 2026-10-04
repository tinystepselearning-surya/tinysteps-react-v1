import { describe, expect, it } from 'vitest';
import type * as admin from 'firebase-admin';

import {
  loadWorksheetParentIdentity,
} from '../src/getParentWorksheetResources';
import type {
  LegacyAuthoritativeIdentityRead,
} from '../src/schoolOS/identity/readAdapter';
import {
  IDENTITY_SHADOW_CANARY_READER,
  IDENTITY_SHADOW_CANARY_SAMPLE_PERCENT,
  buildIdentityShadowCanaryAdapterErrorTelemetry,
  buildIdentityShadowCanaryTelemetry,
  identityShadowCanaryBucket,
  identityShadowIstDayBucket,
  shouldRunIdentityShadowCanary,
} from '../src/schoolOS/identity/shadowCanary';

type Row = Record<string, unknown> | null;

function buildPointReadDb(rows: Record<string, Row>) {
  const reads: string[] = [];

  const db = {
    collection(collection: string) {
      return {
        doc(id: string) {
          const path = `${collection}/${id}`;
          return {
            async get() {
              reads.push(path);
              const data = rows[path] ?? null;
              return {
                exists: Boolean(data),
                data: () => data,
              };
            },
          };
        },
      };
    },
  } as unknown as admin.firestore.Firestore;

  return { db, reads };
}

function shadowResult(params: {
  uid: string;
  legacyData?: Record<string, unknown> | null;
  status?: LegacyAuthoritativeIdentityRead['shadow']['status'];
}): LegacyAuthoritativeIdentityRead {
  const legacyData =
    params.legacyData === undefined
      ? {
        displayName: 'Parent One',
        role: 'parent',
        status: 'active',
      }
      : params.legacyData;

  return {
    authority: 'legacy',
    sourceCollection: 'users',
    legacyExists: Boolean(legacyData),
    legacyData,
    shadow: {
      mode: 'shadow_legacy_authoritative',
      sourceCollection: 'users',
      subjectToken: 'a1b2c3d4e5f6',
      status: params.status ?? 'match',
      canonicalDocumentsExpected: 3,
      canonicalDocumentsRead: 3,
      missingCanonicalKinds: [],
      mismatchFields: [],
      canonicalReadErrorKinds: [],
      legacyReadMs: 2,
      canonicalReadMs: 4,
    },
  };
}

describe('Wave 1 identity SWITCH READS Brick 2 canary sampling', () => {
  it('uses an IST business-day bucket for rotating deterministic sampling', () => {
    expect(
      identityShadowIstDayBucket(
        Date.parse('2026-10-04T18:29:59.000Z'),
      ),
    ).toBe('2026-10-04');

    expect(
      identityShadowIstDayBucket(
        Date.parse('2026-10-04T18:30:00.000Z'),
      ),
    ).toBe('2026-10-05');

    const input = {
      reader: IDENTITY_SHADOW_CANARY_READER,
      sourceCollection: 'users' as const,
      sourceId: 'parent-1',
      dayBucket: '2026-10-04',
    };

    const first = identityShadowCanaryBucket(input);
    const second = identityShadowCanaryBucket(input);

    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(100);
  });

  it('honours explicit zero and full sampling gates', () => {
    const base = {
      reader: IDENTITY_SHADOW_CANARY_READER,
      sourceCollection: 'users' as const,
      sourceId: 'parent-1',
      nowMs: Date.parse('2026-10-04T06:00:00Z'),
    };

    expect(
      shouldRunIdentityShadowCanary({
        ...base,
        samplePercent: 0,
      }),
    ).toBe(false);

    expect(
      shouldRunIdentityShadowCanary({
        ...base,
        samplePercent: 100,
      }),
    ).toBe(true);

    expect(IDENTITY_SHADOW_CANARY_SAMPLE_PERCENT).toBe(20);
  });

  it('builds privacy-safe structured telemetry without raw IDs', () => {
    const result = shadowResult({ uid: 'parent-secret' });
    const telemetry = buildIdentityShadowCanaryTelemetry({
      reader: IDENTITY_SHADOW_CANARY_READER,
      observation: result.shadow,
      nowMs: Date.parse('2026-10-04T06:00:00Z'),
    });

    expect(telemetry).toMatchObject({
      event: 'wave1_identity_shadow_canary',
      reader: 'getParentWorksheetResources',
      sourceCollection: 'users',
      status: 'match',
      canonicalDocumentsExpected: 3,
      canonicalDocumentsRead: 3,
      samplePercent: 20,
      dayBucket: '2026-10-04',
    });

    const errorTelemetry =
      buildIdentityShadowCanaryAdapterErrorTelemetry({
        reader: IDENTITY_SHADOW_CANARY_READER,
        sourceCollection: 'users',
        sourceId: 'parent-secret',
        error: new TypeError('sensitive raw message'),
        nowMs: Date.parse('2026-10-04T06:00:00Z'),
      });

    expect(errorTelemetry.errorName).toBe('TypeError');
    expect(errorTelemetry.subjectToken).toMatch(
      /^[a-f0-9]{12}$/,
    );

    const serialized = JSON.stringify({
      telemetry,
      errorTelemetry,
    });
    expect(serialized).not.toContain('parent-secret');
    expect(serialized).not.toContain('sensitive raw message');
  });
});

describe('Wave 1 identity SWITCH READS Brick 2 worksheet canary wiring', () => {
  it('keeps the exact legacy point read when the request is not sampled', async () => {
    const uid = 'parent-legacy';
    const { db, reads } = buildPointReadDb({
      [`users/${uid}`]: {
        displayName: 'Legacy Parent',
        role: 'parent',
        status: 'active',
      },
    });

    let shadowCalls = 0;
    const result = await loadWorksheetParentIdentity(
      db,
      uid,
      {
        shouldSample: () => false,
        readShadow: async () => {
          shadowCalls += 1;
          return shadowResult({ uid });
        },
      },
    );

    expect(result).toMatchObject({
      exists: true,
      shadowSampled: false,
    });
    expect(result.data?.displayName).toBe('Legacy Parent');
    expect(reads).toEqual([`users/${uid}`]);
    expect(shadowCalls).toBe(0);
  });

  it('uses the adapter legacy result on sampled calls without a duplicate legacy read', async () => {
    const uid = 'parent-sampled';
    const { db, reads } = buildPointReadDb({
      [`users/${uid}`]: {
        displayName: 'Direct Legacy Should Not Be Read',
      },
    });

    const observations: LegacyAuthoritativeIdentityRead[] = [];
    const result = await loadWorksheetParentIdentity(
      db,
      uid,
      {
        shouldSample: () => true,
        readShadow: async () =>
          shadowResult({
            uid,
            legacyData: {
              displayName: 'Adapter Legacy Parent',
              role: 'parent',
              status: 'active',
            },
          }),
        recordObservation: (observation) => {
          observations.push(observation);
        },
      },
    );

    expect(result).toMatchObject({
      exists: true,
      shadowSampled: true,
    });
    expect(result.data?.displayName).toBe(
      'Adapter Legacy Parent',
    );
    expect(reads).toEqual([]);
    expect(observations).toHaveLength(1);
    expect(observations[0].authority).toBe('legacy');
  });

  it('falls back to the pre-Brick-2 legacy read if the shadow adapter throws', async () => {
    const uid = 'parent-fallback';
    const { db, reads } = buildPointReadDb({
      [`users/${uid}`]: {
        displayName: 'Fallback Parent',
        role: 'parent',
        status: 'active',
      },
    });

    const failures: string[] = [];
    const result = await loadWorksheetParentIdentity(
      db,
      uid,
      {
        shouldSample: () => true,
        readShadow: async () => {
          throw new Error('forced adapter failure');
        },
        recordFailure: (sourceId) => {
          failures.push(sourceId);
        },
      },
    );

    expect(result).toMatchObject({
      exists: true,
      shadowSampled: false,
    });
    expect(result.data?.displayName).toBe('Fallback Parent');
    expect(reads).toEqual([`users/${uid}`]);
    expect(failures).toEqual([uid]);
  });

  it('never promotes canonical state when the adapter reports legacy missing', async () => {
    const uid = 'parent-missing';
    const { db, reads } = buildPointReadDb({
      [`users/${uid}`]: {
        displayName: 'Direct Legacy Must Not Override Adapter Result',
      },
    });

    const result = await loadWorksheetParentIdentity(
      db,
      uid,
      {
        shouldSample: () => true,
        readShadow: async () =>
          shadowResult({
            uid,
            legacyData: null,
            status: 'legacy_missing',
          }),
      },
    );

    expect(result).toEqual({
      exists: false,
      data: null,
      shadowSampled: true,
    });
    expect(reads).toEqual([]);
  });

  it('contains telemetry sink failures without changing the legacy business result', async () => {
    const uid = 'parent-telemetry-error';
    const { db } = buildPointReadDb({});

    const result = await loadWorksheetParentIdentity(
      db,
      uid,
      {
        shouldSample: () => true,
        readShadow: async () =>
          shadowResult({
            uid,
            legacyData: {
              displayName: 'Safe Parent',
              role: 'parent',
              status: 'active',
            },
          }),
        recordObservation: () => {
          throw new Error('telemetry sink unavailable');
        },
      },
    );

    expect(result.exists).toBe(true);
    expect(result.shadowSampled).toBe(true);
    expect(result.data?.displayName).toBe('Safe Parent');
  });
});
