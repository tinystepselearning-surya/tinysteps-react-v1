#!/usr/bin/env bash

set -euo pipefail

MODE="${1:-}"
CHANNEL_ID="${2:-}"
PROJECT_ID="${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID is required}"

run_with_log() {
  : >"$TMP_LOG"
  if "$@" 2>&1 | tee "$TMP_LOG"; then
    return 0
  fi

  return 1
}

case "$MODE" in
  live)
    TARGET_DESCRIPTION="live"
    ;;
  channel)
    if [[ -z "$CHANNEL_ID" ]]; then
      echo "Usage: $0 channel <channel-id>" >&2
      exit 64
    fi
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

if [[ "$MODE" == "channel" ]]; then
  echo "Ensuring Firebase Hosting preview channel '$CHANNEL_ID' exists..."
  if ! run_with_log npx firebase-tools@latest hosting:channel:create "$CHANNEL_ID" --project "$PROJECT_ID" --non-interactive; then
    CREATE_OUTPUT="$(cat "$TMP_LOG")"

    if grep -qi "HTTP Error: 409" <<<"$CREATE_OUTPUT" \
      && grep -qi "Channel .* already exists" <<<"$CREATE_OUTPUT"; then
      echo "Firebase Hosting reports preview channel '$CHANNEL_ID' already exists; continuing to deploy."
    else
      echo "Firebase Hosting preview channel setup for '$CHANNEL_ID' failed with a real error." >&2
      exit 1
    fi
  fi

  echo "Deploying Firebase Hosting to ${TARGET_DESCRIPTION}..."
  if run_with_log npx firebase-tools@latest hosting:channel:deploy "$CHANNEL_ID" --project "$PROJECT_ID" --non-interactive; then
    echo "Firebase Hosting deploy to ${TARGET_DESCRIPTION} succeeded."
    exit 0
  fi

  echo "Firebase Hosting deploy to ${TARGET_DESCRIPTION} failed with a real error." >&2
  exit 1
fi

echo "Deploying Firebase Hosting to ${TARGET_DESCRIPTION}..."
if run_with_log npx firebase-tools@latest deploy --only hosting --project "$PROJECT_ID" --non-interactive; then
  echo "Firebase Hosting deploy to ${TARGET_DESCRIPTION} succeeded."
  exit 0
fi

DEPLOY_OUTPUT="$(cat "$TMP_LOG")"

if grep -qi "is the current active version" <<<"$DEPLOY_OUTPUT" \
  && grep -qi "FAILED_PRECONDITION" <<<"$DEPLOY_OUTPUT"; then
  echo "Firebase Hosting reports the requested release is already active on ${TARGET_DESCRIPTION}; treating as a successful no-op."
  exit 0
fi

echo "Firebase Hosting deploy to ${TARGET_DESCRIPTION} failed with a real error." >&2
exit 1
