import { HttpsError } from 'firebase-functions/v2/https';
import {
  MicrosoftGraphError,
  type MicrosoftGraphErrorKind,
} from './microsoftGraphClient';
import type { StoredEvidenceIssue } from './teamsEvidenceCollector';

export type AvsFailureCategory =
  | 'business_review'
  | 'retryable_infrastructure'
  | 'configuration'
  | 'authorization'
  | 'request'
  | 'unknown_infrastructure';

export type AvsRetryDisposition =
  | 'review'
  | 'retry'
  | 'admin_action'
  | 'reload'
  | 'do_not_retry';

export type AvsOperatorAction =
  | 'review_case'
  | 'retry'
  | 'fix_configuration'
  | 'fix_permissions'
  | 'reload_results'
  | 'investigate';

export interface AvsFailureDescriptor {
  code: string;
  category: AvsFailureCategory;
  retryDisposition: AvsRetryDisposition;
  retryable: boolean;
  operatorAction: AvsOperatorAction;
  source: 'graph' | 'evidence' | 'organizer' | 'callable' | 'unknown';
  stage: string | null;
  httpStatus: number | null;
  graphCode: string | null;
  innerCode: string | null;
  blocking: boolean;
  supplemental: boolean;
}

export interface AvsFailureSummary {
  totalCount: number;
  businessReviewCount: number;
  retryableInfrastructureCount: number;
  configurationCount: number;
  authorizationCount: number;
  requestCount: number;
  unknownInfrastructureCount: number;
  retryableCount: number;
  adminActionRequiredCount: number;
  infrastructureFailureCount: number;
  blockingInfrastructureCount: number;
  supplementalIssueCount: number;
  codeCounts: Record<string, number>;
}

function descriptor(
  code: string,
  category: AvsFailureCategory,
  retryDisposition: AvsRetryDisposition,
  operatorAction: AvsOperatorAction,
  extra: Partial<AvsFailureDescriptor> = {},
): AvsFailureDescriptor {
  return {
    code,
    category,
    retryDisposition,
    retryable: retryDisposition === 'retry',
    operatorAction,
    source: extra.source ?? 'unknown',
    stage: extra.stage ?? null,
    httpStatus: extra.httpStatus ?? null,
    graphCode: extra.graphCode ?? null,
    innerCode: extra.innerCode ?? null,
    blocking: extra.blocking ?? false,
    supplemental: extra.supplemental ?? false,
  };
}

function graphDescriptor(
  kind: MicrosoftGraphErrorKind | string,
  extra: Partial<AvsFailureDescriptor> = {},
): AvsFailureDescriptor {
  if (kind === 'rate_limited' || kind === 'transient') {
    return descriptor(kind, 'retryable_infrastructure', 'retry', 'retry', {
      ...extra,
      source: extra.source ?? 'graph',
    });
  }
  if (
    kind === 'invalid_configuration'
    || kind === 'token_exchange_failed'
    || kind === 'application_access_policy_missing'
  ) {
    return descriptor(kind, 'configuration', 'admin_action', 'fix_configuration', {
      ...extra,
      source: extra.source ?? 'graph',
    });
  }
  if (
    kind === 'unauthorized'
    || kind === 'forbidden'
    || kind === 'transcript_access_disabled'
    || kind === 'speaker_attribution_not_allowed'
  ) {
    return descriptor(kind, 'authorization', 'admin_action', 'fix_permissions', {
      ...extra,
      source: extra.source ?? 'graph',
    });
  }
  if (
    kind === 'not_found'
    || kind === 'ambiguous_result'
    || kind === 'missing_join_url'
    || kind === 'meeting_not_found'
  ) {
    return descriptor(kind, 'business_review', 'review', 'review_case', {
      ...extra,
      source: extra.source ?? 'evidence',
    });
  }
  if (kind === 'unexpected_error') {
    return descriptor(kind, 'retryable_infrastructure', 'retry', 'retry', {
      ...extra,
      source: extra.source ?? 'evidence',
    });
  }
  return descriptor(
    String(kind || 'graph_error'),
    'unknown_infrastructure',
    'admin_action',
    'investigate',
    { ...extra, source: extra.source ?? 'graph' },
  );
}

