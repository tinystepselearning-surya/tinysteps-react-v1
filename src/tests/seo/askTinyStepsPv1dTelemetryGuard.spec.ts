import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const telemetryPath = path.join(ROOT, 'src/lib/askTinyStepsTelemetry.ts');
const hookPath = path.join(ROOT, 'src/hooks/useAskTinyStepsChat.ts');

function read(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

describe('PV-1D Ask Tiny Steps privacy telemetry guard', () => {
  it('keeps the routing event on the existing analytics pipeline with no database writes', () => {
    const telemetry = read(telemetryPath);

    expect(telemetry).toContain("ASK_TINY_STEPS_ROUTING_EVENT = 'ask_tiny_steps_route'");
    expect(telemetry).toContain("import { trackEvent } from './analytics'");
    expect(telemetry).not.toMatch(/firebase\/firestore|addDoc|setDoc|updateDoc|collection\(/);
  });

  it('makes conversation and identity fields unrepresentable in routing metadata', () => {
    const telemetry = read(telemetryPath);

    const neverTypedFields = [
      'deterministicAnswer?: never;',
      'question?: never;',
      'prompt?: never;',
      'answer?: never;',
      'content?: never;',
      'history?: never;',
      'errorMessage?: never;',
      'email?: never;',
      'phone?: never;',
      'userId?: never;',
      'sessionId?: never;',
    ];

    for (const field of neverTypedFields) {
      expect(telemetry).toContain(field);
    }

    expect(telemetry).toContain('route: AskTinyStepsRoutingMetadata');
    expect(telemetry).toContain('promptLength: number');
    expect(telemetry).toContain('prompt_length_bucket');
  });

  it('strips the answer-bearing execution plan before the analytics tracker receives it', () => {
    const hook = read(hookPath);
    const planIndex = hook.indexOf('const plan = planAskTinyStepsExecution');
    const metadataIndex = hook.indexOf('route: toAskTinyStepsRoutingMetadata(plan)');
    const trackIndex = hook.indexOf('trackAskTinyStepsRouting({');

    expect(planIndex).toBeGreaterThan(-1);
    expect(trackIndex).toBeGreaterThan(planIndex);
    expect(metadataIndex).toBeGreaterThan(trackIndex);
    expect(hook).toContain('responsePath');
    expect(hook).toContain('aiAttempted');
  });
});
