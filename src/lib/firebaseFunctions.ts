// src/lib/firebaseFunctions.ts
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseConfig';

const functions = getFunctions(app, 'asia-south1');

// Cloud Function: "groqKidIdea"
// Input: { topic: string }
// Output: either { idea: string } or a plain string
export async function getGroqKidIdea(topic: string): Promise<string> {
  const callable = httpsCallable(functions, 'groqKidIdea');
  const result = await callable({ topic });

  const data = result.data as any;

  if (data && typeof data.idea === 'string') {
    return data.idea;
  }

  if (typeof data === 'string') {
    return data;
  }

  return 'No idea returned from Groq function.';
}
