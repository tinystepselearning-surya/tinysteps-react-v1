#!/usr/bin/env node
/**
 * R5 Milestone 3 production-canary SAFETY PREFLIGHT.
 *
 * Source-only and privacy-safe. No Firebase client, CLI, sign-in, IAM
 * discovery, document reads, listeners, network requests or write methods.
 * A positive result proves the blocked risky paths remain blocked, NOT that
 * a live browser role, authorization parity or billed-read budget passed.
 */
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const REQUIRED_HELD_CUTOVERS = [
  'firestoreRulesCutover',
  'storageRulesCutover',
  'targetUserBusinessReaderCutover',
  'preAuthLoginResolverCutover',
  'destructiveOperations',
];
const BLOCKED_CALLABLES = [
  'getSessionsManagementSnapshot',
  'adminRefreshSessionsManagementSnapshot',
  'getSessionsManagementDateSnapshot',
  'auditParentPaymentBackfillDryRun',
  'applyParentPaymentBackfillForSafeParents',
];

function invariant(condition, code) {
  if (!condition) throw new Error('m3_canary_preflight_source_changed_' + code);
}

function region(source, from, to, label) {
  const first = source.indexOf(from);
  invariant(first >= 0, label + '_start');
  const last = source.indexOf(to, first + from.length);
  invariant(last > first, label + '_end');
  return source.slice(first, last);
}

