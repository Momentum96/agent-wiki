#!/usr/bin/env bash
set -euo pipefail

ROOT="${AGENT_WIKI_DIR:-$HOME/agent-wiki}"
DATE="$(date +%F)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SLUG="${1:-session}"
DIR="$ROOT/sessions/$DATE"
FILE="$DIR/${STAMP}-${SLUG}.md"

mkdir -p "$DIR"
cat > "$FILE"
echo "$FILE"
