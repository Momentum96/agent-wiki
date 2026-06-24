import { describe, expect, test } from "bun:test"

import { runDoctor } from "../commands/doctor"

describe("runDoctor", () => {
  test("Given qmd is available When doctor runs Then it reports a passing qmd check", async () => {
    const report = await runDoctor({
      paths: {
        home: "/home/alice",
        codexHome: "/home/alice/.codex",
        agentWikiDir: "/home/alice/agent-wiki",
        stateDir: "/home/alice/.agent-wiki",
        templateDir: "/repo/templates",
        skillsDir: "/home/alice/.codex/skills",
        platform: { kind: "linux", isWsl: false },
      },
      commandRunner: async (command) => ({
        exitCode: 0,
        stdout: command === "qmd" ? "qmd 2.5.3" : "1.3.14",
        stderr: "",
      }),
      fileExists: async () => true,
      versions: { bun: "1.3.14", node: "v22.22.3" },
    })

    expect(report.checks.find((check) => check.id === "qmd-version")?.status).toBe("pass")
    expect(report.summary.failed).toBe(0)
  })

  test("Given qmd command fails When doctor runs Then it reports qmd as failed without throwing", async () => {
    const report = await runDoctor({
      paths: {
        home: "/home/alice",
        codexHome: "/home/alice/.codex",
        agentWikiDir: "/home/alice/agent-wiki",
        stateDir: "/home/alice/.agent-wiki",
        templateDir: "/repo/templates",
        skillsDir: "/home/alice/.codex/skills",
        platform: { kind: "linux", isWsl: false },
      },
      commandRunner: async () => ({ exitCode: 127, stdout: "", stderr: "not found" }),
      fileExists: async () => false,
      versions: { bun: "1.3.14", node: "v22.22.3" },
    })

    expect(report.checks.find((check) => check.id === "qmd-version")?.status).toBe("fail")
    expect(report.checks.find((check) => check.id === "qmd-version")?.installCandidate?.id).toBe("qmd")
    expect(report.checks.find((check) => check.id === "sqlite-version")?.installCandidate?.id).toBe("sqlite")
    expect(report.summary.failed).toBe(2)
  })
})
