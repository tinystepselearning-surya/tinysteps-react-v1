import {
  IDENTITY_SCHEMA_VERSION,
  type PersonStatus,
} from './contracts';
import {
  buildGuardianRelationshipId,
} from './idStrategy';

export const CANONICAL_PRIMARY_WRITE_SCHEMA_VERSION = 1 as const;
export const CANONICAL_PRIMARY_WRITE_AUTHORITY =
  'canonical-primary' as const;

export type CanonicalPrimaryCommand =
  | 'learner_create';

export interface CanonicalPrimaryOwnership {
  schemaVersion: typeof CANONICAL_PRIMARY_WRITE_SCHEMA_VERSION;
  authority: typeof CANONICAL_PRIMARY_WRITE_AUTHORITY;
  command: CanonicalPrimaryCommand;
  writeId: string;
}

export interface CanonicalPrimaryDocumentPlan {
  collection: string;
  documentId: string;
  data: Record<string, unknown>;
}

export interface CompatibilityDocumentPlan {
  collection: string;
  documentId: string;
  data: Record<string, unknown>;
}

export interface CompatibilityArrayUnionPlan {
  collection: string;
  documentId: string;
  field: string;
  value: string;
}

export interface CanonicalLearnerCreatePlan {
  command: 'learner_create';
  personId: string;
  writeId: string;
  canonicalDocuments: CanonicalPrimaryDocumentPlan[];
  compatibilityDocuments: CompatibilityDocumentPlan[];
  compatibilityArrayUnions: CompatibilityArrayUnionPlan[];
}

