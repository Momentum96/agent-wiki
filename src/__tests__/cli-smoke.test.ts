import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

describe("CLI smoke", () => {
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

  test("Given temp target When setup dry-run runs Then it writes templates only under target", async () => {
    const target = await mkdtemp(join(tmpdir(), "agent-wiki-cli-"))
    try {
      const proc = Bun.spawn({
        cmd: ["bun", "run", "src/cli.ts", "setup", "--dry-run", "--target", target, "--json"],
        stdout: "pipe",
        stderr: "pipe",
      })
      const stdout = await new Response(proc.stdout).text()
      const exitCode = await proc.exited

      expect(exitCode).toBe(0)
      expect(JSON.parse(stdout).changed.length).toBe(8)
    } finally {
      await rm(target, { force: true, recursive: true })
    }
  })
})
