/**
 * Operator-injected read-only sampler. No CLI, credential discovery, app
 * initialization, user login, collection scans, or production execution.
 * Build Functions first. An approved actor manifest and separately authorized
 * read-only operator database are required before any live use.
 */
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {loadCanonicalAuthAccessInput, buildAuthAccessReadModel} =
  require('../functions/lib/schoolOS/identity/authAccessReadModel.js');
const {parseCurrentAuthAccessPrincipal} =
  require('../functions/lib/schoolOS/identity/authAccessAuthorization.js');

const roles = ['admin', 'founder', 'schoolAdmin', 'teacher', 'parent', 'learningPartner'];
const id = value => typeof value === 'string' && value.trim() === value &&
  value.length > 0 && value.length <= 128 && !value.includes('/');
const sameSet = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

// Narrow facade prevents the sampler/production loader from issuing writes,
// unfiltered queries, more than 7 SDK get operations, or queries over 51 rows.
function boundedReader(db, counts) {
  const points = new Set(['authAccessReadModels', 'authIdentities', 'people', 'users', 'schoolUsers']);
  const queries = new Set(['roleAssignments', 'organisationMemberships']);
  async function get(ref, query = false) {
    if (counts.sdkGetAttempts >= 7) throw new Error('operation_bound_exceeded');
    counts.sdkGetAttempts++;
    const snap = await ref.get();
    counts.sdkGetCompleted++;
    counts.documentsReturned += query ? snap.size : Number(snap.exists);
    return snap;
  }
  return {collection(name) {
    if (points.has(name)) return {doc(key) {
      if (!id(key)) throw new Error('invalid_source_id');
      return {get: () => get(db.collection(name).doc(key))};
    }};
    if (queries.has(name)) return {where(field, op, value) {
      if (field !== 'personId' || op !== '==' || !id(value)) throw new Error('invalid_query');
      return {limit(n) {
        if (!Number.isInteger(n) || n < 1 || n > 51) throw new Error('invalid_limit');
        return {get: () => get(db.collection(name).where(field, op, value).limit(n), true)};
      }};
    }};
    throw new Error('invalid_collection');
  }};
}

export async function auditApprovedPrincipals({db, actors, nowMs, maxAgeMs}) {
  // Validate the complete manifest before the first read; identifiers are never
  // echoed, hashed, logged, or included in errors/results.
  if (!Array.isArray(actors) || actors.length < 1 || actors.length > 12 ||
      !Number.isFinite(nowMs) || !Number.isFinite(maxAgeMs) || maxAgeMs <= 0 ||
      actors.some(a => !a || !id(a.uid) || !roles.includes(a.role) ||
        (a.role === 'schoolAdmin' && (!id(a.organisationId) || !id(a.legacySchoolId)))) ||
      new Set(actors.map(a => a.uid)).size !== actors.length) {
    throw new Error('invalid_audit_manifest');
  }
  const results = [];
  for (const actor of actors) {
    const counts = {sdkGetAttempts: 0, sdkGetCompleted: 0, documentsReturned: 0};
    const reader = boundedReader(db, counts);
    const issues = [];
    let stage = 'projection_read';
    let age = 'NOT_VERIFIED';
    try {
      const snap = await reader.collection('authAccessReadModels').doc(actor.uid).get();
      let principal = null;
      if (!snap.exists) issues.push('projection_missing');
      else {
        try {
          principal = parseCurrentAuthAccessPrincipal({documentId: actor.uid, data: snap.data()});
        } catch { issues.push('projection_invalid'); }
        const millis = snap.data()?.updatedAt?.toMillis?.();
        age = !Number.isFinite(millis) ? 'timestamp_missing_or_invalid' :
          millis > nowMs ? 'timestamp_in_future' :
          nowMs - millis > maxAgeMs ? 'older_than_review_threshold' : 'within_review_threshold';
      }
      stage = 'canonical_source_read_or_validation';
      const {input} = await loadCanonicalAuthAccessInput({
        db: reader, firebaseUid: actor.uid, maxRoleAssignments: 50, maxOrganisationMemberships: 50,
      });
      const expected = buildAuthAccessReadModel(input);
      if (principal) {
        const scalarFields = ['firebaseUid', 'personId', 'personStatus', 'authStatus', 'accessActive', 'sourceAuthIdentityId'];
        if (scalarFields.some(k => principal[k] !== expected[k]) ||
            !sameSet(principal.globalRoles, expected.globalRoles) ||
            !sameSet(principal.schoolAdminOrganisationIds, expected.schoolAdminOrganisationIds)) {
          issues.push('projection_source_drift');
        }
        if (!principal.accessActive) issues.push('projection_inactive');
        const hasRole = actor.role === 'schoolAdmin' ?
          principal.schoolAdminOrganisationIds.includes(actor.organisationId) :
          principal.globalRoles.includes(actor.role);
        if (!hasRole) issues.push('expected_role_or_scope_missing');
      }
      stage = 'legacy_read';
      const legacy = await reader.collection('users').doc(actor.uid).get();
      const school = await reader.collection('schoolUsers').doc(actor.uid).get();
      if (!legacy.exists) issues.push('legacy_user_missing');
      else {
        const user = legacy.data();
        // Signals only: this is deliberately not a reimplementation of Rules.
        const legacyRoles = [user.role, ...(Array.isArray(user.roles) ? user.roles : [])];
        if (!legacyRoles.includes(actor.role)) issues.push('legacy_expected_role_missing');
        if (user.superUser === true && !expected.globalRoles.includes('admin')) issues.push('legacy_superuser_without_canonical_admin');
        if (user.status && user.status !== 'active') issues.push('legacy_status_requires_review');
      }
      if (actor.role === 'schoolAdmin') {
        const data = school.exists ? school.data() : {};
        if (data.status !== 'active' || data.role !== 'schoolAdmin' ||
            !Array.isArray(data.schoolIds) || !data.schoolIds.includes(actor.legacySchoolId)) {
          issues.push('legacy_school_membership_mismatch');
        }
      }
    } catch (error) {
      // Never emit raw SDK messages (may contain paths/tokens/customer fields).
      issues.push(['role_assignment_bound_exceeded', 'organisation_membership_bound_exceeded']
        .includes(error?.message) ? 'canonical_source_bound_exceeded' : stage + '_failed');
    }
    results.push({actor: results.length + 1, role: actor.role,
      status: issues.length ? 'REVIEW_REQUIRED' : 'SAMPLED_FIELDS_MATCH', issues,
      projectionAge: age, ...counts});
  }
  return {schema: 'tinysteps-m3-bounded-principal-audit-v1', results,
    evidenceKind: 'operator_sample_not_browser_authorization',
    consistency: 'non_atomic_point_in_time_sample_recheck_drift_before_remediation',
    identityExceptionParity: 'NOT_VERIFIED', authenticatedCanaries: 'NOT_VERIFIED',
    measuredProductionBilledReads: null, milestoneComplete: false};
}
