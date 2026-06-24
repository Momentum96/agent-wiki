import { runCommand, type CommandRunner } from "./command"
import { installCodexFiles } from "./codex-config"
import type { ResolvedPaths } from "./paths"
import { configureQmd, resolveQmdCommand } from "./qmd-setup"
import { createSetupReport, freezeSetupReport, type SetupReport } from "./setup-report"
import { installTemplateFiles } from "./setup-files"

export async function runSetup(input: {
  readonly paths: ResolvedPaths
  readonly skipEmbed: boolean
  readonly commandRunner?: CommandRunner
}): Promise<SetupReport> {
  const commandRunner = input.commandRunner ?? runCommand
  const report = createSetupReport()
  const stamp = new Date().toISOString().replace(/[:.]/gu, "-")
  const qmdCommand = await resolveQmdCommand(commandRunner)

  await installTemplateFiles({ paths: input.paths, report })
  await installCodexFiles({ paths: input.paths, qmdCommand, stamp, report })
  await configureQmd({
    paths: input.paths,
    skipEmbed: input.skipEmbed,
    commandRunner,
    report,
  })

  return freezeSetupReport(report)
}
