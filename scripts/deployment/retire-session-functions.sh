#!/usr/bin/env bash
set -euo pipefail

# Intentionally destructive. Runs only inside authenticated main-branch
# production deployment after the bounded Functions release has succeeded.
EXPECTED_PROJECT="tinysteps-react-v1"
EXPECTED_REPO="tinystepselearning-surya/tinysteps-react-v1"
REGION="asia-south1"
EXPECTED="dailySessionsTomorrowAt0005,rollingScheduleEdgeReplenisherDaily,futureScheduleReconcilerEveryTwoHours,onFutureScheduleEnrollmentWrite"
RETIRED="${FUNCTIONS_RETIRED_TARGETS:-}"
if [[ "${GITHUB_ACTIONS:-}" != "true" || "${GITHUB_EVENT_NAME:-}" != "push" || "${GITHUB_REF:-}" != "refs/heads/main" || "${GITHUB_REPOSITORY:-}" != "$EXPECTED_REPO" || "${FIREBASE_PROJECT_ID:-}" != "$EXPECTED_PROJECT" ]]; then
  echo "Refusing to retire functions outside production main-branch deployment" >&2
  exit 1
fi
if [[ "$RETIRED" != "$EXPECTED" ]]; then
  echo "Refusing unexpected retirement set: $RETIRED" >&2
  exit 1
fi

# A removed source export does not delete a deployed Function in our targeted
# Functions pipeline; explicitly delete each old endpoint. Firebase CLI manages
# scheduler resources associated with scheduled functions.
IFS=',' read -r -a targets <<< "$RETIRED"
for target in "${targets[@]}"; do
  echo "Retiring explicitly allowlisted Cloud Function: $target"
  npx --yes firebase-tools@15.30.0 functions:delete "$target" \
    --region "$REGION" --project "$EXPECTED_PROJECT" --force
done

# Confirm that no retired Cloud Function still exists. Name matching is exact.
gcloud functions list --project "$EXPECTED_PROJECT" --format=json > /tmp/tinysteps-function-retirement-verify.json
node --input-type=module <<'NODE'
import {readFileSync} from 'node:fs';
const expected = ['dailySessionsTomorrowAt0005','rollingScheduleEdgeReplenisherDaily','futureScheduleReconcilerEveryTwoHours','onFutureScheduleEnrollmentWrite'];
const rows = JSON.parse(readFileSync('/tmp/tinysteps-function-retirement-verify.json','utf8'));
if (!Array.isArray(rows)) throw new Error('Invalid Cloud Functions inventory');
const names = rows.map(x => String(x.name || '').split('/').pop());
const left = expected.filter(name => names.includes(name));
if (left.length) throw new Error('Retired Cloud Functions still deployed: ' + left.join(','));
console.log('Verified absent Cloud Functions: ' + expected.join(', '));
NODE

# A scheduled function must not leave behind a billable Cloud Scheduler job.
gcloud scheduler jobs list --project "$EXPECTED_PROJECT" --location "$REGION" --format=json > /tmp/tinysteps-scheduler-retirement-verify.json
node --input-type=module <<'NODE'
import {readFileSync} from 'node:fs';
const jobs = JSON.parse(readFileSync('/tmp/tinysteps-scheduler-retirement-verify.json','utf8'));
if (!Array.isArray(jobs)) throw new Error('Invalid Cloud Scheduler inventory');
const scheduled = ['dailySessionsTomorrowAt0005','rollingScheduleEdgeReplenisherDaily','futureScheduleReconcilerEveryTwoHours'];
const stale = jobs.filter(x => {
 const id=String(x.name||'').split('/').pop();
 return scheduled.some(name => id === `firebase-schedule-${name}-asia-south1` || id === name);
}).map(x=>x.name);
if (stale.length) throw new Error('Stale Cloud Scheduler jobs require review: '+stale.join(','));
console.log('Verified no legacy Firebase Scheduler jobs remain for retired session generators');
NODE
