#!/usr/bin/env bash
set -euo pipefail

PROJECT_SCOPE=false
if [ "${AGENT_WIKI_SCOPE:-project}" = "project" ]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
  ROOT="${AGENT_WIKI_DIR:-$REPO_ROOT/docs/agent-wiki}"
  PROJECT_SCOPE=true
else
  ROOT="${AGENT_WIKI_DIR:-$HOME/agent-wiki}"
fi
DATE="$(date +%F)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SLUG="${1:-session}"
DIR="$ROOT/sessions/$DATE"
FILE="$DIR/${STAMP}-${SLUG}.md"

mkdir -p "$DIR"
CONTENT="$(cat)"
if [ "$PROJECT_SCOPE" = "true" ]; then
  rewrite_repo_root() {
    local root="$1"
    [ -n "$root" ] || return
    CONTENT="$(
      printf '%s' "$CONTENT" |
        AGENT_WIKI_REPO_ROOT="$root" perl -0pe '
          my $root = $ENV{"AGENT_WIKI_REPO_ROOT"};
          s{\Q$root/}{}g;
          s{(^|[^[:alnum:]_./-])\Q$root\E($|[^[:alnum:]_./-])}{$1.$2}g;
        '
    )"
  }

  rewrite_repo_root "$REPO_ROOT"
  REPO_ROOT_ALIAS="${REPO_ROOT#/private}"
  if [ "$REPO_ROOT_ALIAS" != "$REPO_ROOT" ]; then
    rewrite_repo_root "$REPO_ROOT_ALIAS"
  fi
  LOCAL_ABSOLUTE_PATH_PATTERN='(^|[^[:alnum:]_.-])(/Users/|/Volumes/|/private/var/|/var/folders/|/tmp/)'
  if printf '%s\n' "$CONTENT" | grep -Eq "$LOCAL_ABSOLUTE_PATH_PATTERN"; then
    echo "agent-wiki-log: project logs must use repo-relative paths; write machine-local absolute paths to global/private memory instead." >&2
    exit 1
  fi
fi
printf '%s\n' "$CONTENT" > "$FILE"
echo "$FILE"
