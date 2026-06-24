import { describe, expect, test } from "bun:test"

import { resolvePaths } from "../core/paths"

describe("resolvePaths", () => {
  test("Given default environment When resolving paths Then it derives Codex and wiki targets", () => {
    const result = resolvePaths({
      env: { HOME: "/home/alice" },
      platform: { os: "linux", release: "6.0.0" },
      cwd: "/repo",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("expected path resolution to succeed")
    expect(result.value.home).toBe("/home/alice")
    expect(result.value.codexHome).toBe("/home/alice/.codex")
    expect(result.value.agentWikiDir).toBe("/home/alice/agent-wiki")
    expect(result.value.stateDir).toBe("/home/alice/.agent-wiki")
    expect(result.value.templateDir).toBe("/repo/templates")
    expect(result.value.skillsDir).toBe("/home/alice/.codex/skills")
    expect(result.value.platform.kind).toBe("linux")
  })

  test("Given overrides When resolving paths Then override values are preserved", () => {
    const result = resolvePaths({
      env: {
        HOME: "/home/alice",
        CODEX_HOME: "/tmp/codex-test",
        AGENT_WIKI_DIR: "/tmp/wiki-test",
        AGENT_WIKI_STATE_DIR: "/tmp/state-test",
      },
      platform: { os: "darwin", release: "23.0.0" },
      cwd: "/repo",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("expected path resolution to succeed")
    expect(result.value.codexHome).toBe("/tmp/codex-test")
    expect(result.value.agentWikiDir).toBe("/tmp/wiki-test")
    expect(result.value.stateDir).toBe("/tmp/state-test")
    expect(result.value.platform.kind).toBe("darwin")
  })

  test("Given missing HOME When resolving paths Then it returns a structured error", () => {
    const result = resolvePaths({
      env: {},
      platform: { os: "linux", release: "6.0.0" },
      cwd: "/repo",
    })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected path resolution to fail")
    expect(result.error.kind).toBe("missing_home")
  })
})