export function auditCanaryReadSafety({
  paymentDryRun,
  paymentWriteMode,
  snapshotService,
  canonicalGuard,
  principalSampler,
  frontendCache,
  ledger,
}) {
  const r5 = ledger?.switchReads?.r5?.r5c;
  invariant(r5?.milestone1?.status === 'complete' &&
    r5?.milestone2?.status === 'complete', 'prior_milestones');
  invariant(r5?.milestone3?.status === 'verification_in_progress' &&
    r5?.milestone3?.productionMutationsAuthorized === false &&
    r5?.milestone3?.finalExitGate === 'not_attempted', 'm3_live_gate_held');
  for (const flag of REQUIRED_HELD_CUTOVERS) {
    invariant(r5[flag] === false, 'held_' + flag);
  }

  const paymentLoader = region(paymentDryRun,
    'export async function loadParentPaymentBackfillPayments(',
    'export async function loadParentPaymentBackfillParentScopedData(',
    'payment_loader');
  const scoped = region(paymentDryRun,
    'export async function loadParentPaymentBackfillParentScopedData(',
    'export const auditParentPaymentBackfillDryRun = onCall(',
    'parent_detail');
  const dryRun = paymentDryRun.slice(
    paymentDryRun.indexOf('export const auditParentPaymentBackfillDryRun = onCall('));
  const snapshotRead = region(snapshotService,
    'export const getSessionsManagementSnapshot = onCall(',
    'export const adminRefreshSessionsManagementSnapshot = onCall(',
    'snapshot_read');
  const manualRefresh = region(snapshotService,
    'export const adminRefreshSessionsManagementSnapshot = onCall(',
    'export const getSessionsManagementDateSnapshot = onCall(',
    'manual_snapshot_refresh');
  const dateRead = region(snapshotService,
    'export const getSessionsManagementDateSnapshot = onCall(',
    'export const onSessionsManagementEnrollmentWrite = onDocumentWritten(',
    'date_snapshot');
  const writeCallable = paymentWriteMode.slice(
    paymentWriteMode.indexOf('export const applyParentPaymentBackfillForSafeParents = onCall('));

  invariant(/if\s*\(!parentId\)\s*\{\s*query = query\.limit\(limitPayments\)/.test(paymentLoader),
    'payment_parent_branch_has_no_query_limit');
  invariant(paymentLoader.includes('const paymentsSnap = await query.get()') &&
    paymentLoader.includes('.slice(0, limitPayments)'),
    'payment_slice_after_get');
  invariant(paymentLoader.includes(".collection('allocations')") &&
    /\.collection\('allocations'\)\s*\.get\(\)/.test(paymentLoader),
    'allocation_uncapped_query');
  invariant(scoped.includes("db.collection('billingCharges').where('parentId', '==', parentId).get()") &&
    scoped.includes(".collection('transactions').get()") &&
    scoped.includes(".collection('months').get()"), 'parent_detail_uncapped_query');
  invariant(dryRun.includes('await ensureCanonicalAdmin(request.auth)') &&
    dryRun.includes('loadParentPaymentBackfillPayments('), 'dry_run_callable_canonical');
  invariant(writeCallable.includes("data.mode !== 'write'") &&
    writeCallable.includes('await ensureCanonicalAdmin(request.auth)') &&
    writeCallable.includes('loadParentPaymentBackfillPayments('),
    'write_mode_callable_must_not_canary');
  invariant(snapshotRead.includes('await ensureCanonicalAdmin(request.auth)') &&
    snapshotRead.includes("rebuildSnapshot('bootstrap'"),
    'snapshot_read_bootstrap_writes');
  invariant(manualRefresh.includes("rebuildSnapshot('manual'"),
    'snapshot_manual_writes');
  invariant(dateRead.includes('await ensureCanonicalAdmin(request.auth)') &&
    dateRead.includes('buildDatePayload('), 'date_snapshot_bounded_source_only');
  invariant(canonicalGuard.includes('loadCurrentAuthAccessPrincipal') &&
    !canonicalGuard.includes("collection('users')"),
    'canonical_guard_no_legacy_fallback');
  invariant(principalSampler.includes('actors.length > 12') &&
    principalSampler.includes('counts.sdkGetAttempts >= 7') &&
    principalSampler.includes('n > 51') &&
    principalSampler.includes("evidenceKind: 'operator_sample_not_browser_authorization'") &&
    principalSampler.includes('measuredProductionBilledReads: null'),
    'bounded_principal_sampler_not_billing');
  invariant(frontendCache.includes('tinysteps:sessions-management-snapshot:v4') &&
    frontendCache.includes('isSessionsManagementAuthorizationFailure') &&
    frontendCache.includes('isAccessFailure(error)'),
    'cache_p1_authorization_boundary');

  return {
    schema: 'tinysteps-m3-canary-read-cost-preflight-v1',
    evidence: 'source_only_no_production_access',
    verdict: 'CANARY_NOT_AUTHORIZED_LIVE_EVIDENCE_PENDING',
    safety: {
      productionReadsPerformed: false,
      productionWritesPerformed: false,
      databaseCredentialsLoaded: false,
      rulesChanged: false,
      globalCutoversHeld: true,
      affectedFunctions: 0,
      blockedCallableCanaries: BLOCKED_CALLABLES,
      allowedCanaryClass: 'signed_in_user_web_sdk_server_get_of_exact_owner_approved_existing_document',
      approval: 'actor_sessions_exact_resource_paths_allow_deny_expectations_and_read_budget_required',
    },
    sourceFindings: [
      {
        id: 'M3-COST-PAYMENTS-PARENT',
        severity: 'high',
        evidence: 'parentId payment query has no server-side limit; output is sliced after get',
        risk: 'limitPayments is not a fetched-document or billing ceiling when parentId is supplied',
        remedy: 'finance-safe completeness-preserving pagination plus measured read budget in a separate PR',
      },
      {
        id: 'M3-COST-PAYMENTS-ALLOCATIONS',
        severity: 'high',
        evidence: 'payment allocations fetched without per-payment limit; one query per selected payment',
        risk: 'selected payment count cannot bound allocation documents read',
        remedy: 'bounded pagination with completeness proof; do not truncate finance conclusions',
      },
      {
        id: 'M3-COST-PARENT-SCOPED',
        severity: 'high',
        evidence: 'billing charges, wallet transactions, parent month records have parent-scoped uncapped gets',
        risk: 'one parent may return arbitrarily many historical finance records',
        remedy: 'bounded paginated collection reads and explicit incomplete-result handling',
      },
      {
        id: 'M3-CANARY-SNAPSHOT',
        severity: 'high',
        evidence: 'getSessionsManagementSnapshot can call rebuildSnapshot(bootstrap); refresh calls manual rebuild',
        risk: 'a seemingly read-only callable can write leases, projection metadata and shards',
        remedy: 'exclude all listed snapshot callables from live read-only canaries',
      },
      {
        id: 'M3-PRINCIPAL-SAMPLE-BOUNDS',
        severity: 'high',
        evidence: 'pre-existing sampler max 12 actors, max 7 SDK get attempts per actor, query limit 51',
        risk: 'SDK get attempts and returned rows are not billed-read ceilings or population coverage',
        remedy: 'owner-approved actor manifest and capped, separately authorized operator read-only run',
      },
    ],
    productionRoleCanaries: 'NOT_VERIFIED',
    canonicalPrincipalCoverage: 'NOT_VERIFIED',
    actualProductionBilledReads: 'NOT_VERIFIED',
    milestone3Exit: 'NOT_PASSED',
    nextStep: 'approve private role actors and exact allowlisted resources before Codex live reads',
  };
}

export function auditFromRepository(root = process.cwd()) {
  const read = path => readFileSync(resolve(root, path), 'utf8');
  return auditCanaryReadSafety({
    paymentDryRun: read('functions/src/parentPaymentBackfillDryRun.ts'),
    paymentWriteMode: read('functions/src/parentPaymentBackfillWriteMode.ts'),
    snapshotService: read('functions/src/sessionsManagementSnapshot.ts'),
    canonicalGuard: read('functions/src/helpers/canonicalAdminGuard.ts'),
    principalSampler: read('scripts/milestone3-bounded-principal-audit.mjs'),
    frontendCache: read('src/lib/sessionsManagementSnapshot.ts'),
    ledger: JSON.parse(read('docs/architecture/wave-1/migrations/identity-foundation-v1.json')),
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = auditFromRepository();
  const output = process.argv.find(a => a.startsWith('--output='))?.slice('--output='.length);
  if (output) {
    const out = resolve(output);
    mkdirSync(dirname(out), {recursive: true});
    writeFileSync(out, JSON.stringify(report, null, 2) + '\n', 'utf8');
  }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}