function normalizeCode(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().toLowerCase().replace(/^functions\//, '')
    : '';
}

function unwrapCause(input: unknown): unknown {
  let current = input;
  for (let depth = 0; depth < 4; depth += 1) {
    if (
      current
      && typeof current === 'object'
      && 'causeError' in current
      && (current as { causeError?: unknown }).causeError !== undefined
    ) {
      current = (current as { causeError?: unknown }).causeError;
      continue;
    }
    break;
  }
  return current;
}

export function classifyAvsReason(
  value: unknown,
  extra: Partial<AvsFailureDescriptor> = {},
): AvsFailureDescriptor {
  const reason = String(value ?? '').trim().toLowerCase();
  if (
    reason === 'organizer_config_invalid'
    || reason === 'organizer_identity_unresolved'
    || reason === 'organizer_identity_ambiguous'
  ) {
    return descriptor(
      reason,
      'configuration',
      'admin_action',
      'fix_configuration',
      { ...extra, source: 'organizer' },
    );
  }
  return graphDescriptor(reason || 'unknown_error', extra);
}

export function classifyAvsFailure(
  input: unknown,
  extra: Partial<AvsFailureDescriptor> = {},
): AvsFailureDescriptor {
  if (input && typeof input === 'object' && 'failure' in input) {
    const nested = (input as { failure?: unknown }).failure;
    if (
      nested
      && typeof nested === 'object'
      && typeof (nested as { code?: unknown }).code === 'string'
    ) {
      return nested as AvsFailureDescriptor;
    }
  }

  const error = unwrapCause(input);
  if (error instanceof MicrosoftGraphError) {
    return graphDescriptor(error.kind, {
      ...extra,
      source: 'graph',
      httpStatus: error.status,
      graphCode: error.graphCode,
      innerCode: error.innerCode,
    });
  }

  const record =
    error && typeof error === 'object'
      ? error as Record<string, unknown>
      : {};
  const code = normalizeCode(record.code);

  if (code === 'unauthenticated' || code === 'permission-denied') {
    return descriptor(code, 'authorization', 'admin_action', 'fix_permissions', {
      ...extra,
      source: 'callable',
    });
  }
  if (
    code === 'unavailable'
    || code === 'deadline-exceeded'
    || code === 'resource-exhausted'
    || code === 'aborted'
    || code === 'internal'
  ) {
    return descriptor(code, 'retryable_infrastructure', 'retry', 'retry', {
      ...extra,
      source: 'callable',
    });
  }
  if (
    code === 'failed-precondition'
    || code === 'not-found'
    || code === 'already-exists'
  ) {
    return descriptor(code, 'request', 'reload', 'reload_results', {
      ...extra,
      source: 'callable',
    });
  }
  if (code === 'invalid-argument' || code === 'out-of-range') {
    return descriptor(code, 'request', 'do_not_retry', 'reload_results', {
      ...extra,
      source: 'callable',
    });
  }

  const name =
    error instanceof Error ? error.name : String(record.name ?? '').trim();
  if (name === 'TypeError' || name === 'FetchError') {
    return descriptor('transport_error', 'retryable_infrastructure', 'retry', 'retry', {
      ...extra,
      source: 'unknown',
    });
  }

  return descriptor('unknown_error', 'unknown_infrastructure', 'admin_action', 'investigate', {
    ...extra,
    source: 'unknown',
  });
}

export function classifyStoredEvidenceIssue(
  issue: StoredEvidenceIssue,
): AvsFailureDescriptor {
  const supplemental = issue.stage === 'transcripts';
  const base = classifyAvsReason(issue.kind, {
    source: 'evidence',
    stage: issue.stage,
    httpStatus: issue.httpStatus,
    graphCode: issue.graphCode,
    innerCode: issue.innerCode,
  });
  return {
    ...base,
    source: 'evidence',
    stage: issue.stage,
    httpStatus: issue.httpStatus,
    graphCode: issue.graphCode,
    innerCode: issue.innerCode,
    blocking: !supplemental && base.category !== 'business_review',
    supplemental,
  };
}

export function emptyAvsFailureSummary(): AvsFailureSummary {
  return {
    totalCount: 0,
    businessReviewCount: 0,
    retryableInfrastructureCount: 0,
    configurationCount: 0,
    authorizationCount: 0,
    requestCount: 0,
    unknownInfrastructureCount: 0,
    retryableCount: 0,
    adminActionRequiredCount: 0,
    infrastructureFailureCount: 0,
    blockingInfrastructureCount: 0,
    supplementalIssueCount: 0,
    codeCounts: {},
  };
}

export function summarizeAvsFailures(
  failures: readonly AvsFailureDescriptor[],
): AvsFailureSummary {
  const summary = emptyAvsFailureSummary();
  for (const failure of failures) {
    summary.totalCount += 1;
    summary.codeCounts[failure.code] = (summary.codeCounts[failure.code] ?? 0) + 1;
    if (failure.category === 'business_review') summary.businessReviewCount += 1;
    else if (failure.category === 'retryable_infrastructure') {
      summary.retryableInfrastructureCount += 1;
      summary.infrastructureFailureCount += 1;
    } else if (failure.category === 'configuration') {
      summary.configurationCount += 1;
      summary.infrastructureFailureCount += 1;
    } else if (failure.category === 'authorization') {
      summary.authorizationCount += 1;
      summary.infrastructureFailureCount += 1;
    } else if (failure.category === 'request') summary.requestCount += 1;
    else {
      summary.unknownInfrastructureCount += 1;
      summary.infrastructureFailureCount += 1;
    }
    if (failure.retryable) summary.retryableCount += 1;
    if (failure.retryDisposition === 'admin_action') {
      summary.adminActionRequiredCount += 1;
    }
    if (failure.blocking) summary.blockingInfrastructureCount += 1;
    if (failure.supplemental) summary.supplementalIssueCount += 1;
  }
  return summary;
}

export function summarizeAvsEvidenceIssues(
  issues: readonly StoredEvidenceIssue[],
): AvsFailureSummary {
  return summarizeAvsFailures(issues.map(classifyStoredEvidenceIssue));
}

export function firstBlockingEvidenceFailure(
  issues: readonly StoredEvidenceIssue[],
): AvsFailureDescriptor | null {
  return issues
    .map(classifyStoredEvidenceIssue)
    .find((failure) => failure.blocking) ?? null;
}

export function mergeAvsFailureSummaries(
  ...summaries: Array<AvsFailureSummary | null | undefined>
): AvsFailureSummary {
  const merged = emptyAvsFailureSummary();
  for (const summary of summaries) {
    if (!summary) continue;
    merged.totalCount += summary.totalCount;
    merged.businessReviewCount += summary.businessReviewCount;
    merged.retryableInfrastructureCount += summary.retryableInfrastructureCount;
    merged.configurationCount += summary.configurationCount;
    merged.authorizationCount += summary.authorizationCount;
    merged.requestCount += summary.requestCount;
    merged.unknownInfrastructureCount += summary.unknownInfrastructureCount;
    merged.retryableCount += summary.retryableCount;
    merged.adminActionRequiredCount += summary.adminActionRequiredCount;
    merged.infrastructureFailureCount += summary.infrastructureFailureCount;
    merged.blockingInfrastructureCount += summary.blockingInfrastructureCount;
    merged.supplementalIssueCount += summary.supplementalIssueCount;
    for (const [code, count] of Object.entries(summary.codeCounts)) {
      merged.codeCounts[code] = (merged.codeCounts[code] ?? 0) + count;
    }
  }
  return merged;
}

export class AvsEvidenceInfrastructureError extends Error {
  constructor(
    readonly failure: AvsFailureDescriptor,
    readonly failureSummary: AvsFailureSummary,
  ) {
    super('Teams evidence collection was blocked by an infrastructure failure.');
    this.name = 'AvsEvidenceInfrastructureError';
  }
}

export function avsFailureLogFields(
  failure: AvsFailureDescriptor,
): Record<string, unknown> {
  return {
    failureCode: failure.code,
    failureCategory: failure.category,
    retryDisposition: failure.retryDisposition,
    retryable: failure.retryable,
    operatorAction: failure.operatorAction,
    source: failure.source,
    stage: failure.stage,
    httpStatus: failure.httpStatus,
    graphCode: failure.graphCode,
    innerCode: failure.innerCode,
  };
}

function safeMessage(failure: AvsFailureDescriptor): string {
  if (failure.category === 'retryable_infrastructure') {
    return 'Temporary AVS infrastructure failure. Retry this action.';
  }
  if (failure.category === 'configuration') {
    return 'AVS configuration requires attention before retrying.';
  }
  if (failure.category === 'authorization') {
    return 'Microsoft Graph access or permissions require attention before retrying.';
  }
  if (failure.category === 'request') {
    return 'AVS request state is invalid or changed. Reload results and try again.';
  }
  if (failure.category === 'business_review') {
    return 'Teams evidence requires review rather than an infrastructure retry.';
  }
  return 'AVS infrastructure failure. Review diagnostics before retrying.';
}

export function avsFailureHttpsError(
  failure: AvsFailureDescriptor,
  extraDetails: Record<string, unknown> = {},
): HttpsError {
  const code =
    failure.category === 'retryable_infrastructure'
      ? 'unavailable'
      : failure.category === 'authorization'
        ? 'permission-denied'
        : failure.category === 'unknown_infrastructure'
          ? 'internal'
          : 'failed-precondition';
  return new HttpsError(code, safeMessage(failure), {
    failure,
    ...extraDetails,
  });
}
