# Firebase Database Secret Upgrade Runbook

## Why this exists

Firebase is deprecating Realtime Database "Database secrets" (legacy token generator path). This runbook tracks how TinySteps verifies and removes legacy dependencies.

## Current repo status

- Cloud Functions and scripts use `firebase-admin` for server-side auth.
- No active source references to `firebase-token-generator`.
- CI function deploy now uses Google service-account auth in GitHub Actions (not `FIREBASE_TOKEN`).

## Pre-upgrade checks

1. Run local audit:

```bash
npm run audit:firebase-upgrade
```

2. In Firebase Console, confirm there are no remaining consumers of Database Secrets:
- Cloud Functions
- Any backend service outside this repo
- Legacy mobile/web clients still minting custom tokens

3. Verify all custom token creation uses Admin SDK:
- `admin.auth().createCustomToken(...)`

## Deployment checks

1. Ensure GitHub secret `FIREBASE_SERVICE_ACCOUNT_TINYSTEPS_REACT_V1` is valid and has deploy permissions.
2. Deploy to staging.
3. Verify:
- Auth login flows
- Callable functions requiring admin claims
- Any custom-token-based local tooling

## Post-upgrade validation

- Check Cloud Function logs for auth failures (`permission-denied`, invalid token, missing claims).
- Confirm GitHub Actions deploys complete without token-auth fallback.
- Remove any remaining Database Secrets from Firebase Console only after all consumers are confirmed migrated.

## Rollback plan

1. If auth failures spike after cutover, immediately pause secret removal.
2. Revert the deployment workflow/auth change commit.
3. Restore previous known-good deploy while root cause is investigated.
