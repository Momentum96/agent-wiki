import { chmod, copyFile, mkdir, stat } from "node:fs/promises"
import { dirname, join } from "node:path"

import { err, ok, type Result } from "./result"

const TEMPLATE_PATHS = [
  "agents/AGENTS.agent-wiki-block.md",
  "scripts/agent-wiki-log.sh",
  "scripts/agent-wiki-refresh.sh",
  "skills/agent-wiki-memory/SKILL.md",
  "skills/qmd-cli/SKILL.md",
  "wiki/context.md",
  "wiki/session-log.md",
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
}): Promise<readonly TemplateAsset[]> {
  return TEMPLATE_PATHS.map((relativePath) => ({
    relativePath,
    sourcePath: join(input.templateDir, relativePath),
  }))
}

export async function copyTemplatesDryRun(input: {
  readonly templateDir: string
  readonly targetDir: string
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
