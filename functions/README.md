# Functions Helpers

This folder contains utility scripts to manage secrets and other environment-level operations for Firebase Cloud Functions.

## Updating Groq API Key

The repository expects the Groq API key to be present in Google Secret Manager as a secret named `groq-api-key`.

You can update or create it using one of the following methods:

1) Using gcloud and a shell script (recommended):

```bash
# From functions/ directory
# Provide new key as argument
./scripts/set-groq-secret.sh "sk-NEW_KEY"

# Or as environment var
NEW_GROQ_KEY="sk-NEW_KEY" ./scripts/set-groq-secret.sh
```

2) Using Node helper (requires AD creds):

```bash
# From functions/ directory
NEW_GROQ_KEY="sk-NEW_KEY" node scripts/setGroqSecret.js
# or
node scripts/setGroqSecret.js "sk-NEW_KEY"
```

3) (Local/dev only) Use environment variable override for local emulation or dev:

When running the Firebase emulator or testing locally, you can set env var `GROQ_API_KEY` and the functions will use that instead of Secret Manager.

```bash
# macOS / zsh
export GROQ_API_KEY="sk-NEW_KEY"
npm run emulators # or your function dev run
```

Note: After updating the secret, redeploy functions or restart the functions emulator if secrets are cached at init time.

## Prerequisites

- For gcloud scripts: Install Google Cloud SDK and authenticate with `gcloud auth login` and set project with `gcloud config set project tinystepselearning-surya`.
- For Node script: Ensure Application Default Credentials are set up (e.g., via `gcloud auth application-default login`).

## Security Notes

- Never commit API keys into the repository.
- Restrict secret access to the least privileges required (only service accounts used by functions should have access to read the secret).
