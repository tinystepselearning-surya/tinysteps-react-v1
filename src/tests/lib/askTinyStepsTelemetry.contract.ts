import type {
  AskTinyStepsRoutingMetadata,
  AskTinyStepsRoutingTelemetryInput,
} from '../../lib/askTinyStepsTelemetry';

export const pv1dSafeRouteFixture: AskTinyStepsRoutingMetadata = {
  mode: 'deterministic',
  reason: 'verified_fact',
  audience: 'parents',
  intent: 'pricing',
  sourceIds: ['pricing'],
  isFollowUp: false,
};

export const pv1dTechnicalOnlyFixture: AskTinyStepsRoutingTelemetryInput = {
  route: pv1dSafeRouteFixture,
  promptLength: 42,
  aiAttempted: false,
  responsePath: 'deterministic',
  totalLatencyMs: 12,
};

export const pv1dRejectsAnswerBearingRoute: AskTinyStepsRoutingMetadata = {
  ...pv1dSafeRouteFixture,
  // @ts-expect-error PV-1D deliberately makes answer content unrepresentable.
  deterministicAnswer: 'This must never enter telemetry.',
};

export const pv1dRejectsPromptBearingRoute: AskTinyStepsRoutingMetadata = {
  ...pv1dSafeRouteFixture,
  // @ts-expect-error PV-1D deliberately makes prompt content unrepresentable.
  prompt: 'This must never enter telemetry.',
};
