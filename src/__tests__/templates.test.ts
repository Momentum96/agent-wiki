import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { copyTemplatesDryRun, listTemplateAssets } from "../core/templates"

const tempDirs: string[] = []

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { force: true, recursive: true })
  }
})

describe("template inventory", () => {
  test("Given repository templates When listing assets Then every expected packaged file is present", async () => {
    const assets = await listTemplateAssets({ templateDir: "templates" })

    expect(assets.map((asset) => asset.relativePath).sort()).toEqual([
      "agents/AGENTS.agent-wiki-block.md",
      "scripts/agent-wiki-log.sh",
      "scripts/agent-wiki-refresh.sh",
      "skills/agent-wiki-memory/SKILL.md",
      "skills/qmd-cli/SKILL.md",
      "wiki/context.md",
      "wiki/session-log.md",
    ])
  })

  test("Given temp target When dry-run copying Then templates are copied under target", async () => {
    const target = await mkdtemp(join(tmpdir(), "agent-wiki-test-"))
    tempDirs.push(target)

    const report = await copyTemplatesDryRun({ templateDir: "templates", targetDir: target })

    expect(report.ok).toBe(true)
    if (!report.ok) throw new Error("expected dry-run copy to succeed")
    expect(report.value.changed).toHaveLength(7)
    await expect(stat(join(target, "skills/qmd-cli/SKILL.md"))).resolves.toBeDefined()
    await expect(stat(join(target, "scripts/agent-wiki-log.sh"))).resolves.toBeDefined()
  })
})
