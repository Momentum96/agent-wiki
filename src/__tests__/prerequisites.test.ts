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

  test("Given non-installable runtime tools are absent When planning candidates Then Bun Node and Codex are not candidates", () => {
    const ids = [
      installCandidateFor("qmd", { kind: "linux", isWsl: false }).id,
      installCandidateFor("sqlite", { kind: "linux", isWsl: false }).id,
    ]

    expect(ids).not.toContain("bun")
    expect(ids).not.toContain("node")
    expect(ids).not.toContain("codex")
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
