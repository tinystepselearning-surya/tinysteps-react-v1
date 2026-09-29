#!/usr/bin/env bash
set -euo pipefail

marker_ref="${1:-}"
target_sha="${2:-${GITHUB_SHA:-}}"

case "${marker_ref}" in
  ci/functions-production|ci/hosting-production|ci/firestore-rules-production|ci/firestore-indexes-production)
    ;;
  *)
    echo "Unsupported production marker ref: ${marker_ref:-<empty>}" >&2
    exit 64
    ;;
esac

if [[ ! "${target_sha}" =~ ^[a-f0-9]{40}$ ]]; then
  echo "Invalid target SHA for production marker: ${target_sha:-<empty>}" >&2
  exit 64
fi

if [[ -z "${GITHUB_REPOSITORY:-}" || -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_REPOSITORY and GITHUB_TOKEN are required." >&2
  exit 64
fi

encoded_ref="${marker_ref//\//%2F}"
api="https://api.github.com/repos/${GITHUB_REPOSITORY}/git/refs/heads/${encoded_ref#ci%2F}"
create_api="https://api.github.com/repos/${GITHUB_REPOSITORY}/git/refs"

status="$(curl -sS -o /tmp/production-marker-ref.json -w "%{http_code}" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "${api}")"

if [[ "${status}" == "200" ]]; then
  curl -fsS -X PATCH \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -d "{\"sha\":\"${target_sha}\",\"force\":true}" \
    "${api}" >/dev/null
elif [[ "${status}" == "404" ]]; then
  curl -fsS -X POST \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -d "{\"ref\":\"refs/heads/${marker_ref}\",\"sha\":\"${target_sha}\"}" \
    "${create_api}" >/dev/null
else
  cat /tmp/production-marker-ref.json >&2 || true
  echo "Unable to read production marker ${marker_ref} (HTTP ${status})." >&2
  exit 1
fi

echo "Production marker ${marker_ref} advanced to ${target_sha}."
