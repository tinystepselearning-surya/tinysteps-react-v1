# Ask Tiny Steps: Firebase AI Logic

Ask Tiny Steps uses the Gemini Developer API through Firebase AI Logic on the
separate `tiny-steps-ask-ai` Firebase project. The primary
`tinysteps-react-v1` Firebase app remains the default app and continues to own
the website's Auth, Firestore, Functions, Hosting, and best-effort public chat
analytics.

## Configuration

Copy the `VITE_ASK_TINY_STEPS_*` placeholders from `.env.local.example` into an
ignored local environment file or the hosting environment. Use the Firebase web
configuration for **Ask Tiny Steps Web** and its reCAPTCHA Enterprise site key.
These are browser configuration values. Do not add a Gemini API key, service
account, App Check debug token, or Groq key.

## Local App Check workflow

1. Start the app in Vite development mode and open Ask Tiny Steps on localhost.
2. Send a non-greeting question so the secondary app initializes.
3. Copy the generated App Check debug token printed by Firebase in the browser console.
4. In Firebase Console, select `tiny-steps-ask-ai`, then open **App Check** and
   register the token under **Manage debug tokens** for **Ask Tiny Steps Web**.
5. Reload and verify the Firebase AI Logic request succeeds.

Debug mode is gated by `import.meta.env.DEV`. Never put the generated token in
source control or an environment file, and do not add localhost to the production
reCAPTCHA Enterprise key.

## Production validation

- Supply all seven `VITE_ASK_TINY_STEPS_*` values before the production build.
- Confirm Ask Tiny Steps answers a common FAQ on `tinystepslearning.com`.
- Confirm App Check shows verified Firebase AI Logic requests.
- Confirm the default app's Auth, Firestore, and Functions behavior is unchanged.
- Confirm no Groq request and no App Check debug-token message appears.

After the agreed rollback window, delete `groq-api-key` and `GROQ_API_KEY` in
Secret Manager for `tinysteps-react-v1`, and remove the former secret-level
accessor binding. Do this only after production validation.
