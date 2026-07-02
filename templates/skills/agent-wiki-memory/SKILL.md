---
name: agent-wiki-memory
description: Use when qmd-backed wiki memory, work logs, changed-file manifests, Codex/OpenCode behavior consistency, or local agent memory workflows are involved.
---

# Agent Wiki Memory

Use this skill to keep coding-agent behavior consistent through qmd-backed markdown wikis.

Use project memory by default. Use global memory only as a personal/local fallback.

## Required Variables

- Project wiki root: `$AGENT_WIKI_DIR`, usually `<repo>/docs/agent-wiki`
- Project qmd collection: `$AGENT_WIKI_COLLECTION`, usually `agent-wiki-<repo-slug>`
- Global/private wiki root: `$HOME/agent-wiki`
- Global/private qmd collection: `agent-wiki`

## Start Routine

Before non-trivial planning or editing:

1. Check qmd availability with `qmd --version`.
2. Check wiki state with `qmd collection list` and `qmd context list`.
3. Search the project collection first:
   - Use `qmd query "<task topic>" --collection "$AGENT_WIKI_COLLECTION" --format files` for natural-language tasks.
   - Use `qmd search "<exact token>" --collection "$AGENT_WIKI_COLLECTION" --format files` for filenames, errors, or exact phrases.
4. Search global/private memory second only when project results are missing or local machine context matters.
5. Retrieve only relevant files with `qmd get` or `qmd multi-get`.
6. If qmd or the expected wiki collection is unavailable, state that clearly before proceeding.

## Setup Request Routine

When the user asks to use, enable, install, set up, or initialize agent-wiki for the current project:

1. Treat project-local memory as the default. Do not add `--project`; it is already the default.
2. Find the current repository root with `git rev-parse --show-toplevel`. Run setup from that root.
3. Locate the agent-wiki CLI. Prefer an existing checkout at `$HOME/mac_work/agent-wiki/src/cli.ts`; otherwise use the checked-out agent-wiki repository or the installed `agent-wiki` executable if available.
4. Run safe checks first:
   - `bun run <agent-wiki-cli> paths --json`
   - `bun run <agent-wiki-cli> doctor --json`
   - `bun run <agent-wiki-cli> setup --dry-run --json`
5. If Bun, Node.js, or Codex is missing, stop and ask the user. Do not install them automatically.
6. If qmd or SQLite is missing, show the exact prerequisite command and ask before installing.
7. Apply project setup:
   - `bun run <agent-wiki-cli> setup --skip-embed --json`
   - `bun run <agent-wiki-cli> verify --json`
8. Confirm that the resolved wiki root is `<repo>/docs/agent-wiki`, the local state dir is `<repo>/.agent-wiki/local`, and the collection is `agent-wiki-<repo-slug>`.
9. Treat `docs/agent-wiki` files as project-shareable. Treat `.agent-wiki/local` as local-only.
10. Report commands, pass/fail results, changed files, and any Codex backups.

## During-Work Routine

Track durable work memory only:

- task summary
- repo root or current working directory
- changed files, using repo-relative paths for project memory
- decisions and rationale
- verification commands and shareable evidence notes
- blockers or follow-up notes

Do not record raw conversation transcripts.
Do not put local-only absolute evidence paths into project memory. Store those in global/private memory or mark them as local-only.

## End Routine

After meaningful work:

1. Write project-shareable facts under the project wiki by default.
2. Write machine-local facts under the global/private wiki.
3. Refresh qmd with `qmd update`.
4. If semantic search freshness matters, run `qmd embed -c "$AGENT_WIKI_COLLECTION"` for project memory or `qmd embed -c agent-wiki` for global memory.
5. Verify retrieval with `qmd search "<log smoke token>" --collection "$AGENT_WIKI_COLLECTION" --format files`.

## Privacy Guardrails

Never write secrets or sensitive artifacts into the wiki:

- `.env` files or environment dumps
- auth files
- private keys or SSH material
- token-like values
- database dumps
- raw transcripts

If a useful note contains sensitive material, summarize the non-sensitive fact and omit the secret.
