import { access } from "node:fs/promises"
import { join } from "node:path"

import { runCommand, type CommandRunner } from "../core/command"
import type { ResolvedPaths } from "../core/paths"
import {
  checkInstallablePrerequisites,
  type InstallCandidate,
  type PrerequisiteCheck,
} from "../core/prerequisites"

export type CheckStatus = "pass" | "fail" | "skip"

export type DoctorCheck = {
  readonly id: string
  readonly label: string
  readonly status: CheckStatus
  readonly detail: string
  readonly installCandidate?: InstallCandidate
}

export type DoctorReport = {
  readonly checks: readonly DoctorCheck[]
  readonly summary: {
    readonly passed: number
    readonly failed: number
    readonly skipped: number
  }
}

export type DoctorInput = {
  readonly paths: ResolvedPaths
  readonly commandRunner: CommandRunner
  readonly fileExists: (path: string) => Promise<boolean>
  readonly versions: {
    readonly bun: string
    readonly node: string
  }
}

export async function runDoctor(input: DoctorInput): Promise<DoctorReport> {
  const checks: DoctorCheck[] = []

  checks.push(checkVersion("bun-version", "Bun version", input.versions.bun, 1))
  checks.push(checkVersion("node-version", "Node.js version", input.versions.node, 22))
  const prerequisiteChecks = await checkInstallablePrerequisites(input.paths.platform, input.commandRunner)
  checks.push(...prerequisiteChecks.map(toDoctorCheck))
  checks.push(await checkFile("codex-home", "Codex home", input.paths.codexHome, input.fileExists))
  checks.push(
    await checkFile(
      "codex-config",
      "Codex config.toml",
      join(input.paths.codexHome, "config.toml"),
      input.fileExists,
    ),
  )
  checks.push(
    await checkFile(
      "codex-agents",
      "Codex AGENTS.md",
      join(input.paths.codexHome, "AGENTS.md"),
      input.fileExists,
    ),
  )

  return { checks, summary: summarize(checks) }
}

export async function runCurrentDoctor(paths: ResolvedPaths): Promise<DoctorReport> {
  return runDoctor({
    paths,
    commandRunner: runCommand,
    fileExists: pathExists,
    versions: { bun: Bun.version, node: process.version },
  })
}

function toDoctorCheck(check: PrerequisiteCheck): DoctorCheck {
  const base = {
    id: `${check.id}-version`,
    label: `${check.label} version`,
    status: check.available ? "pass" : "fail",
    detail: check.detail,
  } satisfies DoctorCheck

  if (check.available) return base

  return {
    ...base,
    installCandidate: check.installCandidate,
  }
}

function checkVersion(id: string, label: string, value: string, minimumMajor: number): DoctorCheck {
  const major = Number.parseInt(value.replace(/^v/, "").split(".")[0] ?? "", 10)
  if (Number.isNaN(major)) {
    return { id, label, status: "skip", detail: `Could not parse version ${value}` }
  }
  if (major >= minimumMajor) {
    return { id, label, status: "pass", detail: value }
  }
  return { id, label, status: "fail", detail: `${value} is below required major ${minimumMajor}` }
}

async function checkFile(
  id: string,
  label: string,
  path: string,
  fileExists: (path: string) => Promise<boolean>,
): Promise<DoctorCheck> {
  const exists = await fileExists(path)
  return {
    id,
    label,
    status: exists ? "pass" : "skip",
    detail: path,
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch (error) {
    if (error instanceof Error) return false
    throw error
  }
}

function summarize(checks: readonly DoctorCheck[]): DoctorReport["summary"] {
  return {
    passed: checks.filter((check) => check.status === "pass").length,
    failed: checks.filter((check) => check.status === "fail").length,
    skipped: checks.filter((check) => check.status === "skip").length,
  }
}
