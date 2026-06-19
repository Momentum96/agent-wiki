---
name: agent-wiki-memory
description: Use when qmd-backed wiki memory, work logs, changed-file manifests, Codex/OpenCode behavior consistency, or local agent memory workflows are involved.
---

# Agent Wiki Memory

Use this skill to keep local coding-agent behavior consistent through a shared qmd-backed markdown wiki.

## Required Variables

- Wiki root: `$AGENT_WIKI_DIR`, default `$HOME/agent-wiki`
- qmd collection: `agent-wiki`

## Start Routine

Before non-trivial planning or editing:

1. Check qmd availability with `qmd --version`.
2. Check wiki state with `qmd collection list` and `qmd context list`.
3. Search before loading documents:
   - Use `qmd query "<task topic>" --collection agent-wiki --format files` for natural-language tasks.
   - Use `qmd search "<exact token>" --collection agent-wiki --format files` for filenames, errors, or exact phrases.
4. Retrieve only relevant files with `qmd get` or `qmd multi-get`.
5. If qmd or the wiki collection is unavailable, state that clearly before proceeding.

## During-Work Routine

Track durable work memory only:

- task summary
- current working directory
- changed files
- decisions and rationale
- verification commands and evidence paths
- blockers or follow-up notes

Do not record raw conversation transcripts.

## End Routine

After meaningful work:

1. Write a structured session log under `$AGENT_WIKI_DIR/sessions/YYYY-MM-DD/`.
2. Refresh qmd with `qmd update`.
3. If semantic search freshness matters, run `qmd embed -c agent-wiki`.
4. Verify retrieval with `qmd search "<log smoke token>" --collection agent-wiki --format files`.

## Privacy Guardrails

Never write secrets or sensitive artifacts into the wiki:

- `.env` files or environment dumps
- auth files
- private keys or SSH material
- token-like values
- database dumps
- raw transcripts

If a useful note contains sensitive material, summarize the non-sensitive fact and omit the secret.
