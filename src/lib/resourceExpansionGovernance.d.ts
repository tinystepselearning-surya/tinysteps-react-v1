import type { ResourceExpansionDecision } from './resourceExpansionGate';

export const RESOURCE_EXPANSION_GATE_REVISION: '2026-09-09-r11';
export const CURRENT_WAVE_PUBLICATION_APPROVAL_STATE: 'approved-for-current-wave';

export type CurrentWavePublicationApproval = {
  readonly publicationApprovalState: typeof CURRENT_WAVE_PUBLICATION_APPROVAL_STATE;
  readonly publicationApprovalRevision: string;
};

export function assertCurrentWavePublicationEligibility(
  concept: { readonly id: string; readonly expansionState: string; readonly canonicalOwnerTopicId?: string | null },
  approval: CurrentWavePublicationApproval | null | undefined,
  options: { readonly curriculumState: string; readonly approvalRevision: string },
): true;

export function evaluateFurtherResourceScale(options?: {
  readonly decision?: ResourceExpansionDecision | null;
  readonly curriculumEligible?: boolean;
  readonly explicitPublicationApproval?: boolean;
}): Readonly<{
  eligible: boolean;
  reason: string;
  blockScope?: 'page' | 'cluster';
  blocksOtherClusters: false;
}>;
