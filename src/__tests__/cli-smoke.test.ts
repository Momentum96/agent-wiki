import { describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
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
      expect(JSON.parse(stdout).changed.length).toBe(7)
    } finally {
      await rm(target, { force: true, recursive: true })
    }
  })
})
