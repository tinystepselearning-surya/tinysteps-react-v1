import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseConfig';

// Map known callable functions to the regions where they are actually deployed.
// This avoids relying on env misconfigurations and ensures game functions hit us-central1.
const FUNCTION_REGION_OVERRIDES: Record<string, string> = {
  // Game / Groq-backed functions (us-central1)
  // (game-related functions removed)

  // Admin / payments / LP functions (asia-south1)
  verifyPhonePePayment: 'asia-south1',
  setUserRole: 'asia-south1',
  adminResetPassword: 'asia-south1',
  adminCreateUser: 'asia-south1',
  resolveLoginIdentifier: 'asia-south1',
  webhookPhonePe: 'asia-south1',
  assignLPToParent: 'asia-south1',
  unassignLPFromParent: 'asia-south1',
  createRazorpayOrder: 'asia-south1',
  unassignLPFromTeacher: 'asia-south1',
  createPhonePeOrder: 'asia-south1',
  adminGenerateResetLink: 'asia-south1',
  assignLPToTeacher: 'asia-south1',
  adminProcessEnrollmentCSV: 'asia-south1',
  adminCreateDemoSession: 'asia-south1',
  adminCheckDemoPhoneConflicts: 'asia-south1',
  adminUpdateDemoSessionDetails: 'asia-south1',
  createOrSyncMessageThread: 'asia-south1',
  syncMessageThreadsForActiveStudents: 'asia-south1',
  registerNotificationToken: 'asia-south1',
  sendTestPushNotification: 'asia-south1',
  createLessonAccessSession: 'asia-south1',
  resolveLessonAccessViewer: 'asia-south1',
  claimDemoSession: 'asia-south1',
  updateDemoSessionSchedule: 'asia-south1',
  completeDemoSession: 'asia-south1',
  sendMessage: 'asia-south1',
  markMessageThreadRead: 'asia-south1',
  reassignDemoSession: 'asia-south1',
  cancelDemoSession: 'asia-south1',
  releaseDemoSession: 'asia-south1',
  deleteDemoSession: 'asia-south1',
  reopenDemoSession: 'asia-south1',
  recordLegacyFallbackUsage: 'asia-south1',
  getUidByEmail: 'asia-south1',
  subscribeNewsletter: 'asia-south1',
};

const FALLBACK_REGIONS = Array.from(
  new Set(
    [import.meta?.env?.VITE_FUNCTIONS_REGION, 'us-central1', 'asia-south1'].filter(Boolean) as string[]
  )
);

/**
 * Calls a Firebase callable function, preferring the region where it is actually deployed.
 * Falls back across known regions if needed. Throws the last error if all regions fail.
 */
export async function callFunction<T = any, P = any>(name: string, payload?: P): Promise<T> {
  const preferredRegion = FUNCTION_REGION_OVERRIDES[name];
  const regionsToTry = preferredRegion ? [preferredRegion] : FALLBACK_REGIONS;

  let lastError: any = null;

  for (const region of regionsToTry) {
    try {
      const client = getFunctions(app, region);
      const fn = httpsCallable(client, name);
      const resp = await fn(payload as any);
      return (resp?.data as T) ?? (resp as unknown as T);
    } catch (err) {
      lastError = err;
      // Surface details in dev to help diagnose auth/region/network issues.
      if (import.meta.env?.DEV) {
        console.error(`Callable ${name} failed in region ${region}`, err);
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error(`Callable ${name} failed in all regions`);
}

export default callFunction;
