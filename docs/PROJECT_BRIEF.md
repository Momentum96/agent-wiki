# Project Brief

## Overview

`agent-wiki` will be a Bun-installable CLI for setting up a qmd-backed local markdown memory workflow for Codex and similar coding agents.

The project exists to convert a manual setup guide into a repeatable installer that a developer can run without asking an LLM to interpret each step.

## Background

The current manual guide describes how to:

- install qmd
- create an agent wiki folder
- register qmd collections and context
- configure Codex MCP
- add global `AGENTS.md` workflow instructions
- install `qmd-cli` and `agent-wiki-memory` skills
- create helper scripts for logging and qmd refresh
- avoid sharing secrets or raw transcripts

That guide is detailed enough for a careful manual setup. The missing layer is packaging: predictable path resolution, safe config merge, template installation, cross-platform behavior, and machine-readable verification.

## Goal

Build a globally installable CLI that can configure the local agent wiki workflow with:

```bash
bun install -g agent-wiki
agent-wiki doctor
agent-wiki setup
agent-wiki verify
```

The final result should let another developer install qmd-backed agent wiki memory without copying local paths, private config, or large instruction blocks by hand.

## Success Criteria

The first production-ready version is successful when:

1. A clean macOS, Linux, or Windows environment can run `agent-wiki doctor` and receive clear readiness diagnostics.
2. `agent-wiki setup` can create the wiki root, templates, qmd collection, qmd context, Codex MCP config, global `AGENTS.md` block, skills, and helper scripts.
3. Re-running `agent-wiki setup` is safe and does not duplicate or corrupt existing files.
4. `agent-wiki verify` proves the setup through actual qmd commands, including collection listing and a smoke search.
5. The installer never copies secrets, raw transcripts, or complete user-specific Codex config.

## Design Principles

- Idempotent by default.
- Prefer repair over overwrite.
- Show exact paths and commands in diagnostics.
- Use structured config parsing instead of string-only edits where possible.
- Keep packaged templates separate from installer logic.
- Treat `qmd embed` as optional setup enrichment, not a mandatory smoke gate.
- Keep platform-specific behavior explicit.

## Platform Requirements

### macOS

- Support zsh users by default.
- Detect Homebrew SQLite readiness and ask before installing SQLite.
- Use absolute paths in Codex MCP config.

### Linux

- Support common shells without requiring shell profile edits during setup.
- Detect common SQLite package gaps and print distro-specific guidance.
- Ask before running SQLite package-manager commands.
- Work in normal home-directory installs and container-like environments.

### Windows

- Support native Windows path handling.
- Detect whether the user is running native Windows or WSL.
- Do not mix Windows qmd paths with WSL Codex paths.
- Print PowerShell-friendly remediation when PATH or SQLite is missing.

## Initial CLI Shape

```text
agent-wiki doctor [--json]
agent-wiki setup [--wiki-dir <path>] [--codex-home <path>] [--skip-embed] [--dry-run] [--install-prereqs] [--yes] [--no-install] [--json]
agent-wiki verify [--json]
agent-wiki paths [--json]
```

## Files The Installer Should Manage

Default targets:

- `$HOME/agent-wiki/context.md`
- `$HOME/agent-wiki/templates/session-log.md`
- `$HOME/agent-wiki/scripts/agent-wiki-log.sh`
- `$HOME/agent-wiki/scripts/agent-wiki-refresh.sh`
- `$HOME/.agent-wiki/`
- `$CODEX_HOME/AGENTS.md`
- `$CODEX_HOME/config.toml`
- `$CODEX_HOME/skills/qmd-cli/SKILL.md`
- `$CODEX_HOME/skills/agent-wiki-memory/SKILL.md`

The implementation must allow target paths to be overridden by CLI flags or environment variables.

## Open Decisions

- Final npm package name.
- Whether the package should publish under a scope.
- Whether Windows should install `.ps1` helper scripts in addition to POSIX shell scripts, after PowerShell parser validation is available.
- Whether to vendor qmd skill content exactly from `qmd skills get qmd --full` or keep a project-maintained `qmd-cli` template.
