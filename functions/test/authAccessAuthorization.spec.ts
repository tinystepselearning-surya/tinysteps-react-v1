import { describe, expect, it } from 'vitest';
import type * as admin from 'firebase-admin';

import {
  loadCurrentAuthAccessPrincipal,
  parseCurrentAuthAccessPrincipal,
  principalHasGlobalRole,
  principalHasSchoolAdminAccess,
} from '../src/schoolOS/identity/authAccessAuthorization';

type Row = Record<string, unknown> | null;

class FakeDocRef {
  constructor(
    private readonly path: string,
    private readonly rows: Map<string, Row>,
    private readonly reads: string[],
  ) {}

  async get() {
    this.reads.push(this.path);
    const data =
      this.rows.get(this.path) ?? null;

    return {
      exists: Boolean(data),
      data: () => data,
    };
  }
}

class FakeCollection {
  constructor(
    private readonly name: string,
    private readonly rows: Map<string, Row>,
    private readonly reads: string[],
  ) {}

  doc(id: string) {
    return new FakeDocRef(
      `${this.name}/${id}`,
      this.rows,
      this.reads,
    );
  }
}

function buildDb(
  initial: Record<string, Row>,
) {
  const rows = new Map<string, Row>(
    Object.entries(initial),
  );
  const reads: string[] = [];

  const db = {
    collection(name: string) {
      return new FakeCollection(
        name,
        rows,
        reads,
      );
    },
  } as unknown as admin.firestore.Firestore;

  return {
    db,
    reads,
  };
}

function record(
  overrides: Record<string, unknown> = {},
) {
  return {
    schemaVersion: 1,
    authority: 'canonical-derived',
    firebaseUid: 'uid-1',
    personId: 'person-1',
    personStatus: 'active',
    authStatus: 'active',
    accessActive: true,
    globalRoles: ['admin'],
    schoolAdminOrganisationIds: [
      'school-1',
    ],
    sourceAuthIdentityId:
      'firebase-auth-identity-1',
    ...overrides,
  };
}

describe('Wave 1 R5C canonical backend authorization reader', () => {
  it('parses active canonical access and authorizes only projected roles/scopes', () => {
    const principal =
      parseCurrentAuthAccessPrincipal({
        documentId: 'uid-1',
        data: record(),
      });

    expect(
      principalHasGlobalRole(
        principal,
        'admin',
      ),
    ).toBe(true);
    expect(
      principalHasGlobalRole(
        principal,
        'teacher',
      ),
    ).toBe(false);
    expect(
      principalHasSchoolAdminAccess(
        principal,
        'school-1',
      ),
    ).toBe(true);
    expect(
      principalHasSchoolAdminAccess(
        principal,
        'school-2',
      ),
    ).toBe(false);
  });

  it('accepts a consistent inactive lifecycle record but denies every role predicate', () => {
    const principal =
      parseCurrentAuthAccessPrincipal({
        documentId: 'uid-1',
        data: record({
          personStatus: 'suspended',
          authStatus: 'disabled',
          accessActive: false,
        }),
      });

    expect(principal.accessActive)
      .toBe(false);
    expect(
      principalHasGlobalRole(
        principal,
        'admin',
      ),
    ).toBe(false);
    expect(
      principalHasSchoolAdminAccess(
        principal,
        'school-1',
      ),
    ).toBe(false);
  });

  it('fails closed when lifecycle flags contradict canonical statuses', () => {
    expect(() =>
      parseCurrentAuthAccessPrincipal({
        documentId: 'uid-1',
        data: record({
          authStatus: 'disabled',
          accessActive: true,
        }),
      }),
    ).toThrow(
      'auth_access_active_inconsistent',
    );
  });

  it('fails closed on schema, authority, UID or required identity mismatch', () => {
    expect(() =>
      parseCurrentAuthAccessPrincipal({
        documentId: 'uid-1',
        data: record({
          schemaVersion: 2,
        }),
      }),
    ).toThrow(
      'auth_access_schema_version_invalid',
    );

    expect(() =>
      parseCurrentAuthAccessPrincipal({
        documentId: 'uid-1',
        data: record({
          authority: 'legacy',
        }),
      }),
    ).toThrow(
      'auth_access_authority_invalid',
    );

    expect(() =>
      parseCurrentAuthAccessPrincipal({
        documentId: 'uid-1',
        data: record({
          firebaseUid: 'uid-2',
        }),
      }),
    ).toThrow(
      'auth_access_firebase_uid_mismatch',
    );

    expect(() =>
      parseCurrentAuthAccessPrincipal({
        documentId: 'uid-1',
        data: record({
          personId: '',
        }),
      }),
    ).toThrow('personId_required');
  });

  it('fails closed on invalid or duplicate global roles and school scopes', () => {
    expect(() =>
      parseCurrentAuthAccessPrincipal({
        documentId: 'uid-1',
        data: record({
          globalRoles: ['admin', 'root'],
        }),
      }),
    ).toThrow(
      'auth_access_global_role_invalid',
    );

    expect(() =>
      parseCurrentAuthAccessPrincipal({
        documentId: 'uid-1',
        data: record({
          globalRoles: ['admin', 'admin'],
        }),
      }),
    ).toThrow(
      'auth_access_global_role_duplicate',
    );

    expect(() =>
      parseCurrentAuthAccessPrincipal({
        documentId: 'uid-1',
        data: record({
          schoolAdminOrganisationIds: [
            'school-1',
            'school-1',
          ],
        }),
      }),
    ).toThrow(
      'auth_access_school_id_duplicate',
    );
  });

  it('loads exactly one UID-keyed read-model document and never reads legacy identity roots', async () => {
    const {
      db,
      reads,
    } = buildDb({
      'authAccessReadModels/uid-1':
        record(),
    });

    const principal =
      await loadCurrentAuthAccessPrincipal({
        db,
        firebaseUid: 'uid-1',
      });

    expect(principal.personId)
      .toBe('person-1');
    expect(reads).toEqual([
      'authAccessReadModels/uid-1',
    ]);
    expect(
      reads.some(
        (path) =>
          path.startsWith('users/') ||
          path.startsWith('schoolUsers/'),
      ),
    ).toBe(false);
  });

  it('fails closed when the reconciled access document is missing', async () => {
    const {
      db,
    } = buildDb({});

    await expect(
      loadCurrentAuthAccessPrincipal({
        db,
        firebaseUid: 'uid-missing',
      }),
    ).rejects.toThrow(
      'auth_access_read_model_missing',
    );
  });
});
