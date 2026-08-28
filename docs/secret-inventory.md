# Secret Inventory

## Retired Ask Tiny Steps secrets

Ask Tiny Steps migrated to Firebase AI Logic, which does not use a Gemini API
secret in this repository. Both former Groq secrets are now retirement candidates.

## Inventory

| secret name | used by which function/module | deploy-time or runtime | canonical? | safe to remove? |
|---|---|---|---|---|
| `groq-api-key` | no current code references in repo | none (retired provider) | no | yes, after production validation |
| `GROQ_API_KEY` | no current code references in repo | none (legacy duplicate) | no | yes, after production validation |
| `BOOTSTRAP_TOKEN` | no current code references in repo | unknown/manual | no | not yet (ownership unknown) |

## Current access notes (GitHub deploy SA)

Principal: `serviceAccount:github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com`

- `groq-api-key`: legacy `roles/secretmanager.secretAccessor` binding can be removed after production validation
- `GROQ_API_KEY`: no access
- `BOOTSTRAP_TOKEN`: no access

## Retirement plan

1. Deploy and validate Ask Tiny Steps through Firebase AI Logic in production.
2. In Google Cloud Console, select `tinysteps-react-v1` and open Security > Secret Manager.
3. Delete both `groq-api-key` and `GROQ_API_KEY` after the agreed rollback window.
4. Remove any remaining secret-level IAM accessor binding for `groq-api-key`.
