import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { applyManagedBlock } from "./markers"
import type { ResolvedPaths } from "./paths"
import type { MutableSetupReport } from "./setup-report"
import { backupIfExists, writeIfChanged } from "./file-state"

const QMD_SECTION = "[mcp_servers.qmd]"

export async function installCodexFiles(input: {
  readonly paths: ResolvedPaths
  readonly qmdCommand: string
  readonly stamp: string
  readonly report: MutableSetupReport
}): Promise<void> {
  await installConfig(input)
  await installAgents(input)
}

export function mergeQmdMcpConfig(content: string, qmdCommand: string): string {
  const section = [
    QMD_SECTION,
    `command = "${escapeTomlString(qmdCommand)}"`,
    'args = ["mcp"]',
    "enabled = true",
    "startup_timeout_sec = 15",
  ].join("\n")
  const block = `${section}\n`
  const lines = content.split("\n")
  const start = lines.findIndex((line) => line.trim() === QMD_SECTION)
  if (start === -1) return appendBlock(content, block)

  const end = findNextSection(lines, start + 1)
  const before = lines.slice(0, start).join("\n")
  const after = lines.slice(end).join("\n")
  const prefix = before.length === 0 ? "" : `${before}\n`
  const suffix = after.length === 0 ? "" : `\n${trimTrailingNewlines(after)}\n`
  return `${prefix}${block}${suffix}`
}

async function installConfig(input: {
  readonly paths: ResolvedPaths
  readonly qmdCommand: string
  readonly stamp: string
  readonly report: MutableSetupReport
}): Promise<void> {
  const path = join(input.paths.codexHome, "config.toml")
  const existing = await readText(path)
  const next = mergeQmdMcpConfig(existing, input.qmdCommand)
  if (existing !== next) {
    const backup = await backupIfExists(path, input.stamp)
    if (backup !== undefined) input.report.backups.push(backup)
  }
  const status = await writeIfChanged(path, next)
  input.report[status].push("codex:config.toml")
}

async function installAgents(input: {
  readonly paths: ResolvedPaths
  readonly stamp: string
  readonly report: MutableSetupReport
}): Promise<void> {
  const path = join(input.paths.codexHome, "AGENTS.md")
  const block = await readFile(join(input.paths.templateDir, "agents/AGENTS.agent-wiki-block.md"), "utf8")
  const existing = await readText(path)
  const next = applyManagedBlock(existing, block)
  if (!next.ok) {
    input.report.failed.push(`codex:AGENTS.md:${next.error.message}`)
    return
  }
  if (existing !== next.value) {
    const backup = await backupIfExists(path, input.stamp)
    if (backup !== undefined) input.report.backups.push(backup)
  }
  const status = await writeIfChanged(path, next.value)
  input.report[status].push("codex:AGENTS.md")
}

async function readText(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8")
  } catch (error) {
    if (error instanceof Error) return ""
    throw error
  }
}

function appendBlock(content: string, block: string): string {
  if (content.length === 0) return block
  return `${trimTrailingNewlines(content)}\n\n${block}`
}

function findNextSection(lines: readonly string[], start: number): number {
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index]
    if (line !== undefined && /^\s*\[[^\]]+\]\s*$/.test(line)) return index
  }
  return lines.length
}

function trimTrailingNewlines(value: string): string {
  return value.replace(/\n+$/u, "")
}

function escapeTomlString(value: string): string {
  return value.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"')
}
