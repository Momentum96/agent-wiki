# Agent Wiki Installer

`agent-wiki` is a Bun-distributed setup tool for installing a qmd-backed local agent wiki workflow for Codex and compatible coding agents.

The project turns the current manual setup guide into a repeatable CLI that can be installed globally:

```bash
bun install -g agent-wiki
agent-wiki setup
agent-wiki verify
```

The installer should configure qmd, create a local markdown wiki, register the qmd MCP server with Codex, install required agent skills, and add safe global agent instructions without copying private local state.

## Why This Exists

The current setup lives as a detailed markdown guide. That is useful for one careful human, but it is not enough for repeatable distribution.

This project should make the setup deterministic:

- no LLM needed to interpret the setup steps
- no copy-pasting large `SKILL.md` blocks by hand
- no accidental overwrite of existing Codex settings
- clear diagnostics when qmd, SQLite, PATH, or Codex config is not ready
- the same core flow on macOS, Linux, and Windows

## Target Users

- Developers who use Codex or similar coding agents locally
- Teams that want a shared qmd-backed memory pattern across machines
- Future maintainers packaging the setup as a Bun global CLI

A contributor should not need to know the history of the original manual setup discussion.

## Scope

The first production version should provide a CLI with these commands:

| Command | Purpose |
| --- | --- |
| `agent-wiki doctor` | Inspect runtime, OS, qmd, PATH, SQLite, Codex home, and existing config without writing. |
| `agent-wiki setup` | Create or repair the local agent wiki setup idempotently. |
| `agent-wiki verify` | Run smoke checks and report whether the installed workflow works. |
| `agent-wiki paths` | Print resolved paths for qmd, Codex home, wiki root, templates, and config files. |

`setup` should generate files from packaged templates instead of embedding long strings in installer logic.

## Supported Platforms

Minimum supported platforms:

- macOS
- Linux
- Windows

Windows support must distinguish native Windows from WSL because Codex, qmd, SQLite, and path handling may live in different environments.

## Required Behaviors

The setup flow must be idempotent. Running it twice should not duplicate config blocks, duplicate contexts, or corrupt existing files.

At minimum, the installer must:

- require Node.js 22 or newer
- prefer Bun for this package, while allowing qmd itself to be installed by Bun or npm
- detect qmd with `command -v qmd` or the platform equivalent
- create the agent wiki directory if missing
- create initial wiki documents and session templates
- register or repair the `agent-wiki` qmd collection
- register qmd context for the collection
- run `qmd update`
- make `qmd embed` optional, because it can require model downloads and more time
- add or update the Codex qmd MCP server config using a TOML-aware merge
- add or update the global `AGENTS.md` instruction block using explicit markers
- install required Codex skills from packaged templates
- install helper scripts from packaged templates where the OS supports them
- run a smoke search against the newly indexed wiki
- produce a readable summary of changed, unchanged, skipped, and failed steps

## Non-Goals For The First Version

Do not implement these until the core setup is reliable:

- cloud sync for wiki content
- hosted MCP service
- raw transcript ingestion
- automatic secret scanning beyond simple local guardrails
- automatic installation of Homebrew, apt packages, winget packages, or system SQLite
- destructive rewrites of existing Codex config
- automatic commits or repository publishing

## Privacy Rules

The installer must never copy or package:

- Codex auth files
- API keys
- `.env` files
- SSH keys
- database dumps
- qmd SQLite index files
- raw chat transcripts
- complete user-specific `config.toml` files

Templates should contain generic setup content only.

## Documentation Map

- [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md): product goal, success criteria, and implementation boundaries.
- [docs/INSTALLER_REQUIREMENTS.md](docs/INSTALLER_REQUIREMENTS.md): functional requirements for the future CLI.
- [docs/GENERATED_ASSETS.md](docs/GENERATED_ASSETS.md): packaged files that `agent-wiki setup` should copy into the target environment.
- `templates/skills/`: packaged skill templates that `agent-wiki setup` will copy into Codex skill locations.
- `templates/scripts/`: packaged helper script templates that `agent-wiki setup` will install when applicable.

## Current Status

This repository is currently a project brief and requirements scaffold. It is not yet an installable package.

The next implementation step is to add a Bun/TypeScript CLI skeleton with `doctor`, `setup`, `verify`, and `paths` commands.
