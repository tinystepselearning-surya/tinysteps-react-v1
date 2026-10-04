import { createHash } from 'node:crypto';

import * as logger from 'firebase-functions/logger';

import type {
  IdentityShadowObservation,
  IdentityShadowSourceCollection,
} from './readAdapter';

export const IDENTITY_SHADOW_CANARY_EVENT =
  'wave1_identity_shadow_canary' as const;

export const IDENTITY_SHADOW_CANARY_ERROR_EVENT =
  'wave1_identity_shadow_canary_adapter_error' as const;

export const IDENTITY_SHADOW_CANARY_READER =
  'getParentWorksheetResources' as const;

export const IDENTITY_SHADOW_CANARY_SAMPLE_PERCENT = 20;

export interface IdentityShadowCanaryTelemetry {
  event: typeof IDENTITY_SHADOW_CANARY_EVENT;
  reader: string;
  mode: IdentityShadowObservation['mode'];
  sourceCollection: IdentityShadowSourceCollection;
  subjectToken: string;
  status: IdentityShadowObservation['status'];
  canonicalDocumentsExpected: number;
  canonicalDocumentsRead: number;
  missingCanonicalKinds: string[];
  mismatchFields: string[];
  canonicalReadErrorKinds: string[];
  legacyReadMs: number;
  canonicalReadMs: number;
  samplePercent: number;
  dayBucket: string;
}

export interface IdentityShadowCanaryAdapterErrorTelemetry {
  event: typeof IDENTITY_SHADOW_CANARY_ERROR_EVENT;
  reader: string;
  sourceCollection: IdentityShadowSourceCollection;
  subjectToken: string;
  samplePercent: number;
  dayBucket: string;
  errorName: string;
}

function hashHex(value: string): string {
  return createHash('sha256')
    .update(value, 'utf8')
    .digest('hex');
}

export function identityShadowSubjectToken(params: {
  sourceCollection: IdentityShadowSourceCollection;
  sourceId: string;
}): string {
  return hashHex(
    [
      params.sourceCollection,
      String(params.sourceId || '').trim(),
    ].join('\u001f'),
  ).slice(0, 12);
}

export function identityShadowIstDayBucket(
  nowMs = Date.now(),
): string {
  const IST_OFFSET_MS = 330 * 60 * 1000;
  return new Date(nowMs + IST_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

export function identityShadowCanaryBucket(params: {
  reader: string;
  sourceCollection: IdentityShadowSourceCollection;
  sourceId: string;
  dayBucket: string;
}): number {
  const digest = hashHex(
    [
      params.reader,
      params.sourceCollection,
      String(params.sourceId || '').trim(),
      params.dayBucket,
    ].join('\u001f'),
  );
  return Number.parseInt(digest.slice(0, 8), 16) % 100;
}

export function shouldRunIdentityShadowCanary(params: {
  reader: string;
  sourceCollection: IdentityShadowSourceCollection;
  sourceId: string;
  nowMs?: number;
  samplePercent?: number;
}): boolean {
  const samplePercent = Math.max(
    0,
    Math.min(
      100,
      Math.trunc(
        params.samplePercent ??
          IDENTITY_SHADOW_CANARY_SAMPLE_PERCENT,
      ),
    ),
  );

  if (samplePercent === 0) return false;
  if (samplePercent === 100) return true;

  const dayBucket = identityShadowIstDayBucket(
    params.nowMs,
  );

  return identityShadowCanaryBucket({
    reader: params.reader,
    sourceCollection: params.sourceCollection,
    sourceId: params.sourceId,
    dayBucket,
  }) < samplePercent;
}

export function buildIdentityShadowCanaryTelemetry(params: {
  reader: string;
  observation: IdentityShadowObservation;
  nowMs?: number;
  samplePercent?: number;
}): IdentityShadowCanaryTelemetry {
  const samplePercent =
    params.samplePercent ??
    IDENTITY_SHADOW_CANARY_SAMPLE_PERCENT;

  return {
    event: IDENTITY_SHADOW_CANARY_EVENT,
    reader: params.reader,
    mode: params.observation.mode,
    sourceCollection:
      params.observation.sourceCollection,
    subjectToken: params.observation.subjectToken,
    status: params.observation.status,
    canonicalDocumentsExpected:
      params.observation.canonicalDocumentsExpected,
    canonicalDocumentsRead:
      params.observation.canonicalDocumentsRead,
    missingCanonicalKinds:
      [...params.observation.missingCanonicalKinds],
    mismatchFields:
      [...params.observation.mismatchFields],
    canonicalReadErrorKinds:
      [...params.observation.canonicalReadErrorKinds],
    legacyReadMs: params.observation.legacyReadMs,
    canonicalReadMs:
      params.observation.canonicalReadMs,
    samplePercent,
    dayBucket: identityShadowIstDayBucket(
      params.nowMs,
    ),
  };
}

export function buildIdentityShadowCanaryAdapterErrorTelemetry(
  params: {
    reader: string;
    sourceCollection: IdentityShadowSourceCollection;
    sourceId: string;
    error: unknown;
    nowMs?: number;
    samplePercent?: number;
  },
): IdentityShadowCanaryAdapterErrorTelemetry {
  return {
    event: IDENTITY_SHADOW_CANARY_ERROR_EVENT,
    reader: params.reader,
    sourceCollection: params.sourceCollection,
    subjectToken: identityShadowSubjectToken({
      sourceCollection: params.sourceCollection,
      sourceId: params.sourceId,
    }),
    samplePercent:
      params.samplePercent ??
      IDENTITY_SHADOW_CANARY_SAMPLE_PERCENT,
    dayBucket: identityShadowIstDayBucket(
      params.nowMs,
    ),
    errorName:
      params.error instanceof Error
        ? params.error.name || 'Error'
        : 'UnknownError',
  };
}

export function recordIdentityShadowCanaryTelemetry(
  telemetry: IdentityShadowCanaryTelemetry,
): void {
  logger.info(
    IDENTITY_SHADOW_CANARY_EVENT,
    telemetry,
  );
}

export function recordIdentityShadowCanaryAdapterError(
  telemetry: IdentityShadowCanaryAdapterErrorTelemetry,
): void {
  logger.warn(
    IDENTITY_SHADOW_CANARY_ERROR_EVENT,
    telemetry,
  );
}
