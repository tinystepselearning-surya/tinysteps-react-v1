import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMocks = vi.hoisted(() => ({
  getApps: vi.fn(),
  getApp: vi.fn(),
  initializeApp: vi.fn(),
  initializeAppCheck: vi.fn(),
  provider: vi.fn(),
  getAI: vi.fn(),
  backend: vi.fn(),
  getGenerativeModel: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  getApps: firebaseMocks.getApps,
  getApp: firebaseMocks.getApp,
  initializeApp: firebaseMocks.initializeApp,
}));

vi.mock('firebase/app-check', () => ({
  initializeAppCheck: firebaseMocks.initializeAppCheck,
  ReCaptchaEnterpriseProvider: firebaseMocks.provider,
}));

vi.mock('firebase/ai', () => ({
  getAI: firebaseMocks.getAI,
  GoogleAIBackend: firebaseMocks.backend,
  getGenerativeModel: firebaseMocks.getGenerativeModel,
}));

import {
  ASK_TINY_STEPS_APP_NAME,
  ASK_TINY_STEPS_MAX_OUTPUT_TOKENS,
  ASK_TINY_STEPS_MODEL,
  ASK_TINY_STEPS_MODEL_CASCADE,
  ASK_TINY_STEPS_MODEL_TIMEOUT_MS,
  ASK_TINY_STEPS_REQUEST_TIMEOUT_MS,
  ASK_TINY_STEPS_THINKING_BUDGET,
  getAskTinyStepsApp,
  getAskTinyStepsGenerativeModel,
  initializeAskTinyStepsAppCheck,
} from '../../lib/askTinyStepsFirebaseAI';

const askApp = { name: ASK_TINY_STEPS_APP_NAME } as never;

