export type SetupReport = {
  readonly changed: readonly string[]
  readonly unchanged: readonly string[]
  readonly skipped: readonly string[]
  readonly failed: readonly string[]
  readonly backups: readonly string[]
}

export type MutableSetupReport = {
  readonly changed: string[]
  readonly unchanged: string[]
  readonly skipped: string[]
  readonly failed: string[]
  readonly backups: string[]
}

export function createSetupReport(): MutableSetupReport {
  return { changed: [], unchanged: [], skipped: [], failed: [], backups: [] }
}

export function freezeSetupReport(report: MutableSetupReport): SetupReport {
  return {
    changed: report.changed,
    unchanged: report.unchanged,
    skipped: report.skipped,
    failed: report.failed,
    backups: report.backups,
  }
}
