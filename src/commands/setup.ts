import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createInterface } from "node:readline/promises"

import { runCommand, type CommandRunner } from "../core/command"
import type { PlatformInfo } from "../core/platform"
import { resolveCurrentPaths } from "../core/paths"
import {
  checkInstallablePrerequisites,
  installSelectedPrerequisites,
  missingInstallCandidates,
  type InstallCandidate,
  type InstallDecision,
  type PrerequisiteInstallResult,
} from "../core/prerequisites"
import { printJson } from "../core/report"
import { copyTemplatesDryRun } from "../core/templates"

export async function handleSetup(args: readonly string[]): Promise<number> {
  const json = args.includes("--json")
  const dryRun = args.includes("--dry-run")
  const installPrereqs = args.includes("--install-prereqs")
  if (!dryRun && !installPrereqs) {
    const message = "setup without --dry-run is not implemented in this milestone."
    if (json) printJson({ error: message })
    else console.error(message)
    return 1
  }

  const paths = resolveCurrentPaths()
  if (!paths.ok) {
    if (json) printJson({ error: paths.error.message })
    else console.error(paths.error.message)
    return 1
  }

  let prerequisiteResult: PrerequisiteInstallResult | undefined
  if (installPrereqs) {
    prerequisiteResult = await runPrerequisiteInstall({
      platform: paths.value.platform,
      json,
      yes: args.includes("--yes"),
      noInstall: args.includes("--no-install"),
      commandRunner: runCommand,
    })

    if (!dryRun) {
      if (json) printJson(prerequisiteResult)
      else printPrerequisiteResult(prerequisiteResult)
      return prerequisiteResult.failed.length === 0 && prerequisiteResult.skipped.length === 0 ? 0 : 1
    }

    if (prerequisiteResult.failed.length > 0 || prerequisiteResult.skipped.length > 0) {
      if (json) printJson({ prerequisites: prerequisiteResult })
      else printPrerequisiteResult(prerequisiteResult)
      return 1
    }
  }

  const target = await targetDirectory(args)
  const result = await copyTemplatesDryRun({
    templateDir: paths.value.templateDir,
    targetDir: target,
  })

  if (!result.ok) {
    if (json) printJson({ error: result.error.message })
    else console.error(result.error.message)
    return 1
  }

  if (json) printJson({ ...result.value, prerequisites: prerequisiteResult })
  else {
    if (prerequisiteResult !== undefined) printPrerequisiteResult(prerequisiteResult)
    console.log(`Dry-run target: ${result.value.targetDir}`)
    console.log(`Changed: ${result.value.changed.length}`)
  }
  return 0
}

export async function runPrerequisiteInstall(input: {
  readonly platform: PlatformInfo
  readonly json: boolean
  readonly yes: boolean
  readonly noInstall: boolean
  readonly commandRunner: CommandRunner
  readonly confirm?: (candidate: InstallCandidate) => Promise<boolean>
}): Promise<PrerequisiteInstallResult> {
  const checks = await checkInstallablePrerequisites(input.platform, input.commandRunner)
  const candidates = missingInstallCandidates(checks)
  const decisions: InstallDecision[] = []

  for (const candidate of candidates) {
    if (input.noInstall) {
      decisions.push({ id: candidate.id, install: false })
    } else if (input.yes) {
      decisions.push({ id: candidate.id, install: true })
    } else if (input.json) {
      decisions.push({ id: candidate.id, install: false })
    } else {
      const install = input.confirm === undefined ? await confirmInstall(candidate) : await input.confirm(candidate)
      decisions.push({ id: candidate.id, install })
    }
  }

  return installSelectedPrerequisites({
    candidates,
    decisions,
    commandRunner: input.commandRunner,
  })
}

async function confirmInstall(candidate: InstallCandidate): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const command = [candidate.command, ...candidate.args].join(" ")
    const answer = await rl.question(`Install ${candidate.label} with '${command}'? [y/N] `)
    return answer.trim().toLowerCase() === "y"
  } finally {
    rl.close()
  }
}

function printPrerequisiteResult(result: PrerequisiteInstallResult): void {
  if (result.planned.length === 0) {
    console.log("qmd and SQLite are available.")
    return
  }

  for (const candidate of result.planned) {
    const command = [candidate.command, ...candidate.args].join(" ")
    console.log(`Missing ${candidate.label}: ${command}`)
  }
  for (const candidate of result.installed) {
    console.log(`Installed ${candidate.label}.`)
  }
  for (const candidate of result.skipped) {
    console.log(`Skipped ${candidate.label}.`)
  }
  for (const item of result.failed) {
    console.log(`Failed ${item.candidate.label}: ${item.detail}`)
  }
}

async function targetDirectory(args: readonly string[]): Promise<string> {
  const targetFlag = args.indexOf("--target")
  const target = targetFlag >= 0 ? args[targetFlag + 1] : undefined
  if (target !== undefined && target.length > 0) return target
  return mkdtemp(join(tmpdir(), "agent-wiki-setup-"))
}
