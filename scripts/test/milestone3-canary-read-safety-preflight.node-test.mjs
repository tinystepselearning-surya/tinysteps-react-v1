import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  auditCanaryReadSafety,
  auditFromRepository,
} from '../milestone3-canary-read-safety-preflight.mjs';

const read = path => readFileSync(resolve(process.cwd(), path), 'utf8');
const input = () => ({
  paymentDryRun: read('functions/src/parentPaymentBackfillDryRun.ts'),
  paymentWriteMode: read('functions/src/parentPaymentBackfillWriteMode.ts'),
  snapshotService: read('functions/src/sessionsManagementSnapshot.ts'),
  canonicalGuard: read('functions/src/helpers/canonicalAdminGuard.ts'),
  principalSampler: read('scripts/milestone3-bounded-principal-audit.mjs'),
  frontendCache: read('src/lib/sessionsManagementSnapshot.ts'),
  ledger: JSON.parse(read('docs/architecture/wave-1/migrations/identity-foundation-v1.json')),
});

test('source-only preflight keeps all high-risk callables blocked without live evidence', () => {
  const result = auditFromRepository();
  assert.equal(result.verdict, 'CANARY_NOT_AUTHORIZED_LIVE_EVIDENCE_PENDING');
  assert.equal(result.evidence, 'source_only_no_production_access');
  assert.equal(result.safety.productionReadsPerformed, false);
  assert.equal(result.safety.productionWritesPerformed, false);
  assert.equal(result.safety.globalCutoversHeld, true);
  assert.equal(result.safety.affectedFunctions, 0);
  assert.deepEqual(result.safety.blockedCallableCanaries, [
    'getSessionsManagementSnapshot', 'adminRefreshSessionsManagementSnapshot',
    'getSessionsManagementDateSnapshot',
    'auditParentPaymentBackfillDryRun', 'applyParentPaymentBackfillForSafeParents',
  ]);
  assert.equal(result.sourceFindings.length, 5);
  assert.equal(result.actualProductionBilledReads, 'NOT_VERIFIED');
  assert.equal(result.productionRoleCanaries, 'NOT_VERIFIED');
  assert.equal(result.milestone3Exit, 'NOT_PASSED');
});

test('preflight fails closed if payment parent branch ever changes query limit semantics', () => {
  const source = input();
  source.paymentDryRun = source.paymentDryRun.replace('if (!parentId) {', 'if (parentId) {');
  assert.throws(() => auditCanaryReadSafety(source),
    /m3_canary_preflight_source_changed_payment_parent_branch_has_no_query_limit/);
});

test('preflight fails closed if allocation query becomes a different code path', () => {
  const source = input();
  source.paymentDryRun = source.paymentDryRun.replace(
    ".collection('allocations')", ".collection('allocationArchive')",
  );
  assert.throws(() => auditCanaryReadSafety(source),
    /m3_canary_preflight_source_changed_allocation_uncapped_query/);
});

test('preflight fails closed if snapshot service starts claiming it cannot bootstrap writes', () => {
  const source = input();
  source.snapshotService = source.snapshotService.replace(
    "rebuildSnapshot('bootstrap'", "readOnlySnapshot('bootstrap'",
  );
  assert.throws(() => auditCanaryReadSafety(source),
    /m3_canary_preflight_source_changed_snapshot_read_bootstrap_writes/);
});

test('preflight refuses to bypass approved operator sampling bounds', () => {
  const source = input();
  source.principalSampler = source.principalSampler.replace('actors.length > 12', 'actors.length > 999');
  assert.throws(() => auditCanaryReadSafety(source),
    /m3_canary_preflight_source_changed_bounded_principal_sampler_not_billing/);
});

test('preflight refuses premature Firestore security-rule or production mutation authorization', () => {
  const source = input();
  source.ledger.switchReads.r5.r5c.firestoreRulesCutover = true;
  assert.throws(() => auditCanaryReadSafety(source),
    /m3_canary_preflight_source_changed_held_firestoreRulesCutover/);
  source.ledger.switchReads.r5.r5c.firestoreRulesCutover = false;
  source.ledger.switchReads.r5.r5c.milestone3.productionMutationsAuthorized = true;
  assert.throws(() => auditCanaryReadSafety(source),
    /m3_canary_preflight_source_changed_m3_live_gate_held/);
});

test('preflight fails if P1 cache authorization boundary disappears', () => {
  const source = input();
  source.frontendCache = source.frontendCache.replace(
    'isSessionsManagementAuthorizationFailure', 'isSessionsManagementGenericFailure',
  );
  assert.throws(() => auditCanaryReadSafety(source),
    /m3_canary_preflight_source_changed_cache_p1_authorization_boundary/);
});

test('preflight output is fixed-shape and never reproduces private source identities', () => {
  const source = input();
  source.paymentDryRun += "\n// Synthetic private UID sentinel-no-output-3024145\n";
  const result = JSON.stringify(auditCanaryReadSafety(source));
  assert.equal(result.includes('sentinel-no-output-3024145'), false);
  assert.equal(result.includes('request.auth.token.email'), false);
  assert.equal(result.includes('authAccessReadModels/synthetic-private-uid'), false);
  assert.equal(result.includes('https://'), false);
});
