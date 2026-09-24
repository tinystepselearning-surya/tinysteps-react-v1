import { describe, expect, it } from 'vitest';
import { HttpsError } from 'firebase-functions/v2/https';
import { MicrosoftGraphError } from '../src/attendanceValidation/microsoftGraphClient';
import {
  classifyAvsFailure,
  classifyStoredEvidenceIssue,
  mergeAvsFailureSummaries,
  summarizeAvsEvidenceIssues,
  summarizeAvsFailures,
} from '../src/attendanceValidation/errorTaxonomy';

describe('AVS Brick 6 failure taxonomy', () => {
  it('separates retryable infrastructure from configuration and authorization', () => {
    expect(classifyAvsFailure(new MicrosoftGraphError({
      kind: 'rate_limited',
      message: 'rate limited',
      status: 429,
    }))).toMatchObject({
      category: 'retryable_infrastructure',
      retryable: true,
    });
    expect(classifyAvsFailure(new MicrosoftGraphError({
      kind: 'application_access_policy_missing',
      message: 'missing policy',
      status: 403,
    }))).toMatchObject({
      category: 'configuration',
      retryable: false,
    });
    expect(classifyAvsFailure(new MicrosoftGraphError({
      kind: 'forbidden',
      message: 'forbidden',
      status: 403,
    }))).toMatchObject({
      category: 'authorization',
      retryable: false,
    });
  });

  it('keeps missing meetings as business review, not infrastructure', () => {
    expect(classifyStoredEvidenceIssue({
      stage: 'meeting_resolution',
      reportId: null,
      kind: 'meeting_not_found',
      httpStatus: null,
      graphCode: null,
      innerCode: null,
      retryAfterMs: null,
    })).toMatchObject({
      category: 'business_review',
      blocking: false,
    });
  });

  it('does not let supplemental transcript access failures block attendance validation', () => {
    const summary = summarizeAvsEvidenceIssues([{
      stage: 'transcripts',
      reportId: null,
      kind: 'transcript_access_disabled',
      httpStatus: 403,
      graphCode: null,
      innerCode: 'GraphAccessToTranscriptsDisabled',
      retryAfterMs: null,
    }]);
    expect(summary.authorizationCount).toBe(1);
    expect(summary.supplementalIssueCount).toBe(1);
    expect(summary.blockingInfrastructureCount).toBe(0);
  });

  it('blocks retryable attendance-report infrastructure failures', () => {
    const summary = summarizeAvsEvidenceIssues([{
      stage: 'attendance_reports',
      reportId: null,
      kind: 'rate_limited',
      httpStatus: 429,
      graphCode: null,
      innerCode: null,
      retryAfterMs: 1000,
    }]);
    expect(summary.retryableInfrastructureCount).toBe(1);
    expect(summary.blockingInfrastructureCount).toBe(1);
    expect(summary.retryableCount).toBe(1);
  });

  it('classifies callable state and merges only safe counters', () => {
    const retry = summarizeAvsFailures([
      classifyAvsFailure(new HttpsError('unavailable', 'temporary details')),
    ]);
    const auth = summarizeAvsFailures([
      classifyAvsFailure(new HttpsError('permission-denied', 'private details')),
    ]);
    const merged = mergeAvsFailureSummaries(retry, auth);
    expect(merged.totalCount).toBe(2);
    expect(merged.retryableCount).toBe(1);
    expect(merged.adminActionRequiredCount).toBe(1);
    expect(JSON.stringify(merged)).not.toContain('private details');
  });
});
