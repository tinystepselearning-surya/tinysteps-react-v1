#!/bin/bash
# Usage:
# 1) Set env var NEW_GROQ_KEY and run `./set-groq-secret.sh` OR
# 2) ./set-groq-secret.sh "sk-YOURNEWKEY"
# This script creates or updates the Secret Manager secret 'groq-api-key' in the current GCP project.

set -euo pipefail

NEW_KEY=""
if [ -n "${1:-}" ]; then
  NEW_KEY="$1"
elif [ -n "${NEW_GROQ_KEY:-}" ]; then
  NEW_KEY="$NEW_GROQ_KEY"
fi

if [ -z "$NEW_KEY" ]; then
  echo "Provide the new Groq API key as an argument or set NEW_GROQ_KEY environment variable."
  echo "Example: NEW_GROQ_KEY=sk-... ./set-groq-secret.sh"
  exit 1
fi

# Detect project. Prefer FIREBASE_CONFIG if present.
if [ -n "${FIREBASE_CONFIG:-}" ]; then
  PROJECT=$(node -e "console.log(JSON.parse(process.env.FIREBASE_CONFIG).projectId)")
else
  PROJECT=${GCLOUD_PROJECT:-${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null || echo "")}}
fi

if [ -z "$PROJECT" ]; then
  echo "Could not determine GCP project. Set GCLOUD_PROJECT or run 'gcloud config set project <PROJECT_ID>'."
  exit 1
fi

echo "Using project: $PROJECT"

# Create a temporary file with the key
TMP_FILE=$(mktemp)
printf "%s" "$NEW_KEY" > "$TMP_FILE"

# Ensure the secret exists
if ! gcloud secrets describe groq-api-key --project="$PROJECT" >/dev/null 2>&1; then
  echo "Secret groq-api-key not found, creating..."
  gcloud secrets create groq-api-key --replication-policy="automatic" --project="$PROJECT"
fi

# Add a new secret version
gcloud secrets versions add groq-api-key --data-file="$TMP_FILE" --project="$PROJECT"

# Cleanup
rm "$TMP_FILE"

echo "Groq API key secret 'groq-api-key' updated in project $PROJECT."

echo "Note: After updating the secret, redeploy functions that cache it if you read the key in init."
