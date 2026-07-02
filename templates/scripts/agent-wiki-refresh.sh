#!/usr/bin/env bash
set -euo pipefail

if [ "${AGENT_WIKI_SCOPE:-project}" = "project" ] && [ -z "${AGENT_WIKI_DIR:-}" ]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
  ROOT="$REPO_ROOT/docs/agent-wiki"
else
  ROOT="${AGENT_WIKI_DIR:-$HOME/agent-wiki}"
fi
if [ "${AGENT_WIKI_SCOPE:-project}" = "project" ] && [ -z "${AGENT_WIKI_COLLECTION:-}" ]; then
  COLLECTION="agent-wiki-$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g; s/^-//; s/-$//')"
else
  COLLECTION="${AGENT_WIKI_COLLECTION:-agent-wiki}"
fi
if [ -n "${AGENT_WIKI_CONTEXT_TEXT:-}" ]; then
  CONTEXT_TEXT="$AGENT_WIKI_CONTEXT_TEXT"
elif [ "${AGENT_WIKI_SCOPE:-project}" = "project" ]; then
  CONTEXT_TEXT="Shared project agent wiki for coding agents. Stores repo-local summaries, decisions, verification notes, and changed-file manifests. Use repo-relative paths for shareable project facts."
else
  CONTEXT_TEXT="Shared agent wiki for coding agents. Stores structured work summaries, decisions, project notes, changed-file manifests, and qmd-searchable memory context. Raw transcripts and secrets are excluded."
fi

if ! command -v qmd >/dev/null 2>&1; then
  echo "qmd is not available on PATH." >&2
  exit 2
fi

mkdir -p "$ROOT"

if ! qmd collection show "$COLLECTION" >/dev/null 2>&1; then
  qmd collection add "$ROOT" --name "$COLLECTION" --mask "**/*.md"
fi

if ! qmd context list 2>/dev/null | grep -Fxq "$COLLECTION"; then
  qmd context add "qmd://$COLLECTION" "$CONTEXT_TEXT"
fi

qmd update

if [ "${AGENT_WIKI_SKIP_EMBED:-0}" = "1" ]; then
  echo "Skipping qmd embed because AGENT_WIKI_SKIP_EMBED=1."
  exit 0
fi

qmd embed -c "$COLLECTION"
