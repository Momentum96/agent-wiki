import { describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
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
      withObsidianSkills: false,
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

  test("Given project-scoped target paths When setup runs Then it configures a project collection", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-wiki-setup-project-"))
    const paths = {
      ...testPaths(root),
      agentWikiDir: join(root, "repo/docs/agent-wiki"),
      stateDir: join(root, "repo/.agent-wiki/local"),
      collectionName: "agent-wiki-repo",
    }
    const commands: string[] = []

    const report = await runSetup({
      paths,
      skipEmbed: true,
      withObsidianSkills: false,
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
    expect(commands).toContain(`qmd collection add ${paths.agentWikiDir} --name agent-wiki-repo --mask **/*.md`)
    expect(commands).toContain("qmd context add qmd://agent-wiki-repo Shared project agent wiki for coding agents. Stores repo-local summaries, decisions, verification notes, and changed-file manifests. Use repo-relative paths for shareable project facts.")
    expect(commands).toContain("qmd search Agent Wiki Context --collection agent-wiki-repo --format files")
  })

  test("Given only a similarly named context exists When setup runs Then it adds the exact project context", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-wiki-setup-context-"))
    const paths = {
      ...testPaths(root),
      collectionName: "agent-wiki-repo",
    }
    const commands: string[] = []

    const report = await runSetup({
      paths,
      skipEmbed: true,
      withObsidianSkills: false,
      commandRunner: async (command, args) => {
        commands.push([command, ...args].join(" "))
        if (command === "which") return { exitCode: 0, stdout: "/opt/bin/qmd\n", stderr: "" }
        if (command === "qmd" && args[0] === "context" && args[1] === "list") {
          return { exitCode: 0, stdout: "agent-wiki-repository\n", stderr: "" }
        }
        return { exitCode: 0, stdout: "ok", stderr: "" }
      },
    })

    expect(report.failed).toEqual([])
    expect(commands).toContain("qmd context add qmd://agent-wiki-repo Shared project agent wiki for coding agents. Stores repo-local summaries, decisions, verification notes, and changed-file manifests. Use repo-relative paths for shareable project facts.")
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
      withObsidianSkills: false,
      commandRunner: async (command, args) => qmdAlreadyConfigured(command, args),
    })
    const second = await runSetup({
      paths,
      skipEmbed: true,
      withObsidianSkills: false,
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

  test("Given recursive optional sentinels When default and opt-in setups run Then only opt-in manages optional assets idempotently", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-wiki-setup-obsidian-"))
    const paths = testPaths(root)
    const skillNames = [
      "defuddle",
      "json-canvas",
      "obsidian-bases",
      "obsidian-cli",
      "obsidian-markdown",
    ] as const
    const optionalLabels = [
      "skill:defuddle/LICENSE",
      "skill:defuddle/SKILL.md",
      "skill:json-canvas/LICENSE",
      "skill:json-canvas/SKILL.md",
      "skill:json-canvas/references/EXAMPLES.md",
      "skill:obsidian-bases/LICENSE",
      "skill:obsidian-bases/SKILL.md",
      "skill:obsidian-bases/references/FUNCTIONS_REFERENCE.md",
      "skill:obsidian-cli/LICENSE",
      "skill:obsidian-cli/SKILL.md",
      "skill:obsidian-markdown/LICENSE",
      "skill:obsidian-markdown/SKILL.md",
      "skill:obsidian-markdown/references/CALLOUTS.md",
      "skill:obsidian-markdown/references/EMBEDS.md",
      "skill:obsidian-markdown/references/PROPERTIES.md",
    ] as const

    try {
      for (const [index, skillName] of skillNames.entries()) {
        const sentinel = join(paths.skillsDir, skillName, "user", "nested", `sentinel-${index}.txt`)
        await mkdir(join(sentinel, ".."), { recursive: true })
        await writeFile(sentinel, `sentinel:${skillName}`)
      }

      const optionalRelativePaths = optionalLabels.map((label) => label.slice("skill:".length))
      const optionalPrefixes = skillNames.map((skillName) => `skill:${skillName}/`)
      const hasOptionalLabel = (labels: readonly string[]) =>
        labels.some((label) => optionalPrefixes.some((prefix) => label.startsWith(prefix)))
      const allReportLabels = (report: {
        readonly changed: readonly string[]
        readonly unchanged: readonly string[]
        readonly skipped: readonly string[]
        readonly failed: readonly string[]
      }) => [...report.changed, ...report.unchanged, ...report.skipped, ...report.failed]

      const defaultBefore = await runSetup({
        paths,
        skipEmbed: true,
        withObsidianSkills: false,
        commandRunner: qmdAlreadyConfigured,
      })
      expect(hasOptionalLabel(allReportLabels(defaultBefore))).toBe(false)
      for (const relativePath of optionalRelativePaths) {
        await expect(stat(join(paths.skillsDir, relativePath))).rejects.toThrow()
      }

      const optInFirst = await runSetup({
        paths,
        skipEmbed: true,
        withObsidianSkills: true,
        commandRunner: qmdAlreadyConfigured,
      })
      const optInSnapshot = new Map(
        await Promise.all(
          optionalRelativePaths.map(async (relativePath) => [
            relativePath,
            await readFile(join(paths.skillsDir, relativePath)),
          ] as const),
        ),
      )

      const defaultAfter = await runSetup({
        paths,
        skipEmbed: true,
        withObsidianSkills: false,
        commandRunner: qmdAlreadyConfigured,
      })
      expect(hasOptionalLabel(allReportLabels(defaultAfter))).toBe(false)
      for (const relativePath of optionalRelativePaths) {
        const expected = optInSnapshot.get(relativePath)
        if (expected === undefined) throw new Error(`missing optional snapshot: ${relativePath}`)
        expect(await readFile(join(paths.skillsDir, relativePath))).toEqual(expected)
      }

      const optInSecond = await runSetup({
        paths,
        skipEmbed: true,
        withObsidianSkills: true,
        commandRunner: qmdAlreadyConfigured,
      })

      expect(
        optInFirst.changed
          .filter((label) => optionalLabels.includes(label as typeof optionalLabels[number]))
          .sort(),
      ).toEqual([...optionalLabels])
      expect(
        optInSecond.unchanged
          .filter((label) => optionalLabels.includes(label as typeof optionalLabels[number]))
          .sort(),
      ).toEqual([...optionalLabels])
      expect(hasOptionalLabel(optInSecond.changed)).toBe(false)

      for (const [index, skillName] of skillNames.entries()) {
        const sentinel = join(paths.skillsDir, skillName, "user", "nested", `sentinel-${index}.txt`)
        expect(await readFile(sentinel, "utf8")).toBe(`sentinel:${skillName}`)
      }
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test("Given legacy installed agent wiki assets When setup runs Then it removes them", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-wiki-setup-legacy-"))
    const paths = testPaths(root)
    const legacySkillDir = join(paths.skillsDir, "agent-wiki-memory")
    await mkdir(join(legacySkillDir, "scripts"), { recursive: true })
    await mkdir(join(legacySkillDir, "references"), { recursive: true })
    await mkdir(join(legacySkillDir, "templates"), { recursive: true })
    await mkdir(paths.codexHome, { recursive: true })
    await writeFile(join(legacySkillDir, "scripts/agent-wiki-refresh.sh"), "WIKI_ROOT=\"$HOME/agent-wiki\"\n")
    await writeFile(join(legacySkillDir, "scripts/agent-wiki-log.sh"), "AGENT_WIKI_ROOT=\"$HOME/agent-wiki\"\n")
    await writeFile(join(legacySkillDir, "references/wiki-schema.md"), "Changed files must use absolute paths\n")
    await writeFile(join(legacySkillDir, "templates/session-log.md"), "legacy template\n")
    await writeFile(
      join(paths.codexHome, "AGENTS.md"),
      [
        "Existing instructions",
        "",
        "## Agent Wiki Memory",
        "",
        "Before any non-trivial task, load and follow the `agent-wiki-memory` skill.",
        "",
        "- Check the qmd-backed wiki before planning or editing.",
        "- Use qmd as the required retrieval and indexing layer.",
        "- After meaningful work, record the summary, decisions, verification, and changed files in the wiki log.",
        "- If qmd or the skill is unavailable, state that clearly before proceeding.",
        "",
      ].join("\n"),
    )

    const report = await runSetup({
      paths,
      skipEmbed: true,
      withObsidianSkills: false,
      commandRunner: async (command, args) => qmdAlreadyConfigured(command, args),
    })

    expect(report.failed).toEqual([])
    expect(report.changed).toContain("legacy:agent-wiki-memory/scripts/agent-wiki-refresh.sh")
    await expect(stat(join(legacySkillDir, "scripts/agent-wiki-refresh.sh"))).rejects.toThrow()
    await expect(stat(join(legacySkillDir, "scripts/agent-wiki-log.sh"))).rejects.toThrow()
    await expect(stat(join(legacySkillDir, "references/wiki-schema.md"))).rejects.toThrow()
    await expect(stat(join(legacySkillDir, "templates/session-log.md"))).rejects.toThrow()

    const agents = await readFile(join(paths.codexHome, "AGENTS.md"), "utf8")
    expect(agents).toContain("Existing instructions")
    expect(agents.match(/## Agent Wiki Memory/g)?.length).toBe(1)
    expect(agents).not.toContain("After meaningful work, record the summary")
    expect(agents).toContain("Search project memory first; it is the default workflow.")
  })
})

function testPaths(root: string) {
  return {
    home: root,
    codexHome: join(root, ".codex"),
    agentWikiDir: join(root, "agent-wiki"),
    stateDir: join(root, ".agent-wiki"),
    collectionName: "agent-wiki",
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
