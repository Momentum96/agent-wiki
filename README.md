# Agent Wiki

[English](README.md) | [한국어](README.ko.md)

`agent-wiki` is a Bun/TypeScript CLI for setting up a local, qmd-backed markdown memory workflow for Codex and compatible coding agents.

It is designed for two readers:

- humans who want to understand what will be changed before running anything
- AI agents who need a short, deterministic installation path they can follow for a user

## Current Status

This repository now has the local installer flow implemented.

Implemented:

- `agent-wiki paths`
- `agent-wiki doctor`
- `agent-wiki setup --dry-run`
- `agent-wiki setup --install-prereqs`
- `agent-wiki setup`
- `agent-wiki verify`

Distribution status:

- Package metadata is prepared for `@momentum96/agent-wiki`.
- Actual npm publishing requires an authenticated npm account with access to the `@momentum96` scope.

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
bun run src/cli.ts setup --skip-embed
bun run src/cli.ts verify
```

To see what setup would copy without touching your Codex config:

```bash
bun run src/cli.ts setup --dry-run
```

## Optional Obsidian Skills

The default setup doesn't create, modify, delete, or report the optional Obsidian skill directories. Existing same-named directories remain yours.

To inspect the optional copy without writing to your Codex home:

```bash
bun run src/cli.ts setup --dry-run --with-obsidian-skills --json
```

To install or update the optional skills, use:

```bash
bun run src/cli.ts setup --with-obsidian-skills --skip-embed --json
```

Only this flag manages these packaged skills beneath `$CODEX_HOME/skills`: `defuddle`, `json-canvas`, `obsidian-bases`, `obsidian-cli`, and `obsidian-markdown`. It doesn't install Obsidian, Defuddle, or any other runtime dependency. It also doesn't install OpenCode, automate a vault, or create, search, index, update, or refresh a qmd collection for a vault. `obsidian-zettelkasten` isn't included. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the vendored skill source, revision, and MIT notice.

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
- Prefer `setup --dry-run` first, then run `setup --skip-embed` when the user wants to apply changes.
- Run `verify` after setup.
- Report the exact commands run and their pass/fail result.

Minimal local validation flow:

```bash
bun install
bun run typecheck
bun test
bun run src/cli.ts paths --json
bun run src/cli.ts paths --global --json
bun run src/cli.ts doctor --json
bun run src/cli.ts setup --dry-run --json
bun run src/cli.ts setup --skip-embed --json
bun run src/cli.ts verify --json
```

## What It Will Manage

Default project-local wiki content:

- `<repo>/docs/agent-wiki/context.md`
- `<repo>/docs/agent-wiki/templates/session-log.md`
- `<repo>/docs/agent-wiki/scripts/agent-wiki-log.sh`
- `<repo>/docs/agent-wiki/scripts/agent-wiki-sanitize-log.ts`
- `<repo>/docs/agent-wiki/scripts/agent-wiki-refresh.sh`

Default project-local internal state:

- `<repo>/.agent-wiki/local`

Project collections default to `agent-wiki-<repo-slug>` and should be searched before the global/private `agent-wiki` collection.

Global/private wiki content when `--global` or `AGENT_WIKI_SCOPE=global` is used:

- `$HOME/agent-wiki/context.md`
- `$HOME/agent-wiki/templates/session-log.md`
- `$HOME/agent-wiki/scripts/agent-wiki-log.sh`
- `$HOME/agent-wiki/scripts/agent-wiki-sanitize-log.ts`
- `$HOME/agent-wiki/scripts/agent-wiki-refresh.sh`

Global/private internal state:

- `$HOME/.agent-wiki`

Default Codex targets:

- `$CODEX_HOME/AGENTS.md`
- `$CODEX_HOME/config.toml`
- `$CODEX_HOME/skills/qmd-cli/SKILL.md`
- `$CODEX_HOME/skills/agent-wiki-memory/SKILL.md`

Optional Obsidian targets, managed only by `setup --with-obsidian-skills`:

- `$CODEX_HOME/skills/{defuddle,json-canvas,obsidian-bases,obsidian-cli,obsidian-markdown}/...`

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
| `agent-wiki paths` | implemented | Print resolved home, Codex, wiki, state, collection, template, and skill paths. |
| `agent-wiki doctor` | implemented | Inspect Bun, Node.js, qmd, SQLite, and Codex files without writing. |
| `agent-wiki setup --install-prereqs` | implemented | Check qmd and SQLite and offer confirmed installation only for missing installable prerequisites. |
| `agent-wiki setup --dry-run` | implemented | Copy packaged templates into a temporary target for inspection. |
| `agent-wiki setup --dry-run --with-obsidian-skills` | implemented | Inspect the five optional Obsidian skill trees without writing to `$CODEX_HOME/skills`. |
| `agent-wiki setup --with-obsidian-skills` | implemented | Install or update only the five optional Obsidian skill trees under `$CODEX_HOME/skills`. |
| `agent-wiki setup` | implemented | Create or repair the full local agent wiki setup idempotently. Repo-local memory is the default; use `--global` for global/private memory. |
| `agent-wiki verify` | implemented | Run qmd smoke checks against the installed workflow. Project collections are the default; use `--global` for the global/private collection. |

## Documentation

- [docs/guide/installation.md](docs/guide/installation.md): step-by-step guide for AI agents and humans.
- [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md): product goal, success criteria, and boundaries.
- [docs/INSTALLER_REQUIREMENTS.md](docs/INSTALLER_REQUIREMENTS.md): functional requirements.
- [docs/GENERATED_ASSETS.md](docs/GENERATED_ASSETS.md): files that setup should copy from templates.
