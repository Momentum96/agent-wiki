<!-- agent-wiki:start -->
## Agent Wiki Memory

Before any non-trivial task, load and follow the `agent-wiki-memory` skill.

- Check the qmd-backed wiki before planning or editing.
- Use qmd as the required retrieval and indexing layer.
- Search project memory first; it is the default workflow.
- Search the global/private `agent-wiki` collection second when project results are missing or local machine context matters.
- Prefer `qmd query "<topic>" --collection "$AGENT_WIKI_COLLECTION" --format files` for natural-language task lookup.
- Prefer `qmd search "<exact token>" --collection "$AGENT_WIKI_COLLECTION" --format files` for filenames, errors, and exact strings.
- Retrieve only relevant documents with `qmd get` or `qmd multi-get`.
- When asked to set up agent-wiki for the current project, run the project-local setup flow from the repo root: `paths --json`, `doctor --json`, `setup --dry-run --json`, `setup --skip-embed --json`, then `verify --json`. Project-local is the default; use `--global` only when explicitly requested.
- After meaningful work, record project-shareable summaries, decisions, verification, and changed files in project memory using repo-relative paths.
- Write project session logs through `docs/agent-wiki/scripts/agent-wiki-log.sh`; for `work-log` entries use `AGENT_WIKI_LOG_KIND=work-log` with that helper so local absolute paths are sanitized.
- Record machine-local facts only in global/private memory.
- Run `qmd update` after writing wiki logs. Run `qmd embed -c "$AGENT_WIKI_COLLECTION"` when semantic search freshness matters.
- If qmd or the skill is unavailable, state that clearly before proceeding.
- <!-- agent-wiki:obsidian-boundary --> For Obsidian work, load the skill's Obsidian Vault Boundary first and proceed only with the explicitly named vault, operation target, and required authorized tool; never route vault content through qmd or another vault.

Privacy guardrails:

- Never write `.env` files, API keys, private keys, auth files, database dumps, or raw transcripts into the wiki.
- Summarize sensitive work without copying secrets.
<!-- agent-wiki:end -->
