import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const OPTIONAL_TEMPLATE_PATHS = [
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

describe("CLI smoke", () => {
  test("Given CLI help When printed Then it advertises the optional Obsidian skill flag", async () => {
    const proc = Bun.spawn({
      cmd: ["bun", "run", "src/cli.ts", "--help"],
      stdout: "pipe",
      stderr: "pipe",
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])

    expect(exitCode).toBe(0)
    expect(stderr).toBe("")
    expect(stdout).toContain("--with-obsidian-skills")
  })

  test("Given env overrides When paths --json runs Then it prints parseable JSON", async () => {
    const proc = Bun.spawn({
      cmd: ["bun", "run", "src/cli.ts", "paths", "--json"],
      env: {
        ...process.env,
        CODEX_HOME: "/tmp/codex-test",
        AGENT_WIKI_DIR: "/tmp/wiki-test",
        AGENT_WIKI_STATE_DIR: "/tmp/state-test",
      },
      stdout: "pipe",
      stderr: "pipe",
    })

    const stdout = await new Response(proc.stdout).text()
    const exitCode = await proc.exited

    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout).codexHome).toBe("/tmp/codex-test")
    expect(JSON.parse(stdout).stateDir).toBe("/tmp/state-test")
  })

  test("Given default mode from a nested cwd When paths runs Then it resolves the git root", async () => {
    const proc = Bun.spawn({
      cmd: ["bun", "run", "../src/cli.ts", "paths", "--json"],
      cwd: join(process.cwd(), "src"),
      env: process.env,
      stdout: "pipe",
      stderr: "pipe",
    })

    const stdout = await new Response(proc.stdout).text()
    const exitCode = await proc.exited
    const parsed = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(parsed.agentWikiDir).toBe(join(process.cwd(), "docs/agent-wiki"))
    expect(parsed.stateDir).toBe(join(process.cwd(), ".agent-wiki/local"))
    expect(parsed.collectionName).toBe("agent-wiki-agent-wiki")
  })

  test("Given global mode When paths runs Then it resolves the home wiki", async () => {
    const proc = Bun.spawn({
      cmd: ["bun", "run", "src/cli.ts", "paths", "--global", "--json"],
      env: {
        ...process.env,
        HOME: "/tmp/agent-wiki-home",
      },
      stdout: "pipe",
      stderr: "pipe",
    })

    const stdout = await new Response(proc.stdout).text()
    const exitCode = await proc.exited
    const parsed = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(parsed.agentWikiDir).toBe("/tmp/agent-wiki-home/agent-wiki")
    expect(parsed.stateDir).toBe("/tmp/agent-wiki-home/.agent-wiki")
    expect(parsed.collectionName).toBe("agent-wiki")
  })

  test("Given external default mode from a nested cwd When setup dry-run runs Then it uses packaged templates", async () => {
    const project = await mkdtemp(join(tmpdir(), "agent-wiki-project-"))
    const target = await mkdtemp(join(tmpdir(), "agent-wiki-target-"))
    const nested = join(project, "packages/web")
    const cliPath = join(process.cwd(), "src/cli.ts")

    try {
      await mkdir(join(project, "templates"), { recursive: true })
      await mkdir(nested, { recursive: true })
      const git = Bun.spawn({
        cmd: ["git", "init"],
        cwd: project,
        stdout: "pipe",
        stderr: "pipe",
      })
      expect(await git.exited).toBe(0)

      const proc = Bun.spawn({
        cmd: ["bun", "run", cliPath, "setup", "--dry-run", "--target", target, "--json"],
        cwd: nested,
        env: process.env,
        stdout: "pipe",
        stderr: "pipe",
      })
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      const exitCode = await proc.exited

      expect(stderr).toBe("")
      expect(exitCode).toBe(0)
      expect(JSON.parse(stdout).changed.length).toBe(8)
    } finally {
      await rm(project, { force: true, recursive: true })
      await rm(target, { force: true, recursive: true })
    }
  })

  test("Given temp target When default setup dry-run runs Then JSON lists only eight base templates", async () => {
    const target = await mkdtemp(join(tmpdir(), "agent-wiki-cli-"))
    try {
      const proc = Bun.spawn({
        cmd: ["bun", "run", "src/cli.ts", "setup", "--dry-run", "--target", target, "--json"],
        stdout: "pipe",
        stderr: "pipe",
      })
      const stdout = await new Response(proc.stdout).text()
      const exitCode = await proc.exited
      const changed = JSON.parse(stdout).changed as string[]

      expect(exitCode).toBe(0)
      expect(changed).toHaveLength(8)
      expect(
        changed.some((path) =>
          OPTIONAL_TEMPLATE_PATHS.includes(path as typeof OPTIONAL_TEMPLATE_PATHS[number]),
        ),
      ).toBe(false)
    } finally {
      await rm(target, { force: true, recursive: true })
    }
  })

  test("Given opt-in flag When setup dry-run runs Then JSON lists eight base and 15 optional templates", async () => {
    const target = await mkdtemp(join(tmpdir(), "agent-wiki-cli-obsidian-"))
    try {
      const proc = Bun.spawn({
        cmd: [
          "bun",
          "run",
          "src/cli.ts",
          "setup",
          "--dry-run",
          "--with-obsidian-skills",
          "--target",
          target,
          "--json",
        ],
        stdout: "pipe",
        stderr: "pipe",
      })
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ])
      const changed = JSON.parse(stdout).changed as string[]

      expect(exitCode).toBe(0)
      expect(stderr).toBe("")
      expect(changed).toHaveLength(23)
      expect(
        changed
          .filter((path) => OPTIONAL_TEMPLATE_PATHS.includes(path as typeof OPTIONAL_TEMPLATE_PATHS[number]))
          .sort(),
      ).toEqual([...OPTIONAL_TEMPLATE_PATHS])
    } finally {
      await rm(target, { force: true, recursive: true })
    }
  })

  test("Given a regular-file dry-run target When CLI runs in JSON mode Then it exits one with parseable error JSON", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-wiki-cli-file-target-"))
    const target = join(root, "target-file")
    await Bun.write(target, "not a directory")

    try {
      const proc = Bun.spawn({
        cmd: [
          "bun",
          "run",
          "src/cli.ts",
          "setup",
          "--dry-run",
          "--with-obsidian-skills",
          "--target",
          target,
          "--json",
        ],
        stdout: "pipe",
        stderr: "pipe",
      })
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ])
      const parsed = JSON.parse(stdout) as { error?: string }

      expect(exitCode).toBe(1)
      expect(stderr).toBe("")
      expect(parsed.error).toBeString()
      expect(parsed.error?.length).toBeGreaterThan(0)
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })
})
