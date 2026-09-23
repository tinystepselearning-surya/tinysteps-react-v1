import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { Av3StaffRegistrySnapshot } from './staffIdentityRegistry';
import {
  ATTENDANCE_VALIDATION_STAFF_IDENTITIES_COLLECTION,
  loadProductionStaffIdentityRegistry,
} from './staffIdentityRegistry';
import {
  planCachedTeacherIdentityRollout,
  registryWithAppliedIdentityMappings,
  type TeacherIdentityRolloutDecision,
} from './teacherIdentityRollout';
import type { AttendanceValidationEvidenceDocument } from './teamsEvidenceCollector';

export const ATTENDANCE_VALIDATION_MICROSOFT_IDENTITY_CLAIMS_COLLECTION =
  'attendanceValidationMicrosoftIdentityClaims';
export const AVS_MICROSOFT_IDENTITY_CLAIM_SCHEMA_VERSION = 1;

const SHA256_HEX = /^[a-f0-9]{64}$/;
const DISABLED_OVERRIDE_STATUSES = new Set([
  'inactive',
  'disabled',
  'archived',
  'deleted',
]);

export type TeacherIdentityBindingSource =
  | 'fresh_avs_evidence_email_bound'
  | 'cached_avs_evidence_email_bound'
  | 'registry_backfill';

export type TeacherIdentityBindingWriteStatus =
  | 'bound'
  | 'already_bound'
  | 'override_disabled'
  | 'override_conflict'
  | 'identity_claim_conflict';

export interface TeacherIdentityMappingWriteResult {
  status: TeacherIdentityBindingWriteStatus;
  teacherId: string;
  overrideWrite: boolean;
  claimWrite: boolean;
  transactionReadCount: number;
}

export interface AutomaticTeacherIdentityResult {
  decision: TeacherIdentityRolloutDecision | null;
  bindingStatus: TeacherIdentityBindingWriteStatus | 'not_eligible';
  overrideWrite: boolean;
  claimWrite: boolean;
  transactionReadCount: number;
  staffRegistry: Av3StaffRegistrySnapshot;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizedHash(value: unknown): string | null {
  const normalized = text(value).toLowerCase();
  return SHA256_HEX.test(normalized) ? normalized : null;
}

function normalizedHashArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map((candidate) => normalizedHash(candidate))
      .filter((candidate): candidate is string => Boolean(candidate)),
  )].sort();
}

function overrideDisabled(value: unknown): boolean {
  return DISABLED_OVERRIDE_STATUSES.has(text(value).toLowerCase());
}

export function registryWithoutMicrosoftIdentities(
  registry: Av3StaffRegistrySnapshot,
  staffIds: ReadonlySet<string>,
): Av3StaffRegistrySnapshot {
  if (staffIds.size === 0) return registry;
  return {
    ...registry,
    entries: registry.entries.map((entry) =>
      staffIds.has(entry.staffId)
        ? { ...entry, microsoftIdentityIdHashes: [] }
        : entry),
  };
}

export function planFreshEvidenceTeacherIdentity(
  evidence: AttendanceValidationEvidenceDocument,
  registry: Av3StaffRegistrySnapshot,
): TeacherIdentityRolloutDecision | null {
  const teacherId = text(evidence.session.teacherId);
  const classSessionId = text(evidence.session.classSessionId);
  const evidenceId = text(evidence.id);
  if (!teacherId || !classSessionId || !evidenceId) return null;

  const plan = planCachedTeacherIdentityRollout(
    [{
      caseId: classSessionId,
      classSessionId,
      teacherId,
      evidenceId,
      resolutionStatus: null,
    }],
    new Map([[evidenceId, evidence]]),
    registry,
  );

  return plan.decisions.find((decision) => decision.teacherId === teacherId)
    ?? null;
}

export async function claimAndBindTeacherIdentityMapping(params: {
  db: Firestore;
  teacherId: string;
  microsoftIdentityIdHash: string;
  source: Exclude<TeacherIdentityBindingSource, 'registry_backfill'>;
  supportingCaseCount: number;
}): Promise<TeacherIdentityMappingWriteResult> {
  const teacherId = text(params.teacherId);
  const candidateHash = normalizedHash(params.microsoftIdentityIdHash);
  if (!teacherId || teacherId.includes('/') || !candidateHash) {
    throw new TypeError('Teacher identity mapping input is invalid.');
  }

  const overrideRef = params.db
    .collection(ATTENDANCE_VALIDATION_STAFF_IDENTITIES_COLLECTION)
    .doc(teacherId);
  const claimRef = params.db
    .collection(ATTENDANCE_VALIDATION_MICROSOFT_IDENTITY_CLAIMS_COLLECTION)
    .doc(candidateHash);

  return params.db.runTransaction(async (transaction) => {
    const overrideSnapshot = await transaction.get(overrideRef);
    const claimSnapshot = await transaction.get(claimRef);
    const overrideData = overrideSnapshot.exists
      ? (overrideSnapshot.data() || {}) as Record<string, unknown>
      : {};
    const claimData = claimSnapshot.exists
      ? (claimSnapshot.data() || {}) as Record<string, unknown>
      : {};

    if (overrideDisabled(overrideData.status)) {
      return {
        status: 'override_disabled' as const,
        teacherId,
        overrideWrite: false,
        claimWrite: false,
        transactionReadCount: 2,
      };
    }

    const existingHashes = normalizedHashArray(
      overrideData.microsoftIdentityIdHashes,
    );
    if (
      existingHashes.length > 1
      || (existingHashes.length === 1 && existingHashes[0] !== candidateHash)
    ) {
      return {
        status: 'override_conflict' as const,
        teacherId,
        overrideWrite: false,
        claimWrite: false,
        transactionReadCount: 2,
      };
    }

    const claimOwner = text(claimData.staffId);
    if (claimOwner && claimOwner !== teacherId) {
      return {
        status: 'identity_claim_conflict' as const,
        teacherId,
        overrideWrite: false,
        claimWrite: false,
        transactionReadCount: 2,
      };
    }

    const overrideWrite = existingHashes.length === 0;
    const claimWrite = !claimSnapshot.exists;

    if (overrideWrite) {
      transaction.set(overrideRef, {
        staffId: teacherId,
        microsoftIdentityIdHashes: [candidateHash],
        source: params.source,
        supportingCaseCount: params.supportingCaseCount,
        updatedAt: FieldValue.serverTimestamp(),
        operationalMutationAllowed: false,
      }, { merge: true });
    }

    if (claimWrite) {
      transaction.set(claimRef, {
        schemaVersion: AVS_MICROSOFT_IDENTITY_CLAIM_SCHEMA_VERSION,
        staffId: teacherId,
        source: params.source,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        operationalMutationAllowed: false,
      }, { merge: false });
    }

    return {
      status: overrideWrite ? 'bound' as const : 'already_bound' as const,
      teacherId,
      overrideWrite,
      claimWrite,
      transactionReadCount: 2,
    };
  });
}

