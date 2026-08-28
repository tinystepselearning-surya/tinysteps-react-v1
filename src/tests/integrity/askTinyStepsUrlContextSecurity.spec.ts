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
    const aiClient = readFileSync(
      join(process.cwd(), 'src/lib/askTinyStepsFirebaseAI.ts'),
      'utf8',
    );
    const hook = readFileSync(
      join(process.cwd(), 'src/hooks/useAskTinyStepsChat.ts'),
      'utf8',
    );

    expect(aiClient).toContain('tools: [{ urlContext: {} }]');
    expect(selector).toContain('ASK_TINY_STEPS_MAX_URL_CONTEXT_SOURCES = 3');
    expect(service).toContain('removeConversationUrls');
    expect(service).toContain('ASK_TINY_STEPS_KNOWLEDGE_SOURCES.find');
    expect(service).toContain("urlRetrievalStatus === 'URL_RETRIEVAL_STATUS_SUCCESS'");
    expect(service).toContain('primary-url-context-retrieval-failed');
    expect(hook).toContain('selectAskTinyStepsSources');
    expect(hook).toContain('sourceIds: sourceSelection.sourceIds');

    // The Groq-era copied-snippet request contract is retired from the AI path.
    expect(service).not.toContain('approvedSnippets');
    expect(hook).not.toContain('approvedSnippets');
    expect(service).not.toContain('APPROVED TINY STEPS SNIPPETS');
  });
});
