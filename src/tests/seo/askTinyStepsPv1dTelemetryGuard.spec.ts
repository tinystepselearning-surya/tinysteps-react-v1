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

  it('does not define conversation-content fields in the telemetry payload', () => {
    const telemetry = read(telemetryPath);

    const forbiddenPayloadKeys = [
      'question:',
      'prompt:',
      'answer:',
      'response_text:',
      'error_message:',
      'email:',
      'phone:',
      'child_name:',
      'parent_name:',
      'conversation:',
      'history:',
      'session_id:',
      'user_id:',
    ];

    for (const key of forbiddenPayloadKeys) {
      expect(telemetry).not.toContain(key);
    }

    expect(telemetry).toContain('promptLength: number');
    expect(telemetry).toContain('prompt_length_bucket');
  });

  it('emits telemetry only after the execution plan has selected an answer path', () => {
    const hook = read(hookPath);
    const planIndex = hook.indexOf('const plan = planAskTinyStepsExecution');
    const trackIndex = hook.indexOf('trackAskTinyStepsRouting({');

    expect(planIndex).toBeGreaterThan(-1);
    expect(trackIndex).toBeGreaterThan(planIndex);
    expect(hook).toContain('responsePath');
    expect(hook).toContain('aiAttempted');
  });
});
