# IAM Audit Sheet

Target principal audited:

- `serviceAccount:github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com`

## Project-level roles

| principal | role | scope | reason | keep/remove/narrow | tested after change |
|---|---|---|---|---|---|
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/cloudfunctions.developer` | project `tinysteps-react-v1` | deploy/update gen2 functions | keep | yes (manual deploy + smoke checks) |
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/cloudscheduler.admin` | project `tinysteps-react-v1` | manage scheduled function jobs during deploy | keep (review later for narrower custom role) | yes (scheduled functions deploy verified) |
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/datastore.indexAdmin` | project `tinysteps-react-v1` | list/create and monitor required Firestore composite indexes; no document access | keep | yes (two dedicated workflow runs; create/READY then READY no-mutation) |
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/datastore.viewer` | project `tinysteps-react-v1` | Firebase deploy analysis for Firestore metadata | keep (review later if removable) | yes (deploy + trigger checks) |
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/firebaseauth.admin` | project `tinysteps-react-v1` | currently granted; functional need for deploy not yet proven | narrow/remove candidate | yes (deploy succeeded with role still present) |
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/firebasehosting.admin` | project `tinysteps-react-v1` | Firebase Hosting deploy action | keep | yes (no regressions in function deploy workflow) |
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/run.viewer` | project `tinysteps-react-v1` | inspect Cloud Run services backing gen2 functions | keep | yes (gen2 rollout and runtime checks) |
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/serviceusage.apiKeysViewer` | project `tinysteps-react-v1` | service/API inspection during deploy workflows | keep | yes (deploy and CLI checks) |
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/serviceusage.serviceUsageConsumer` | project `tinysteps-react-v1` | service usage checks during deploy | keep | yes (deploy and CLI checks) |

## Narrowed scopes completed

| principal | role | scope | reason | keep/remove/narrow | tested after change |
|---|---|---|---|---|---|
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/iam.serviceAccountUser` | `tinysteps-react-v1@appspot.gserviceaccount.com` (service-account scope) | required to act as runtime service account | narrowed (from project-level) | yes (policy update verified) |
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/secretmanager.secretAccessor` | secret `groq-api-key` | retired Ask Tiny Steps provider | remove after Firebase AI Logic production validation | pending |
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/secretmanager.viewer` | secret `groq-api-key` | not required for runtime secret access | removed | yes (policy update verified) |
| github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com | `roles/secretmanager.secretAccessor` + `roles/secretmanager.viewer` | secret `GROQ_API_KEY` | duplicate legacy secret; not used by code | removed | yes (policy update verified) |

## Notes

- No additional current project-level role bindings were found beyond the roles in the Project-level roles table.
- A follow-up hardening pass should test removing `roles/firebaseauth.admin` and possibly `roles/datastore.viewer` one at a time through CI deploy verification.
