import { execFileSync } from "node:child_process"
import { basename, join } from "node:path"
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
  readonly collectionName: string
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

  const scope = input.env["AGENT_WIKI_SCOPE"] === "global" ? "global" : "project"
  const projectRoot = scope === "project" ? resolveProjectRoot(input) : input.cwd
  const projectCollectionName = `agent-wiki-${slugify(basename(projectRoot))}`
  const collectionName = nonEmptyOrDefault(
    input.env["AGENT_WIKI_COLLECTION"],
    scope === "project" ? projectCollectionName : "agent-wiki",
  )
  const codexHome = nonEmptyOrDefault(input.env["CODEX_HOME"], join(home, ".codex"))
  const agentWikiDir = nonEmptyOrDefault(
    input.env["AGENT_WIKI_DIR"],
    scope === "project" ? join(projectRoot, "docs", "agent-wiki") : join(home, "agent-wiki"),
  )
  const stateDir = nonEmptyOrDefault(
    input.env["AGENT_WIKI_STATE_DIR"],
    scope === "project" ? join(projectRoot, ".agent-wiki", "local") : join(home, ".agent-wiki"),
  )
  const templateDir = nonEmptyOrDefault(
    input.env["AGENT_WIKI_TEMPLATE_DIR"],
    packagedTemplateDir(),
  )

  return ok({
    home,
    codexHome,
    agentWikiDir,
    stateDir,
    collectionName,
    templateDir,
    skillsDir: join(codexHome, "skills"),
    platform: detectPlatform(input.platform),
  })
}

function resolveProjectRoot(input: ResolvePathsInput): string {
  const explicit = input.env["AGENT_WIKI_PROJECT_ROOT"]
  if (explicit !== undefined && explicit.length > 0) return explicit

  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: input.cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return input.cwd
  }
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

function packagedTemplateDir(): string {
  return join(import.meta.dir, "..", "..", "templates")
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "")
  return slug.length > 0 ? slug : "project"
}
