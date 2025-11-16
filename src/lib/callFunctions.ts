import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseConfig';

const fallbackRegions = Array.from(
  new Set(
    [import.meta?.env?.VITE_FUNCTIONS_REGION, 'us-central1', 'asia-south1'].filter(Boolean) as string[]
  )
);

/**
 * Calls a Firebase callable function, trying configured + fallback regions.
 * Throws the last error if all regions fail.
 */
export async function callFunction<T = any, P = any>(name: string, payload?: P): Promise<T> {
  let lastError: any = null;
  for (const region of fallbackRegions) {
    try {
      const client = getFunctions(app, region);
      const fn = httpsCallable(client, name);
      const resp = await fn(payload as any);
      return (resp?.data as T) ?? (resp as unknown as T);
    } catch (err) {
      lastError = err;
    }
  }
  if (lastError) {
    throw lastError;
  }
  throw new Error(`Callable ${name} failed`);
}

export default callFunction;
