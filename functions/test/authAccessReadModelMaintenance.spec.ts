import { describe, expect, it } from 'vitest';
import type * as admin from 'firebase-admin';

import {
  buildAuthIdentityId,
} from '../src/schoolOS/identity/idStrategy';
import {
  deleteAuthAccessReadModelStrict,
  refreshAuthAccessReadModelBestEffort,
  refreshAuthAccessReadModelStrict,
} from '../src/schoolOS/identity/authAccessReadModelMaintenance';

type Row = Record<string, unknown> | null;

class FakeDocRef {
  constructor(
    public readonly path: string,
    private readonly rows: Map<string, Row>,
    private readonly writes: string[],
  ) {}

  async get() {
    const data = this.rows.get(this.path) ?? null;
    return {
      exists: Boolean(data),
      data: () => data,
    };
  }

  async set(data: Record<string, unknown>) {
    this.writes.push('set:' + this.path);
    this.rows.set(this.path, data);
  }

  async delete() {
    this.writes.push('delete:' + this.path);
    this.rows.delete(this.path);
  }
}

class FakeQuery {
  private field = '';
  private value: unknown;
  private max = 1000;

  constructor(
    private readonly collectionName: string,
    private readonly rows: Map<string, Row>,
  ) {}

  where(
    field: string,
    op: string,
    value: unknown,
  ) {
    if (op !== '==') {
      throw new Error('unsupported_operator');
    }
    this.field = field;
    this.value = value;
    return this;
  }

  limit(max: number) {
    this.max = max;
    return this;
  }

  async get() {
    const prefix =
      this.collectionName + '/';
    const docs = [...this.rows.entries()]
      .filter(([path, row]) => {
        if (!path.startsWith(prefix) || !row) {
          return false;
        }
        return (
          (row as Record<string, unknown>)[
            this.field
          ] === this.value
        );
      })
      .slice(0, this.max)
      .map(([path, row]) => ({
        id: path.slice(prefix.length),
        data: () => row,
      }));

    return {
      size: docs.length,
      docs,
    };
  }
}

class FakeCollection {
  constructor(
    private readonly name: string,
    private readonly rows: Map<string, Row>,
    private readonly writes: string[],
  ) {}

  doc(id: string) {
    return new FakeDocRef(
      this.name + '/' + id,
      this.rows,
      this.writes,
    );
  }

  where(
    field: string,
    op: string,
    value: unknown,
  ) {
    return new FakeQuery(
      this.name,
      this.rows,
    ).where(field, op, value);
  }
}

function buildDb(
  initial: Record<string, Row> = {},
) {
  const rows = new Map<string, Row>(
    Object.entries(initial),
  );
  const writes: string[] = [];

  const db = {
    collection(name: string) {
      return new FakeCollection(
        name,
        rows,
        writes,
      );
    },
  } as unknown as admin.firestore.Firestore;

  return { db, rows, writes };
}

function canonicalRows() {
  const uid = 'uid-1';
  const personId = 'person-1';
  const authIdentityId =
    buildAuthIdentityId(
      'firebase',
      uid,
    );

  return {
    uid,
    personId,
    rows: {
      ['authIdentities/' + authIdentityId]: {
        authIdentityId,
        personId,
        provider: 'firebase',
        providerSubject: uid,
        status: 'active',
      },
      ['people/' + personId]: {
        personId,
        status: 'active',
      },
      'roleAssignments/role-parent': {
        roleAssignmentId: 'role-parent',
        personId,
        role: 'parent',
        scopeType: 'global',
        scopeId: null,
        status: 'active',
      },
    } as Record<string, Row>,
  };
}

describe('Wave 1 R5B auth access maintenance helpers', () => {
  it('best-effort refresh returns a failure result instead of throwing', async () => {
    const { db } = buildDb();

    await expect(
      refreshAuthAccessReadModelBestEffort({
        db,
        firebaseUid: 'missing-uid',
        context: 'adminCreateUser',
      }),
    ).resolves.toMatchObject({
      ok: false,
      action: 'refresh',
      context: 'adminCreateUser',
      errorName: 'Error',
    });
  });

  it('strict refresh propagates canonical projection failures for retryable background work', async () => {
    const { db } = buildDb();

    await expect(
      refreshAuthAccessReadModelStrict({
        db,
        firebaseUid: 'missing-uid',
        context: 'legacyUserSync',
      }),
    ).rejects.toThrow(
      'auth_identity_missing',
    );
  });

  it('best-effort refresh materializes one UID-keyed access document when canonical state is valid', async () => {
    const state = canonicalRows();
    const { db, rows, writes } =
      buildDb(state.rows);

    const result =
      await refreshAuthAccessReadModelBestEffort({
        db,
        firebaseUid: state.uid,
        context: 'adminUpdateUser',
      });

    expect(result).toMatchObject({
      ok: true,
      action: 'refresh',
      context: 'adminUpdateUser',
      accessActive: true,
      globalRoleCount: 1,
      schoolAdminOrganisationCount: 0,
    });

    expect(writes).toEqual([
      'set:authAccessReadModels/uid-1',
    ]);
    expect(
      rows.get(
        'authAccessReadModels/uid-1',
      ),
    ).toMatchObject({
      firebaseUid: 'uid-1',
      personId: 'person-1',
      accessActive: true,
      globalRoles: ['parent'],
    });
  });

  it('strict delete removes the UID-keyed access document for a deleted legacy user', async () => {
    const { db, rows, writes } =
      buildDb({
        'authAccessReadModels/uid-1': {
          firebaseUid: 'uid-1',
          personId: 'person-1',
        },
      });

    const result =
      await deleteAuthAccessReadModelStrict({
        db,
        firebaseUid: 'uid-1',
        context: 'legacyUserSync',
      });

    expect(result).toMatchObject({
      ok: true,
      action: 'delete',
      context: 'legacyUserSync',
    });
    expect(
      rows.has(
        'authAccessReadModels/uid-1',
      ),
    ).toBe(false);
    expect(writes).toEqual([
      'delete:authAccessReadModels/uid-1',
    ]);
  });
});
