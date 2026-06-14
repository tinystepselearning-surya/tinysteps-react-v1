# Firebase Deploy IAM Runbook

Project: `tinysteps-react-v1`

## Current deploy identity

Production deploys in [`.github/workflows/deploy.yml`](/Users/tinysteps/Documents/Tinysteps-react-v1/.github/workflows/deploy.yml) use:

- GitHub Actions
- `google-github-actions/auth@v2`
- `credentials_json: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_TINYSTEPS_REACT_V1 }}`

That means the repo is using a service account JSON stored in a GitHub secret, not Workload Identity Federation and not `FIREBASE_TOKEN`.

The audited deploy principal already documented in [docs/iam-audit-sheet.md](/Users/tinysteps/Documents/Tinysteps-react-v1/docs/iam-audit-sheet.md) is:

- `github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com`

If the GitHub secret is rotated to a different service account, update this runbook and `docs/iam-audit-sheet.md` together.

## Why the new callable deploy failed

The failed function was:

- `repairEnrollmentFutureSessionsFromSchedule(asia-south1)`

Observed Firebase error:

- `Unable to set the invoker for the IAM policy`

This is an IAM permission problem on the deploy identity for new callable/HTTPS function rollout. It is not a TypeScript build problem.

## Required deploy roles

For this project, the deploy identity should have these project-level roles at minimum for Firebase Functions + Hosting deploys:

- `roles/firebase.admin`
- `roles/cloudfunctions.admin`
- `roles/run.admin`
- `roles/iam.serviceAccountUser`
- `roles/artifactregistry.writer`
- `roles/cloudbuild.builds.editor`

If the project deploys scheduled or event-driven functions, also grant:

- `roles/cloudscheduler.admin`
- `roles/eventarc.admin`
- `roles/pubsub.admin`

Existing repo docs already show that the deploy service account has historically needed IAM and scheduler-related permissions. This runbook is the canonical checklist for callable deployment.

## Grant commands

Replace the service account placeholder if the GitHub secret now points to a different principal.

```bash
PROJECT_ID="tinysteps-react-v1"
DEPLOY_SA="<DEPLOY_SERVICE_ACCOUNT_EMAIL>"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOY_SA" \
  --role="roles/firebase.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOY_SA" \
  --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOY_SA" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOY_SA" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOY_SA" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOY_SA" \
  --role="roles/cloudbuild.builds.editor"
```

Additional roles when scheduled/event-driven functions are deployed:

```bash
PROJECT_ID="tinysteps-react-v1"
DEPLOY_SA="<DEPLOY_SERVICE_ACCOUNT_EMAIL>"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOY_SA" \
  --role="roles/cloudscheduler.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOY_SA" \
  --role="roles/eventarc.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOY_SA" \
  --role="roles/pubsub.admin"
```

## Safe deploy order after IAM is fixed

1. Deploy only the failed callable first:

```bash
npx firebase-tools@latest deploy \
  --only functions:repairEnrollmentFutureSessionsFromSchedule \
  --project tinysteps-react-v1 \
  --non-interactive
```

2. Then deploy all functions:

```bash
npx firebase-tools@latest deploy \
  --only functions \
  --project tinysteps-react-v1 \
  --non-interactive
```

3. Then deploy hosting because frontend files changed:

```bash
npm run build

npx firebase-tools@latest deploy \
  --only hosting \
  --project tinysteps-react-v1 \
  --non-interactive
```

## Notes for this incident

- Do not remove `repairEnrollmentFutureSessionsFromSchedule`.
- Do not weaken the repair safety rules to avoid the deploy error.
- If the single-function deploy still fails after these grants, inspect whether the deploy principal can modify Cloud Run invoker policy for gen2-backed callable functions.
