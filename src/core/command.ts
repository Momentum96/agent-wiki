export type CommandResult = {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

export type CommandRunner = (command: string, args: readonly string[]) => Promise<CommandResult>

export const runCommand: CommandRunner = async (command, args) => {
  let proc: Bun.Subprocess<"ignore", "pipe", "pipe">
  try {
    proc = Bun.spawn({
      cmd: [command, ...args],
      stdout: "pipe",
      stderr: "pipe",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : `Failed to spawn ${command}`
    return { exitCode: 127, stdout: "", stderr: message }
  }

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])

  return { exitCode, stdout, stderr }
}
