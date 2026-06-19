# Generated Assets

This document lists the packaged templates that `agent-wiki setup` should copy into the target environment.

## Skill Templates

- `templates/skills/qmd-cli/SKILL.md`
- `templates/skills/agent-wiki-memory/SKILL.md`

These files are generic Codex skill templates. They must not contain user-specific paths, local machine names, secrets, or raw transcript content.

## Script Templates

- `templates/scripts/agent-wiki-log.sh`
- `templates/scripts/agent-wiki-refresh.sh`

The POSIX scripts are for macOS, Linux, and WSL. Native Windows helper templates are required by the platform contract, but should be added only after PowerShell parser validation is available.

## Wiki Templates

- `templates/wiki/context.md`
- `templates/wiki/session-log.md`

These become the initial wiki context and session-log template under the target wiki root.

## Agent Instruction Template

- `templates/agents/AGENTS.agent-wiki-block.md`

The installer should merge this block into `$CODEX_HOME/AGENTS.md` using the `agent-wiki:start` and `agent-wiki:end` markers.

## Installer Rules

The installer should copy templates rather than reconstructing long text in code.

It may substitute target paths only when a template explicitly contains a placeholder. Current templates avoid path placeholders so they remain portable.

Do not ship unverified platform-specific script templates. If a future implementation adds PowerShell helpers, it must include a syntax check in native Windows or PowerShell CI.
