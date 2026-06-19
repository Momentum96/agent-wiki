#!/usr/bin/env bash
set -euo pipefail

ROOT="${AGENT_WIKI_DIR:-$HOME/agent-wiki}"
COLLECTION="${AGENT_WIKI_COLLECTION:-agent-wiki}"
CONTEXT_TEXT="${AGENT_WIKI_CONTEXT_TEXT:-Shared agent wiki for coding agents. Stores structured work summaries, decisions, project notes, changed-file manifests, and qmd-searchable memory context. Raw transcripts and secrets are excluded.}"

if ! command -v qmd >/dev/null 2>&1; then
  echo "qmd is not available on PATH." >&2
  exit 2
fi

mkdir -p "$ROOT"

if ! qmd collection show "$COLLECTION" >/dev/null 2>&1; then
  qmd collection add "$ROOT" --name "$COLLECTION" --mask "**/*.md"
fi

if ! qmd context list 2>/dev/null | grep -q "$COLLECTION"; then
  qmd context add "qmd://$COLLECTION" "$CONTEXT_TEXT"
fi

qmd update

if [ "${AGENT_WIKI_SKIP_EMBED:-0}" = "1" ]; then
  echo "Skipping qmd embed because AGENT_WIKI_SKIP_EMBED=1."
  exit 0
fi

qmd embed -c "$COLLECTION"
