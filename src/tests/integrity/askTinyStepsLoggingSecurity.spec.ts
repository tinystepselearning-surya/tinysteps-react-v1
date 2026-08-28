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
});
