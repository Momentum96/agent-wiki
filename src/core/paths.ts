import { join } from "node:path"
import { release, platform } from "node:os"

import { err, ok, type Result } from "./result"
import { detectPlatform, type PlatformInfo, type PlatformInput } from "./platform"

export type PathResolutionError = {
  readonly kind: "missing_home"
  readonly message: string
}

export type ResolvedPaths = {
  readonly home: string
  readonly codexHome: string
  readonly agentWikiDir: string
  readonly stateDir: string
  readonly templateDir: string
  readonly skillsDir: string
  readonly platform: PlatformInfo
}

export type ResolvePathsInput = {
  readonly env: Readonly<Record<string, string | undefined>>
  readonly platform: PlatformInput
  readonly cwd: string
}

export function resolvePaths(input: ResolvePathsInput): Result<ResolvedPaths, PathResolutionError> {
  const home = input.env["HOME"]
  if (home === undefined || home.length === 0) {
    return err({ kind: "missing_home", message: "HOME is required to resolve agent-wiki paths." })
  }

  const codexHome = nonEmptyOrDefault(input.env["CODEX_HOME"], join(home, ".codex"))
  const agentWikiDir = nonEmptyOrDefault(input.env["AGENT_WIKI_DIR"], join(home, "agent-wiki"))
  const stateDir = nonEmptyOrDefault(input.env["AGENT_WIKI_STATE_DIR"], join(home, ".agent-wiki"))

  return ok({
    home,
    codexHome,
    agentWikiDir,
    stateDir,
    templateDir: join(input.cwd, "templates"),
    skillsDir: join(codexHome, "skills"),
    platform: detectPlatform(input.platform),
  })
}

export function resolveCurrentPaths(): Result<ResolvedPaths, PathResolutionError> {
  return resolvePaths({
    env: process.env,
    platform: { os: platform(), release: release() },
    cwd: process.cwd(),
  })
}

function nonEmptyOrDefault(value: string | undefined, fallback: string): string {
  if (value === undefined || value.length === 0) return fallback
  return value
}
