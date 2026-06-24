#!/usr/bin/env bun
import { runCurrentDoctor } from "./commands/doctor"
import { handlePaths } from "./commands/paths"
import { handleSetup } from "./commands/setup"
import { resolveCurrentPaths } from "./core/paths"
import { printJson } from "./core/report"

const USAGE = `Usage: agent-wiki <command> [options]

Commands:
  paths [--json]
  doctor [--json]
  setup --dry-run [--target <dir>] [--json]
  setup --install-prereqs [--yes|--no-install] [--json]
  verify
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
      console.error("verify is reserved for a later milestone.")
      return 1
    default:
      console.error(`Unknown command: ${command}`)
      console.error(USAGE)
      return 1
  }
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

if (import.meta.main) {
  const exitCode = await main(Bun.argv.slice(2))
  process.exit(exitCode)
}
