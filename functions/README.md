# Functions Helpers

This folder contains utility scripts to manage secrets and other environment-level operations for Firebase Cloud Functions.

## Updating Groq API Key

Canonical secret name: `groq-api-key`

The repository expects the Groq API key to be present in Google Secret Manager as `groq-api-key`.

Use the maintained Node helper from the `functions/` directory. Prefer passing the key through the environment rather than as a command-line argument:

```bash
GCLOUD_PROJECT="tinysteps-react-v1" NEW_GROQ_KEY="sk-NEW_KEY" npm run set-groq-secret
```

The helper uses `@google-cloud/secret-manager` and Application Default Credentials to create the secret when needed and add a new secret version.

## Prerequisites

- Ensure Application Default Credentials are configured with permission to manage Secret Manager, for example with `gcloud auth application-default login`.
- Set `GCLOUD_PROJECT` (or `GCP_PROJECT`), unless `FIREBASE_CONFIG` already supplies the project ID.

After updating the secret, redeploy Functions or restart the Functions emulator if a process has cached the secret value.

## Security Notes

- Never commit API keys into the repository.
- Prefer `NEW_GROQ_KEY` over passing a key directly as a command-line argument so the key is less likely to appear in shell history or process listings.
- Restrict secret access to the least privileges required; only service accounts that need the secret should be able to read it.
