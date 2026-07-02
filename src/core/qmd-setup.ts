import type { CommandRunner } from "./command"
import type { ResolvedPaths } from "./paths"
import type { MutableSetupReport } from "./setup-report"

const CONTEXT_TEXT =
  "Shared agent wiki for Codex and OpenCode. Stores structured work summaries, decisions, project notes, changed-file manifests, and qmd-searchable memory context. Raw transcripts are excluded."
const PROJECT_CONTEXT_TEXT =
  "Shared project agent wiki for coding agents. Stores repo-local summaries, decisions, verification notes, and changed-file manifests. Use repo-relative paths for shareable project facts."

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
    await runOptional(input.commandRunner, ["embed", "-c", input.paths.collectionName], "qmd:embed", input.report)
  }
  await runRequired(
    input.commandRunner,
    ["search", "Agent Wiki Context", "--collection", input.paths.collectionName, "--format", "files"],
    "qmd:search",
    input.report,
  )
}

async function ensureCollection(input: {
  readonly paths: ResolvedPaths
  readonly commandRunner: CommandRunner
  readonly report: MutableSetupReport
}): Promise<void> {
  const show = await input.commandRunner("qmd", ["collection", "show", input.paths.collectionName])
  if (show.exitCode === 0) {
    input.report.unchanged.push("qmd:collection")
    return
  }
  await runRequired(
    input.commandRunner,
    ["collection", "add", input.paths.agentWikiDir, "--name", input.paths.collectionName, "--mask", "**/*.md"],
    "qmd:collection",
    input.report,
  )
}

async function ensureContext(input: {
  readonly paths: ResolvedPaths
  readonly commandRunner: CommandRunner
  readonly report: MutableSetupReport
}): Promise<void> {
  const list = await input.commandRunner("qmd", ["context", "list"])
  if (list.exitCode === 0 && hasExactContext(list.stdout, input.paths.collectionName)) {
    input.report.unchanged.push("qmd:context")
    return
  }
  await runRequired(
    input.commandRunner,
    ["context", "add", `qmd://${input.paths.collectionName}`, contextText(input.paths.collectionName)],
    "qmd:context",
    input.report,
  )
}

function contextText(collectionName: string): string {
  return collectionName === "agent-wiki" ? CONTEXT_TEXT : PROJECT_CONTEXT_TEXT
}

function hasExactContext(output: string, collectionName: string): boolean {
  return output
    .split(/\r?\n/u)
    .some((line) => line.trim() === collectionName)
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
