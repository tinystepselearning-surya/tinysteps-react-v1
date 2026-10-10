#!/usr/bin/env node
/**
 * Milestone 3 verification: read-only architecture and production-evidence gate.
 * Does NOT connect to Firebase, call production Functions, write Firestore,
 * change security rules, or claim end-to-end live authorization parity.
 */
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync, writeFileSync, mkdirSync} from 'node:fs';
import {join, relative, resolve, dirname, sep} from 'node:path';

const ROOT = process.cwd();
const read = (name) => readFileSync(resolve(ROOT, name), 'utf8');
const ledger = JSON.parse(read('docs/architecture/wave-1/migrations/identity-foundation-v1.json'));
const flag = ledger.switchReads.r5.r5c;
const milestone3 = flag.milestone3;
const checks = [];
const findings = [];

function verify(id, condition, evidence) {
  assert.ok(condition, id + ': ' + evidence);
  checks.push({id, result: 'pass', evidence});
}
function hold(id, severity, evidence, action) {
  findings.push({id, severity, status: 'requires_review', evidence, action});
}
function allSources(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? allSources(path) :
      /\.(?:ts|js)$/.test(path) ? [path] : [];
  });
}

verify('M3-BLUEPRINT-PRIOR-MILESTONES',
  flag.milestone1?.status === 'complete' && flag.milestone1?.finalExitGate === 'passed' &&
  flag.milestone2?.status === 'complete' && flag.milestone2?.finalExitGate === 'passed',
  'M1 and M2 have recorded passing independent exit gates');
verify('M3-STATE',
  milestone3?.status === 'verification_in_progress' &&
  milestone3?.finalExitGate === 'not_attempted' &&
  milestone3?.productionMutationsAuthorized === false,
  'Milestone 3 verification is active, but production cutovers remain prohibited');

const expectedRoots = {33: 2, 34: 4, 35: 5, 36: 10, 37: 16, 38: 14};
for (const [num, count] of Object.entries(expectedRoots)) {
  const slice = flag.r5c2.slices['r5c2c' + num];
  verify('M3-PRODUCTION-C' + num,
    slice?.productionVerified === true &&
    slice.legacyFallback === false &&
    slice.productionDeployment?.result === 'success' &&
    slice.productionDeployment?.functionsCheckpointReady === count &&
    slice.productionDeployment?.functionsProductionMarkerAdvanced === true &&
    slice.productionDeployment?.functionsFullDeployment === false,
    'Production checkpoint verified for C' + num + ' (' + count + ' Function roots)');
}
verify('M3-M2-CANONICAL-PRODUCTION-MARKER',
  flag.milestone2.lastProductionCommit === '81af741aef78ea3d8e3cac66e548455ce3a9b43f',
  'Recorded C38 Functions marker matches final Milestone 2 production commit');