export async function bindTeacherIdentityFromFreshEvidence(params: {
  db: Firestore;
  evidence: AttendanceValidationEvidenceDocument;
  staffRegistry?: Av3StaffRegistrySnapshot;
  source?: Extract<TeacherIdentityBindingSource, 'fresh_avs_evidence_email_bound'>;
}): Promise<AutomaticTeacherIdentityResult> {
  const registry = params.staffRegistry
    ?? await loadProductionStaffIdentityRegistry(params.db);
  const decision = planFreshEvidenceTeacherIdentity(params.evidence, registry);
  const candidateHash = normalizedHash(decision?.candidateHash);

  if (
    !decision
    || !candidateHash
    || !['ready', 'already_mapped'].includes(decision.status)
  ) {
    return {
      decision,
      bindingStatus: 'not_eligible',
      overrideWrite: false,
      claimWrite: false,
      transactionReadCount: 0,
      staffRegistry: registry,
    };
  }

  const binding = await claimAndBindTeacherIdentityMapping({
    db: params.db,
    teacherId: decision.teacherId,
    microsoftIdentityIdHash: candidateHash,
    source: params.source ?? 'fresh_avs_evidence_email_bound',
    supportingCaseCount: Math.max(1, decision.supportingCaseCount),
  });

  if (
    binding.status === 'bound'
    || binding.status === 'already_bound'
  ) {
    return {
      decision,
      bindingStatus: binding.status,
      overrideWrite: binding.overrideWrite,
      claimWrite: binding.claimWrite,
      transactionReadCount: binding.transactionReadCount,
      staffRegistry: registryWithAppliedIdentityMappings(registry, [{
        teacherId: decision.teacherId,
        microsoftIdentityIdHash: candidateHash,
      }]),
    };
  }

  const failClosedRegistry = decision.status === 'already_mapped'
    ? registryWithoutMicrosoftIdentities(
        registry,
        new Set([decision.teacherId]),
      )
    : registry;

  return {
    decision,
    bindingStatus: binding.status,
    overrideWrite: false,
    claimWrite: false,
    transactionReadCount: binding.transactionReadCount,
    staffRegistry: failClosedRegistry,
  };
}

export async function backfillMicrosoftIdentityClaimsFromRegistry(
  db: Firestore,
  registry: Av3StaffRegistrySnapshot,
) {
  const owners = new Map<string, Set<string>>();
  for (const entry of registry.entries) {
    for (const rawHash of entry.microsoftIdentityIdHashes) {
      const identityHash = normalizedHash(rawHash);
      if (!identityHash) continue;
      if (!owners.has(identityHash)) owners.set(identityHash, new Set());
      owners.get(identityHash)!.add(entry.staffId);
    }
  }

  let claimWrites = 0;
  let alreadyOwned = 0;
  let readCount = 0;
  const conflictingStaffIds = new Set<string>();
  let conflictCount = 0;

  for (const [identityHash, staffIds] of owners.entries()) {
    if (staffIds.size !== 1) {
      conflictCount += 1;
      for (const staffId of staffIds) conflictingStaffIds.add(staffId);
      continue;
    }

    const staffId = [...staffIds][0];
    const claimRef = db
      .collection(ATTENDANCE_VALIDATION_MICROSOFT_IDENTITY_CLAIMS_COLLECTION)
      .doc(identityHash);
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(claimRef);
      const owner = snapshot.exists
        ? text((snapshot.data() || {}).staffId)
        : '';
      if (owner && owner !== staffId) {
        return { status: 'conflict' as const, readCount: 1 };
      }
      if (owner === staffId) {
        return { status: 'already' as const, readCount: 1 };
      }
      transaction.set(claimRef, {
        schemaVersion: AVS_MICROSOFT_IDENTITY_CLAIM_SCHEMA_VERSION,
        staffId,
        source: 'registry_backfill',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        operationalMutationAllowed: false,
      }, { merge: false });
      return { status: 'written' as const, readCount: 1 };
    });

    readCount += result.readCount;
    if (result.status === 'written') claimWrites += 1;
    else if (result.status === 'already') alreadyOwned += 1;
    else {
      conflictCount += 1;
      conflictingStaffIds.add(staffId);
    }
  }

  return {
    candidateCount: owners.size,
    claimWrites,
    alreadyOwned,
    conflictCount,
    readCount,
    conflictingStaffIds,
  };
}