describe('Ask Tiny Steps secondary Firebase AI client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_ASK_TINY_STEPS_FIREBASE_API_KEY', 'public-web-key');
    vi.stubEnv('VITE_ASK_TINY_STEPS_FIREBASE_AUTH_DOMAIN', 'tiny-steps-ask-ai.firebaseapp.com');
    vi.stubEnv('VITE_ASK_TINY_STEPS_FIREBASE_PROJECT_ID', 'tiny-steps-ask-ai');
    vi.stubEnv('VITE_ASK_TINY_STEPS_FIREBASE_STORAGE_BUCKET', 'tiny-steps-ask-ai.firebasestorage.app');
    vi.stubEnv('VITE_ASK_TINY_STEPS_FIREBASE_MESSAGING_SENDER_ID', '123');
    vi.stubEnv('VITE_ASK_TINY_STEPS_FIREBASE_APP_ID', '1:123:web:abc');
    vi.stubEnv('VITE_ASK_TINY_STEPS_RECAPTCHA_ENTERPRISE_SITE_KEY', 'recaptcha-site-key');
    delete (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN;
    delete (globalThis as any).__askTinyStepsAppCheckApps;
    firebaseMocks.getApps.mockReturnValue([]);
    firebaseMocks.initializeApp.mockReturnValue(askApp);
    firebaseMocks.getAI.mockReturnValue({ app: askApp });
    firebaseMocks.getGenerativeModel.mockReturnValue({ startChat: vi.fn() });
  });

  it('initializes a uniquely named secondary app without replacing the default app', () => {
    const defaultApp = { name: '[DEFAULT]' };
    firebaseMocks.getApps.mockReturnValue([defaultApp]);

    expect(getAskTinyStepsApp()).toBe(askApp);
    expect(firebaseMocks.initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'tiny-steps-ask-ai' }),
      ASK_TINY_STEPS_APP_NAME,
    );
    expect(firebaseMocks.initializeApp).not.toHaveBeenCalledWith(expect.anything());
  });

  it('prefers 3.7 Flash, then 3.5 Flash, then 3.5 Flash-Lite', () => {
    expect(ASK_TINY_STEPS_MODEL_CASCADE).toEqual([
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
    ]);
    expect(ASK_TINY_STEPS_MODEL).toBe('gemini-3.7-flash');
  });

  it('uses a 12s/10s/8s per-model timeout budget instead of a 60s stall', () => {
    expect(ASK_TINY_STEPS_MODEL_TIMEOUT_MS).toEqual({
      'gemini-3.7-flash': 12_000,
      'gemini-3.5-flash': 10_000,
      'gemini-3.5-flash-lite': 8_000,
    });
    expect(ASK_TINY_STEPS_REQUEST_TIMEOUT_MS).toBe(12_000);
  });

  it('uses Gemini Developer API and URL Context with the requested model timeout', () => {
    firebaseMocks.getApps.mockReturnValue([askApp]);
    getAskTinyStepsGenerativeModel('gemini-3.5-flash');

    expect(firebaseMocks.backend).toHaveBeenCalledOnce();
    expect(firebaseMocks.getAI).toHaveBeenCalledWith(askApp, {
      backend: expect.anything(),
    });
    expect(firebaseMocks.getGenerativeModel).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        model: 'gemini-3.5-flash',
        tools: [{ urlContext: {} }],
      }),
      { timeout: 10_000 },
    );
  });

  it('uses the SDK-compatible near-minimal thinking budget with answer headroom', () => {
    firebaseMocks.getApps.mockReturnValue([askApp]);
    getAskTinyStepsGenerativeModel();

    const modelConfig = firebaseMocks.getGenerativeModel.mock.calls[0][1];
    expect(ASK_TINY_STEPS_THINKING_BUDGET).toBe(0);
    expect(ASK_TINY_STEPS_MAX_OUTPUT_TOKENS).toBe(768);
    expect(modelConfig.generationConfig).toEqual({
      maxOutputTokens: ASK_TINY_STEPS_MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: ASK_TINY_STEPS_THINKING_BUDGET },
    });
    expect(modelConfig.generationConfig).not.toHaveProperty('temperature');
    expect(modelConfig.generationConfig.thinkingConfig).not.toHaveProperty('thinkingLevel');
  });

  it('applies the shortest timeout to the final Flash-Lite fallback', () => {
    firebaseMocks.getApps.mockReturnValue([askApp]);
    getAskTinyStepsGenerativeModel('gemini-3.5-flash-lite');

    expect(firebaseMocks.getGenerativeModel.mock.calls[0][2]).toEqual({ timeout: 8_000 });
  });

  it('defaults direct model creation to the 3.7 Flash primary', () => {
    firebaseMocks.getApps.mockReturnValue([askApp]);
    getAskTinyStepsGenerativeModel();

    expect(firebaseMocks.getGenerativeModel).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ model: 'gemini-3.7-flash' }),
      expect.anything(),
    );
  });

  it('uses reCAPTCHA Enterprise in production without enabling a debug token', () => {
    vi.stubEnv('DEV', false);
    initializeAskTinyStepsAppCheck(askApp);

    expect(firebaseMocks.provider).toHaveBeenCalledWith('recaptcha-site-key');
    expect(firebaseMocks.initializeAppCheck).toHaveBeenCalledWith(
      askApp,
      expect.objectContaining({ isTokenAutoRefreshEnabled: true }),
    );
    expect((globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN).toBeUndefined();
  });

  it('refuses to initialize Ask Tiny Steps App Check on the default app', () => {
    expect(() =>
      initializeAskTinyStepsAppCheck({ name: '[DEFAULT]' } as never),
    ).toThrow('Refusing to initialize');
    expect(firebaseMocks.initializeAppCheck).not.toHaveBeenCalled();
  });

  it('enables the generated App Check debug-token workflow only in development', () => {
    vi.stubEnv('DEV', true);
    initializeAskTinyStepsAppCheck(askApp);
    expect((globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN).toBe(true);
  });
});
