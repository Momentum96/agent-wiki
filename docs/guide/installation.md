# Agent Wiki Installation Guide

Use this guide when a human asks an AI agent to install or validate `agent-wiki`.

## Step 0: Confirm Scope

Tell the user the current project state:

- local CLI scaffold exists
- full setup mutation is not implemented yet
- safe validation is available through `doctor`, `paths`, `setup --install-prereqs`, and `setup --dry-run`

Do not promise a complete Codex/qmd installation until full `setup` and `verify` are implemented.

## Step 1: Inspect the Repository

```bash
git status --short
git remote -v
```

If the working tree is dirty, do not revert unrelated changes. Continue carefully and report the dirty state.

## Step 2: Check Runtime Prerequisites

Check Bun and Node.js, but do not install them automatically.

```bash
bun --version
node --version
```

If either is missing, stop and tell the user what is missing.

## Step 3: Install Project Dependencies

```bash
bun install
```

This installs project development dependencies from `package.json`.

## Step 4: Validate the CLI

```bash
bun run typecheck
bun test
bun run src/cli.ts paths --json
bun run src/cli.ts doctor --json
```

Expected current behavior:

- `paths --json` includes `agentWikiDir` and `stateDir`
- `doctor --json` checks Bun, Node.js, qmd, SQLite, Codex home, Codex config, and Codex `AGENTS.md`
- missing qmd or SQLite may include an `installCandidate`

## Step 5: Handle qmd and SQLite

Run:

```bash
bun run src/cli.ts setup --install-prereqs
```

If qmd or SQLite is missing, the CLI may ask whether to install it.

Rules:

- default answer is no
- ask the user before answering `y`
- do not install Bun, Node.js, Codex, or Homebrew
- use `--no-install` if the user only wants diagnostics

Non-interactive diagnostics:

```bash
bun run src/cli.ts setup --install-prereqs --json --no-install
```

## Step 6: Dry-Run Setup

```bash
bun run src/cli.ts setup --dry-run --json
```

This copies packaged templates into a temporary directory. It must not modify Codex config, qmd collections, global `AGENTS.md`, or the user's real wiki directory.

## Step 7: Report Back

Report:

- commands run
- pass/fail result for each command
- whether qmd and SQLite were present
- whether any install was offered or skipped
- the dry-run target directory
- that full setup mutation and `verify` are still later milestones

## Korean Summary

이 가이드는 AI Agent가 사용자의 `agent-wiki` 설치/검증 요청을 받을 때 따르는 절차입니다.

핵심 원칙:

- 현재는 첫 CLI 마일스톤이며 전체 setup은 아직 미구현입니다.
- Bun, Node.js, Codex는 자동 설치하지 않습니다.
- qmd와 SQLite만 누락 시 명령을 보여주고 사용자 승인 후 설치할 수 있습니다.
- 실제 설정 변경 전에는 `setup --dry-run`으로만 확인합니다.
