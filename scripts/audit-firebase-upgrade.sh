#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

ISSUES=0

scan() {
  local pattern="$1"
  local label="$2"
  shift 2

  local output
  output="$(rg -n --hidden -S --glob '!node_modules/**' --glob '!.git/**' "$pattern" "$@" || true)"
  if [[ -n "$output" ]]; then
    echo "FAIL: $label"
    echo "$output"
    echo
    ISSUES=$((ISSUES + 1))
  fi
}

scan "firebase-token-generator|FirebaseTokenGenerator" \
  "Legacy Firebase token generator references found." \
  functions/src src src/functions scripts/dev-tools .github/workflows package.json functions/package.json

scan "FIREBASE_TOKEN" \
  "GitHub Actions deploy still relies on FIREBASE_TOKEN." \
  .github/workflows

scan "firebase-adminsdk-[A-Za-z0-9_-]+\\.json" \
  "Hardcoded service account filename references found in active scripts/source." \
  functions/src src src/functions scripts/dev-tools

if [[ "$ISSUES" -eq 0 ]]; then
  echo "PASS: No immediate legacy Firebase auth blockers were detected."
  exit 0
fi

echo "Detected $ISSUES issue set(s). Resolve findings before upgrade."
exit 1
