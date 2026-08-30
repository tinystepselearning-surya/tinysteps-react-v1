import { trackEvent } from './analytics';
import type { AskTinyStepsExecutionPlan } from '../services/askTinyStepsExecutionRouter';

export const ASK_TINY_STEPS_ROUTING_EVENT = 'ask_tiny_steps_route';
export const ASK_TINY_STEPS_TELEMETRY_SCHEMA_VERSION = 'pv1d_v1';

export type AskTinyStepsResponsePath = 'deterministic' | 'ai' | 'local_fallback';
export type AskTinyStepsModelLane =
  | 'none'
  | 'grounded_flash_cascade'
  | 'flash_lite_guidance';
export type AskTinyStepsAiResult = 'not_attempted' | 'success' | 'fallback';

export type AskTinyStepsRoutingTelemetryInput = {
  plan: AskTinyStepsExecutionPlan;
  promptLength: number;
  aiAttempted: boolean;
  responsePath: AskTinyStepsResponsePath;
  totalLatencyMs: number;
};

const SAFE_SOURCE_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;

function promptLengthBucket(length: number): string {
  if (length <= 80) return '1_80';
  if (length <= 240) return '81_240';
  if (length <= 800) return '241_800';
  if (length <= 2_000) return '801_2000';
  return 'over_2000';
}

function modelLane(plan: AskTinyStepsExecutionPlan): AskTinyStepsModelLane {
  if (plan.mode === 'first_party_grounded') return 'grounded_flash_cascade';
  if (plan.mode === 'general_guidance') return 'flash_lite_guidance';
  return 'none';
}

function aiResult(input: AskTinyStepsRoutingTelemetryInput): AskTinyStepsAiResult {
  if (!input.aiAttempted) return 'not_attempted';
  return input.responsePath === 'ai' ? 'success' : 'fallback';
}

function safeSourceIds(sourceIds: readonly string[]): string[] {
  return sourceIds.filter((sourceId) => SAFE_SOURCE_ID.test(sourceId)).slice(0, 2);
}

function safeLatencyMs(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(60_000, Math.round(value));
}

/**
 * Builds the complete PV-1D payload. Deliberately accepts prompt length only,
 * never prompt/answer/error text, so content cannot be added accidentally by a
 * caller without changing this typed contract.
 */
export function buildAskTinyStepsRoutingTelemetry(
  input: AskTinyStepsRoutingTelemetryInput,
): Record<string, string | number> {
  const sources = safeSourceIds(input.plan.sourceIds);

  return {
    schema_version: ASK_TINY_STEPS_TELEMETRY_SCHEMA_VERSION,
    route_mode: input.plan.mode,
    route_reason: input.plan.reason,
    audience: input.plan.audience,
    intent: input.plan.intent,
    is_follow_up: input.plan.isFollowUp ? 1 : 0,
    source_count: sources.length,
    primary_source_id: sources[0] ?? 'none',
    source_ids: sources.length ? sources.join('|') : 'none',
    prompt_length_bucket: promptLengthBucket(input.promptLength),
    ai_attempted: input.aiAttempted ? 1 : 0,
    ai_result: aiResult(input),
    model_lane: modelLane(input.plan),
    response_path: input.responsePath,
    total_latency_ms: safeLatencyMs(input.totalLatencyMs),
  };
}

export function trackAskTinyStepsRouting(input: AskTinyStepsRoutingTelemetryInput): void {
  trackEvent(ASK_TINY_STEPS_ROUTING_EVENT, buildAskTinyStepsRoutingTelemetry(input));
}
