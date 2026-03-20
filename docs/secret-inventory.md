# Secret Inventory

## Canonical decision

- Canonical Groq secret name: `groq-api-key`
- Duplicate legacy name: `GROQ_API_KEY`

## Inventory

| secret name | used by which function/module | deploy-time or runtime | canonical? | safe to remove? |
|---|---|---|---|---|
| `groq-api-key` | `functions/src/ai/askTinySteps.ts` via `defineSecret("groq-api-key")` | runtime (Cloud Functions secret injection) | yes | no |
| `GROQ_API_KEY` | no current code references in repo | none (legacy duplicate) | no | yes, after final verification window |
| `BOOTSTRAP_TOKEN` | no current code references in repo | unknown/manual | no | not yet (ownership unknown) |

## Current access notes (GitHub deploy SA)

Principal: `serviceAccount:github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com`

- `groq-api-key`: `roles/secretmanager.secretAccessor`
- `GROQ_API_KEY`: no access
- `BOOTSTRAP_TOKEN`: no access

## Retirement plan for duplicate `GROQ_API_KEY`

1. Keep secret object for one verification cycle while no code references it.
2. Confirm no runtime/CI breakage.
3. Delete secret `GROQ_API_KEY` from Secret Manager.
