// @vitest-environment node
// M3 parity characterization: emulator-only, synthetic identities, no production writes.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {doc, getDoc, setDoc, updateDoc} from 'firebase/firestore';
import {afterAll, afterEach, beforeAll, describe, it} from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const suite = emulatorHost ? describe : describe.skip;
let env: RulesTestEnvironment;

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, rawPort = '8085'] = emulatorHost.split(':');
  env = await initializeTestEnvironment({
    projectId: 'tinysteps-m3-authorization-parity',
    firestore: {
      host,
      port: Number(rawPort),
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});
afterEach(async () => {if (env) await env.clearFirestore();});
afterAll(async () => {if (env) await env.cleanup();});

const context = (uid: string, token: Record<string, unknown> = {}) =>
  env.authenticatedContext(uid, token).firestore();

async function seed() {
  await env.withSecurityRulesDisabled(async (runner) => {
    const db = runner.firestore();
    for (const [id, role, status, extra] of [
      ['legacy-super', 'parent', 'active', {superUser: true}],
      ['canonical-only', 'parent', 'active', {}],
      ['global-admin', 'admin', 'active', {}],
      ['inactive-admin', 'admin', 'archived', {superUser: true}],
      ['founder-only', 'founder', 'active', {}],
      ['parent-a', 'parent', 'active', {}],
      ['parent-b', 'parent', 'active', {}],
      ['teacher-a', 'teacher', 'active', {}],
      ['teacher-b', 'teacher', 'active', {}],
      ['lp-a', 'learningPartner', 'active', {}],
      ['lp-b', 'learningPartner', 'active', {}],
      ['school-a-admin', 'schoolAdmin', 'active', {}],
      ['school-b-admin', 'schoolAdmin', 'active', {}],
    ] as const) {
      await setDoc(doc(db, 'users', id), {uid: id, role, status, ...extra});
    }
    // Intentionally created as a synthetic canonical-only projection. Current
    // legacy browser Rules must not consult it; no actual role is granted.
    await setDoc(doc(db, 'authAccessReadModels', 'canonical-only'), {
      firebaseUid: 'canonical-only', accessActive: true, globalRoles: ['admin'],
    });
    await setDoc(doc(db, 'authAccessReadModels', 'no-legacy-record'), {
      firebaseUid: 'no-legacy-record', accessActive: true, globalRoles: ['admin'],
    });
    await setDoc(doc(db, 'adminSessionsManagement', 'projectionState'), {
      revision: 1,
    });
    await setDoc(doc(db, 'parentWallets', 'parent-a'), {
      amount: 100,
    });
    await setDoc(doc(db, 'parentWallets', 'parent-b'), {
      amount: 50,
    });
    for (const [id, partner] of [['school-a', 'lp-a'], ['school-b', 'lp-b']]) {
      await setDoc(doc(db, 'schools', id), {
        name: id,
        status: 'active',
        learningPartnerId: partner,
      });
    }
    await setDoc(doc(db, 'schoolUsers', 'school-a-admin'), {
      role: 'schoolAdmin',
      status: 'active',
      schoolIds: ['school-a'],
    });
    await setDoc(doc(db, 'schoolUsers', 'school-b-admin'), {
      role: 'schoolAdmin',
      status: 'active',
      schoolIds: ['school-b'],
    });
    for (const [id, teacherId, parentId] of [
      ['session-a', 'teacher-a', 'parent-a'],
      ['session-b', 'teacher-b', 'parent-b'],
    ]) {
      await setDoc(doc(db, 'classSessions', id), {
        teacherId, parentId, status: 'scheduled', date: '2026-10-12',
      });
    }
    await setDoc(doc(db, 'billingCharges', 'charge-a'), {
      parentId: 'parent-a',
      amount: 400,
    });
  });
}

suite('Milestone 3 current Firestore Rules / canonical Admin parity characterization', () => {
  it('allows active legacy superUser to read and update Admin-only data (known parity gap)', async () => {
    await seed();
    const db = context('legacy-super', {role: 'parent'});
    await assertSucceeds(getDoc(doc(db, 'adminSessionsManagement', 'projectionState')));
    await assertSucceeds(updateDoc(doc(db, 'users', 'teacher-a'), {displayName: 'Emulator only'}));
  });

  it('does not accept canonical Admin-only read models while the Rules cutover is held', async () => {
    await seed();
    await assertFails(getDoc(doc(context('canonical-only', {role: 'admin'}), 'adminSessionsManagement', 'projectionState')));
    await assertFails(getDoc(doc(context('no-legacy-record', {role: 'admin'}), 'adminSessionsManagement', 'projectionState')));
  });

  it('allows active global legacy Admin but rejects an inactive superUser and orphan Admin claim', async () => {
    await seed();
    await assertSucceeds(getDoc(doc(context('global-admin'), 'adminSessionsManagement', 'projectionState')));
    await assertFails(getDoc(doc(context('inactive-admin', {admin: true}), 'adminSessionsManagement', 'projectionState')));
    await assertFails(getDoc(doc(context('orphan', {role: 'admin', admin: true}), 'adminSessionsManagement', 'projectionState')));
  });

  it('keeps Founder read-only and separate from global Admin authorization', async () => {
    await seed();
    const db = context('founder-only', {role: 'founder'});
    await assertSucceeds(getDoc(doc(db, 'billingCharges', 'charge-a')));
    await assertFails(getDoc(doc(db, 'adminSessionsManagement', 'projectionState')));
    await assertFails(updateDoc(doc(db, 'billingCharges', 'charge-a'), {amount: 0}));
  });

  it('keeps school-admin tenancy scoped to membership and forbids global Admin reads', async () => {
    await seed();
    const db = context('school-a-admin', {role: 'schoolAdmin'});
    await assertSucceeds(getDoc(doc(db, 'schools', 'school-a')));
    await assertFails(getDoc(doc(db, 'schools', 'school-b')));
    await assertFails(getDoc(doc(db, 'adminSessionsManagement', 'projectionState')));
  });

  it('isolates both School Admin tenants and both Learning Partner assignments', async () => {
    await seed();
    for (const [actor, ownSchool, otherSchool] of [
      ['school-a-admin', 'school-a', 'school-b'],
      ['school-b-admin', 'school-b', 'school-a'],
    ]) {
      const db = context(actor, {role: 'schoolAdmin'});
      await assertSucceeds(getDoc(doc(db, 'schools', ownSchool)));
      await assertFails(getDoc(doc(db, 'schools', otherSchool)));
      await assertFails(getDoc(doc(db, 'adminSessionsManagement', 'projectionState')));
    }
    for (const [actor, ownSchool, otherSchool] of [
      ['lp-a', 'school-a', 'school-b'],
      ['lp-b', 'school-b', 'school-a'],
    ]) {
      const db = context(actor, {role: 'learningPartner'});
      await assertSucceeds(getDoc(doc(db, 'schools', ownSchool)));
      await assertFails(getDoc(doc(db, 'schools', otherSchool)));
      await assertFails(getDoc(doc(db, 'adminSessionsManagement', 'projectionState')));
    }
  });

  it('enforces two independent Teacher and Parent ownership contexts', async () => {
    await seed();
    for (const [actor, ownSession, otherSession] of [
      ['teacher-a', 'session-a', 'session-b'],
      ['teacher-b', 'session-b', 'session-a'],
    ]) {
      const db = context(actor, {role: 'teacher'});
      await assertSucceeds(getDoc(doc(db, 'classSessions', ownSession)));
      await assertFails(getDoc(doc(db, 'classSessions', otherSession)));
    }
    for (const [actor, ownSession, otherSession, ownWallet, otherWallet] of [
      ['parent-a', 'session-a', 'session-b', 'parent-a', 'parent-b'],
      ['parent-b', 'session-b', 'session-a', 'parent-b', 'parent-a'],
    ]) {
      const db = context(actor, {role: 'parent'});
      await assertSucceeds(getDoc(doc(db, 'classSessions', ownSession)));
      await assertFails(getDoc(doc(db, 'classSessions', otherSession)));
      await assertSucceeds(getDoc(doc(db, 'parentWallets', ownWallet)));
      await assertFails(getDoc(doc(db, 'parentWallets', otherWallet)));
    }
  });

  it('keeps parent wallets owner-scoped and denies unrelated teacher/LP access', async () => {
    await seed();
    const owner = context('parent-a', {role: 'parent'});
    await assertSucceeds(getDoc(doc(owner, 'parentWallets', 'parent-a')));
    await assertFails(getDoc(doc(owner, 'parentWallets', 'parent-b')));
    for (const uid of ['teacher-a', 'lp-a', 'parent-b']) {
      await assertFails(getDoc(doc(context(uid), 'adminSessionsManagement', 'projectionState')));
    }
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'adminSessionsManagement', 'projectionState')));
  });
});
