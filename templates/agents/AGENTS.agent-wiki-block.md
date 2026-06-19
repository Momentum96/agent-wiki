<!-- agent-wiki:start -->
## Agent Wiki Memory

Before any non-trivial task, load and follow the `agent-wiki-memory` skill.

- Check the qmd-backed wiki before planning or editing.
- Use qmd as the required retrieval and indexing layer.
- Prefer `qmd query "<topic>" --collection agent-wiki --format files` for natural-language task lookup.
- Prefer `qmd search "<exact token>" --collection agent-wiki --format files` for filenames, errors, and exact strings.
- Retrieve only relevant documents with `qmd get` or `qmd multi-get`.
- After meaningful work, record the summary, decisions, verification, and changed files in the wiki log.
- Run `qmd update` after writing wiki logs. Run `qmd embed -c agent-wiki` when semantic search freshness matters.
- If qmd or the skill is unavailable, state that clearly before proceeding.

Privacy guardrails:

- Never write `.env` files, API keys, private keys, auth files, database dumps, or raw transcripts into the wiki.
- Summarize sensitive work without copying secrets.
<!-- agent-wiki:end -->
