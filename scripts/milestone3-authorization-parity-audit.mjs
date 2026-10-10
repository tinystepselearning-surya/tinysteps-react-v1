#!/usr/bin/env node
/**
 * Milestone 3: privacy-safe source parity audit, never contacts Firebase.
 * Reports rule patterns, not exception identifiers or customer data.
 */
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function authorizationFunction(source, functionName) {
  const header = new RegExp('\\bfunction\\s+' + functionName + '\\s*\\(\\)\\s*\\{');
  const match = header.exec(source);
  if (!match) throw new Error('missing_rule_helper_' + functionName);
  const start = match.index + match[0].length;
  // The selected helper bodies are a single braced block in the current Rules files.
  const end = source.indexOf('\n    }', start);
  if (end < 0) throw new Error('unterminated_rule_helper_' + functionName);
  return source.slice(start, end);
}

function requireShape(condition, code) {
  if (!condition) throw new Error('m3_parity_source_changed_' + code);
}

function exceptionShape(body) {
  return {
    // Never output or hash real exception UID or email literals.
    uidLiteralPresent: /request\.auth\.uid\s*==\s*['"][^'"]+['"]/.test(body),
    tokenEmailLiteralPresent: /request\.auth\.token\.email\.lower\(\)\s*==\s*['"][^'"]+['"]/.test(body),
    superUserAccepted: /superUser/.test(body),
    usersRoleAccepted: /userRole\(request\.auth\.uid\)\s*==\s*['"]admin['"]/.test(body),
    usersRolesArrayAccepted: /['"]admin['"]\s+in\s+get\(/.test(body) ||
      /\(['"]admin['"] in get\(/.test(body) ||
      /['"]admin['"]\s+in\s+firestore\.get\(/.test(body),
    activeLegacyUserRequired: /userIsActiveOrLegacy\(request\.auth\.uid\)/.test(body),
  };
}

export function auditAuthorizationParity({firestore, storage, guard, authority, ledger}) {
  const fAdmin = authorizationFunction(firestore, 'isAdmin');
  const sAdmin = authorizationFunction(storage, 'isCurrentAdmin');
  const fCurrent = authorizationFunction(firestore, 'isCurrentActiveAdmin');
  const fSchool = authorizationFunction(firestore, 'schoolUserHasAccess');
  const fFounder = authorizationFunction(firestore, 'isFounder');
  const ff = exceptionShape(fAdmin), ss = exceptionShape(sAdmin);
  for (const [name, shape] of [['firestore', ff], ['storage', ss]]) {
    for (const [field, passed] of Object.entries(shape)) {
      requireShape(passed, name + '_' + field);
    }
  }
  requireShape(firestore.includes('/documents/users/$(uid)'), 'firestore_legacy_authority');
  requireShape(storage.includes('/documents/users/$(uid)'), 'storage_legacy_authority');
  requireShape(!firestore.includes('authAccessReadModels'), 'firestore_no_canonical_cutover');
  requireShape(!storage.includes('authAccessReadModels'), 'storage_no_canonical_cutover');
  requireShape(/['"]admin['"]/.test(fCurrent) && !/superUser/.test(fCurrent), 'strict_school_admin_different_from_global');
  requireShape(/schoolUserDocExists/.test(fSchool) && /schoolIds/.test(fSchool) && /schoolId in/.test(fSchool), 'school_membership_scope');
  requireShape(/['"]founder['"]/.test(fFounder), 'founder_role');
  requireShape(/loadCurrentAuthAccessPrincipal/.test(guard) && /isCanonicalAdminPrincipal/.test(guard), 'canonical_guard');
  requireShape(!/from ['"]\.\/helpers\/adminGuard['"]/.test(guard) &&
    !/collection\(['"]users['"]\)/.test(guard), 'canonical_no_legacy_fallback');
  requireShape(/AUTH_ACCESS_READ_MODEL_COLLECTION/.test(authority) &&
    /principalHasGlobalRole/.test(authority) &&
    /principalHasSchoolAdminAccess/.test(authority) &&
    /schoolAdminOrganisationIds/.test(authority), 'canonical_role_model');
  const r5 = ledger.switchReads?.r5?.r5c;
  requireShape(r5?.milestone1?.status === 'complete' &&
    r5?.milestone2?.status === 'complete' &&
    r5?.milestone3?.status === 'verification_in_progress', 'milestones');
  for (const flag of [
    'firestoreRulesCutover',
    'storageRulesCutover',
    'targetUserBusinessReaderCutover',
    'preAuthLoginResolverCutover',
    'destructiveOperations',
  ]) requireShape(r5?.[flag] === false, 'held_' + flag);
  requireShape(r5?.milestone3?.productionMutationsAuthorized === false, 'read_only_boundary');

  return {
    schema: 'tinysteps-m3-authorization-parity-v1',
    mode: 'source_only_privacy_safe',
    status: 'source_verified_live_parity_blocked',
    legacyFirestore: {adminSource: 'users/{uid}', roleBased: true, exceptionTypes: ['uid', 'token_email', 'superUser'], activeUserGate: true},
    legacyStorage: {adminSource: 'users/{uid}', roleBased: true, exceptionTypes: ['uid', 'token_email', 'superUser'], activeUserGate: true},
    canonicalBackend: {adminSource: 'authAccessReadModels/{uid}', requiresActiveGlobalAdmin: true, specialIdentityExceptions: false},
    schoolAdmin: {legacy: 'users/{uid} + active schoolUsers/{uid}.schoolIds', canonical: 'active schoolAdminOrganisationIds', crossTenantParity: 'NOT_VERIFIED'},
    founder: {legacy: 'separate read-only role', canonicalAdminImpersonation: false},
    riskReview: [
      {code: 'M3-PARITY-EXCEPTION-DECISION', severity: 'high', state: 'OPEN', note: 'Two legacy Rules files include identity-specific and superUser Admin exceptions absent from canonical authorization; owner must approve explicit exception-role parity decision.'},
      {code: 'M3-PARITY-CANONICAL-ONLY', severity: 'high', state: 'OPEN', note: 'Canonical Admin role alone does not confer browser Rules access while legacy rules remain active.'},
      {code: 'M3-PARITY-SCHOOL-TENANT', severity: 'high', state: 'OPEN', note: 'Legacy schoolUsers membership must be reconciled with canonical organisation-scoped role assignments.'},
    ],
    verifiedSurfaces: ['production_repository_source', 'versioned_ledger'],
    liveRoleCanaries: 'NOT_VERIFIED',
    liveAuthAccessModelCoverage: 'NOT_VERIFIED',
    liveRulesExceptionsMatchedToCanonicalRoles: 'NOT_VERIFIED',
    firestoreReadBudget: 'NOT_VERIFIED',
    firestoreRulesCutoverApproved: false,
    storageRulesCutoverApproved: false,
    recommendedNextGate: 'approved_read_only_production_role_canaries_and_canonical_principal_coverage',
  };
}

export function auditFromRepository(root = process.cwd()) {
  const read = (path) => readFileSync(resolve(root, path), 'utf8');
  return auditAuthorizationParity({
    firestore: read('firestore.rules'),
    storage: read('storage.rules'),
    guard: read('functions/src/helpers/canonicalAdminGuard.ts'),
    authority: read('functions/src/schoolOS/identity/authAccessAuthorization.ts'),
    ledger: JSON.parse(read('docs/architecture/wave-1/migrations/identity-foundation-v1.json')),
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = process.argv.find((value) => value.startsWith('--output='))?.slice(9);
  const report = auditFromRepository();
  const json = JSON.stringify(report, null, 2) + '\n';
  if (output) {
    const out = resolve(output);
    mkdirSync(dirname(out), {recursive: true});
    writeFileSync(out, json, {encoding: 'utf8'});
  }
  process.stdout.write(json);
}
