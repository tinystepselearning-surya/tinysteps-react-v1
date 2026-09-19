import type { Firestore } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';
import {
  ATTENDANCE_VALIDATION_CONFIG_COLLECTION,
  ATTENDANCE_VALIDATION_TEAMS_CONFIG_DOC,
  AVS_ORGANIZER_BOOTSTRAP_EVIDENCE_LIMIT,
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
      return {
        exists: Boolean(args.configuredOrganizer),
        data: () => args.configuredOrganizer
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
  it('keeps organizer configuration backend-only and bounded', () => {
    expect(ATTENDANCE_VALIDATION_CONFIG_COLLECTION)
      .toBe('attendanceValidationConfig');
    expect(ATTENDANCE_VALIDATION_TEAMS_CONFIG_DOC).toBe('teams');
    expect(AVS_ORGANIZER_BOOTSTRAP_EVIDENCE_LIMIT).toBe(25);
  });

  it('uses explicit backend config without scanning evidence', async () => {
    const fake = fakeFirestore({
      configuredOrganizer: 'organizer-1',
      evidenceOrganizers: ['should-not-be-read'],
    });

    await expect(resolveAttendanceValidationOrganizerUserId(fake.db))
      .resolves.toMatchObject({
        organizerUserId: 'organizer-1',
        source: 'config',
        firestoreReadCount: 1,
        configWriteCount: 0,
      });
    expect(fake.counters()).toEqual({ configReads: 1, evidenceReads: 0 });
    expect(fake.writes).toHaveLength(0);
  });

  it('bootstraps once when bounded prior AV2 evidence proves one organizer', async () => {
    const fake = fakeFirestore({
      configuredOrganizer: null,
      evidenceOrganizers: ['organizer-1', 'organizer-1'],
    });

    await expect(resolveAttendanceValidationOrganizerUserId(fake.db))
      .resolves.toMatchObject({
        organizerUserId: 'organizer-1',
        source: 'bootstrapped_from_evidence',
        firestoreReadCount: 3,
        configWriteCount: 1,
      });
    expect(fake.counters()).toEqual({ configReads: 1, evidenceReads: 2 });
    expect(fake.writes).toHaveLength(1);
    expect(fake.writes[0]).toMatchObject({
      schemaVersion: 1,
      organizerUserId: 'organizer-1',
      source: 'bootstrapped_from_existing_av2_evidence',
      browserAccessAllowed: false,
    });
  });

  it('fails closed when no prior evidence can establish the organizer', async () => {
    const fake = fakeFirestore({
      configuredOrganizer: null,
      evidenceOrganizers: [],
    });

    await expect(resolveAttendanceValidationOrganizerUserId(fake.db))
      .rejects.toThrow('no prior evidence can bootstrap it');
    expect(fake.writes).toHaveLength(0);
  });

  it('fails closed instead of guessing across multiple organizer IDs', async () => {
    const fake = fakeFirestore({
      configuredOrganizer: null,
      evidenceOrganizers: ['organizer-1', 'organizer-2'],
    });

    await expect(resolveAttendanceValidationOrganizerUserId(fake.db))
      .rejects.toThrow('ambiguous across prior evidence');
    expect(fake.writes).toHaveLength(0);
  });
});
