# Agent Wiki

[English](README.md) | [한국어](README.ko.md)

`agent-wiki` is a Bun/TypeScript CLI for setting up a local, qmd-backed markdown memory workflow for Codex and compatible coding agents.

It is designed for two readers:

- humans who want to understand what will be changed before running anything
- AI agents who need a short, deterministic installation path they can follow for a user

## Current Status

This repository is in the first CLI milestone.

Implemented in this milestone:

- `agent-wiki paths`
- `agent-wiki doctor`
- `agent-wiki setup --dry-run`
- `agent-wiki setup --install-prereqs`

Not implemented yet:

- full `agent-wiki setup` mutation of Codex config, qmd collections, skills, and helper scripts
- production `agent-wiki verify`
- npm/Bun package publishing

## For Humans

Recommended: ask your coding agent to inspect and run this project for you.

Paste this into Codex, Claude Code, Cursor, OpenCode, or another coding agent:

```text
Install and validate agent-wiki from this repository:
https://github.com/Momentum96/agent-wiki

Read the README and docs/guide/installation.md first. Do not install Bun, Node.js, or Codex automatically. If qmd or SQLite is missing, show me the exact command and ask before installing.
```

If you want to inspect it yourself:

```bash
git clone https://github.com/Momentum96/agent-wiki.git
cd agent-wiki
bun install
bun run typecheck
bun test
bun run src/cli.ts doctor
```

To see what setup would copy without touching your Codex config:

```bash
bun run src/cli.ts setup --dry-run
```

To check qmd and SQLite prerequisites:

```bash
bun run src/cli.ts setup --install-prereqs
```

That command may offer to install missing qmd or SQLite, but it defaults to `N` and requires explicit confirmation.

## For AI Agents

Fetch the installation guide and follow it step by step:

```bash
curl -fsSL https://raw.githubusercontent.com/Momentum96/agent-wiki/refs/heads/main/docs/guide/installation.md
```

Rules for agents:

- Read this README and `docs/guide/installation.md` before running commands.
- Check the current repository state with `git status --short`.
- Do not install Bun, Node.js, Codex, Homebrew, apt packages, or winget packages without user approval.
- You may run `agent-wiki setup --install-prereqs` or `bun run src/cli.ts setup --install-prereqs`; if qmd or SQLite is missing, ask the user before answering `y`.
- Use `setup --dry-run` until full setup mutation is implemented.
- Treat `verify` as reserved until it is implemented.
- Report the exact commands run and their pass/fail result.

Minimal local validation flow:

```bash
bun install
bun run typecheck
bun test
bun run src/cli.ts paths --json
bun run src/cli.ts doctor --json
bun run src/cli.ts setup --dry-run --json
```

## What It Will Manage

Default user-facing wiki content:

- `$HOME/agent-wiki/context.md`
- `$HOME/agent-wiki/templates/session-log.md`
- `$HOME/agent-wiki/scripts/agent-wiki-log.sh`
- `$HOME/agent-wiki/scripts/agent-wiki-refresh.sh`

Default internal state:

- `$HOME/.agent-wiki`

Default Codex targets:

- `$CODEX_HOME/AGENTS.md`
- `$CODEX_HOME/config.toml`
- `$CODEX_HOME/skills/qmd-cli/SKILL.md`
- `$CODEX_HOME/skills/agent-wiki-memory/SKILL.md`

## Safety Model

The installer must be idempotent. Re-running setup must not duplicate qmd collections, qmd contexts, skills, scripts, or global `AGENTS.md` blocks.

The installer must never copy or package:

- Codex auth files
- API keys
- `.env` files
- SSH keys
- database dumps
- qmd SQLite index files
- raw chat transcripts
- complete user-specific `config.toml` files

## Commands

| Command | Status | Purpose |
| --- | --- | --- |
| `agent-wiki paths` | implemented | Print resolved home, Codex, wiki, state, template, and skill paths. |
| `agent-wiki doctor` | implemented | Inspect Bun, Node.js, qmd, SQLite, and Codex files without writing. |
| `agent-wiki setup --install-prereqs` | implemented | Check qmd and SQLite and offer confirmed installation only for missing installable prerequisites. |
| `agent-wiki setup --dry-run` | implemented | Copy packaged templates into a temporary target for inspection. |
| `agent-wiki setup` | later milestone | Create or repair the full local agent wiki setup idempotently. |
| `agent-wiki verify` | later milestone | Run qmd smoke checks against the installed workflow. |

## Documentation

- [docs/guide/installation.md](docs/guide/installation.md): step-by-step guide for AI agents and humans.
- [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md): product goal, success criteria, and boundaries.
- [docs/INSTALLER_REQUIREMENTS.md](docs/INSTALLER_REQUIREMENTS.md): functional requirements.
- [docs/GENERATED_ASSETS.md](docs/GENERATED_ASSETS.md): files that setup should copy from templates.
