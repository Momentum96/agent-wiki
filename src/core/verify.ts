import { runCommand, type CommandRunner } from "./command"

export type VerifyCheck = {
  readonly id: string
  readonly status: "pass" | "fail"
  readonly detail: string
}

export type VerifyReport = {
  readonly ok: boolean
  readonly checks: readonly VerifyCheck[]
}

const CHECKS = [
  ["qmd-version", ["--version"]],
  ["qmd-collection", ["collection", "show", "agent-wiki"]],
  ["qmd-context", ["context", "list"]],
  ["qmd-update", ["update"]],
  ["qmd-search", ["search", "Agent Wiki Context", "--collection", "agent-wiki", "--format", "files"]],
] as const

export async function runVerify(input: {
  readonly commandRunner?: CommandRunner
}): Promise<VerifyReport> {
  const commandRunner = input.commandRunner ?? runCommand
  const checks: VerifyCheck[] = []

  for (const [id, args] of CHECKS) {
    const result = await commandRunner("qmd", args)
    const contextMissing = id === "qmd-context" && !result.stdout.includes("agent-wiki")
    const failed = result.exitCode !== 0 || contextMissing
    checks.push({
      id,
      status: failed ? "fail" : "pass",
      detail: result.stdout.trim() || result.stderr.trim(),
    })
  }

  return {
    ok: checks.every((check) => check.status === "pass"),
    checks,
  }
}
