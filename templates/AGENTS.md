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
| Optional Obsidian skills | `skills/{defuddle,json-canvas,obsidian-bases,obsidian-cli,obsidian-markdown}/` | Installed only by the explicit opt-in flag. |
| Initial wiki files | `wiki/context.md`, `wiki/session-log.md` | Generic starter content only. |

## CONVENTIONS

- Templates must be portable. Avoid machine-specific absolute paths unless the file explicitly documents a placeholder.
- Keep generated long-form text here, not embedded in installer code.
- If a template gains placeholders, document the placeholder contract before wiring installer substitution.
- Preserve POSIX script portability for macOS, Linux, and WSL.
- Keep Obsidian templates generic. Never prescribe a vault path or name.
- `setup --with-obsidian-skills` is the only installer ownership path for the five optional skill trees. Default setup preserves same-named directories without reporting them.
- Optional skill assets retain their MIT `LICENSE` files. Their Kepano provenance and pinned revision are recorded in `THIRD_PARTY_NOTICES.md`.
- qmd is for repository memory. Do not add a qmd vault lifecycle, runtime auto-installation, vault discovery, or vault synchronization to templates.

## ANTI-PATTERNS

- Do not place secrets, token-like values, auth files, local database paths, qmd cache contents, raw transcripts, or personal Codex config in templates.
- Do not add native Windows script templates until PowerShell syntax validation is available.
- Do not remove or rename `agent-wiki:start` / `agent-wiki:end` markers unless the merge contract changes everywhere.
- Do not package `docs/agent-wiki/`; it holds local project records rather than distributed documentation.
