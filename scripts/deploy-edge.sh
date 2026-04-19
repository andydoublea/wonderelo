#!/usr/bin/env bash
# Deploy edge functions to Supabase.
# Reads SUPABASE_ACCESS_TOKEN from .env (gitignored) so tokens never end up in git.
# Usage:
#   ./scripts/deploy-edge.sh dev   # staging project
#   ./scripts/deploy-edge.sh prod  # production project

set -euo pipefail

ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a; . "$ENV_FILE"; set +a
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN not set. Add it to .env or export it before running." >&2
  exit 1
fi

TARGET="${1:-dev}"
case "$TARGET" in
  dev|staging)
    PROJECT_REF="dqoybysbooxngrsxaekd"
    ;;
  prod|production)
    PROJECT_REF="tpsgnnrkwgvgnsktuicr"
    ;;
  *)
    echo "❌ Unknown target: $TARGET (use 'dev' or 'prod')" >&2
    exit 1
    ;;
esac

echo "🚀 Deploying edge functions to $TARGET ($PROJECT_REF)…"
SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" \
  npx supabase functions deploy make-server-ce05600a \
    --project-ref "$PROJECT_REF" \
    --no-verify-jwt \
    --use-api
