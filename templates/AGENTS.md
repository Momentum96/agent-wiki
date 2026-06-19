# TEMPLATE ASSET RULES

## OVERVIEW

`templates/` contains packaged files that the future `agent-wiki setup` command will copy or merge into a user's local environment.

## STRUCTURE

```text
templates/
├── agents/    # marker-managed global AGENTS.md block
├── scripts/   # helper script templates
├── skills/    # Codex skill templates
└── wiki/      # initial wiki context and session-log template
```

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| Global instruction block | `agents/AGENTS.agent-wiki-block.md` | Keep the start/end markers intact. |
| Logging helper behavior | `scripts/agent-wiki-log.sh` | Writes structured session logs, not transcripts. |
| qmd refresh helper | `scripts/agent-wiki-refresh.sh` | Runs indexing refresh commands. |
| Codex memory skill | `skills/agent-wiki-memory/SKILL.md` | Main workflow for qmd-backed memory. |
| qmd CLI skill | `skills/qmd-cli/SKILL.md` | qmd command guidance. |
| Initial wiki files | `wiki/context.md`, `wiki/session-log.md` | Generic starter content only. |

## CONVENTIONS

- Templates must be portable. Avoid machine-specific absolute paths unless the file explicitly documents a placeholder.
- Keep generated long-form text here, not embedded in installer code.
- If a template gains placeholders, document the placeholder contract before wiring installer substitution.
- Preserve POSIX script portability for macOS, Linux, and WSL.

## ANTI-PATTERNS

- Do not place secrets, token-like values, auth files, local database paths, qmd cache contents, raw transcripts, or personal Codex config in templates.
- Do not add native Windows script templates until PowerShell syntax validation is available.
- Do not remove or rename `agent-wiki:start` / `agent-wiki:end` markers unless the merge contract changes everywhere.
