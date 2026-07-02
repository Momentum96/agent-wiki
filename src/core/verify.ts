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

type QmdCheckCommand = readonly [string, readonly string[]]

export async function runVerify(input: {
  readonly collectionName?: string
  readonly commandRunner?: CommandRunner
}): Promise<VerifyReport> {
  const commandRunner = input.commandRunner ?? runCommand
  const collectionName = input.collectionName ?? "agent-wiki"
  const checks: VerifyCheck[] = []

  for (const [id, args] of checksFor(collectionName)) {
    const result = await commandRunner("qmd", args)
    const contextMissing = id === "qmd-context" && !hasExactContext(result.stdout, collectionName)
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

function hasExactContext(output: string, collectionName: string): boolean {
  return output
    .split(/\r?\n/u)
    .some((line) => line.trim() === collectionName)
}

function checksFor(collectionName: string): readonly QmdCheckCommand[] {
  return [
    ["qmd-version", ["--version"]],
    ["qmd-collection", ["collection", "show", collectionName]],
    ["qmd-context", ["context", "list"]],
    ["qmd-update", ["update"]],
    ["qmd-search", ["search", "Agent Wiki Context", "--collection", collectionName, "--format", "files"]],
  ] as const
}
