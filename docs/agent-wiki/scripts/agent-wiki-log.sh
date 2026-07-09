#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

PROJECT_SCOPE=false
if [ "${AGENT_WIKI_SCOPE:-project}" = "project" ]; then
  REPO_ROOT="${AGENT_WIKI_PROJECT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)}"
  ROOT="${AGENT_WIKI_DIR:-$REPO_ROOT/docs/agent-wiki}"
  PROJECT_SCOPE=true
else
  ROOT="${AGENT_WIKI_DIR:-$HOME/agent-wiki}"
fi

DATE="$(date +%F)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SLUG="$(printf '%s' "${1:-session}" | sed -E 's/[^A-Za-z0-9_-]+/-/g; s/^-+//; s/-+$//')"
[ -n "$SLUG" ] || SLUG="session"
LOG_KIND="${AGENT_WIKI_LOG_KIND:-session}"

case "$LOG_KIND" in
  session)
    DIR="$ROOT/sessions/$DATE"
    FILE="$DIR/${STAMP}-${SLUG}.md"
    ;;
  work-log)
    DIR="$ROOT/work-log"
    FILE="$DIR/${DATE}-${SLUG}.md"
    ;;
  *)
    echo "Unsupported AGENT_WIKI_LOG_KIND: $LOG_KIND" >&2
    exit 2
    ;;
esac

mkdir -p "$DIR"

if [ "$PROJECT_SCOPE" = "true" ]; then
  SANITIZE_ARGS=(--repo-root "$REPO_ROOT" --home "${HOME:-}")
  if [ -n "${CODEX_HOME:-}" ]; then
    SANITIZE_ARGS+=(--codex-home "$CODEX_HOME")
  fi
  bun run "$SCRIPT_DIR/agent-wiki-sanitize-log.ts" "${SANITIZE_ARGS[@]}" > "$FILE"
else
  cat > "$FILE"
fi

echo "$FILE"
