import { resolveCurrentPaths, type ResolvedPaths } from "../core/paths"
import { printJson } from "../core/report"

export function handlePaths(args: readonly string[]): number {
  const result = resolveCurrentPaths()
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
  console.log(`Templates: ${paths.templateDir}`)
  console.log(`Skills: ${paths.skillsDir}`)
  console.log(`Platform: ${paths.platform.kind}`)
}
