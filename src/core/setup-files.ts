import { mkdir, rm, rmdir, stat } from "node:fs/promises"
import { join } from "node:path"

import type { ResolvedPaths } from "./paths"
import type { MutableSetupReport } from "./setup-report"
import { copyIfChanged } from "./file-state"

const FILE_TARGETS = [
  ["wiki/context.md", "context.md", "wiki:context.md"],
  ["wiki/session-log.md", "templates/session-log.md", "wiki:templates/session-log.md"],
  ["scripts/agent-wiki-log.sh", "scripts/agent-wiki-log.sh", "script:agent-wiki-log.sh"],
  ["scripts/agent-wiki-sanitize-log.ts", "scripts/agent-wiki-sanitize-log.ts", "script:agent-wiki-sanitize-log.ts"],
  ["scripts/agent-wiki-refresh.sh", "scripts/agent-wiki-refresh.sh", "script:agent-wiki-refresh.sh"],
] as const

const SKILL_TARGETS = [
  ["skills/qmd-cli/SKILL.md", "qmd-cli/SKILL.md", "skill:qmd-cli"],
  ["skills/agent-wiki-memory/SKILL.md", "agent-wiki-memory/SKILL.md", "skill:agent-wiki-memory"],
] as const

const OPTIONAL_OBSIDIAN_SKILL_TARGETS = [
  ["skills/defuddle/LICENSE", "defuddle/LICENSE", "skill:defuddle/LICENSE"],
  ["skills/defuddle/SKILL.md", "defuddle/SKILL.md", "skill:defuddle/SKILL.md"],
  ["skills/json-canvas/LICENSE", "json-canvas/LICENSE", "skill:json-canvas/LICENSE"],
  ["skills/json-canvas/SKILL.md", "json-canvas/SKILL.md", "skill:json-canvas/SKILL.md"],
  [
    "skills/json-canvas/references/EXAMPLES.md",
    "json-canvas/references/EXAMPLES.md",
    "skill:json-canvas/references/EXAMPLES.md",
  ],
  ["skills/obsidian-bases/LICENSE", "obsidian-bases/LICENSE", "skill:obsidian-bases/LICENSE"],
  ["skills/obsidian-bases/SKILL.md", "obsidian-bases/SKILL.md", "skill:obsidian-bases/SKILL.md"],
  [
    "skills/obsidian-bases/references/FUNCTIONS_REFERENCE.md",
    "obsidian-bases/references/FUNCTIONS_REFERENCE.md",
    "skill:obsidian-bases/references/FUNCTIONS_REFERENCE.md",
  ],
  ["skills/obsidian-cli/LICENSE", "obsidian-cli/LICENSE", "skill:obsidian-cli/LICENSE"],
  ["skills/obsidian-cli/SKILL.md", "obsidian-cli/SKILL.md", "skill:obsidian-cli/SKILL.md"],
  ["skills/obsidian-markdown/LICENSE", "obsidian-markdown/LICENSE", "skill:obsidian-markdown/LICENSE"],
  ["skills/obsidian-markdown/SKILL.md", "obsidian-markdown/SKILL.md", "skill:obsidian-markdown/SKILL.md"],
  [
    "skills/obsidian-markdown/references/CALLOUTS.md",
    "obsidian-markdown/references/CALLOUTS.md",
    "skill:obsidian-markdown/references/CALLOUTS.md",
  ],
  [
    "skills/obsidian-markdown/references/EMBEDS.md",
    "obsidian-markdown/references/EMBEDS.md",
    "skill:obsidian-markdown/references/EMBEDS.md",
  ],
  [
    "skills/obsidian-markdown/references/PROPERTIES.md",
    "obsidian-markdown/references/PROPERTIES.md",
    "skill:obsidian-markdown/references/PROPERTIES.md",
  ],
] as const

const LEGACY_AGENT_WIKI_MEMORY_FILES = [
  "agent-wiki-memory/scripts/agent-wiki-refresh.sh",
  "agent-wiki-memory/scripts/agent-wiki-log.sh",
  "agent-wiki-memory/references/wiki-schema.md",
  "agent-wiki-memory/templates/session-log.md",
] as const

const LEGACY_AGENT_WIKI_MEMORY_DIRS = [
  "agent-wiki-memory/scripts",
  "agent-wiki-memory/references",
  "agent-wiki-memory/templates",
] as const

export async function installTemplateFiles(input: {
  readonly paths: ResolvedPaths
  readonly report: MutableSetupReport
  readonly withObsidianSkills: boolean
}): Promise<void> {
  await mkdir(input.paths.agentWikiDir, { recursive: true })
  await mkdir(input.paths.stateDir, { recursive: true })
  input.report.changed.push("dir:agent-wiki")
  input.report.changed.push("dir:state")

  for (const [source, target, label] of FILE_TARGETS) {
    const status = await copyIfChanged({
      sourcePath: join(input.paths.templateDir, source),
      targetPath: join(input.paths.agentWikiDir, target),
    })
    input.report[status].push(label)
  }

  for (const [source, target, label] of SKILL_TARGETS) {
    const status = await copyIfChanged({
      sourcePath: join(input.paths.templateDir, source),
      targetPath: join(input.paths.skillsDir, target),
    })
    input.report[status].push(label)
  }

  if (input.withObsidianSkills) {
    for (const [source, target, label] of OPTIONAL_OBSIDIAN_SKILL_TARGETS) {
      const status = await copyIfChanged({
        sourcePath: join(input.paths.templateDir, source),
        targetPath: join(input.paths.skillsDir, target),
      })
      input.report[status].push(label)
    }
  }

  await removeLegacyAgentWikiMemoryAssets(input.paths, input.report)
}

async function removeLegacyAgentWikiMemoryAssets(
  paths: ResolvedPaths,
  report: MutableSetupReport,
): Promise<void> {
  for (const relativePath of LEGACY_AGENT_WIKI_MEMORY_FILES) {
    const path = join(paths.skillsDir, relativePath)
    if (!(await exists(path))) continue
    await rm(path)
    report.changed.push(`legacy:${relativePath}`)
  }

  for (const relativePath of LEGACY_AGENT_WIKI_MEMORY_DIRS) {
    try {
      await rmdir(join(paths.skillsDir, relativePath))
    } catch {
    }
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}
