---
name: qmd-cli
description: Use when working with the qmd CLI to set up collections, add context, refresh indexes, search local markdown, retrieve documents, or expose qmd through MCP.
---

# qmd CLI

Use qmd as a local markdown search and retrieval engine for agent workflows.

qmd indexes markdown files, searches them with keyword and semantic retrieval, and exposes an MCP server for compatible agents. It is not Quarto and not a markdown renderer.

## Core Rules

- Use documented qmd commands only.
- Check command support with `qmd --help` or `qmd <command> --help` before relying on uncertain flags.
- Prefer `qmd search` for exact terms, filenames, errors, and rare strings.
- Prefer `qmd query` for natural-language retrieval.
- Retrieve source documents with `qmd get` or `qmd multi-get` before answering from results.
- If qmd setup state is unclear, inspect `qmd status`, `qmd collection list`, and `qmd context list`.

## Setup Checks

```bash
qmd --version
qmd status
qmd collection list
qmd context list
```

## Agent Wiki Setup

```bash
qmd collection show "$AGENT_WIKI_COLLECTION"
qmd collection add "$AGENT_WIKI_DIR" --name "$AGENT_WIKI_COLLECTION" --mask "**/*.md"
qmd context add "qmd://$AGENT_WIKI_COLLECTION" "Shared project agent wiki for coding agents"
qmd update
qmd embed -c "$AGENT_WIKI_COLLECTION"
```

For repo-local project memory, `AGENT_WIKI_COLLECTION` is usually `agent-wiki-<repo-slug>` and should be searched before the global collection.
For global/private memory, `AGENT_WIKI_COLLECTION` is usually `agent-wiki`.

`qmd embed` can be slow or require model downloads. If `qmd update` succeeds but embedding fails, keyword search can still work; report semantic search as degraded instead of treating the whole setup as missing.

## Search Workflow

```bash
qmd search "exact error or filename" --collection "$AGENT_WIKI_COLLECTION" --format files -n 8
qmd query "how do we handle this topic?" --collection "$AGENT_WIKI_COLLECTION" --format files -n 8
qmd get "qmd://$AGENT_WIKI_COLLECTION/path/to/file.md"
qmd multi-get "sessions/YYYY-MM-DD/*.md" --max-bytes 20480
```

## Failure Handling

- If qmd is not on `PATH`, report that clearly and inspect the package-manager global bin path.
- If the `agent-wiki` collection is missing, create it before relying on search.
- If context is missing, add it before expecting good retrieval quality.
- Never store secrets, raw transcripts, or qmd SQLite cache files in the wiki.
