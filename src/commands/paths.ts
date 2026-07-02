import { platform, release } from "node:os"

import { resolveCurrentPaths, resolvePaths, type ResolvedPaths } from "../core/paths"
import { printJson } from "../core/report"

export function handlePaths(args: readonly string[]): number {
  const result = args.includes("--project") || args.includes("--global") || args.includes("--collection")
    ? resolvePaths({
        env: {
          ...process.env,
          AGENT_WIKI_SCOPE: scopeFromArgs(args),
          AGENT_WIKI_COLLECTION: valueAfter(args, "--collection") ?? process.env["AGENT_WIKI_COLLECTION"],
        },
        platform: { os: platform(), release: release() },
        cwd: process.cwd(),
      })
    : resolveCurrentPaths()
  if (!result.ok) {
    console.error(result.error.message)
    return 1
  }

  if (args.includes("--json")) {
    printJson(result.value)
    return 0
  }

  printPaths(result.value)
  return 0
}

function printPaths(paths: ResolvedPaths): void {
  console.log(`HOME: ${paths.home}`)
  console.log(`CODEX_HOME: ${paths.codexHome}`)
  console.log(`AGENT_WIKI_DIR: ${paths.agentWikiDir}`)
  console.log(`AGENT_WIKI_STATE_DIR: ${paths.stateDir}`)
  console.log(`AGENT_WIKI_COLLECTION: ${paths.collectionName}`)
  console.log(`Templates: ${paths.templateDir}`)
  console.log(`Skills: ${paths.skillsDir}`)
  console.log(`Platform: ${paths.platform.kind}`)
}

function scopeFromArgs(args: readonly string[]): string | undefined {
  if (args.includes("--global")) return "global"
  if (args.includes("--project")) return "project"
  return process.env["AGENT_WIKI_SCOPE"]
}

function valueAfter(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag)
  if (index < 0) return undefined
  const value = args[index + 1]
  if (value === undefined || value.length === 0) return undefined
  return value
}
