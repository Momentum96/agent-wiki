import type { CommandRunner } from "./command"
import type { PlatformInfo } from "./platform"

export type InstallablePrerequisiteId = "qmd" | "sqlite"

export type InstallCandidate = {
  readonly id: InstallablePrerequisiteId
  readonly label: string
  readonly command: string
  readonly args: readonly string[]
  readonly manager: "bun" | "brew" | "apt" | "winget"
  readonly note: string
}

export type PrerequisiteCheck = {
  readonly id: InstallablePrerequisiteId
  readonly label: string
  readonly available: boolean
  readonly detail: string
  readonly installCandidate: InstallCandidate
}

export type InstallDecision = {
  readonly id: InstallablePrerequisiteId
  readonly install: boolean
}

export type PrerequisiteInstallResult = {
  readonly planned: readonly InstallCandidate[]
  readonly installed: readonly InstallCandidate[]
  readonly skipped: readonly InstallCandidate[]
  readonly failed: readonly {
    readonly candidate: InstallCandidate
    readonly detail: string
  }[]
}

export async function checkInstallablePrerequisites(
  platform: PlatformInfo,
  commandRunner: CommandRunner,
): Promise<readonly PrerequisiteCheck[]> {
  const [qmd, sqlite] = await Promise.all([
    checkCommand("qmd", "qmd", ["qmd", "--version"], platform, commandRunner),
    checkCommand("sqlite", "SQLite", ["sqlite3", "--version"], platform, commandRunner),
  ])
  return [qmd, sqlite]
}

export function missingInstallCandidates(
  checks: readonly PrerequisiteCheck[],
): readonly InstallCandidate[] {
  return checks.filter((check) => !check.available).map((check) => check.installCandidate)
}

export async function installSelectedPrerequisites(input: {
  readonly candidates: readonly InstallCandidate[]
  readonly decisions: readonly InstallDecision[]
  readonly commandRunner: CommandRunner
}): Promise<PrerequisiteInstallResult> {
  const installed: InstallCandidate[] = []
  const skipped: InstallCandidate[] = []
  const failed: {
    readonly candidate: InstallCandidate
    readonly detail: string
  }[] = []

  for (const candidate of input.candidates) {
    const decision = input.decisions.find((item) => item.id === candidate.id)
    if (decision?.install !== true) {
      skipped.push(candidate)
      continue
    }

    const result = await input.commandRunner(candidate.command, candidate.args)
    if (result.exitCode === 0) {
      installed.push(candidate)
    } else {
      failed.push({
        candidate,
        detail: result.stderr.trim() || result.stdout.trim() || `${candidate.command} failed`,
      })
    }
  }

  return {
    planned: input.candidates,
    installed,
    skipped,
    failed,
  }
}

export function installCandidateFor(
  id: InstallablePrerequisiteId,
  platform: PlatformInfo,
): InstallCandidate {
  if (id === "qmd") {
    return {
      id,
      label: "qmd CLI",
      command: "bun",
      args: ["install", "--global", "qmd"],
      manager: "bun",
      note: "qmd is the required retrieval and indexing CLI.",
    }
  }

  if (platform.kind === "darwin") {
    return {
      id,
      label: "SQLite",
      command: "brew",
      args: ["install", "sqlite"],
      manager: "brew",
      note: "SQLite is required by qmd indexes.",
    }
  }

  if (platform.kind === "windows") {
    return {
      id,
      label: "SQLite",
      command: "winget",
      args: ["install", "SQLite.SQLite"],
      manager: "winget",
      note: "SQLite is required by qmd indexes.",
    }
  }

  return {
    id,
    label: "SQLite",
    command: "sudo",
    args: ["apt", "install", "sqlite3", "libsqlite3-dev"],
    manager: "apt",
    note: "SQLite is required by qmd indexes.",
  }
}

async function checkCommand(
  id: InstallablePrerequisiteId,
  label: string,
  args: readonly string[],
  platform: PlatformInfo,
  commandRunner: CommandRunner,
): Promise<PrerequisiteCheck> {
  const [command, ...commandArgs] = args
  if (command === undefined) {
    throw new Error(`Missing command for prerequisite ${id}`)
  }

  const result = await commandRunner(command, commandArgs)
  return {
    id,
    label,
    available: result.exitCode === 0,
    detail: result.exitCode === 0 ? result.stdout.trim() : result.stderr.trim() || `${command} not found`,
    installCandidate: installCandidateFor(id, platform),
  }
}
