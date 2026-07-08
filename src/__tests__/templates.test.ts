import { afterEach, describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
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

  test("Given project log content with repo absolute paths When logging Then it stores repo-relative paths", async () => {
    const project = await mkdtemp(join(tmpdir(), "agent-wiki-project-log-"))
    tempDirs.push(project)
    await mkdir(join(project, "src"), { recursive: true })
    const inputPath = join(project, "input.md")
    await writeFile(
      inputPath,
      [
        "# Session Log",
        "",
        `- CWD: \`${project}\``,
        `- Changed files: \`${project}/src/cli.ts\``,
        `- Verification: \`bun run ${project}/src/cli.ts paths --json\``,
        "",
      ].join("\n"),
    )

    const proc = Bun.spawn({
      cmd: ["bash", "-c", '"$1" path-redaction < "$2"', "bash", join(process.cwd(), "templates/scripts/agent-wiki-log.sh"), inputPath],
      cwd: project,
      env: {
        AGENT_WIKI_SCOPE: "project",
        HOME: project,
        PATH: process.env["PATH"] ?? "",
        PWD: process.cwd(),
      },
      stdout: "pipe",
      stderr: "pipe",
    })
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const exitCode = await proc.exited

    expect(stderr).toBe("")
    expect(exitCode).toBe(0)
    const logPath = stdout.trim()
    const log = await readFile(logPath, "utf8")
    expect(log).not.toContain(project)
    expect(log).toContain("- CWD: `.`")
    expect(log).toContain("- Changed files: `src/cli.ts`")
    expect(log).toContain("- Verification: `bun run src/cli.ts paths --json`")
  })

  test("Given project log content with machine-local absolute paths When logging Then it refuses to write", async () => {
    const project = await mkdtemp(join(tmpdir(), "agent-wiki-project-log-"))
    tempDirs.push(project)
    const inputPath = join(project, "input.md")
    await writeFile(inputPath, "- Evidence: `/Users/example/private-evidence.txt`\n")

    const proc = Bun.spawn({
      cmd: ["bash", "-c", '"$1" path-guard < "$2"', "bash", join(process.cwd(), "templates/scripts/agent-wiki-log.sh"), inputPath],
      cwd: project,
      env: {
        AGENT_WIKI_SCOPE: "project",
        HOME: project,
        PATH: process.env["PATH"] ?? "",
        PWD: process.cwd(),
      },
      stdout: "pipe",
      stderr: "pipe",
    })
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const exitCode = await proc.exited

    expect(stdout).toBe("")
    expect(exitCode).toBe(1)
    expect(stderr).toContain("project logs must use repo-relative paths")
  })

  test("Given a sibling path that starts with the repo path When logging Then it refuses instead of partially rewriting", async () => {
    const project = await mkdtemp(join(tmpdir(), "agent-wiki-project-log-"))
    tempDirs.push(project)
    const inputPath = join(project, "input.md")
    await writeFile(inputPath, `- Evidence: \`${project}-sibling/private.txt\`\n`)

    const proc = Bun.spawn({
      cmd: ["bash", "-c", '"$1" sibling-guard < "$2"', "bash", join(process.cwd(), "templates/scripts/agent-wiki-log.sh"), inputPath],
      cwd: project,
      env: {
        AGENT_WIKI_SCOPE: "project",
        HOME: project,
        PATH: process.env["PATH"] ?? "",
        PWD: process.cwd(),
      },
      stdout: "pipe",
      stderr: "pipe",
    })
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const exitCode = await proc.exited

    expect(stdout).toBe("")
    expect(exitCode).toBe(1)
    expect(stderr).toContain("project logs must use repo-relative paths")
  })

  test("Given a colon-delimited machine-local absolute path When logging Then it refuses to write", async () => {
    const project = await mkdtemp(join(tmpdir(), "agent-wiki-project-log-"))
    tempDirs.push(project)
    const inputPath = join(project, "input.md")
    await writeFile(inputPath, "Evidence:/Users/example/private-evidence.txt\n")

    const proc = Bun.spawn({
      cmd: ["bash", "-c", '"$1" colon-guard < "$2"', "bash", join(process.cwd(), "templates/scripts/agent-wiki-log.sh"), inputPath],
      cwd: project,
      env: {
        AGENT_WIKI_SCOPE: "project",
        HOME: project,
        PATH: process.env["PATH"] ?? "",
        PWD: process.cwd(),
      },
      stdout: "pipe",
      stderr: "pipe",
    })
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const exitCode = await proc.exited

    expect(stdout).toBe("")
    expect(exitCode).toBe(1)
    expect(stderr).toContain("project logs must use repo-relative paths")
  })
})
