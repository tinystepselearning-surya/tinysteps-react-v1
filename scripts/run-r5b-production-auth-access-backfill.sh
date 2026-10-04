#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="tinysteps-react-v1"
MAX_RECORDS="250"
CANARY_LIMIT="20"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_DIR="reports/r5b-production-${STAMP}"

fail() {
  echo "R5B BACKFILL BLOCKED: $*" >&2
  exit 2
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

json_assert() {
  local file="$1"
  local expression="$2"
  node - "$file" "$expression" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
const expression = process.argv[3];
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const check = Function('r', 'return (' + expression + ');');
if (!check(report)) {
  console.error(JSON.stringify({
    ok: false,
    file,
    expression,
    result: report.result,
    planningIssueCount: report.planningIssueCount,
    before: report.before?.counts || null,
    writes: report.writes || null,
    after: report.after?.counts || null,
  }, null, 2));
  process.exit(2);
}
console.log(JSON.stringify({
  ok: true,
  file,
  result: report.result,
  planningIssueCount: report.planningIssueCount,
  before: report.before?.counts || null,
  writes: report.writes || null,
  after: report.after?.counts || null,
}, null, 2));
NODE
}

require_command node
require_command npm
require_command gcloud

ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -n 1)"
[[ -n "${ACTIVE_ACCOUNT}" ]] || fail "No active gcloud account. Run: gcloud auth login"

echo "Operator: ${ACTIVE_ACCOUNT}"
echo "Project: ${PROJECT_ID}"
echo "Reports: ${REPORT_DIR}"

if ! gcloud auth application-default print-access-token >/dev/null 2>&1; then
  cat >&2 <<'EOF'
Application Default Credentials are not available.

Run:
  gcloud auth application-default login

Then rerun this script.
EOF
  exit 2
fi

mkdir -p "${REPORT_DIR}"

if [[ ! -d node_modules ]]; then
  echo "Installing root dependencies..."
  npm ci
fi

if [[ ! -d functions/node_modules ]]; then
  echo "Installing Functions dependencies..."
  npm ci --prefix functions --include=dev
fi

echo
echo "=== BUILD FUNCTIONS ==="
npm --prefix functions run build

export GOOGLE_CLOUD_PROJECT="${PROJECT_ID}"
export GCLOUD_PROJECT="${PROJECT_ID}"

DRY_RUN="${REPORT_DIR}/01-dry-run.json"
CANARY_WRITE="${REPORT_DIR}/02-canary-write.json"
CANARY_VERIFY="${REPORT_DIR}/03-canary-verify.json"
FULL_WRITE="${REPORT_DIR}/04-full-write.json"
RECONCILE="${REPORT_DIR}/05-reconcile.json"

echo
echo "=== 1/5 PRODUCTION DRY-RUN (ZERO WRITES) ==="
node scripts/wave1-auth-access-read-model-backfill.mjs   --project "${PROJECT_ID}"   --mode dry-run   --max-records "${MAX_RECORDS}"   --sample-size 20   --report "${DRY_RUN}"

json_assert "${DRY_RUN}"   "r.result === 'dry_run_ready' && r.planningIssueCount === 0 && r.before.counts.blockingIssues === 0"

echo
echo "=== 2/5 CANARY WRITE (MAX ${CANARY_LIMIT}) ==="
node scripts/wave1-auth-access-read-model-backfill.mjs   --project "${PROJECT_ID}"   --mode write   --write-limit "${CANARY_LIMIT}"   --max-records "${MAX_RECORDS}"   --sample-size 20   --report "${CANARY_WRITE}"

json_assert "${CANARY_WRITE}"   "r.planningIssueCount === 0 && r.writes.failed === 0 && r.writes.succeeded > 0 && r.writes.succeeded <= 20 && r.after.counts.blockingIssues === 0"

echo
echo "=== 3/5 INDEPENDENT CANARY VERIFICATION (ZERO WRITES) ==="
node scripts/wave1-auth-access-read-model-backfill.mjs   --project "${PROJECT_ID}"   --mode dry-run   --max-records "${MAX_RECORDS}"   --sample-size 20   --report "${CANARY_VERIFY}"

json_assert "${CANARY_VERIFY}"   "r.planningIssueCount === 0 && r.before.counts.blockingIssues === 0 && r.before.counts.existing >= 1"

echo
echo "=== 4/5 REMAINING BOUNDED WRITE ==="
node scripts/wave1-auth-access-read-model-backfill.mjs   --project "${PROJECT_ID}"   --mode write   --write-limit 250   --max-records "${MAX_RECORDS}"   --sample-size 20   --report "${FULL_WRITE}"

json_assert "${FULL_WRITE}"   "r.planningIssueCount === 0 && r.writes.failed === 0 && r.after.reconciled === true && r.after.counts.pendingWrites === 0 && r.after.counts.blockingIssues === 0"

echo
echo "=== 5/5 INDEPENDENT FULL RECONCILIATION (ZERO WRITES) ==="
node scripts/wave1-auth-access-read-model-backfill.mjs   --project "${PROJECT_ID}"   --mode reconcile   --max-records "${MAX_RECORDS}"   --sample-size 20   --report "${RECONCILE}"

json_assert "${RECONCILE}"   "r.result === 'reconciled' && r.planningIssueCount === 0 && r.before.counts.pendingWrites === 0 && r.before.counts.blockingIssues === 0 && r.before.counts.create === 0 && r.before.counts.update === 0 && r.before.counts.conflict === 0 && r.before.counts.unexpected === 0"

echo
echo "=== R5B PRODUCTION BACKFILL VERIFIED ==="
echo "All reports are in: ${REPORT_DIR}"
echo "Do not delete or alter legacy identity collections. R5C remains the next migration stage."
