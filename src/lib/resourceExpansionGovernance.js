const freeze = (value) => Object.freeze(value);

export const RESOURCE_EXPANSION_GATE_REVISION = '2026-09-09-r11';
export const CURRENT_WAVE_PUBLICATION_APPROVAL_STATE = 'approved-for-current-wave';

/**
 * Initial publication is a curriculum/editorial governance decision. Search
 * evidence cannot exist for a URL that has not yet been published.
 */
export function assertCurrentWavePublicationEligibility(concept, approval, {
  curriculumState,
  approvalRevision,
} = {}) {
  if (!concept || concept.expansionState !== curriculumState) {
    throw new Error(`Publication requires curriculum state ${curriculumState}.`);
  }
  if (!approval || approval.publicationApprovalState !== CURRENT_WAVE_PUBLICATION_APPROVAL_STATE) {
    throw new Error('Publication requires an explicit current-wave approval record.');
  }
  if (!approvalRevision || approval.publicationApprovalRevision !== approvalRevision) {
    throw new Error('Publication approval revision is missing or stale.');
  }
  if (concept.canonicalOwnerTopicId) {
    throw new Error(`Publication refuses an already-owned concept: ${concept.id}.`);
  }
  return true;
}

/**
 * Scaling beyond an explicitly approved publication wave is evidence-governed.
 * Only a finalized R11 promote decision for the evaluated scope can authorize
 * further scale; missing or non-promote evidence never becomes positive proof.
 */
export function evaluateFurtherResourceScale({
  decision,
  curriculumEligible = false,
  explicitPublicationApproval = false,
} = {}) {
  if (!decision || decision.revision !== RESOURCE_EXPANSION_GATE_REVISION) {
    return freeze({ eligible: false, reason: 'missing-finalized-r11-decision', blocksOtherClusters: false });
  }
  if (decision.status === 'blocked' || decision.status === 'repair') {
    return freeze({
      eligible: false,
      reason: `affected-${decision.scopeType}-${decision.status}`,
      blockScope: decision.scopeType,
      blocksOtherClusters: false,
    });
  }
  if (decision.status !== 'promote') {
    return freeze({ eligible: false, reason: `r11-${decision.status}-does-not-authorize-scale`, blocksOtherClusters: false });
  }
  if (!curriculumEligible) {
    return freeze({ eligible: false, reason: 'missing-curriculum-eligibility', blocksOtherClusters: false });
  }
  if (!explicitPublicationApproval) {
    return freeze({ eligible: false, reason: 'missing-explicit-publication-approval', blocksOtherClusters: false });
  }
  return freeze({ eligible: true, reason: 'r11-promote-with-curriculum-and-publication-approval', blocksOtherClusters: false });
}
