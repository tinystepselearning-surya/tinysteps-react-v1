# System Inventory Sheet

Fill this sheet before cutover. Keep one row per system/process.

## Columns

- `System`
- `Owner`
- `Environment` (local/staging/prod/other)
- `Auth Method` (ADC/service account secret/OIDC/token/unknown)
- `Touches Realtime Database` (yes/no/unknown)
- `Production Critical` (yes/no)
- `Evidence` (file path, workflow, dashboard, script name)
- `Status` (green/needs-fix/unknown)
- `Notes`

## Inventory

| System | Owner | Environment | Auth Method | Touches Realtime Database | Production Critical | Evidence | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Web app (Vite React) | TBD | prod | Firebase Web SDK client auth | unknown | yes | `/src/lib/firebaseConfig.ts` | unknown | Verify if any route still reads RTDB directly |
| Cloud Functions | TBD | prod | Firebase Admin SDK (runtime SA) | unknown | yes | `/functions/src` | green | No DB-secret/token-generator refs in repo scan |
| GitHub Actions deploy | TBD | prod | Service account credentials JSON in GH secret | no | yes | `/.github/workflows/deploy.yml` | green | Functions deploy path now avoids `FIREBASE_TOKEN` |
| Local admin scripts | TBD | local | ADC or service account JSON | unknown | no | `/scripts/dev-tools` | green | Uses shared init helper `adminInit.js` |
| One-off maintenance scripts | TBD | local/prod | ADC or service account JSON | unknown | medium | `/functions/src/scripts` | unknown | Validate project targeting and auth assumptions |
| Analytics jobs / rollups | TBD | prod | Cloud Functions runtime SA | no | yes | `/functions/src/scheduled` | green | Validate scheduler IAM and region |
| External automations (Zapier/Make/n8n/cron) | TBD | prod | unknown | unknown | unknown | outside repo | unknown | Must be manually inventoried |
| Off-repo admin utilities | TBD | local/prod | unknown | unknown | unknown | outside repo | unknown | Include personal scripts and notebooks |

## Sign-off

- Inventory owner:
- Last updated (local date/time):
- Ready for pre-cutover checklist: `yes/no`
