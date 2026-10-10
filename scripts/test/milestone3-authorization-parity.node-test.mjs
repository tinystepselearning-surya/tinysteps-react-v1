import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {auditAuthorizationParity, auditFromRepository} from '../milestone3-authorization-parity-audit.mjs';

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');
function input() {
  return {
    firestore: read('firestore.rules'),
    storage: read('storage.rules'),
    guard: read('functions/src/helpers/canonicalAdminGuard.ts'),
    authority: read('functions/src/schoolOS/identity/authAccessAuthorization.ts'),
    ledger: JSON.parse(read('docs/architecture/wave-1/migrations/identity-foundation-v1.json')),
  };
}

test('M3 source rules parity explicitly remains held, without leaking exception identities', () => {
  const data = input();
  const report = auditFromRepository();
  assert.equal(report.status, 'source_verified_live_parity_blocked');
  assert.equal(report.legacyFirestore.adminSource, 'users/{uid}');
  assert.equal(report.legacyStorage.adminSource, 'users/{uid}');
  assert.equal(report.canonicalBackend.adminSource, 'authAccessReadModels/{uid}');
  assert.equal(report.liveRoleCanaries, 'NOT_VERIFIED');
  assert.equal(report.firestoreRulesCutoverApproved, false);
  const output = JSON.stringify(report);
  assert.ok(!output.includes('request.auth.token.email'));
  assert.ok(!output.includes('request.auth.uid =='));
  for(const body of [data.firestore, data.storage]){
    for(const match of body.matchAll(/request\.auth\.token\.email\.lower\(\)\s*==\s*['"]([^'"]+)['"]/g)) {
      assert.equal(output.includes(match[1]), false, 'Never disclose exception email');
    }
    for(const match of body.matchAll(/request\.auth\.uid\s*==\s*['"]([^'"]+)['"]/g)) {
      assert.equal(output.includes(match[1]), false, 'Never disclose exception UID');
    }
  }
});

test('M3 audit rejects an unauthorized Firestore Rules switch', () => {
  const data = input();
  data.ledger.switchReads.r5.r5c.firestoreRulesCutover = true;
  assert.throws(() => auditAuthorizationParity(data), /m3_parity_source_changed_held_firestoreRulesCutover/);
});

test('M3 audit rejects silently removing the legacy Admin exception source', () => {
  const data = input();
  // Removes only the static exception expression, not other account role checks.
  data.storage = data.storage.replace(/request\.auth\.uid\s*==\s*['"][^'"]+['"]/, 'false');
  assert.throws(() => auditAuthorizationParity(data), /m3_parity_source_changed_storage_uidLiteralPresent/);
});

test('M3 audit rejects a canonical Admin fallback to legacy user documents', () => {
  const data = input();
  data.guard += "\nconst legacy = admin.firestore().collection('users');\n";
  assert.throws(() => auditAuthorizationParity(data), /m3_parity_source_changed_canonical_no_legacy_fallback/);
});

test('M3 audit denies a premature production canary completion declaration', () => {
  const report = auditFromRepository();
  assert.equal(report.liveAuthAccessModelCoverage, 'NOT_VERIFIED');
  assert.equal(report.liveRulesExceptionsMatchedToCanonicalRoles, 'NOT_VERIFIED');
  assert.equal(report.firestoreReadBudget, 'NOT_VERIFIED');
});
