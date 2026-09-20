import type { Firestore } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';
import {
  ATTENDANCE_VALIDATION_CONFIG_COLLECTION,
  ATTENDANCE_VALIDATION_TEAMS_CONFIG_DOC,
  AVS_ORGANIZER_BOOTSTRAP_EVIDENCE_LIMIT,
  isMicrosoftEntraObjectId,
  resolveAttendanceValidationOrganizerUserId,
} from '../src/attendanceValidation/organizerConfig';

function fakeFirestore(args: {
  configuredOrganizer?: string | null;
  evidenceOrganizers?: string[];
}) {
  let configReads = 0;
  let evidenceReads = 0;
  const writes: Record<string, unknown>[] = [];

  const configDoc = {
    async get() {
      configReads += 1;
      const exists = args.configuredOrganizer !== null
        && args.configuredOrganizer !== undefined;
      return {
        exists,
        data: () => exists
          ? { organizerUserId: args.configuredOrganizer }
          : undefined,
      };
    },
    async set(value: Record<string, unknown>) {
      writes.push(value);
    },
  };

  const evidenceDocs = (args.evidenceOrganizers ?? []).map((organizerUserId) => ({
    data: () => ({ organizerUserId }),
  }));

  const evidenceQuery = {
    orderBy() {
      return evidenceQuery;
    },
    limit(value: number) {
      expect(value).toBe(AVS_ORGANIZER_BOOTSTRAP_EVIDENCE_LIMIT);
      return evidenceQuery;
    },
    async get() {
      evidenceReads += evidenceDocs.length;
      return {
        docs: evidenceDocs,
        size: evidenceDocs.length,
      };
    },
  };

  const db = {
    collection(name: string) {
      if (name === ATTENDANCE_VALIDATION_CONFIG_COLLECTION) {
        return {
          doc(id: string) {
            expect(id).toBe(ATTENDANCE_VALIDATION_TEAMS_CONFIG_DOC);
            return configDoc;
          },
        };
      }
      if (name === 'attendanceValidationEvidence') return evidenceQuery;
      throw new Error(`Unexpected collection ${name}`);
    },
  } as unknown as Firestore;

  return {
    db,
    writes,
    counters: () => ({ configReads, evidenceReads }),
  };
}

describe('AVS Teams organizer config contract', () => {
  const organizerA = '11111111-2222-3333-4444-555555555555';
  const organizerB = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('keeps organizer configuration backend-only and bounded', () => {
    expect(ATTENDANCE_VALIDATION_CONFIG_COLLECTION)
      .toBe('attendanceValidationConfig');
    expect(ATTENDANCE_VALIDATION_TEAMS_CONFIG_DOC).toBe('teams');
    expect(AVS_ORGANIZER_BOOTSTRAP_EVIDENCE_LIMIT).toBe(25);
  });

  it('accepts a valid configured Entra object ID without scanning evidence', async () => {
    const fake = fakeFirestore({
      configuredOrganizer: organizerA,
      evidenceOrganizers: [organizerB],
    });

    await expect(resolveAttendanceValidationOrganizerUserId(fake.db))
      .resolves.toMatchObject({
        organizerUserId: organizerA,
        source: 'config',
        firestoreReadCount: 1,
        configWriteCount: 0,
      });
    expect(fake.counters()).toEqual({ configReads: 1, evidenceReads: 0 });
    expect(fake.writes).toHaveLength(0);
  });

  it.each([
    'teacher@tinysteps.example',
    'teacher.example#EXT#@tenant.onmicrosoft.com',
    '',
    'not-a-guid',
  ])('rejects invalid configured organizer value %j', async (configuredOrganizer) => {
    const fake = fakeFirestore({
      configuredOrganizer,
      evidenceOrganizers: [organizerA],
    });

    await expect(resolveAttendanceValidationOrganizerUserId(fake.db))
      .rejects.toThrow('organizer_config_invalid');
    expect(fake.counters()).toEqual({ configReads: 1, evidenceReads: 0 });
    expect(fake.writes).toHaveLength(0);
  });

  it('validates the structural Entra object ID contract', () => {
    expect(isMicrosoftEntraObjectId(organizerA)).toBe(true);
    expect(isMicrosoftEntraObjectId('teacher@tinysteps.example')).toBe(false);
    expect(isMicrosoftEntraObjectId('')).toBe(false);
  });

  it('bootstraps once when bounded prior AV2 evidence proves one organizer', async () => {
    const fake = fakeFirestore({
      configuredOrganizer: null,
      evidenceOrganizers: [
        'teacher@tinysteps.example',
        organizerA,
        organizerA.toUpperCase(),
      ],
    });

    await expect(resolveAttendanceValidationOrganizerUserId(fake.db))
      .resolves.toMatchObject({
        organizerUserId: organizerA,
        source: 'bootstrapped_from_evidence',
        firestoreReadCount: 4,
        configWriteCount: 1,
      });
    expect(fake.counters()).toEqual({ configReads: 1, evidenceReads: 3 });
    expect(fake.writes).toHaveLength(1);
    expect(fake.writes[0]).toMatchObject({
      schemaVersion: 1,
      organizerUserId: organizerA,
      source: 'bootstrapped_from_existing_av2_evidence',
      browserAccessAllowed: false,
    });
  });

  it('fails closed when no prior evidence can establish the organizer', async () => {
    const fake = fakeFirestore({
      configuredOrganizer: null,
      evidenceOrganizers: [
        'teacher@tinysteps.example',
        'teacher.example#EXT#@tenant.onmicrosoft.com',
      ],
    });

    await expect(resolveAttendanceValidationOrganizerUserId(fake.db))
      .rejects.toThrow('organizer_identity_unresolved');
    expect(fake.writes).toHaveLength(0);
  });

  it('fails closed instead of guessing across multiple organizer IDs', async () => {
    const fake = fakeFirestore({
      configuredOrganizer: null,
      evidenceOrganizers: [organizerA, organizerB],
    });

    await expect(resolveAttendanceValidationOrganizerUserId(fake.db))
      .rejects.toThrow('organizer_identity_ambiguous');
    expect(fake.writes).toHaveLength(0);
  });
});
