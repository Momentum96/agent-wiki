import { mkdir } from "node:fs/promises"
import { join } from "node:path"

import type { ResolvedPaths } from "./paths"
import type { MutableSetupReport } from "./setup-report"
import { copyIfChanged } from "./file-state"

const FILE_TARGETS = [
  ["wiki/context.md", "context.md", "wiki:context.md"],
  ["wiki/session-log.md", "templates/session-log.md", "wiki:templates/session-log.md"],
  ["scripts/agent-wiki-log.sh", "scripts/agent-wiki-log.sh", "script:agent-wiki-log.sh"],
  ["scripts/agent-wiki-refresh.sh", "scripts/agent-wiki-refresh.sh", "script:agent-wiki-refresh.sh"],
] as const

const SKILL_TARGETS = [
  ["skills/qmd-cli/SKILL.md", "qmd-cli/SKILL.md", "skill:qmd-cli"],
  ["skills/agent-wiki-memory/SKILL.md", "agent-wiki-memory/SKILL.md", "skill:agent-wiki-memory"],
] as const

export async function installTemplateFiles(input: {
  readonly paths: ResolvedPaths
  readonly report: MutableSetupReport
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
}
