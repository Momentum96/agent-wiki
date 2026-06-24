import { describe, expect, test } from "bun:test"

import { runPrerequisiteInstall } from "../commands/setup"

describe("runPrerequisiteInstall", () => {
  test("Given JSON mode without --yes When qmd is missing Then it reports candidates without installing", async () => {
    const executed: string[] = []
    const result = await runPrerequisiteInstall({
      platform: { kind: "darwin", isWsl: false },
      json: true,
      yes: false,
      noInstall: false,
      commandRunner: async (command) => {
        executed.push(command)
        return command === "qmd"
          ? { exitCode: 127, stdout: "", stderr: "not found" }
          : { exitCode: 0, stdout: "3.50.0", stderr: "" }
      },
    })

    expect(executed).toEqual(["qmd", "sqlite3"])
    expect(result.planned.map((candidate) => candidate.id)).toEqual(["qmd"])
    expect(result.installed).toEqual([])
    expect(result.skipped.map((candidate) => candidate.id)).toEqual(["qmd"])
  })

  test("Given --yes When qmd is missing Then it executes the candidate install command", async () => {
    const executed: string[] = []
    const result = await runPrerequisiteInstall({
      platform: { kind: "darwin", isWsl: false },
      json: false,
      yes: true,
      noInstall: false,
      commandRunner: async (command, args) => {
        executed.push([command, ...args].join(" "))
        if (command === "qmd") return { exitCode: 127, stdout: "", stderr: "not found" }
        if (command === "sqlite3") return { exitCode: 0, stdout: "3.50.0", stderr: "" }
        return { exitCode: 0, stdout: "", stderr: "" }
      },
    })

    expect(executed).toEqual(["qmd --version", "sqlite3 --version", "bun install --global qmd"])
    expect(result.installed.map((candidate) => candidate.id)).toEqual(["qmd"])
  })

  test("Given confirmation returns no When qmd is missing Then default behavior skips installation", async () => {
    const result = await runPrerequisiteInstall({
      platform: { kind: "darwin", isWsl: false },
      json: false,
      yes: false,
      noInstall: false,
      commandRunner: async (command) =>
        command === "qmd"
          ? { exitCode: 127, stdout: "", stderr: "not found" }
          : { exitCode: 0, stdout: "3.50.0", stderr: "" },
      confirm: async () => false,
    })

    expect(result.skipped.map((candidate) => candidate.id)).toEqual(["qmd"])
    expect(result.installed).toEqual([])
  })
})
