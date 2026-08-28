import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check';
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  type GenerativeModel,
} from 'firebase/ai';

export const ASK_TINY_STEPS_APP_NAME = 'ask-tiny-steps';
export const ASK_TINY_STEPS_PROJECT_ID = 'tiny-steps-ask-ai';
export const ASK_TINY_STEPS_MODEL = 'gemini-3.5-flash-lite';
export const ASK_TINY_STEPS_REQUEST_TIMEOUT_MS = 60_000;

type AskTinyStepsRuntime = typeof globalThis & {
  FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  __askTinyStepsAppCheckApps?: Set<string>;
};

const requiredEnv = (name: string, value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Ask Tiny Steps is not configured (${name} is missing).`);
  }
  return value.trim();
};

export function getAskTinyStepsFirebaseConfig(): FirebaseOptions {
  const env = import.meta.env;
  const projectId = requiredEnv(
    'VITE_ASK_TINY_STEPS_FIREBASE_PROJECT_ID',
    env.VITE_ASK_TINY_STEPS_FIREBASE_PROJECT_ID,
  );
  if (projectId !== ASK_TINY_STEPS_PROJECT_ID) {
    throw new Error(`Ask Tiny Steps must use Firebase project ${ASK_TINY_STEPS_PROJECT_ID}.`);
  }
  return {
    apiKey: requiredEnv('VITE_ASK_TINY_STEPS_FIREBASE_API_KEY', env.VITE_ASK_TINY_STEPS_FIREBASE_API_KEY),
    authDomain: requiredEnv(
      'VITE_ASK_TINY_STEPS_FIREBASE_AUTH_DOMAIN',
      env.VITE_ASK_TINY_STEPS_FIREBASE_AUTH_DOMAIN,
    ),
    projectId,
    storageBucket: requiredEnv(
      'VITE_ASK_TINY_STEPS_FIREBASE_STORAGE_BUCKET',
      env.VITE_ASK_TINY_STEPS_FIREBASE_STORAGE_BUCKET,
    ),
    messagingSenderId: requiredEnv(
      'VITE_ASK_TINY_STEPS_FIREBASE_MESSAGING_SENDER_ID',
      env.VITE_ASK_TINY_STEPS_FIREBASE_MESSAGING_SENDER_ID,
    ),
    appId: requiredEnv('VITE_ASK_TINY_STEPS_FIREBASE_APP_ID', env.VITE_ASK_TINY_STEPS_FIREBASE_APP_ID),
  };
}

function findAskTinyStepsApp(): FirebaseApp | undefined {
  return getApps().find((candidate) => candidate.name === ASK_TINY_STEPS_APP_NAME);
}

export function getAskTinyStepsApp(): FirebaseApp {
  return (
    findAskTinyStepsApp() ??
    initializeApp(getAskTinyStepsFirebaseConfig(), ASK_TINY_STEPS_APP_NAME)
  );
}

export function initializeAskTinyStepsAppCheck(
  app: FirebaseApp,
): void {
  if (typeof window === 'undefined') return;
  if (app.name !== ASK_TINY_STEPS_APP_NAME) {
    throw new Error('Refusing to initialize Ask Tiny Steps App Check on another Firebase app.');
  }

  const runtime = globalThis as AskTinyStepsRuntime;
  const initializedApps =
    runtime.__askTinyStepsAppCheckApps ?? (runtime.__askTinyStepsAppCheckApps = new Set<string>());
  if (initializedApps.has(app.name)) return;

  if (import.meta.env.DEV) {
    // Firebase prints a generated debug token to the browser console. Register that
    // token in the tiny-steps-ask-ai project; never paste it into source or an env file.
    runtime.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  const siteKey = requiredEnv(
    'VITE_ASK_TINY_STEPS_RECAPTCHA_ENTERPRISE_SITE_KEY',
    import.meta.env.VITE_ASK_TINY_STEPS_RECAPTCHA_ENTERPRISE_SITE_KEY,
  );
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  initializedApps.add(app.name);
}

export function getAskTinyStepsGenerativeModel(): GenerativeModel {
  const app = getAskTinyStepsApp();
  initializeAskTinyStepsAppCheck(app);
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  return getGenerativeModel(
    ai,
    {
      model: ASK_TINY_STEPS_MODEL,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 180,
      },
      systemInstruction: ASK_TINY_STEPS_SYSTEM_INSTRUCTION,
    },
    { timeout: ASK_TINY_STEPS_REQUEST_TIMEOUT_MS },
  );
}

export const ASK_TINY_STEPS_SYSTEM_INSTRUCTION = `You are "Ask TinySteps", the official public learning assistant for Tiny Steps Learning.

STYLE:
- Use polite, respectful, simple Indian English.
- Be concise: usually 2-4 short sentences and under 75 words.
- For a requested list or breakdown, use at most 4 short bullets.
- Mention WhatsApp support at most once and never pressure a parent to book.
- Do not repeat the same line.
- When you use an approved snippet, end with "Source:" and at most two supplied source URLs.

APPROVED TINY STEPS FACTS:
- One Free 35-Minute Demo Assessment Class is exactly one live 1:1 online session per child before enrolment. It is FREE (₹0), requires no credit card, and has no enrolment obligation.
- Regular classes are live online 1:1 sessions lasting 35 minutes.
- Tracks are Phonics (ages 3-10), Grammar (ages 5-10), and Public Speaking (ages 5-12).
- Standard 1:1 pricing is ₹400 per class. The 12-class package is ₹4,800. Small-group pricing is ₹180-₹300 per child per class.
- Summer Camp 2026 ended on 13 June 2026 and enrolment is closed. Its historical list fee was ₹5,000 and historical effective fee was ₹2,400 for 24 small-group classes.
- Public website: https://tinystepslearning.com
- WhatsApp Advisor: https://wa.me/919618398383

BOUNDARIES:
- Answer primarily from these approved facts and the approved snippets included with the current question.
- Never fabricate Tiny Steps pricing, policies, programmes, curriculum, schedules, discounts, teacher allocation, results, or guarantees.
- If an exact Tiny Steps detail is unavailable, say you do not have it confirmed and offer the WhatsApp Advisor once.
- You may give brief, age-appropriate general educational guidance about children's English learning, phonics, phonemic awareness, blending, decoding, reading, grammar, and speaking. Clearly avoid presenting general guidance as a Tiny Steps policy.
- Redirect unrelated questions to children's English learning or Tiny Steps.
- You have no access to accounts, child records, enrolments, parent details, teachers, attendance, progress, assessments, or session data. For student-specific requests, direct the parent to the secure Parent Dashboard.
- Do not provide medical, legal, financial, political, or general-purpose assistant advice.
- Never request sensitive data such as OTPs, card details, passwords, or Aadhaar numbers.
- A live demo assessment is not a free trial. A separate 3-day digital-games trial applies only to the digital-games subscription.
- When appropriate, you may gently suggest booking the free assessment, but do not pressure the user.`;
