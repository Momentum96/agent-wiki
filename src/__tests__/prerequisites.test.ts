import { describe, expect, test } from "bun:test"

import {
  checkInstallablePrerequisites,
  installCandidateFor,
  installSelectedPrerequisites,
  missingInstallCandidates,
} from "../core/prerequisites"

describe("prerequisites", () => {
  test("Given qmd and sqlite are missing When checking installable prerequisites Then only those candidates are planned", async () => {
    const checks = await checkInstallablePrerequisites(
      { kind: "darwin", isWsl: false },
      async () => ({ exitCode: 127, stdout: "", stderr: "not found" }),
    )

    const candidates = missingInstallCandidates(checks)

    expect(candidates.map((candidate) => candidate.id)).toEqual(["qmd", "sqlite"])
    expect(candidates.find((candidate) => candidate.id === "qmd")?.command).toBe("bun")
    expect(candidates.find((candidate) => candidate.id === "sqlite")?.command).toBe("brew")
  })

  test("Given qmd is missing When selecting its installer Then it uses the canonical @tobilu/qmd package", () => {
    const candidate = installCandidateFor("qmd", { kind: "darwin", isWsl: false })

    expect(candidate.command).toBe("bun")
    expect(candidate.args).toEqual(["install", "--global", "@tobilu/qmd"])
  })

  test("Given non-installable runtime tools are absent When planning candidates Then Bun Node and Codex are not candidates", () => {
    const ids = [
      installCandidateFor("qmd", { kind: "linux", isWsl: false }).id,
      installCandidateFor("sqlite", { kind: "linux", isWsl: false }).id,
    ]

    expect(ids).not.toContain("bun")
    expect(ids).not.toContain("node")
    expect(ids).not.toContain("codex")
  })

  test("Given qmd installation succeeds When its post-check succeeds Then qmd is installed", async () => {
    const candidate = installCandidateFor("qmd", { kind: "darwin", isWsl: false })
    const executed: string[] = []

    const result = await installSelectedPrerequisites({
      candidates: [candidate],
      decisions: [{ id: "qmd", install: true }],
      commandRunner: async (command, args) => {
        executed.push([command, ...args].join(" "))
        return command === "qmd"
          ? { exitCode: 0, stdout: "qmd 1.0.0", stderr: "" }
          : { exitCode: 0, stdout: "", stderr: "" }
      },
    })

    expect(executed).toEqual(["bun install --global @tobilu/qmd", "qmd --version"])
    expect(result.installed.map((item) => item.id)).toEqual(["qmd"])
    expect(result.failed).toEqual([])
  })

  test("Given qmd post-check fails When SQLite installation succeeds Then qmd failure detail prefers stderr and SQLite remains installed", async () => {
    const candidates = [
      installCandidateFor("qmd", { kind: "darwin", isWsl: false }),
      installCandidateFor("sqlite", { kind: "darwin", isWsl: false }),
    ]
    const executed: string[] = []

    const result = await installSelectedPrerequisites({
      candidates,
      decisions: candidates.map((candidate) => ({ id: candidate.id, install: true })),
      commandRunner: async (command, args) => {
        executed.push([command, ...args].join(" "))
        if (command === "qmd") return { exitCode: 1, stdout: "stdout detail", stderr: "stderr detail" }
        return { exitCode: 0, stdout: "", stderr: "" }
      },
    })

    expect(executed).toEqual([
      "bun install --global @tobilu/qmd",
      "qmd --version",
      "brew install sqlite",
    ])
    expect(result.failed.map((item) => [item.candidate.id, item.detail])).toEqual([[
      "qmd",
      "stderr detail",
    ]])
    expect(result.installed.map((candidate) => candidate.id)).toEqual(["sqlite"])
  })

  test.each([
    {
      name: "stderr",
      stdout: "stdout detail",
      stderr: "stderr detail",
      expected: "stderr detail",
    },
    {
      name: "stdout",
      stdout: "stdout detail",
      stderr: "",
      expected: "stdout detail",
    },
    {
      name: "fallback",
      stdout: "",
      stderr: "",
      expected: "qmd --version failed after installation",
    },
  ])("Given qmd post-check fails with $name detail Then failure reporting is deterministic", async ({
    stdout,
    stderr,
    expected,
  }) => {
    const candidate = installCandidateFor("qmd", { kind: "darwin", isWsl: false })

    const result = await installSelectedPrerequisites({
      candidates: [candidate],
      decisions: [{ id: "qmd", install: true }],
      commandRunner: async (command) =>
        command === "qmd"
          ? { exitCode: 1, stdout, stderr }
          : { exitCode: 0, stdout: "", stderr: "" },
    })

    expect(result.installed).toEqual([])
    expect(result.failed.map((item) => item.detail)).toEqual([expected])
  })

  test("Given default negative decisions When installing selected prerequisites Then nothing is executed", async () => {
    const candidates = [
      installCandidateFor("qmd", { kind: "darwin", isWsl: false }),
      installCandidateFor("sqlite", { kind: "darwin", isWsl: false }),
    ]
    const executed: string[] = []

    const result = await installSelectedPrerequisites({
      candidates,
      decisions: candidates.map((candidate) => ({ id: candidate.id, install: false })),
      commandRunner: async (command) => {
        executed.push(command)
        return { exitCode: 0, stdout: "", stderr: "" }
      },
    })

    expect(executed).toEqual([])
    expect(result.skipped.map((candidate) => candidate.id)).toEqual(["qmd", "sqlite"])
  })
})