const sourceRoot = resolve(ROOT, 'functions/src');
const offenders = [];
let filesExamined = 0;
for (const file of allSources(sourceRoot)) {
  const path = relative(sourceRoot, file).split(sep).join('/');
  if (path === 'helpers/adminGuard.ts') continue; // legacy helper is not a live import
  const code = readFileSync(file, 'utf8');
  filesExamined++;
  if (/(?:from\s*['"][^'"]*\/helpers\/adminGuard['"]|require\s*\(\s*['"][^'"]*\/helpers\/adminGuard['"]|\bawait\s+ensureAdmin\s*\()/.test(code)) {
    offenders.push(path);
  }
}
verify('M3-ZERO-LEGACY-ADMIN-CONSUMERS', offenders.length === 0,
  String(filesExamined) + ' production JS/TS files examined; 0 legacy Admin guard import/call sites');

const canonical = read('functions/src/helpers/canonicalAdminGuard.ts');
const principal = read('functions/src/schoolOS/identity/authAccessAuthorization.ts');
verify('M3-CANONICAL-GUARD',
  canonical.includes('loadCurrentAuthAccessPrincipal') &&
  canonical.includes('principalHasGlobalRole') &&
  canonical.includes("'permission-denied'") &&
  !canonical.includes("collection('users')") &&
  !canonical.includes('await ensureAdmin('),
  'Canonical requester authorization uses the derived access principal and fails closed without legacy fallback');
verify('M3-PRINCIPAL-SINGLE-UID-READ',
  principal.includes('AUTH_ACCESS_READ_MODEL_COLLECTION') &&
  principal.includes('.doc(firebaseUid)') &&
  principal.includes('auth_access_read_model_missing') &&
  principal.includes('accessActive'),
  'Principal loader uses a UID-keyed read model and denies missing model records');

for (const name of ['firestoreRulesCutover','storageRulesCutover','targetUserBusinessReaderCutover','preAuthLoginResolverCutover','destructiveOperations']) {
  verify('M3-HELD-' + name.toUpperCase(), flag[name] === false,
    name + ' remains explicitly disabled in the authoritative ledger');
}
verify('M3-LEGACY-RULES-AUTHORITY',
  ledger.switchReads.r5.productionRulesAuthority === 'users_and_schoolUsers_compatibility' &&
  ledger.switchReads.r5.productionReaderAuthority === 'legacy_compatibility',
  'Global Firestore Rules and broad identity readers are still in the legacy-compatibility phase');
const firestoreRules = read('firestore.rules');
const storageRules = read('storage.rules');
const adminRules = firestoreRules.slice(
  firestoreRules.indexOf('function isAdmin()'),
  firestoreRules.indexOf('function isFounder()')
);
const storageAdmin = storageRules.slice(
  storageRules.indexOf('function isCurrentAdmin()')
);
verify('M3-UNSWITCHED-FIRESTORE-RULES',
  adminRules.includes('userIsActiveOrLegacy') &&
  adminRules.includes('userDocPath(') &&
  !adminRules.includes('authAccessReadModels'),
  'Firestore Admin permission remains legacy-user-based; no unapproved R5D rules cutover');
verify('M3-UNSWITCHED-STORAGE-RULES',
  storageAdmin.includes('userIsActiveOrLegacy') &&
  !storageAdmin.includes('authAccessReadModels'),
  'Storage Admin permission remains legacy-user-based; no unapproved storage-rules cutover');

if (adminRules.includes('request.auth.uid ==') || adminRules.includes('request.auth.token.email')) {
  hold('M3-RULES-ADMIN-PARITY', 'high',
    'Legacy Firestore and Storage Rules include specific Admin identity exceptions not expressed by the canonical role check.',
    'Before R5D, reconcile these exceptions with canonical RoleAssignments and emulator allow/deny tests; do not change production rules automatically.');
}
const paymentAudit = read('functions/src/parentPaymentBackfillDryRun.ts');
if (paymentAudit.includes("db.collection('billingCharges').where('parentId', '==', parentId).get()") &&
    paymentAudit.includes(".collection('transactions').get()")) {
  hold('M3-PAYMENT-AUDIT-READ-BUDGET', 'medium',
    'Parent-payment dry-run has parent-scoped billingCharges and wallet transaction queries without server-side limits.',
    'Measure real read costs separately and introduce bounded/paginated queries only in a dedicated finance-safe migration.');
}
const compatibility = read('functions/src/scheduling/rollingScheduleCompatibility.ts');
if (compatibility.includes('await ensureCanonicalAdmin(request.auth);') &&
    compatibility.includes('runCallable(legacyCreateSessionsFromSchedule, request)')) {
  hold('M3-LEGACY-DELEGATE-AUTH-READS', 'low',
    'Some rolling compatibility entry points call canonical Admin before delegating to a legacy callable with its own canonical Admin guard.',
    'Benchmark duplicate UID read cost before any optimization; preserve fail-closed delegated guards.');
}
hold('M3-AUTHENTICATED-LIVE-CANARIES', 'high',
  'CI and ledger cannot prove signed-in parent, teacher, Learning Partner, Admin and school Admin production behavior or current data parity.',
  'Run approved read-only test-account canaries with positive and negative roles, real tenant isolation, evidence freshness and bounded Firestore-read counts.');
hold('M3-ACCESS-MODEL-LIVE-COVERAGE', 'high',
  'The ledger records a completed canonical Admin migration, but this source-only audit does not establish current production authAccessReadModels coverage/freshness.',
  'Obtain read-only production coverage and drift evidence before authorizing any global reader or rules cutover.');

const report = {
  schema: 'tiny-steps-milestone3-verification-v1',
  timestamp: new Date().toISOString(),
  repositoryHead: process.env.GITHUB_SHA || null,
  mode: 'read_only_source_and_ledger',
  verdict: 'code_and_ledger_gate_passed_live_authorization_not_verified',
  previousMilestones: {milestone1: 'complete', milestone2: 'complete'},
  milestone3Status: milestone3.status,
  productionSourceFilesScanned: filesExamined,
  checks,
  openFindings: findings,
  liveProductionCanary: 'NOT_VERIFIED',
  productionFirestoreReadCounts: 'NOT_VERIFIED',
  ruleCutoverAuthorized: false,
  destructiveRetirementAuthorized: false,
};
const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
if (outputArg) {
  const outputPath = resolve(ROOT, outputArg.slice('--output='.length));
  mkdirSync(dirname(outputPath), {recursive:true});
  writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
}
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
