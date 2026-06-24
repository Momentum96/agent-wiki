import type { CommandRunner } from "./command"
import type { ResolvedPaths } from "./paths"
import type { MutableSetupReport } from "./setup-report"

const CONTEXT_TEXT =
  "Shared agent wiki for Codex and OpenCode. Stores structured work summaries, decisions, project notes, changed-file manifests, and qmd-searchable memory context. Raw transcripts are excluded."

export async function resolveQmdCommand(commandRunner: CommandRunner): Promise<string> {
  const result = await commandRunner("which", ["qmd"])
  if (result.exitCode === 0 && result.stdout.trim().length > 0) return result.stdout.trim()
  return "qmd"
}

export async function configureQmd(input: {
  readonly paths: ResolvedPaths
  readonly skipEmbed: boolean
  readonly commandRunner: CommandRunner
  readonly report: MutableSetupReport
}): Promise<void> {
  await ensureCollection(input)
  await ensureContext(input)
  await runRequired(input.commandRunner, ["update"], "qmd:update", input.report)
  if (input.skipEmbed) {
    input.report.skipped.push("qmd:embed")
  } else {
    await runOptional(input.commandRunner, ["embed", "-c", "agent-wiki"], "qmd:embed", input.report)
  }
  await runRequired(
    input.commandRunner,
    ["search", "Agent Wiki Context", "--collection", "agent-wiki", "--format", "files"],
    "qmd:search",
    input.report,
  )
}

async function ensureCollection(input: {
  readonly paths: ResolvedPaths
  readonly commandRunner: CommandRunner
  readonly report: MutableSetupReport
}): Promise<void> {
  const show = await input.commandRunner("qmd", ["collection", "show", "agent-wiki"])
  if (show.exitCode === 0) {
    input.report.unchanged.push("qmd:collection")
    return
  }
  await runRequired(
    input.commandRunner,
    ["collection", "add", input.paths.agentWikiDir, "--name", "agent-wiki", "--mask", "**/*.md"],
    "qmd:collection",
    input.report,
  )
}

async function ensureContext(input: {
  readonly commandRunner: CommandRunner
  readonly report: MutableSetupReport
}): Promise<void> {
  const list = await input.commandRunner("qmd", ["context", "list"])
  if (list.exitCode === 0 && list.stdout.includes("agent-wiki")) {
    input.report.unchanged.push("qmd:context")
    return
  }
  await runRequired(
    input.commandRunner,
    ["context", "add", "qmd://agent-wiki", CONTEXT_TEXT],
    "qmd:context",
    input.report,
  )
}

async function runRequired(
  commandRunner: CommandRunner,
  args: readonly string[],
  label: string,
  report: MutableSetupReport,
): Promise<void> {
  const result = await commandRunner("qmd", args)
  if (result.exitCode === 0) {
    report.changed.push(label)
  } else {
    report.failed.push(`${label}:${result.stderr.trim() || result.stdout.trim()}`)
  }
}

async function runOptional(
  commandRunner: CommandRunner,
  args: readonly string[],
  label: string,
  report: MutableSetupReport,
): Promise<void> {
  const result = await commandRunner("qmd", args)
  if (result.exitCode === 0) {
    report.changed.push(label)
  } else {
    report.skipped.push(`${label}:degraded`)
  }
}
