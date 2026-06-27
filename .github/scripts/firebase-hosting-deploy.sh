#!/usr/bin/env bash

set -euo pipefail

MODE="${1:-}"
CHANNEL_ID="${2:-}"
PROJECT_ID="${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID is required}"

case "$MODE" in
  live)
    CMD=(npx firebase-tools@latest deploy --only hosting --project "$PROJECT_ID" --non-interactive)
    TARGET_DESCRIPTION="live"
    ;;
  channel)
    if [[ -z "$CHANNEL_ID" ]]; then
      echo "Usage: $0 channel <channel-id>" >&2
      exit 64
    fi
    CMD=(npx firebase-tools@latest hosting:channel:deploy "$CHANNEL_ID" --project "$PROJECT_ID" --non-interactive)
    TARGET_DESCRIPTION="preview channel '$CHANNEL_ID'"
    ;;
  *)
    echo "Usage: $0 <live|channel> [channel-id]" >&2
    exit 64
    ;;
esac

TMP_LOG="$(mktemp)"
cleanup() {
  rm -f "$TMP_LOG"
}
trap cleanup EXIT

echo "Deploying Firebase Hosting to ${TARGET_DESCRIPTION}..."

if "${CMD[@]}" 2>&1 | tee "$TMP_LOG"; then
  echo "Firebase Hosting deploy to ${TARGET_DESCRIPTION} succeeded."
  exit 0
fi

DEPLOY_OUTPUT="$(cat "$TMP_LOG")"

if grep -qi "is the current active version" <<<"$DEPLOY_OUTPUT" \
  && grep -qi "FAILED_PRECONDITION" <<<"$DEPLOY_OUTPUT"; then
  echo "Firebase Hosting reports the requested release is already active on ${TARGET_DESCRIPTION}; treating as a successful no-op."
  exit 0
fi

if [[ "$MODE" == "channel" ]] \
  && grep -qi "HTTP Error: 409" <<<"$DEPLOY_OUTPUT" \
  && grep -qi "Channel .* already exists" <<<"$DEPLOY_OUTPUT"; then
  echo "Firebase Hosting reports preview channel '$CHANNEL_ID' already exists; treating as a successful idempotent no-op."
  exit 0
fi

echo "Firebase Hosting deploy to ${TARGET_DESCRIPTION} failed with a real error." >&2
exit 1
