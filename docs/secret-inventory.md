# Secret Inventory

## Inventory

| secret name | used by which function/module | deploy-time or runtime | canonical? | safe to remove? |
|---|---|---|---|---|
| `BOOTSTRAP_TOKEN` | no current code references in repo | unknown/manual | no | not yet (ownership unknown) |

## Current access notes (GitHub deploy SA)

Principal: `serviceAccount:github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com`

- `BOOTSTRAP_TOKEN`: no access
