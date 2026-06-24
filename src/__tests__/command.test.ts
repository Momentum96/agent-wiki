import { describe, expect, test } from "bun:test"

import { runCommand } from "../core/command"

describe("runCommand", () => {
  test("Given missing executable When command runs Then it returns exit 127 instead of throwing", async () => {
    const result = await runCommand("definitely-not-agent-wiki-command", ["--version"])

    expect(result.exitCode).toBe(127)
    expect(result.stderr).toContain("Executable not found")
  })
})
