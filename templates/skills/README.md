# Skill Templates

This directory contains the `SKILL.md` templates installed by `agent-wiki setup`.

Default templates:

- `qmd-cli/SKILL.md`
- `agent-wiki-memory/SKILL.md`

Optional templates are installed only by `setup --with-obsidian-skills`:

- `defuddle/{SKILL.md,LICENSE}`
- `json-canvas/{SKILL.md,references/EXAMPLES.md,LICENSE}`
- `obsidian-bases/{SKILL.md,references/FUNCTIONS_REFERENCE.md,LICENSE}`
- `obsidian-cli/{SKILL.md,LICENSE}`
- `obsidian-markdown/{SKILL.md,references/CALLOUTS.md,references/EMBEDS.md,references/PROPERTIES.md,LICENSE}`

The flag is the only installer ownership path for the five optional directories. A default setup leaves same-named directories untouched and does not report them. Each optional tree retains its upstream MIT `LICENSE`; `THIRD_PARTY_NOTICES.md` records Kepano as the source and pins revision `a1dc48e68138490d522c04cbf5822214c6eb1202`.

Keep templates portable. They must not contain user-specific paths, vault paths or names, secrets, or raw session data. These assets never install a runtime dependency. qmd remains repository memory and must not manage an Obsidian vault lifecycle.
