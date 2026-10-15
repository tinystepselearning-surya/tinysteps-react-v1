/**
 * R5 M3: PURE role-canary outcome reducer. It has no IO, SDK, auth, reads,
 * writes or execution capability. It does not authorize production canaries.
 * Inputs must be redacted ordinal observations, never raw SDK responses.
 */
const ROLES = new Set([
  'admin', 'founder', 'schoolAdmin', 'teacher', 'parent', 'learningPartner',
]);
const OBSERVATIONS = new Set([
  'allowed-existing', 'allowed-missing', 'permission-denied',
  'unauthenticated', 'network-error', 'timeout', 'other-error',
]);

export function classifyCanaryPointRead(expectation, observation) {
  if ((expectation !== 'allow' && expectation !== 'deny') ||
      !OBSERVATIONS.has(observation)) {
    return {verdict: 'HOLD', reason: 'INVALID_CASE_EVIDENCE'};
  }
  if (expectation === 'deny') {
    if (observation === 'permission-denied') {
      return {verdict: 'PASS', reason: 'EXPECTED_DENIAL'};
    }
    if (observation === 'allowed-existing' || observation === 'allowed-missing') {
      return {verdict: 'STOP', reason: 'UNEXPECTED_ALLOW'};
    }
    return {verdict: 'INCONCLUSIVE', reason: 'DENIAL_NOT_ESTABLISHED'};
  }
  if (observation === 'allowed-existing') {
    return {verdict: 'PASS', reason: 'EXPECTED_EXISTING_ALLOW'};
  }
  if (observation === 'permission-denied') {
    return {verdict: 'FAIL', reason: 'UNEXPECTED_DENIAL'};
  }
  return {verdict: 'INCONCLUSIVE', reason: 'ALLOW_NOT_ESTABLISHED'};
}

/**
 * Redacted-only summary. This is retrospective: no production IO happens here.
 * An unexpected grant STOP takes precedence even if other evidence is invalid.
 * Never returns actor IDs, UIDs, document paths, error messages or input objects.
 */
export function summarizeCanaryPointReadEvidence(cases) {
  const array = Array.isArray(cases) ? cases : [];
  const invalidCount = !Array.isArray(cases) || array.length > 24;
  const ordinals = new Set();
  const counts = {PASS: 0, FAIL: 0, STOP: 0, INCONCLUSIVE: 0, HOLD: 0};
  const results = [];
  for (const entry of array.slice(0, 24)) {
    const ordinalValid = Number.isInteger(entry?.ordinal) &&
      entry.ordinal > 0 && entry.ordinal <= 24 &&
      !ordinals.has(entry.ordinal);
    if (ordinalValid) ordinals.add(entry.ordinal);
    const validRole = ROLES.has(entry?.role);
    const result = ordinalValid && validRole ?
      classifyCanaryPointRead(entry.expectation, entry.observation) :
      {verdict: 'HOLD', reason: 'INVALID_CASE_EVIDENCE'};
    counts[result.verdict]++;
    results.push({ordinal: ordinalValid ? entry.ordinal : null,
      verdict: result.verdict, reason: result.reason});
  }
  if (invalidCount) counts.HOLD++;
  const verdict = counts.STOP ? 'STOP_UNEXPECTED_GRANT' :
    counts.HOLD ? 'HOLD_INVALID_OR_UNBOUNDED_EVIDENCE' :
      counts.FAIL ? 'FAIL_ACCESS_PARITY' :
        counts.INCONCLUSIVE || !array.length ? 'INCONCLUSIVE' : 'PASS_REDACTED_EVIDENCE_ONLY';
  return {
    schema: 'tinysteps-m3-canary-outcome-review-v1',
    verdict,
    observedCases: array.length,
    counts,
    results,
    unexpectedGrantStop: counts.STOP > 0,
    liveExecutionAuthorized: false,
    browserPermissionsTestedByThisUtility: false,
    productionReadsPerformedByThisUtility: false,
    productionWritesPerformedByThisUtility: false,
    billedReadsMeasured: false,
    milestone3Exit: 'NOT_PASSED',
  };
}
