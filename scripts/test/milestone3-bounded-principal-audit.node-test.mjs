import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {auditApprovedPrincipals} from '../milestone3-bounded-principal-audit.mjs';
const require = createRequire(import.meta.url);
const {buildAuthIdentityId} = require('../../functions/lib/schoolOS/identity/idStrategy.js');

function fixture(role = 'admin') {
  const uid = 'synthetic-private-uid';
  const personId = 'synthetic-private-person';
  const organisationId = 'synthetic-school-a';
  const authIdentityId = buildAuthIdentityId('firebase', uid);
  const sourceRole = {roleAssignmentId: 'role-1', personId, role, status: 'active',
    scopeType: role === 'schoolAdmin' ? 'organisation' : 'global',
    scopeId: role === 'schoolAdmin' ? organisationId : null};
  const membership = {organisationMembershipId: 'member-1', personId, organisationId,
    role: 'schoolAdmin', status: 'active'};
  const model = {schemaVersion: 1, authority: 'canonical-derived', firebaseUid: uid,
    personId, personStatus: 'active', authStatus: 'active', accessActive: true,
    globalRoles: role === 'schoolAdmin' ? [] : [role],
    schoolAdminOrganisationIds: role === 'schoolAdmin' ? [organisationId] : [],
    sourceAuthIdentityId: authIdentityId, updatedAt: {toMillis: () => 900}};
  const rows = new Map([
    [`authAccessReadModels/${uid}`, model],
    [`authIdentities/${authIdentityId}`, {authIdentityId, provider: 'firebase', providerSubject: uid, personId, status: 'active'}],
    [`people/${personId}`, {personId, status: 'active'}],
    [`users/${uid}`, {role, status: 'active'}],
    [`schoolUsers/${uid}`, {role: 'schoolAdmin', status: 'active', schoolIds: [organisationId]}],
  ]);
  const lists = {roleAssignments: [sourceRole], organisationMemberships: role === 'schoolAdmin' ? [membership] : []};
  const calls = [];
  const db = {collection(name) { return {
    doc(key) { return {async get() {
      calls.push({name, kind: 'point'});
      const data = rows.get(`${name}/${key}`);
      return {exists: data !== undefined, data: () => data};
    }}; },
    where(field, op, value) {
      assert.equal(field, 'personId'); assert.equal(op, '=='); assert.equal(value, personId);
      return {limit(n) { assert.equal(n, 51); return {async get() {
        calls.push({name, kind: 'query', limit: n});
        const docs = lists[name].slice(0, n).map(data => ({data: () => data}));
        return {size: docs.length, docs};
      }}; }};
    },
  }; }};
  const args = {db, actors: [{uid, role, organisationId, legacySchoolId: organisationId}], nowMs: 1000, maxAgeMs: 500};
  return {args, rows, lists, model, uid, calls};
}

for (const role of ['admin', 'founder', 'schoolAdmin', 'teacher', 'parent', 'learningPartner']) {
  test(`bounded canonical/legacy sample: ${role}`, async () => {
    const f = fixture(role);
    const report = await auditApprovedPrincipals(f.args);
    assert.equal(report.results[0].status, 'SAMPLED_FIELDS_MATCH');
    assert.equal(report.results[0].sdkGetAttempts, 7);
    assert.equal(f.calls.filter(c => c.kind === 'query').length, 2);
    assert.equal(report.measuredProductionBilledReads, null);
    assert.equal(report.authenticatedCanaries, 'NOT_VERIFIED');
    assert.equal(JSON.stringify(report).includes('synthetic-'), false);
  });
}
test('rejects oversized, duplicate and path-injection manifests before any read', async () => {
  for (const mutate of [a => a.actors.push(...Array(12).fill(a.actors[0])),
    a => a.actors.push(a.actors[0]), a => {a.actors[0].uid = 'bad/path';},
    a => {a.actors[0].role = 'unknown';}]) {
    const f = fixture(); mutate(f.args);
    await assert.rejects(auditApprovedPrincipals(f.args), /invalid_audit_manifest/);
    assert.equal(f.calls.length, 0);
  }
});
test('detects missing, malformed, stale and inactive projections', async () => {
  for (const [mutate, issue] of [
    [f => f.rows.delete(`authAccessReadModels/${f.uid}`), 'projection_missing'],
    [f => {f.model.schemaVersion = 2;}, 'projection_invalid'],
    [f => {f.model.globalRoles = ['parent'];}, 'projection_source_drift'],
    [f => {f.model.personStatus = 'suspended'; f.model.accessActive = false;}, 'projection_inactive'],
  ]) {
    const f = fixture(); mutate(f);
    const r = await auditApprovedPrincipals(f.args);
    assert.ok(r.results[0].issues.includes(issue));
  }
});
test('age alone is not source drift; invalid or future timestamps remain explicit', async () => {
  for (const [timestamp, expected] of [[0, 'older_than_review_threshold'],
    [2000, 'timestamp_in_future'], [NaN, 'timestamp_missing_or_invalid']]) {
    const f = fixture(); f.model.updatedAt = {toMillis: () => timestamp};
    const r = await auditApprovedPrincipals(f.args);
    assert.equal(r.results[0].projectionAge, expected);
    assert.ok(!r.results[0].issues.includes('projection_source_drift'));
  }
});
test('overflow stops with incomplete source evidence, never successful coverage', async () => {
  const f = fixture(); f.lists.roleAssignments = Array(51).fill(f.lists.roleAssignments[0]);
  const r = await auditApprovedPrincipals(f.args);
  assert.deepEqual(r.results[0].issues, ['canonical_source_bound_exceeded']);
  assert.equal(r.results[0].status, 'REVIEW_REQUIRED');
  assert.ok(f.calls.length <= 7);
});
test('detects legacy superUser and school membership differences', async () => {
  const f = fixture('schoolAdmin');
  f.rows.get(`users/${f.uid}`).superUser = true;
  f.rows.get(`schoolUsers/${f.uid}`).schoolIds = ['other-school'];
  const r = await auditApprovedPrincipals(f.args);
  assert.ok(r.results[0].issues.includes('legacy_superuser_without_canonical_admin'));
  assert.ok(r.results[0].issues.includes('legacy_school_membership_mismatch'));
});
test('SDK errors never expose credentials, paths or personal information', async () => {
  const f = fixture();
  f.args.db = {collection() { throw new Error('secret-token private@example.invalid'); }};
  const r = await auditApprovedPrincipals(f.args);
  assert.deepEqual(r.results[0].issues, ['projection_read_failed']);
  assert.equal(JSON.stringify(r).includes('secret-token'), false);
  assert.equal(JSON.stringify(r).includes('private@'), false);
});
