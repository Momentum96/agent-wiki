export const EXPECTED_PACKAGE_FILES = [
  "src/cli.ts",
  "src/commands",
  "src/core",
  "templates",
  "docs/guide/installation.md",
  "docs/PROJECT_BRIEF.md",
  "docs/INSTALLER_REQUIREMENTS.md",
  "docs/GENERATED_ASSETS.md",
  "THIRD_PARTY_NOTICES.md",
  "LICENSE",
  "README.md",
  "README.ko.md",
] as const

export const REQUIRED_BASE_TEMPLATE_PATHS = [
  "templates/agents/AGENTS.agent-wiki-block.md",
  "templates/scripts/agent-wiki-log.sh",
  "templates/scripts/agent-wiki-refresh.sh",
  "templates/scripts/agent-wiki-sanitize-log.ts",
  "templates/skills/agent-wiki-memory/SKILL.md",
  "templates/skills/qmd-cli/SKILL.md",
  "templates/wiki/context.md",
  "templates/wiki/session-log.md",
] as const

export const REQUIRED_OBSIDIAN_SKILL_PATHS = [
  "templates/skills/defuddle/LICENSE",
  "templates/skills/defuddle/SKILL.md",
  "templates/skills/json-canvas/LICENSE",
  "templates/skills/json-canvas/SKILL.md",
  "templates/skills/json-canvas/references/EXAMPLES.md",
  "templates/skills/obsidian-bases/LICENSE",
  "templates/skills/obsidian-bases/SKILL.md",
  "templates/skills/obsidian-bases/references/FUNCTIONS_REFERENCE.md",
  "templates/skills/obsidian-cli/LICENSE",
  "templates/skills/obsidian-cli/SKILL.md",
  "templates/skills/obsidian-markdown/LICENSE",
  "templates/skills/obsidian-markdown/SKILL.md",
  "templates/skills/obsidian-markdown/references/CALLOUTS.md",
  "templates/skills/obsidian-markdown/references/EMBEDS.md",
  "templates/skills/obsidian-markdown/references/PROPERTIES.md",
] as const

export const REQUIRED_PUBLIC_DOC_PATHS = [
  "docs/guide/installation.md",
  "docs/PROJECT_BRIEF.md",
  "docs/INSTALLER_REQUIREMENTS.md",
  "docs/GENERATED_ASSETS.md",
] as const

export const REQUIRED_RUNTIME_PATHS = [
  "src/cli.ts",
  "src/commands/doctor.ts",
  "src/commands/paths.ts",
  "src/commands/setup.ts",
  "src/core/codex-config.ts",
  "src/core/command.ts",
  "src/core/file-state.ts",
  "src/core/log-sanitize.ts",
  "src/core/markers.ts",
  "src/core/paths.ts",
  "src/core/platform.ts",
  "src/core/prerequisites.ts",
  "src/core/qmd-setup.ts",
  "src/core/report.ts",
  "src/core/result.ts",
  "src/core/setup-files.ts",
  "src/core/setup-report.ts",
  "src/core/setup.ts",
  "src/core/templates.ts",
  "src/core/verify.ts",
] as const

const OBSIDIAN_SKILL_PREFIXES = [
  "templates/skills/defuddle/",
  "templates/skills/json-canvas/",
  "templates/skills/obsidian-bases/",
  "templates/skills/obsidian-cli/",
  "templates/skills/obsidian-markdown/",
] as const

export function packageFileAllowListProblems(files: unknown): string[] {
  if (!Array.isArray(files) || files.some((value) => typeof value !== "string")) {
    return ["package.json files must be an array of strings"]
  }

  const actual = files as string[]
  const problems: string[] = []
  const duplicates = duplicateValues(actual)
  if (duplicates.length > 0) problems.push(`duplicate package allow-list entries: ${duplicates.join(", ")}`)
  if (actual.includes("docs") || actual.includes("docs/")) {
    problems.push('broad "docs" package allow-list entry is forbidden')
  }

  const missing = EXPECTED_PACKAGE_FILES.filter((path) => !actual.includes(path))
  const unexpected = actual.filter(
    (path) => !EXPECTED_PACKAGE_FILES.includes(path as (typeof EXPECTED_PACKAGE_FILES)[number]),
  )
  if (missing.length > 0) problems.push(`missing package allow-list entries: ${missing.join(", ")}`)
  if (unexpected.length > 0) problems.push(`unexpected package allow-list entries: ${unexpected.join(", ")}`)

  return problems
}

export function parseNpmPackFilePaths(stdout: string): string[] {
  const parsed: unknown = JSON.parse(stdout)
  if (!Array.isArray(parsed) || parsed.length !== 1) {
    throw new Error("npm pack JSON must contain exactly one package result")
  }

  const result = parsed[0]
  if (!isRecord(result) || !Array.isArray(result["files"])) {
    throw new Error("npm pack JSON result must contain a files array")
  }

  const paths = result["files"].map((file) => {
    if (!isRecord(file) || typeof file["path"] !== "string" || file["path"].length === 0) {
      throw new Error("every npm pack file entry must contain a non-empty path")
    }
    return file["path"]
  })
  const duplicates = duplicateValues(paths)
  if (duplicates.length > 0) throw new Error(`npm pack JSON contains duplicate paths: ${duplicates.join(", ")}`)
  return paths
}

export function packedFileProblems(paths: readonly string[]): string[] {
  const problems: string[] = []
  const requiredPaths = [
    ...REQUIRED_BASE_TEMPLATE_PATHS,
    ...REQUIRED_OBSIDIAN_SKILL_PATHS,
    ...REQUIRED_PUBLIC_DOC_PATHS,
    ...REQUIRED_RUNTIME_PATHS,
    "THIRD_PARTY_NOTICES.md",
  ]
  const missing = requiredPaths.filter((path) => !paths.includes(path))
  if (missing.length > 0) problems.push(`missing packed files: ${missing.join(", ")}`)

  const forbidden = paths.filter((path) => path.startsWith("docs/agent-wiki/") || path.startsWith(".omo/"))
  if (forbidden.length > 0) problems.push(`forbidden packed files: ${forbidden.join(", ")}`)

  const expectedObsidianPaths = new Set<string>(REQUIRED_OBSIDIAN_SKILL_PATHS)
  const actualObsidianPaths = paths.filter((path) =>
    OBSIDIAN_SKILL_PREFIXES.some((prefix) => path.startsWith(prefix)),
  )
  const unexpectedObsidianPaths = actualObsidianPaths.filter((path) => !expectedObsidianPaths.has(path))
  if (unexpectedObsidianPaths.length > 0) {
    problems.push(`unexpected vendored skill files: ${unexpectedObsidianPaths.join(", ")}`)
  }

  return problems
}

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates].sort()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
