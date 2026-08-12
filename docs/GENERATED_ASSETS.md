# Generated Assets

This document lists the packaged templates that `agent-wiki setup` should copy into the target environment.

## Skill Templates

Default setup copies:

- `templates/skills/qmd-cli/SKILL.md`
- `templates/skills/agent-wiki-memory/SKILL.md`

`setup --with-obsidian-skills` is the only installer ownership path for these optional trees. Without that flag, setup must preserve existing same-named directories without creating, changing, deleting, or reporting them:

- `templates/skills/defuddle/{SKILL.md,LICENSE}`
- `templates/skills/json-canvas/{SKILL.md,references/EXAMPLES.md,LICENSE}`
- `templates/skills/obsidian-bases/{SKILL.md,references/FUNCTIONS_REFERENCE.md,LICENSE}`
- `templates/skills/obsidian-cli/{SKILL.md,LICENSE}`
- `templates/skills/obsidian-markdown/{SKILL.md,references/CALLOUTS.md,references/EMBEDS.md,references/PROPERTIES.md,LICENSE}`

Each optional tree retains its upstream MIT `LICENSE`. `THIRD_PARTY_NOTICES.md` identifies Kepano as the source and pins revision `a1dc48e68138490d522c04cbf5822214c6eb1202`. Do not package or install `obsidian-zettelkasten`.

All skill templates are generic. They must not contain user-specific paths, vault names, local machine names, secrets, or raw transcript content. The option copies packaged assets only. It never installs Obsidian, plugins, Defuddle, or another runtime dependency.

## Script Templates

- `templates/scripts/agent-wiki-log.sh`
- `templates/scripts/agent-wiki-sanitize-log.ts`
- `templates/scripts/agent-wiki-refresh.sh`

The POSIX shell scripts are for macOS, Linux, and WSL. The Bun/TypeScript sanitizer helper is copied alongside the log helper so project work logs can remove machine-local absolute paths before writing shareable wiki files. Native Windows helper templates are required by the platform contract, but should be added only after PowerShell parser validation is available.

## Wiki Templates

- `templates/wiki/context.md`
- `templates/wiki/session-log.md`

These become the initial wiki context and session-log template under the target wiki root.

## Agent Instruction Template

- `templates/agents/AGENTS.agent-wiki-block.md`

The installer should merge this block into `$CODEX_HOME/AGENTS.md` using the `agent-wiki:start` and `agent-wiki:end` markers.

## Installer Rules

The installer should copy templates rather than reconstructing long text in code.

qmd is reserved for repository memory. It must not create, search, index, update, refresh, synchronize, or mirror a qmd collection for an Obsidian vault. Vault work requires a user-identified vault and the authorized Obsidian tool for that request. The installer must not select, create, discover, or prescribe a vault.

The published package must exclude `docs/agent-wiki/`. Those files are local project records, not packaged assets.

It may substitute target paths only when a template explicitly contains a placeholder. Current templates avoid path placeholders so they remain portable.

Do not ship unverified platform-specific script templates. If a future implementation adds PowerShell helpers, it must include a syntax check in native Windows or PowerShell CI.
