import { describe, expect, test } from "bun:test"
import { join } from "node:path"

import { resolvePaths } from "../core/paths"

describe("resolvePaths", () => {
  test("Given default environment When resolving paths Then it derives project-local wiki targets", () => {
    const result = resolvePaths({
      env: { HOME: "/home/alice" },
      platform: { os: "linux", release: "6.0.0" },
      cwd: "/repo",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("expected path resolution to succeed")
    expect(result.value.home).toBe("/home/alice")
    expect(result.value.codexHome).toBe("/home/alice/.codex")
    expect(result.value.agentWikiDir).toBe("/repo/docs/agent-wiki")
    expect(result.value.stateDir).toBe("/repo/.agent-wiki/local")
    expect(result.value.collectionName).toBe("agent-wiki-repo")
    expect(result.value.templateDir).toBe(join(process.cwd(), "templates"))
    expect(result.value.skillsDir).toBe("/home/alice/.codex/skills")
    expect(result.value.platform.kind).toBe("linux")
  })

  test("Given global scope When resolving paths Then it derives home wiki targets", () => {
    const result = resolvePaths({
      env: { HOME: "/home/alice", AGENT_WIKI_SCOPE: "global" },
      platform: { os: "linux", release: "6.0.0" },
      cwd: "/repo",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("expected path resolution to succeed")
    expect(result.value.agentWikiDir).toBe("/home/alice/agent-wiki")
    expect(result.value.stateDir).toBe("/home/alice/.agent-wiki")
    expect(result.value.collectionName).toBe("agent-wiki")
    expect(result.value.templateDir).toBe(join(process.cwd(), "templates"))
  })

  test("Given project scope When resolving paths Then it derives repo-local wiki targets", () => {
    const result = resolvePaths({
      env: { HOME: "/home/alice", AGENT_WIKI_SCOPE: "project" },
      platform: { os: "linux", release: "6.0.0" },
      cwd: "/work/my-app",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("expected path resolution to succeed")
    expect(result.value.agentWikiDir).toBe("/work/my-app/docs/agent-wiki")
    expect(result.value.stateDir).toBe("/work/my-app/.agent-wiki/local")
    expect(result.value.collectionName).toBe("agent-wiki-my-app")
    expect(result.value.templateDir).toBe(join(process.cwd(), "templates"))
  })

  test("Given project scope from a subdirectory When resolving paths Then it uses the project root", () => {
    const result = resolvePaths({
      env: {
        HOME: "/home/alice",
        AGENT_WIKI_SCOPE: "project",
        AGENT_WIKI_PROJECT_ROOT: "/work/my-app",
      },
      platform: { os: "linux", release: "6.0.0" },
      cwd: "/work/my-app/packages/web",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("expected path resolution to succeed")
    expect(result.value.agentWikiDir).toBe("/work/my-app/docs/agent-wiki")
    expect(result.value.stateDir).toBe("/work/my-app/.agent-wiki/local")
    expect(result.value.collectionName).toBe("agent-wiki-my-app")
    expect(result.value.templateDir).toBe(join(process.cwd(), "templates"))
  })

  test("Given project scope and a repo templates directory When resolving paths Then packaged templates stay separate", () => {
    const result = resolvePaths({
      env: {
        HOME: "/home/alice",
        AGENT_WIKI_SCOPE: "project",
        AGENT_WIKI_PROJECT_ROOT: "/work/my-app",
      },
      platform: { os: "linux", release: "6.0.0" },
      cwd: "/work/my-app/packages/web",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("expected path resolution to succeed")
    expect(result.value.templateDir).toBe(join(process.cwd(), "templates"))
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
    expect(result.value.collectionName).toBe("agent-wiki-repo")
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
