import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, stat } from "node:fs/promises"
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
      "scripts/agent-wiki-sanitize-log.ts",
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
    expect(report.value.changed).toHaveLength(8)
    expect(await stat(join(target, "skills/qmd-cli/SKILL.md"))).toBeDefined()
    expect(await stat(join(target, "scripts/agent-wiki-log.sh"))).toBeDefined()
    expect(await stat(join(target, "scripts/agent-wiki-sanitize-log.ts"))).toBeDefined()
  })

  test("Given sanitizer source and packaged copies When comparing implementation Then they stay in sync", async () => {
    const source = await readFile("src/core/log-sanitize.ts", "utf8")
    const template = await readFile("templates/scripts/agent-wiki-sanitize-log.ts", "utf8")
    const installed = await readFile("docs/agent-wiki/scripts/agent-wiki-sanitize-log.ts", "utf8")

    expect(extractSanitizerImplementation(template)).toBe(source.trimEnd())
    expect(extractSanitizerImplementation(installed)).toBe(source.trimEnd())
  })

  test("Given project log content with repo absolute paths When logging Then it stores repo-relative paths", async () => {
    const project = await mkdtemp(join(tmpdir(), "agent-wiki-project-log-"))
    tempDirs.push(project)

    const { stdout, stderr, exitCode } = await runLogHelper({
      project,
      slug: "path-redaction",
      input: [
        "# Session Log",
        "",
        `- CWD: \`${project}\``,
        `- Changed files: \`${project}/src/cli.ts\``,
        `- Verification: \`bun run ${project}/src/cli.ts paths --json\``,
        "",
      ].join("\n"),
    })

    expect(stderr).toBe("")
    expect(exitCode).toBe(0)
    const logPath = stdout.trim()
    const log = await readFile(logPath, "utf8")
    expect(log).not.toContain(project)
    expect(log).toContain("- CWD: `.`")
    expect(log).toContain("- Changed files: `src/cli.ts`")
    expect(log).toContain("- Verification: `bun run src/cli.ts paths --json`")
  })

  test("Given project log content with machine-local absolute paths When logging Then it stores placeholders", async () => {
    const project = await mkdtemp(join(tmpdir(), "agent-wiki-project-log-"))
    tempDirs.push(project)

    const { stdout, stderr, exitCode } = await runLogHelper({
      project,
      slug: "path-guard",
      input: "- Evidence: `/Users/example/private-evidence.txt`\n",
    })

    expect(stderr).toBe("")
    expect(exitCode).toBe(0)
    const log = await readFile(stdout.trim(), "utf8")
    expect(log).toContain("[machine-local-absolute-path]")
    expect(log).not.toContain("/Users/example")
  })

  test("Given a sibling path that starts with the repo path When logging Then it does not partially rewrite it", async () => {
    const project = await mkdtemp(join(tmpdir(), "agent-wiki-project-log-"))
    tempDirs.push(project)

    const { stdout, stderr, exitCode } = await runLogHelper({
      project,
      slug: "sibling-guard",
      input: `- Evidence: \`${project}-sibling/private.txt\`\n`,
    })

    expect(stderr).toBe("")
    expect(exitCode).toBe(0)
    const log = await readFile(stdout.trim(), "utf8")
    expect(log).not.toContain(`${project}-sibling`)
    expect(log).toContain("[machine-local-absolute-path]")
  })

  test("Given a colon-delimited machine-local absolute path When logging Then it stores a placeholder", async () => {
    const project = await mkdtemp(join(tmpdir(), "agent-wiki-project-log-"))
    tempDirs.push(project)

    const { stdout, stderr, exitCode } = await runLogHelper({
      project,
      slug: "colon-guard",
      input: "Evidence:/Users/example/private-evidence.txt\n",
    })

    expect(stderr).toBe("")
    expect(exitCode).toBe(0)
    const log = await readFile(stdout.trim(), "utf8")
    expect(log).toContain("Evidence:[machine-local-absolute-path]")
    expect(log).not.toContain("/Users/example")
  })

  test("Given a path-like slug When log helper writes Then it uses a safe filename segment", async () => {
    const project = await mkdtemp(join(tmpdir(), "agent-wiki-project-log-"))
    tempDirs.push(project)

    const { stdout, stderr, exitCode } = await runLogHelper({
      project,
      slug: "../escape",
      input: "content\n",
      env: {
        AGENT_WIKI_LOG_KIND: "work-log",
      },
    })

    expect(stderr).toBe("")
    expect(exitCode).toBe(0)
    const file = stdout.trim()
    expect(file).toMatch(/\/work-log\/\d{4}-\d{2}-\d{2}-escape\.md$/)
    expect(file).not.toContain("..")
    expect(await readFile(file, "utf8")).toBe("content\n")
  })

  test("Given work-log mode When log helper writes project memory Then it sanitizes absolute paths in a work-log file", async () => {
    const project = await mkdtemp(join(tmpdir(), "agent-wiki-log-helper-"))
    tempDirs.push(project)
    const repoRoot = join(project, "HWT-SW-2025-017-O")
    const home = join(project, "home")

    const { stdout, stderr, exitCode } = await runLogHelper({
      project,
      slug: "codex-update-detection",
      input: [
        `Active \`codex\` is \`${home}/.local/bin/codex\`.`,
        `Project file \`${repoRoot}/docs/agent-wiki/context.md\`.`,
        "Homebrew `/opt/homebrew/bin/codex`.",
        "Volume `/Volumes/External/private-evidence.txt`.",
        "Private var `/private/var/db/secrets.txt`.",
        "Assignment `TMP=/tmp/debug.log`.",
        "Assignment `CODEX_HOME=/Users/other/.codex`.",
        "Assignment root `USERS_ROOT=/Users`.",
        "Assignment root `HOME_ROOT=/home`.",
        "Assignment root `VOLUMES_ROOT=/Volumes`.",
        "Assignment root `TMP_ROOT=/tmp`.",
        "Assignment root `BREW_ROOT=/opt/homebrew`.",
      ].join("\n"),
      env: {
        AGENT_WIKI_LOG_KIND: "work-log",
        AGENT_WIKI_PROJECT_ROOT: repoRoot,
        HOME: home,
      },
    })

    expect(stderr).toBe("")
    expect(exitCode).toBe(0)
    const file = stdout.trim()
    expect(file).toContain("/docs/agent-wiki/work-log/")
    expect(file).toEndWith("codex-update-detection.md")
    const content = await readFile(file, "utf8")
    expect(content).toContain("[local-home]/.local/bin/codex")
    expect(content).toContain("docs/agent-wiki/context.md")
    expect(content).toContain("[machine-local-absolute-path]")
    expect(content).not.toContain(project)
    expect(content).not.toContain("/Volumes/")
    expect(content).not.toContain("/private/var/")
    expect(content).not.toContain("=/tmp/")
    expect(content).not.toContain("=/Users/")
    expect(content).not.toContain("=/Users")
    expect(content).not.toContain("=/home")
    expect(content).not.toContain("=/Volumes")
    expect(content).not.toContain("=/tmp")
    expect(content).not.toContain("=/opt/homebrew")
  })
})

function extractSanitizerImplementation(content: string): string {
  return content
    .replace(/^#!\/usr\/bin\/env bun\n/, "")
    .replace(/\nconst repoRoot = valueAfter\("--repo-root"\)[\s\S]*$/, "\n")
    .trimEnd()
}

async function runLogHelper(input: {
  readonly project: string
  readonly slug: string
  readonly input: string
  readonly env?: Record<string, string>
}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn({
    cmd: [join(process.cwd(), "templates/scripts/agent-wiki-log.sh"), input.slug],
    cwd: input.project,
    env: {
      ...process.env,
      AGENT_WIKI_SCOPE: "project",
      HOME: input.project,
      ...input.env,
    },
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  })

  proc.stdin.write(input.input)
  proc.stdin.end()

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])

  return { stdout, stderr, exitCode }
}
