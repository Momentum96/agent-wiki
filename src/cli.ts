#!/usr/bin/env bun
import { platform, release } from "node:os"

import { runCurrentDoctor } from "./commands/doctor"
import { handlePaths } from "./commands/paths"
import { handleSetup } from "./commands/setup"
import { runVerify } from "./core/verify"
import { resolveCurrentPaths, resolvePaths } from "./core/paths"
import { printJson } from "./core/report"

const USAGE = `Usage: agent-wiki <command> [options]

Commands:
  paths [--project|--global] [--collection <name>] [--json]
  doctor [--json]
  setup --dry-run [--target <dir>] [--with-obsidian-skills] [--json]
  setup [--project|--global] [--collection <name>] [--wiki-dir <dir>] [--codex-home <dir>] [--with-obsidian-skills] [--skip-embed] [--json]
  setup --install-prereqs [--yes|--no-install] [--dry-run] [--json]
  verify [--project|--global] [--collection <name>] [--json]
`

export async function main(args: readonly string[]): Promise<number> {
  const command = args[0]
  const rest = args.slice(1)

  if (command === undefined || command === "--help" || command === "-h") {
    console.log(USAGE)
    return 0
  }

  switch (command) {
    case "paths":
      return handlePaths(rest)
    case "doctor":
      return handleDoctor(rest)
    case "setup":
      return handleSetup(rest)
    case "verify":
      return handleVerify(rest)
    default:
      console.error(`Unknown command: ${command}`)
      console.error(USAGE)
      return 1
  }
}

async function handleVerify(args: readonly string[]): Promise<number> {
  const json = args.includes("--json")
  const paths = resolveVerifyPaths(args)
  if (!paths.ok) {
    if (json) printJson({ error: paths.error.message })
    else console.error(paths.error.message)
    return 1
  }
  const report = await runVerify({ collectionName: paths.value.collectionName })
  if (json) printJson(report)
  else {
    for (const check of report.checks) {
      console.log(`${check.status.toUpperCase()} ${check.id}: ${check.detail}`)
    }
  }
  return report.ok ? 0 : 1
}

function resolveVerifyPaths(args: readonly string[]) {
  if (!args.includes("--project") && !args.includes("--global") && !args.includes("--collection")) return resolveCurrentPaths()
  const collectionName = valueAfter(args, "--collection")
  return resolvePaths({
    env: {
      ...process.env,
      AGENT_WIKI_SCOPE: scopeFromArgs(args),
      AGENT_WIKI_COLLECTION: collectionName ?? process.env["AGENT_WIKI_COLLECTION"],
    },
    platform: { os: platform(), release: release() },
    cwd: process.cwd(),
  })
}

function scopeFromArgs(args: readonly string[]): string | undefined {
  if (args.includes("--global")) return "global"
  if (args.includes("--project")) return "project"
  return process.env["AGENT_WIKI_SCOPE"]
}

async function handleDoctor(args: readonly string[]): Promise<number> {
  const json = args.includes("--json")
  const paths = resolveCurrentPaths()
  if (!paths.ok) {
    if (json) printJson({ error: paths.error.message })
    else console.error(paths.error.message)
    return 1
  }

  const report = await runCurrentDoctor(paths.value)
  if (json) printJson(report)
  else {
    for (const check of report.checks) {
      console.log(`${check.status.toUpperCase()} ${check.label}: ${check.detail}`)
    }
  }
  return 0
}

function valueAfter(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag)
  if (index < 0) return undefined
  const value = args[index + 1]
  if (value === undefined || value.length === 0) return undefined
  return value
}

if (import.meta.main) {
  const exitCode = await main(Bun.argv.slice(2))
  process.exit(exitCode)
}
