#!/usr/bin/env bash
# Trigger a Render manual deploy (deploy hook or API).
# Setup: docs/render-deploy.md
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" ]] && continue
    if [[ "$line" =~ ^(https?://|www\.) ]]; then
      echo "Error: .env has a bare URL on a line. Use this format instead:" >&2
      echo '  RENDER_DEPLOY_HOOK_URL="https://api.render.com/deploy/srv-…?key=…"' >&2
      exit 1
    fi
    if [[ ! "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      echo "Error: invalid .env line (expected NAME=value): $line" >&2
      exit 1
    fi
    local name="${line%%=*}"
    local value="${line#*=}"
    value="${value#\"}"; value="${value%\"}"
    value="${value#\'}"; value="${value%\'}"
    export "${name}=${value}"
  done < "$file"
}

load_env_file .env

REF="${1:-}"

if [[ -n "${RENDER_DEPLOY_HOOK_URL:-}" ]]; then
  URL="$RENDER_DEPLOY_HOOK_URL"
  if [[ -n "$REF" ]]; then
    if [[ "$URL" == *'?'* ]]; then
      URL="${URL}&ref=${REF}"
    else
      URL="${URL}?ref=${REF}"
    fi
  fi
  echo "Triggering deploy via deploy hook…"
  curl -fsS -X POST "$URL"
  echo ""
  echo "Deploy started. Check Render → Events for status."
  exit 0
fi

if [[ -n "${RENDER_API_KEY:-}" && -n "${RENDER_SERVICE_ID:-}" ]]; then
  BODY='{}'
  if [[ -n "$REF" ]]; then
    BODY=$(printf '{"commitId":"%s"}' "$REF")
  fi
  echo "Triggering deploy via Render API (service ${RENDER_SERVICE_ID})…"
  curl -fsS -X POST "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$BODY"
  echo ""
  echo "Deploy started. Check Render → Events for status."
  exit 0
fi

echo "Missing credentials. Do one of the following (see docs/render-deploy.md):" >&2
echo "  • Add RENDER_DEPLOY_HOOK_URL to .env (recommended)" >&2
echo "  • Or set RENDER_API_KEY and RENDER_SERVICE_ID" >&2
exit 1
