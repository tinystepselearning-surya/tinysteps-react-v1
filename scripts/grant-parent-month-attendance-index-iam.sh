#!/usr/bin/env bash
set -euo pipefail

# One-time administrative setup only. Run this interactively as a human/project
# IAM administrator; never add it to a deploy or application workflow.

PROJECT_ID="tinysteps-react-v1"
DEPLOY_SA="github-action-1086722180@tinysteps-react-v1.iam.gserviceaccount.com"
ROLE="roles/datastore.indexAdmin"
MEMBER="serviceAccount:${DEPLOY_SA}"

active_account="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -n 1)"
if [[ -z "${active_account}" ]]; then
  echo "No active gcloud account. Authenticate an operator allowed to update project IAM." >&2
  exit 1
fi

echo "Operator: ${active_account}"
echo "Project: ${PROJECT_ID}"
echo "Member: ${MEMBER}"
echo "Role: ${ROLE}"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="${MEMBER}" \
  --role="${ROLE}" \
  --condition=None \
  --quiet

binding="$(gcloud projects get-iam-policy "${PROJECT_ID}" \
  --flatten='bindings[].members' \
  --filter="bindings.role=${ROLE} AND bindings.members=${MEMBER}" \
  --format='value(bindings.role)' | head -n 1)"

if [[ "${binding}" != "${ROLE}" ]]; then
  echo "IAM update returned without the expected ${ROLE} binding for ${MEMBER}." >&2
  exit 1
fi

echo "Verified ${ROLE} for ${MEMBER} on ${PROJECT_ID}."
