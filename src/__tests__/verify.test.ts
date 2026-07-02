import { describe, expect, test } from "bun:test"

import { runVerify } from "../core/verify"

describe("runVerify", () => {
  test("Given qmd collection and search pass When verify runs Then it reports a passing smoke result", async () => {
    const report = await runVerify({
      commandRunner: async (_command, args) =>
        args[0] === "context"
          ? { exitCode: 0, stdout: "agent-wiki\n", stderr: "" }
          : { exitCode: 0, stdout: "ok agent-wiki", stderr: "" },
    })

    expect(report.ok).toBe(true)
    expect(report.checks.every((check) => check.status === "pass")).toBe(true)
  })

  test("Given qmd search fails When verify runs Then it reports failure without throwing", async () => {
    const report = await runVerify({
      commandRunner: async (_command, args) =>
        args[0] === "search"
          ? { exitCode: 1, stdout: "", stderr: "not indexed" }
          : { exitCode: 0, stdout: "ok agent-wiki", stderr: "" },
    })

    expect(report.ok).toBe(false)
    expect(report.checks.find((check) => check.id === "qmd-search")?.status).toBe("fail")
  })

  test("Given project collection When verify runs Then it checks that collection", async () => {
    const commands: string[] = []
    const report = await runVerify({
      collectionName: "agent-wiki-my-app",
      commandRunner: async (command, args) => {
        commands.push([command, ...args].join(" "))
        if (args[0] === "context") return { exitCode: 0, stdout: "agent-wiki-my-app\n", stderr: "" }
        return { exitCode: 0, stdout: "ok agent-wiki-my-app", stderr: "" }
      },
    })

    expect(report.ok).toBe(true)
    expect(commands).toContain("qmd collection show agent-wiki-my-app")
    expect(commands).toContain("qmd search Agent Wiki Context --collection agent-wiki-my-app --format files")
  })

  test("Given only a similarly named context exists When verify runs Then it fails context check", async () => {
    const report = await runVerify({
      collectionName: "agent-wiki-repo",
      commandRunner: async (_command, args) =>
        args[0] === "context"
          ? { exitCode: 0, stdout: "agent-wiki-repository\n", stderr: "" }
          : { exitCode: 0, stdout: "ok", stderr: "" },
    })

    expect(report.ok).toBe(false)
    expect(report.checks.find((check) => check.id === "qmd-context")?.status).toBe("fail")
  })
})
