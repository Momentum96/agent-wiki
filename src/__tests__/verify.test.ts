import { describe, expect, test } from "bun:test"

import { runVerify } from "../core/verify"

describe("runVerify", () => {
  test("Given qmd collection and search pass When verify runs Then it reports a passing smoke result", async () => {
    const report = await runVerify({
      commandRunner: async () => ({ exitCode: 0, stdout: "ok agent-wiki", stderr: "" }),
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
})
