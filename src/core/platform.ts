export type PlatformKind = "darwin" | "linux" | "windows" | "wsl"

export type PlatformInput = {
  readonly os: string
  readonly release: string
}

export type PlatformInfo = {
  readonly kind: PlatformKind
  readonly isWsl: boolean
}

export function detectPlatform(input: PlatformInput): PlatformInfo {
  if (input.os === "darwin") return { kind: "darwin", isWsl: false }
  if (input.os === "win32") return { kind: "windows", isWsl: false }

  const lowerRelease = input.release.toLowerCase()
  if (input.os === "linux" && lowerRelease.includes("microsoft")) {
    return { kind: "wsl", isWsl: true }
  }

  return { kind: "linux", isWsl: false }
}
