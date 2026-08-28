const requiredVariables = [
  'VITE_ASK_TINY_STEPS_FIREBASE_API_KEY',
  'VITE_ASK_TINY_STEPS_FIREBASE_AUTH_DOMAIN',
  'VITE_ASK_TINY_STEPS_FIREBASE_PROJECT_ID',
  'VITE_ASK_TINY_STEPS_FIREBASE_STORAGE_BUCKET',
  'VITE_ASK_TINY_STEPS_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_ASK_TINY_STEPS_FIREBASE_APP_ID',
  'VITE_ASK_TINY_STEPS_RECAPTCHA_ENTERPRISE_SITE_KEY',
];

const missingVariables = requiredVariables.filter(
  (name) => !String(process.env[name] ?? '').trim(),
);

if (missingVariables.length > 0) {
  for (const name of missingVariables) {
    console.error(`Missing required production variable: ${name}`);
  }
  process.exit(1);
}

console.log('Ask Tiny Steps Firebase configuration present: PASS');

if (process.env.VITE_ASK_TINY_STEPS_FIREBASE_PROJECT_ID !== 'tiny-steps-ask-ai') {
  console.error('Ask Tiny Steps secondary project ID: FAIL (expected tiny-steps-ask-ai)');
  process.exit(1);
}

console.log('Ask Tiny Steps secondary project ID: PASS');
