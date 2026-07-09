# agent-wiki sync pull propagation

## Summary

- Pulled `main` to `1cbe039` and preserved pre-pull local work in a safety stash.
- Propagated latest agent-wiki templates, qmd setup, Codex/OpenCode AGENTS blocks, skills, and project scripts.
- Existing project surfaces updated: current repo, HWT project, and gwasildam project.
- Added/verified log sanitization for machine-local paths, including assignment roots like `USERS_ROOT=[machine-local-absolute-path]`, `HOME_ROOT=[machine-local-absolute-path]`, and `VOLUMES_ROOT=[machine-local-absolute-path]`.

## Verification

- `bun test` -> 46 pass, 0 fail.
- `bun run typecheck` -> pass.
- `git diff --check` -> pass.
- `setup --skip-embed --json` and `verify --json` passed for current repo.
- `setup --skip-embed --json` passed for `--codex-home ~/.codex`.
- HWT and gwasildam project setup/verify passed with Node 24 first in PATH so qmd matched its native module ABI.
- qmd update/search passed; `qmd embed` remains optional and was skipped.

## Changed Surfaces

- Repo templates and sanitizer source/tests.
- Orca Codex, user Codex, and OpenCode AGENTS/skills.
- HWT project agent-wiki scripts.
- Gwasildam root AGENTS marker block, agent block, and agent-wiki scripts.