export interface CanonicalLearnerCreateInput {
  personId: string;
  parentId: string;
  displayName: string;
  ageYears: number;
  grade: string;
  status?: PersonStatus;
  countryCode?: string | null;
  summary?: Record<string, unknown> | null;
  actorId: string;
  writeId: string;
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(
  value: unknown,
  field: string,
): string {
  const text = cleanText(value);
  if (!text) {
    throw new Error(`${field}_required`);
  }
  if (text.includes('/')) {
    throw new Error(`${field}_must_not_contain_slash`);
  }
  return text;
}

function displayText(
  value: unknown,
  field: string,
): string {
  const text = cleanText(value).replace(/\s+/g, ' ');
  if (!text) {
    throw new Error(`${field}_required`);
  }
  return text;
}

function normalizeCountryCode(
  value: unknown,
): string | null {
  const text = cleanText(value).toUpperCase();
  if (!text) return null;
  if (!/^[A-Z]{2}$/.test(text)) {
    throw new Error('countryCode_not_iso_alpha2');
  }
  return text;
}

function normalizeStatus(
  value: unknown,
): PersonStatus {
  const text = cleanText(value).toLowerCase();
  if (!text) return 'active';
  if (
    text === 'active' ||
    text === 'suspended' ||
    text === 'archived'
  ) {
    return text;
  }
  throw new Error('learner_status_not_canonical');
}

function ownership(params: {
  command: CanonicalPrimaryCommand;
  writeId: string;
}): CanonicalPrimaryOwnership {
  return {
    schemaVersion: CANONICAL_PRIMARY_WRITE_SCHEMA_VERSION,
    authority: CANONICAL_PRIMARY_WRITE_AUTHORITY,
    command: params.command,
    writeId: params.writeId,
  };
}

function canonicalBase(params: {
  actorId: string;
  command: CanonicalPrimaryCommand;
  writeId: string;
}): Record<string, unknown> {
  return {
    schemaVersion: IDENTITY_SCHEMA_VERSION,
    createdBy: params.actorId,
    updatedBy: params.actorId,
    canonicalAuthority: ownership({
      command: params.command,
      writeId: params.writeId,
    }),
  };
}

function compatibilityMarker(params: {
  personId: string;
  command: CanonicalPrimaryCommand;
  writeId: string;
}): Record<string, unknown> {
  return {
    schemaVersion: CANONICAL_PRIMARY_WRITE_SCHEMA_VERSION,
    authority: CANONICAL_PRIMARY_WRITE_AUTHORITY,
    command: params.command,
    writeId: params.writeId,
    canonicalPersonId: params.personId,
  };
}

function learnerRelationshipStatus(
  status: PersonStatus,
): 'active' | 'ended' {
  return status === 'archived' ? 'ended' : 'active';
}

export function canonicalProjectionWriteId(
  data: Record<string, unknown> | null | undefined,
): string {
  const marker = data?._wave1CanonicalProjection;
  if (!marker || typeof marker !== 'object') return '';
  return cleanText(
    (marker as Record<string, unknown>).writeId,
  );
}

export function isCanonicalProjectionTransition(params: {
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
}): boolean {
  const afterWriteId =
    canonicalProjectionWriteId(params.afterData);
  if (!afterWriteId) return false;

  const beforeWriteId =
    canonicalProjectionWriteId(params.beforeData);

  return afterWriteId !== beforeWriteId;
}

export function planCanonicalLearnerCreate(
  input: CanonicalLearnerCreateInput,
): CanonicalLearnerCreatePlan {
  const personId = requiredText(
    input.personId,
    'personId',
  );
  const parentId = requiredText(
    input.parentId,
    'parentId',
  );
  const actorId = requiredText(
    input.actorId,
    'actorId',
  );
  const writeId = requiredText(
    input.writeId,
    'writeId',
  );
  const displayName = displayText(
    input.displayName,
    'displayName',
  );
  const grade = displayText(
    input.grade,
    'grade',
  );
  const status = normalizeStatus(input.status);
  const countryCode =
    normalizeCountryCode(input.countryCode);

  if (
    !Number.isInteger(input.ageYears) ||
    input.ageYears < 0 ||
    input.ageYears > 120
  ) {
    throw new Error('ageYears_not_canonical');
  }

  const command = 'learner_create' as const;
  const base = canonicalBase({
    actorId,
    command,
    writeId,
  });

  const guardianRelationshipId =
    buildGuardianRelationshipId({
      guardianPersonId: parentId,
      learnerPersonId: personId,
      relationshipType: 'parent',
    });

  const canonicalDocuments: CanonicalPrimaryDocumentPlan[] = [
    {
      collection: 'people',
      documentId: personId,
      data: {
        ...base,
        personId,
        kind: 'learner',
        status,
        displayName,
        ...(countryCode
          ? { countryCode }
          : {}),
      },
    },
    {
      collection: 'learnerProfiles',
      documentId: personId,
      data: {
        ...base,
        learnerProfileId: personId,
        personId,
        status,
        ageYears: input.ageYears,
        ...(countryCode
          ? { countryCode }
          : {}),
      },
    },
    {
      collection: 'guardianRelationships',
      documentId: guardianRelationshipId,
      data: {
        ...base,
        guardianRelationshipId,
        guardianPersonId: parentId,
        learnerPersonId: personId,
        relationshipType: 'parent',
        isPrimary: true,
        status: learnerRelationshipStatus(status),
      },
    },
    {
      collection: 'learnerDetails',
      documentId: personId,
      data: {
        ...base,
        learnerDetailsId: personId,
        personId,
        grade,
      },
    },
    ...(input.summary
      ? [{
          collection: 'learnerReadModels',
          documentId: personId,
          data: {
            ...base,
            learnerReadModelId: personId,
            personId,
            summary: input.summary,
          },
        }]
      : []),
  ];

  const compatibilityDocuments: CompatibilityDocumentPlan[] = [
    {
      collection: 'kids',
      documentId: personId,
      data: {
        fullName: displayName,
        name: displayName,
        displayName,
        age: input.ageYears,
        ageYears: input.ageYears,
        grade,
        status,
        ...(countryCode
          ? { countryCode }
          : {}),
        parentId,
        parentIds: [parentId],
        primaryParentId: parentId,
        ...(input.summary
          ? { summary: input.summary }
          : {}),
        _wave1CanonicalProjection:
          compatibilityMarker({
            personId,
            command,
            writeId,
          }),
      },
    },
  ];

  return {
    command,
    personId,
    writeId,
    canonicalDocuments,
    compatibilityDocuments,
    compatibilityArrayUnions: [{
      collection: 'users',
      documentId: parentId,
      field: 'childIds',
      value: personId,
    }],
  };
}
