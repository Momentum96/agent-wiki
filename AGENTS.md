# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-17
**Commit:** repository-dependent
**Branch:** repository-dependent

## OVERVIEW

`agent-wiki` is a Bun-distributed CLI scaffold that installs a qmd-backed local agent memory workflow for Codex and compatible coding agents.

The current repository has a first Bun/TypeScript CLI milestone. It is not yet a complete setup installer.

## STRUCTURE

```text
agent-wiki/
├── README.md                       # product overview and command shape
├── docs/                           # requirements and implementation boundaries
├── src/                            # Bun/TypeScript CLI source and tests
└── templates/                      # packaged assets that setup will copy or merge
```

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| Understand scope | `README.md`, `docs/PROJECT_BRIEF.md` | Source of product intent and non-goals. |
| Implement first CLI milestone | `docs/INSTALLER_REQUIREMENTS.md` | Start with `paths`, `doctor`, dry-run template copy, and tests for path/block helpers. |
| Check generated files | `docs/GENERATED_ASSETS.md`, `templates/` | Templates are the source of long generated content. |
| Update global agent instructions | `templates/agents/AGENTS.agent-wiki-block.md` | Must stay marker-managed with `agent-wiki:start` and `agent-wiki:end`. |
| Change wiki workflow guidance | `templates/skills/agent-wiki-memory/SKILL.md`, `templates/skills/qmd-cli/SKILL.md` | Keep skill templates generic and portable. |

## CONVENTIONS

- Treat this as a scaffold until CLI files exist. Do not invent package scripts, build commands, or runtime entry points in docs.
- Installer logic should copy long-form content from templates instead of reconstructing it in code.
- Config updates must be structured merges where practical, especially Codex `config.toml`.
- `setup` must be idempotent: no duplicate qmd collections, qmd contexts, skill files, scripts, or global `AGENTS.md` blocks.
- `qmd embed` is optional enrichment. `qmd update` plus search smoke is the core verification path.
- Prefer explicit paths and command output in diagnostics.

## ANTI-PATTERNS

- Do not copy secrets, `.env` contents, auth files, private keys, database dumps, qmd SQLite indexes, raw transcripts, or full user-specific Codex configs into this package or wiki logs.
- Do not overwrite unmarked user config sections. Use marker-managed replacement only for the managed `AGENTS.md` block.
- Do not add platform-specific helpers without a parser or syntax validation path for that platform.
- Do not make setup install Bun, Node.js, Codex, Homebrew, apt, winget, SQLite, or other system packages without explicit confirmation.

## COMMANDS

Useful repository and qmd checks:

```bash
bun test
bun run typecheck
qmd --version
qmd collection list
qmd context list
qmd search "Agent Wiki Context" --collection agent-wiki --format files
```

Future target commands, once the CLI exists:

```bash
bun install -g agent-wiki
agent-wiki doctor
agent-wiki setup --dry-run
agent-wiki setup --install-prereqs
agent-wiki verify
agent-wiki paths
```

## NOTES

- Keep this file current when repository structure or command surfaces change.
- `docs/PROJECT_BRIEF.md` lists open decisions; do not silently close them in implementation docs.
- Windows support must distinguish native Windows from WSL. Do not mix their qmd or Codex paths.
