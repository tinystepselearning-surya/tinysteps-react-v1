/**
 * Test script to hit the deployed generateAIResponse callable function
 * with a SATPIN CVC worksheet prompt. Run with:
 *   GROQ_API_KEY=... FIREBASE_PROJECT_ID=... FIREBASE_API_KEY=... GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json node test-groq-integration.js
 *
 * Required env:
 * - GROQ_API_KEY: Groq API key (needed if your Cloud Function is reading from env in local emulator; not sent on the wire).
 * - FIREBASE_PROJECT_ID: Firebase project id (used to build the function URL).
 * - FIREBASE_API_KEY: Web API key (for exchanging custom token to id token).
 * - GOOGLE_APPLICATION_CREDENTIALS: path to service account JSON with permissions to mint custom tokens.
 * - TEST_UID (optional): uid to impersonate; defaults to groq-test-uid.
 *
 * The script:
 * 1) Creates a Firebase custom token using the service account.
 * 2) Exchanges for an ID token.
 * 3) Calls the callable function over HTTPS with auth header.
 * 4) Validates response (>=5 entries, child-friendly heuristic, tokens_used < 512).
 * 5) Retries up to 2 times on failure.
 */

const axios = require('axios');
const admin = require('firebase-admin');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const WEB_API_KEY = process.env.FIREBASE_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY; // not sent; helps local emulator if needed
const TEST_UID = process.env.TEST_UID || 'groq-test-uid';
const REGION = process.env.FUNCTION_REGION || 'us-central1';
const FUNCTION_URL = process.env.FUNCTION_URL || `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/generateAIResponse`;

if (!PROJECT_ID || !WEB_API_KEY) {
  console.error('Missing FIREBASE_PROJECT_ID or FIREBASE_API_KEY in env.');
  process.exit(1);
}

// Initialize admin with application default/service account
try {
  admin.initializeApp({ projectId: PROJECT_ID });
} catch (e) {
  /* noop if already initialized */
}

const prompt = [
  'Generate 5 CVC words for a 6-year-old learning phonics.',
  'Format: word | picture_hint | sentence',
  'Example: cat | (whiskers) | The cat sits.'
].join(' ');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getIdToken() {
  // 1) Custom token
  const customToken = await admin.auth().createCustomToken(TEST_UID);
  // 2) Exchange via REST to ID token
  const resp = await axios.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${WEB_API_KEY}`,
    { token: customToken, returnSecureToken: true },
    { timeout: 10000 }
  );
  return resp.data.idToken;
}

function isChildFriendly(text) {
  // Very light heuristic: ensure no obvious adult terms and keep sentences short-ish
  const banned = ['kill', 'violence', 'blood', 'gun', 'drug', 'sex'];
  const lower = text.toLowerCase();
  return !banned.some((word) => lower.includes(word)) && text.length < 5000;
}

function extractWords(text) {
  // Split on lines or pipes, keep first token as word candidate
  return text
    .split('\n')
    .map((line) => line.split('|')[0].trim())
    .filter((w) => w);
}

async function callFunction(idToken) {
  const payload = {
    data: {
      prompt,
      studentId: 'demo-student',
      featureType: 'worksheet'
    }
  };

  const headers = {
    Authorization: `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  };

  // Include Groq key only if you are routing through an emulator that reads it
  if (GROQ_API_KEY) {
    headers['x-groq-api-key'] = GROQ_API_KEY;
  }

  const resp = await axios.post(FUNCTION_URL, payload, {
    headers,
    timeout: 30000
  });
  return resp.data.result || resp.data.data || resp.data;
}

async function validateResponse(result) {
  const responseText = result.response || '';
  const tokensUsed = result.tokens_used ?? result.tokensUsed ?? null;
  const words = extractWords(responseText);

  if (words.length < 5) {
    throw new Error(`Validation failed: expected at least 5 words, got ${words.length}`);
  }
  if (!isChildFriendly(responseText)) {
    throw new Error('Validation failed: response does not look child-friendly');
  }
  if (tokensUsed !== null && tokensUsed >= 512) {
    throw new Error(`Validation failed: tokens_used >= 512 (${tokensUsed})`);
  }

  console.log('Validation passed.');
  console.log('Words:', words.slice(0, 5).join(', '));
  console.log('Tokens used:', tokensUsed);
  console.log('Full response:\n', responseText);
}

async function main() {
  let attempt = 0;
  let lastError = null;
  while (attempt < 3) {
    attempt += 1;
    try {
      console.log(`Attempt ${attempt}: obtaining ID token...`);
      const idToken = await getIdToken();
      console.log('ID token acquired. Calling function...');
      const result = await callFunction(idToken);
      await validateResponse(result);
      console.log('Test completed successfully.');
      return;
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${attempt} failed:`, err.response?.data || err.message);
      if (attempt < 3) {
        console.log('Retrying in 2 seconds...');
        await sleep(2000);
      }
    }
  }

  console.error('All attempts failed. Last error:', lastError?.response?.data || lastError?.message);
  process.exit(1);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
