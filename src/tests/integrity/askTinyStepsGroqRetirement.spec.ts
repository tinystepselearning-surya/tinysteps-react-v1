import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Ask Tiny Steps provider retirement', () => {
  it('has no Groq runtime path, keeps the model cascade, and leaves main Firebase independent', () => {
    const service = readFileSync(join(process.cwd(), 'src/services/askTinyStepsService.ts'), 'utf8');
    const aiClient = readFileSync(join(process.cwd(), 'src/lib/askTinyStepsFirebaseAI.ts'), 'utf8');
    const mainFirebase = readFileSync(join(process.cwd(), 'src/lib/firebaseConfig.ts'), 'utf8');
    const functionsIndex = readFileSync(join(process.cwd(), 'functions/src/index.ts'), 'utf8');
    const deployWorkflow = readFileSync(join(process.cwd(), '.github/workflows/deploy.yml'), 'utf8');

    expect(service.toLowerCase()).not.toContain('groq');
    expect(service).toContain('getAskTinyStepsGenerativeModel');
    expect(service).toContain('ASK_TINY_STEPS_MODEL_CASCADE');
    expect(aiClient).toContain("ASK_TINY_STEPS_APP_NAME = 'ask-tiny-steps'");
    expect(aiClient).toContain("'gemini-3.7-flash'");
    expect(aiClient).toContain("'gemini-3.5-flash'");
    expect(aiClient).toContain("'gemini-3.5-flash-lite'");
    expect(mainFirebase).not.toContain('tiny-steps-ask-ai');
    expect(functionsIndex).not.toContain('export { askTinySteps }');
    expect(deployWorkflow).toMatch(/retired_functions=\([\s\S]*?\baskTinySteps\b/);
  });
});
