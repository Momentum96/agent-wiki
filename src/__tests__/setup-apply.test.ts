import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { runSetup } from "../core/setup"

describe("runSetup", () => {
  test("Given clean target paths When setup runs with skip embed Then it installs files, merges config, and runs qmd smoke", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-wiki-setup-apply-"))
    const paths = testPaths(root)
    const commands: string[] = []

    const report = await runSetup({
      paths,
      skipEmbed: true,
      commandRunner: async (command, args) => {
        commands.push([command, ...args].join(" "))
        if (command === "which") return { exitCode: 0, stdout: "/opt/bin/qmd\n", stderr: "" }
        if (command === "qmd" && args[0] === "collection" && args[1] === "show") {
          return { exitCode: 1, stdout: "", stderr: "missing" }
        }
        if (command === "qmd" && args[0] === "context" && args[1] === "list") {
          return { exitCode: 0, stdout: "", stderr: "" }
        }
        return { exitCode: 0, stdout: "ok", stderr: "" }
      },
    })

    expect(report.failed).toEqual([])
    expect(report.changed).toContain("wiki:context.md")
    expect(report.changed).toContain("codex:config.toml")
    expect(report.changed).toContain("qmd:collection")
    expect(report.skipped).toContain("qmd:embed")
    expect(commands).toContain(`qmd collection add ${paths.agentWikiDir} --name agent-wiki --mask **/*.md`)
    expect(commands).toContain("qmd update")
    expect(commands).toContain("qmd search Agent Wiki Context --collection agent-wiki --format files")

    const config = await readFile(join(paths.codexHome, "config.toml"), "utf8")
    expect(config).toContain("[mcp_servers.qmd]")
    expect(config).toContain('command = "/opt/bin/qmd"')

    const agents = await readFile(join(paths.codexHome, "AGENTS.md"), "utf8")
    expect(agents).toContain("<!-- agent-wiki:start -->")

    await expect(stat(join(paths.agentWikiDir, "scripts/agent-wiki-log.sh"))).resolves.toBeDefined()
    await expect(stat(join(paths.codexHome, "skills/qmd-cli/SKILL.md"))).resolves.toBeDefined()
  })

  test("Given existing managed files When setup reruns Then it preserves unrelated content and reports unchanged files", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-wiki-setup-existing-"))
    const paths = testPaths(root)
    await mkdir(paths.codexHome, { recursive: true })
    await writeFile(join(paths.codexHome, "config.toml"), "[other]\nvalue = true\n")
    await writeFile(join(paths.codexHome, "AGENTS.md"), "Existing instructions\n")

    const first = await runSetup({
      paths,
      skipEmbed: true,
      commandRunner: async (command, args) => qmdAlreadyConfigured(command, args),
    })
    const second = await runSetup({
      paths,
      skipEmbed: true,
      commandRunner: async (command, args) => qmdAlreadyConfigured(command, args),
    })

    expect(first.backups.length).toBe(2)
    expect(second.failed).toEqual([])
    expect(second.unchanged).toContain("codex:config.toml")
    expect(second.unchanged).toContain("codex:AGENTS.md")

    const config = await readFile(join(paths.codexHome, "config.toml"), "utf8")
    expect(config).toContain("[other]")
    expect(config.match(/\[mcp_servers\.qmd\]/g)?.length).toBe(1)

    const agents = await readFile(join(paths.codexHome, "AGENTS.md"), "utf8")
    expect(agents).toContain("Existing instructions")
    expect(agents.match(/agent-wiki:start/g)?.length).toBe(1)
  })
})

function testPaths(root: string) {
  return {
    home: root,
    codexHome: join(root, ".codex"),
    agentWikiDir: join(root, "agent-wiki"),
    stateDir: join(root, ".agent-wiki"),
    templateDir: join(process.cwd(), "templates"),
    skillsDir: join(root, ".codex/skills"),
    platform: { kind: "darwin", isWsl: false } as const,
  }
}

async function qmdAlreadyConfigured(command: string, args: readonly string[]) {
  if (command === "which") return { exitCode: 0, stdout: "/opt/bin/qmd\n", stderr: "" }
  if (command === "qmd" && args[0] === "collection" && args[1] === "show") {
    return { exitCode: 0, stdout: "agent-wiki", stderr: "" }
  }
  if (command === "qmd" && args[0] === "context" && args[1] === "list") {
    return { exitCode: 0, stdout: "agent-wiki\n", stderr: "" }
  }
  return { exitCode: 0, stdout: "ok", stderr: "" }
}
