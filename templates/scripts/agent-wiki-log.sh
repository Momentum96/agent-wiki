#!/usr/bin/env bash
set -euo pipefail

if [ "${AGENT_WIKI_SCOPE:-project}" = "project" ] && [ -z "${AGENT_WIKI_DIR:-}" ]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
  ROOT="$REPO_ROOT/docs/agent-wiki"
else
  ROOT="${AGENT_WIKI_DIR:-$HOME/agent-wiki}"
fi
DATE="$(date +%F)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SLUG="${1:-session}"
DIR="$ROOT/sessions/$DATE"
FILE="$DIR/${STAMP}-${SLUG}.md"

mkdir -p "$DIR"
cat > "$FILE"
echo "$FILE"
