import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Ask Tiny Steps URL Context security boundary', () => {
  it('keeps arbitrary URLs out and preserves the deterministic registry allowlist', () => {
    const service = readFileSync(
      join(process.cwd(), 'src/services/askTinyStepsService.ts'),
      'utf8',
    );
    const selector = readFileSync(
      join(process.cwd(), 'src/services/askTinyStepsSourceSelector.ts'),
      'utf8',
    );
    const router = readFileSync(
      join(process.cwd(), 'src/services/askTinyStepsExecutionRouter.ts'),
      'utf8',
    );
    const aiClient = readFileSync(
      join(process.cwd(), 'src/lib/askTinyStepsFirebaseAI.ts'),
      'utf8',
    );
    const hook = readFileSync(
      join(process.cwd(), 'src/hooks/useAskTinyStepsChat.ts'),
      'utf8',
    );

    expect(aiClient).toContain("mode === 'first_party_grounded'");
    expect(aiClient).toContain('tools: [{ urlContext: {} }]');
    expect(selector).toContain('ASK_TINY_STEPS_MAX_URL_CONTEXT_SOURCES = 2');
    expect(service).toContain('removeConversationUrls');
    expect(service).toContain('ASK_TINY_STEPS_KNOWLEDGE_SOURCES.find');
    expect(service).toContain("urlRetrievalStatus === 'URL_RETRIEVAL_STATUS_SUCCESS'");
    expect(service).toContain('primary-url-context-retrieval-failed');
    expect(router).toContain('planAskTinyStepsExecution');
    expect(router).toContain('selectAskTinyStepsSources');
    expect(router).toContain('VISITOR_URL_PATTERN');
    expect(hook).toContain('planAskTinyStepsExecution');
    expect(hook).toContain('sourceIds: plan.sourceIds');

    // General guidance must not inherit the URL Context tool.
    expect(aiClient).toContain("mode: AskTinyStepsModelMode = 'first_party_grounded'");
    expect(router).toContain("mode: 'general_guidance'");

    // The Groq-era copied-snippet / generic KB request contracts are retired.
    expect(service).not.toContain('approvedSnippets');
    expect(hook).not.toContain('approvedSnippets');
    expect(service).not.toContain('APPROVED TINY STEPS SNIPPETS');
    expect(hook).not.toContain('scoreKB');
    expect(hook).not.toContain('retrieve(trimmed');
  });
});
