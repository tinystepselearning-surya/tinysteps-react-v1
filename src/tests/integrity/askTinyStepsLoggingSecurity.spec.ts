import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Ask Tiny Steps public logging boundary', () => {
  it('does not write public conversations directly to the main Firestore database', () => {
    const hook = readFileSync(
      join(process.cwd(), 'src/hooks/useAskTinyStepsChat.ts'),
      'utf8',
    );

    expect(hook).not.toContain('../lib/firebaseConfig');
    expect(hook).not.toContain('firebase/firestore');
    expect(hook).not.toContain('askTinysteps_sessions');
    expect(hook).not.toContain('AskTinySteps logging error');
    expect(hook).not.toContain('ts_ask_session_v1');
  });

  it('keeps the public privacy and active-offer copy consistent with the implementation', () => {
    const modal = readFileSync(
      join(process.cwd(), 'src/components/common/AskTinyStepsModal.tsx'),
      'utf8',
    );

    expect(modal).toContain('Tiny Steps does not save this chat history.');
    expect(modal).not.toContain('Chats may be stored to improve responses.');
    expect(modal).not.toContain('Tell me about Summer Camp');
    expect(modal).not.toContain('curriculum and summer camp');
  });
});
