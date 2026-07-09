import { describe, expect, test } from "bun:test"

import { sanitizeProjectLogText } from "../core/log-sanitize"

describe("sanitizeProjectLogText", () => {
  test("Given project log text with home and codex paths When sanitized Then placeholders and repo-relative paths are used", () => {
    const repoRoot = "/Users/jgw/mac_work/HWT-SW-2025-017-O"
    const home = "/Users/jgw"
    const codexHome = "/Users/jgw/.codex"
    const text = [
      "Summary: active codex is /Users/jgw/.local/bin/codex",
      "real binary /Users/jgw/.codex/packages/standalone/current/bin/codex",
      "repo file /Users/jgw/mac_work/HWT-SW-2025-017-O/docs/agent-wiki/context.md",
      "external volume /Volumes/External/private-evidence.txt",
      "brew /opt/homebrew/bin/codex",
      "temp /private/var/folders/qp/session/evidence.txt",
      "private var /private/var/db/secrets.txt",
    ].join("\n")

    const sanitized = sanitizeProjectLogText({ text, repoRoot, home, codexHome })

    expect(sanitized).toContain("active codex is [local-home]/.local/bin/codex")
    expect(sanitized).toContain("[local-codex-home]/packages/standalone/current/bin/codex")
    expect(sanitized).toContain("repo file docs/agent-wiki/context.md")
    expect(sanitized).toContain("[machine-local-absolute-path]")
    expect(sanitized).not.toContain("/Users/jgw/")
    expect(sanitized).not.toContain("/Volumes/")
    expect(sanitized).not.toContain("/private/var/")
  })

  test("Given the Codex update work-log text When sanitized Then no local absolute path remains", () => {
    const repoRoot = "/Users/jgw/mac_work/HWT-SW-2025-017-O"
    const home = "/Users/jgw"
    const codexHome = "/Users/jgw/Library/Application Support/agent-runtime/home"
    const text = [
      "Summary: Active `codex` is `/Users/jgw/.local/bin/codex`, an OpenCodex shim that execs `/Users/jgw/.local/bin/codex.opencodex-real`, which points to `/Users/jgw/.codex/packages/standalone/current/bin/codex` at `codex-cli 0.142.5`.",
      "- Runtime home `/Users/jgw/Library/Application Support/agent-runtime/home/plugins/cache/example-plugin`.",
      "- Homebrew also has `codex` installed, but `/opt/homebrew/bin/codex` points to `/opt/homebrew/Caskroom/codex/0.141.0/codex-aarch64-apple-darwin`.",
      "- Project log `/Users/jgw/mac_work/HWT-SW-2025-017-O/docs/agent-wiki/work-log/2026-07-08-codex-update-detection.md`.",
    ].join("\n")

    const sanitized = sanitizeProjectLogText({ text, repoRoot, home, codexHome })

    expect(sanitized).toContain("[local-home]/.local/bin/codex")
    expect(sanitized).toContain("[local-codex-home]/packages/standalone/current/bin/codex")
    expect(sanitized).toContain("[local-codex-home]/plugins/cache/example-plugin")
    expect(sanitized).toContain("[machine-local-absolute-path]")
    expect(sanitized).toContain("docs/agent-wiki/work-log/2026-07-08-codex-update-detection.md")
    expect(sanitized).not.toContain("/Users/jgw/")
    expect(sanitized).not.toContain("/opt/homebrew/")
  })

  test("Given assignment-style local paths When sanitized Then placeholders replace every local path class", () => {
    const text = [
      "USERS=/Users/other/.codex/config.toml",
      "HOME=/home/alice/.config/opencode/AGENTS.md",
      "VOLUME=/Volumes/External/private-evidence.txt",
      "BREW=/opt/homebrew/bin/codex",
      "PRIVATE_TMP=/private/tmp/debug.log",
      "PRIVATE_VAR=/private/var/db/secrets.txt",
      "VAR_FOLDERS=/var/folders/qp/session/evidence.txt",
      "TMP=/tmp/debug.log",
    ].join("\n")

    const sanitized = sanitizeProjectLogText({
      text,
      repoRoot: "/repo",
      home: "/Users/jgw",
    })

    expect(sanitized.match(/\[machine-local-absolute-path\]/g)).toHaveLength(8)
    expect(sanitized).not.toMatch(/=\/(?:Users|home|Volumes|opt\/homebrew|private\/tmp|private\/var|var\/folders|tmp)\//)
  })

  test("Given assignment-style local roots When sanitized Then exact roots are placeholders too", () => {
    const text = [
      "USERS_ROOT=/Users",
      "HOME_ROOT=/home",
      "VOLUMES_ROOT=/Volumes",
      "USERS=/Users/other",
      "HOME=/home/alice",
      "VOLUME=/Volumes/External",
      "BREW=/opt/homebrew",
      "PRIVATE_TMP=/private/tmp",
      "PRIVATE_VAR=/private/var",
      "VAR_FOLDERS=/var/folders",
      "TMP=/tmp",
    ].join("\n")

    const sanitized = sanitizeProjectLogText({
      text,
      repoRoot: "/repo",
      home: "/Users/jgw",
    })

    expect(sanitized.match(/\[machine-local-absolute-path\]/g)).toHaveLength(11)
    expect(sanitized).not.toMatch(/=\/(?:Users|home|Volumes|opt\/homebrew|private\/tmp|private\/var|var\/folders|tmp)(?:$|\n)/)
  })
})
