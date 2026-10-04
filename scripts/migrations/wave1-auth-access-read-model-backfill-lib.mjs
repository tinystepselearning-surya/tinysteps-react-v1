import { createHash } from 'node:crypto';

export const AUTH_ACCESS_BACKFILL_VERSION = 1;

const COMPARED_FIELDS = [
  'schemaVersion',
  'authority',
  'firebaseUid',
  'personId',
  'personStatus',
  'authStatus',
  'accessActive',
  'globalRoles',
  'schoolAdminOrganisationIds',
  'sourceAuthIdentityId',
];

export function privacyToken(
  namespace,
  value,
) {
  return createHash('sha256')
    .update(
      `${namespace}\u001f${String(value || '')}`,
      'utf8',
    )
    .digest('hex')
    .slice(0, 12);
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter(
          (item) =>
            typeof item === 'string' &&
            item.trim(),
        )
        .map((item) => item.trim()),
    ),
  ].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function normalizeAccessRecord(
  value,
) {
  const source =
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
      ? value
      : {};

  const normalized = {};
  for (const field of COMPARED_FIELDS) {
    const raw = source[field];
    if (
      field === 'globalRoles' ||
      field ===
        'schoolAdminOrganisationIds'
    ) {
      normalized[field] =
        normalizeStringList(raw);
      continue;
    }
    normalized[field] =
      raw === undefined ? null : raw;
  }
  return normalized;
}

export function accessRecordMatches(
  existing,
  expected,
) {
  return (
    JSON.stringify(
      normalizeAccessRecord(existing),
    ) ===
    JSON.stringify(
      normalizeAccessRecord(expected),
    )
  );
}

export function classifyAccessRecord(params) {
  const {
    firebaseUid,
    expected,
    existing,
  } = params;

  if (!existing) {
    return {
      state: 'create',
      reason: null,
    };
  }

  if (
    existing.authority !==
    'canonical-derived'
  ) {
    return {
      state: 'conflict',
      reason:
        'existing_document_not_canonical_derived',
    };
  }

  if (
    typeof existing.firebaseUid !==
      'string' ||
    existing.firebaseUid.trim() !==
      firebaseUid
  ) {
    return {
      state: 'conflict',
      reason:
        'existing_firebase_uid_mismatch',
    };
  }

  if (
    accessRecordMatches(
      existing,
      expected,
    )
  ) {
    return {
      state: 'unchanged',
      reason: null,
    };
  }

  return {
    state: 'update',
    reason: null,
  };
}

export function buildAccessBackfillPlan(params) {
  const {
    expectedByUid,
    existingByUid,
    maxSampleSize = 20,
  } = params;

  const items = [];
  const counts = {
    expected: expectedByUid.size,
    existing: existingByUid.size,
    create: 0,
    update: 0,
    unchanged: 0,
    conflict: 0,
    unexpected: 0,
  };
  const samples = {
    create: [],
    update: [],
    conflict: [],
    unexpected: [],
  };

  for (
    const firebaseUid of
    [...expectedByUid.keys()].sort()
  ) {
    const expected =
      expectedByUid.get(firebaseUid);
    const existing =
      existingByUid.get(firebaseUid) ||
      null;
    const classification =
      classifyAccessRecord({
        firebaseUid,
        expected,
        existing,
      });

    counts[classification.state] += 1;

    const item = {
      firebaseUid,
      expected,
      state:
        classification.state,
      reason:
        classification.reason,
    };
    items.push(item);

    if (
      classification.state !==
        'unchanged' &&
      samples[classification.state] &&
      samples[classification.state]
        .length < maxSampleSize
    ) {
      samples[
        classification.state
      ].push({
        uidToken:
          privacyToken(
            'uid',
            firebaseUid,
          ),
        reason:
          classification.reason,
      });
    }
  }

  for (
    const firebaseUid of
    [...existingByUid.keys()].sort()
  ) {
    if (
      expectedByUid.has(firebaseUid)
    ) {
      continue;
    }

    counts.unexpected += 1;
    if (
      samples.unexpected.length <
      maxSampleSize
    ) {
      samples.unexpected.push({
        uidToken:
          privacyToken(
            'uid',
            firebaseUid,
          ),
      });
    }
  }

  const pendingWrites =
    counts.create + counts.update;
  const blockingIssues =
    counts.conflict +
    counts.unexpected;

  return {
    version:
      AUTH_ACCESS_BACKFILL_VERSION,
    counts: {
      ...counts,
      pendingWrites,
      blockingIssues,
    },
    samples,
    items,
    readyForWrite:
      blockingIssues === 0,
    reconciled:
      blockingIssues === 0 &&
      pendingWrites === 0,
  };
}
