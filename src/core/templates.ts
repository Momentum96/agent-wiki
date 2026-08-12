import { chmod, copyFile, mkdir, stat } from "node:fs/promises"
import { dirname, join } from "node:path"

import { err, ok, type Result } from "./result"

const TEMPLATE_PATHS = [
  "agents/AGENTS.agent-wiki-block.md",
  "scripts/agent-wiki-log.sh",
  "scripts/agent-wiki-sanitize-log.ts",
  "scripts/agent-wiki-refresh.sh",
  "skills/agent-wiki-memory/SKILL.md",
  "skills/qmd-cli/SKILL.md",
  "wiki/context.md",
  "wiki/session-log.md",
] as const

const OPTIONAL_OBSIDIAN_SKILL_PATHS = [
  "skills/defuddle/LICENSE",
  "skills/defuddle/SKILL.md",
  "skills/json-canvas/LICENSE",
  "skills/json-canvas/SKILL.md",
  "skills/json-canvas/references/EXAMPLES.md",
  "skills/obsidian-bases/LICENSE",
  "skills/obsidian-bases/SKILL.md",
  "skills/obsidian-bases/references/FUNCTIONS_REFERENCE.md",
  "skills/obsidian-cli/LICENSE",
  "skills/obsidian-cli/SKILL.md",
  "skills/obsidian-markdown/LICENSE",
  "skills/obsidian-markdown/SKILL.md",
  "skills/obsidian-markdown/references/CALLOUTS.md",
  "skills/obsidian-markdown/references/EMBEDS.md",
  "skills/obsidian-markdown/references/PROPERTIES.md",
] as const

export type TemplateAsset = {
  readonly relativePath: string
  readonly sourcePath: string
}

export type TemplateReport = {
  readonly targetDir: string
  readonly changed: readonly string[]
  readonly unchanged: readonly string[]
  readonly skipped: readonly string[]
  readonly failed: readonly string[]
}

export type TemplateError = {
  readonly kind: "template_copy_failed"
  readonly message: string
}

export async function listTemplateAssets(input: {
  readonly templateDir: string
  readonly withObsidianSkills: boolean
}): Promise<readonly TemplateAsset[]> {
  const paths: readonly string[] = input.withObsidianSkills
    ? [...TEMPLATE_PATHS, ...OPTIONAL_OBSIDIAN_SKILL_PATHS]
    : TEMPLATE_PATHS
  return paths.map((relativePath) => ({
    relativePath,
    sourcePath: join(input.templateDir, relativePath),
  }))
}

export async function copyTemplatesDryRun(input: {
  readonly templateDir: string
  readonly targetDir: string
  readonly withObsidianSkills: boolean
}): Promise<Result<TemplateReport, TemplateError>> {
  try {
    const assets = await listTemplateAssets(input)
    const changed: string[] = []

    for (const asset of assets) {
      const targetPath = join(input.targetDir, asset.relativePath)
      await mkdir(dirname(targetPath), { recursive: true })
      await copyFile(asset.sourcePath, targetPath)
      const sourceStat = await stat(asset.sourcePath)
      await chmod(targetPath, sourceStat.mode & 0o777)
      changed.push(asset.relativePath)
    }

    return ok({
      targetDir: input.targetDir,
      changed,
      unchanged: [],
      skipped: [],
      failed: [],
    })
  } catch (error) {
    return err({
      kind: "template_copy_failed",
      message: error instanceof Error ? error.message : "Unknown template copy failure.",
    })
  }
}
