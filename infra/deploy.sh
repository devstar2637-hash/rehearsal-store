#!/usr/bin/env bash
set -euo pipefail

PROJECT="${GCP_PROJECT:?Set GCP_PROJECT to the approved Google Cloud project}"
REGION="${GCP_REGION:-asia-northeast3}"
SERVICE="${GCP_SERVICE:-thousand-stores}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
SOURCE_SHA="$(git rev-parse HEAD)"
ARCHIVE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/rehearsal-deploy.XXXXXX")"
trap 'rm -rf "$ARCHIVE_DIR"' EXIT
git archive "$SOURCE_SHA" | tar -x -C "$ARCHIVE_DIR"

gcloud run deploy "$SERVICE" \
  --project "$PROJECT" \
  --region "$REGION" \
  --source "$ARCHIVE_DIR" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 1 \
  --timeout 30 \
  --concurrency 40 \
  --set-env-vars "NODE_ENV=production,SOURCE_SHA=$SOURCE_SHA" \
  --quiet
