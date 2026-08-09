// @vitest-environment node

import {
  readFileSync,
} from 'node:fs';

import {
  resolve,
} from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

const emulatorHost =
  process.env.FIRESTORE_EMULATOR_HOST;

const shouldRun =
  Boolean(emulatorHost);

const suite =
  shouldRun
    ? describe
    : describe.skip;

let testEnv:
  RulesTestEnvironment;

beforeAll(async () => {
  if (!emulatorHost) return;

  const [host, rawPort] =
    emulatorHost.split(':');

  testEnv =
    await initializeTestEnvironment({
      projectId:
        'tinysteps-rbac-rules',

      firestore: {
        host,
        port: Number(
          rawPort || '8085',
        ),

        rules: readFileSync(
          resolve(
            process.cwd(),
            'firestore.rules',
          ),
          'utf8',
        ),
      },
    });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

afterEach(async () => {
  await testEnv?.clearFirestore();
});

async function seedUsers() {
  await testEnv
    .withSecurityRulesDisabled(
      async (context) => {
        const db =
          context.firestore();

        await setDoc(
          doc(
            db,
            'users',
            'school-admin-1',
          ),
          {
            uid: 'school-admin-1',
            displayName:
              'School Principal',
            email:
              'principal@example.com',
            role: 'schoolAdmin',
            roles: ['schoolAdmin'],
            status: 'active',
          },
        );

        await setDoc(
          doc(
            db,
            'users',
            'parent-1',
          ),
          {
            uid: 'parent-1',
            displayName: 'Parent',
            email:
              'parent@example.com',
            role: 'parent',
            roles: ['parent'],
            status: 'active',
          },
        );

        await setDoc(
          doc(
            db,
            'users',
            'admin-1',
          ),
          {
            uid: 'admin-1',
            displayName: 'Admin',
            email:
              'admin@example.com',
            role: 'admin',
            roles: ['admin'],
            status: 'active',
          },
        );
      },
    );
}

suite(
  'users RBAC rules',
  () => {
    it(
      'allows School Admin to read only their own user document',
      async () => {
        await seedUsers();

        const schoolDb =
          testEnv
            .authenticatedContext(
              'school-admin-1',
              {
                role:
                  'schoolAdmin',
              },
            )
            .firestore();

        await assertSucceeds(
          getDoc(
            doc(
              schoolDb,
              'users',
              'school-admin-1',
            ),
          ),
        );

        await assertFails(
          getDoc(
            doc(
              schoolDb,
              'users',
              'parent-1',
            ),
          ),
        );

        await assertFails(
          getDocs(
            collection(
              schoolDb,
              'users',
            ),
          ),
        );
      },
    );

    it(
      'preserves current internal user read behaviour for existing roles',
      async () => {
        await seedUsers();

        const parentDb =
          testEnv
            .authenticatedContext(
              'parent-1',
              {
                role: 'parent',
              },
            )
            .firestore();

        await assertSucceeds(
          getDoc(
            doc(
              parentDb,
              'users',
              'admin-1',
            ),
          ),
        );
      },
    );

    it(
      'allows safe profile self-updates',
      async () => {
        await seedUsers();

        const parentDb =
          testEnv
            .authenticatedContext(
              'parent-1',
              {
                role: 'parent',
              },
            )
            .firestore();

        await assertSucceeds(
          updateDoc(
            doc(
              parentDb,
              'users',
              'parent-1',
            ),
            {
              displayName:
                'Updated Parent',
            },
          ),
        );
      },
    );

    it(
      'blocks self-escalation through protected authorization fields',
      async () => {
        await seedUsers();

        const parentDb =
          testEnv
            .authenticatedContext(
              'parent-1',
              {
                role: 'parent',
              },
            )
            .firestore();

        const userRef =
          doc(
            parentDb,
            'users',
            'parent-1',
          );

        await assertFails(
          updateDoc(userRef, {
            role: 'admin',
          }),
        );

        await assertFails(
          updateDoc(userRef, {
            rawRole: 'admin',
          }),
        );

        await assertFails(
          updateDoc(userRef, {
            roles: ['admin'],
          }),
        );

        await assertFails(
          updateDoc(userRef, {
            superUser: true,
          }),
        );

        await assertFails(
          updateDoc(userRef, {
            permissions: [
              'admin',
            ],
          }),
        );

        await assertFails(
          updateDoc(userRef, {
            status: 'archived',
          }),
        );

        for (const field of [
          'assignedLPs',
          'assignedParents',
          'assignedTeachers',
          'assignedKids',
          'childIds',
        ]) {
          await assertFails(
            updateDoc(userRef, {
              [field]: ['admin-1'],
            }),
          );
        }
      },
    );

    it(
      'still allows Admin to manage protected user fields',
      async () => {
        await seedUsers();

        const adminDb =
          testEnv
            .authenticatedContext(
              'admin-1',
              {
                role: 'admin',
              },
            )
            .firestore();

        await assertSucceeds(
          updateDoc(
            doc(
              adminDb,
              'users',
              'parent-1',
            ),
            {
              roles: ['parent'],
              status: 'archived',
            },
          ),
        );
      },
    );

    it(
      'accepts legacy School Admin token alias for compatibility',
      async () => {
        await seedUsers();

        const db =
          testEnv
            .authenticatedContext(
              'school-admin-1',
              {
                role:
                  'school-admin',
              },
            )
            .firestore();

        const snap =
          await assertSucceeds(
            getDoc(
              doc(
                db,
                'users',
                'school-admin-1',
              ),
            ),
          );

        expect(
          snap.exists(),
        ).toBe(true);
      },
    );
  },
);
