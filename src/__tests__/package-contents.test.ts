import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  EXPECTED_PACKAGE_FILES,
  REQUIRED_BASE_TEMPLATE_PATHS,
  REQUIRED_OBSIDIAN_SKILL_PATHS,
  REQUIRED_PUBLIC_DOC_PATHS,
  REQUIRED_RUNTIME_PATHS,
  packageFileAllowListProblems,
  packedFileProblems,
  parseNpmPackFilePaths,
} from "./support/package-contents"

const tempDirs: string[] = []

const MINIMAL_VALID_PACKED_PATHS = [
  "package.json",
  ...REQUIRED_BASE_TEMPLATE_PATHS,
  ...REQUIRED_OBSIDIAN_SKILL_PATHS,
  ...REQUIRED_PUBLIC_DOC_PATHS,
  ...REQUIRED_RUNTIME_PATHS,
  "THIRD_PARTY_NOTICES.md",
] as const

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => rm(directory, { force: true, recursive: true })))
})

describe("npm package contents", () => {
  test("Given the publication config When npm computes a dry-run tarball Then required runtime, docs, notices, and templates ship without private records", async () => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8")) as { files?: unknown }
    const pack = Bun.spawn(["npm", "pack", "--dry-run", "--json"], {
      cwd: process.cwd(),
      env: { ...process.env, npm_config_update_notifier: "false" },
      signal: AbortSignal.timeout(30_000),
      stdout: "pipe",
      stderr: "pipe",
    })
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(pack.stdout).text(),
      new Response(pack.stderr).text(),
      pack.exited,
    ])

    expect(exitCode, stderr).toBe(0)
    const packedPaths = parseNpmPackFilePaths(stdout)
    expect(packageFileAllowListProblems(packageJson.files)).toEqual([])
    expect(packedFileProblems(packedPaths)).toEqual([])
  }, 35_000)

  test("Given a temporary broad docs config When validating publication rules Then it is rejected without editing package.json", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-wiki-package-config-"))
    tempDirs.push(root)
    const fixturePath = join(root, "package.json")
    await writeFile(
      fixturePath,
      JSON.stringify({ files: [...EXPECTED_PACKAGE_FILES.filter((path) => !path.startsWith("docs/")), "docs"] }),
    )
    const fixture = JSON.parse(await readFile(fixturePath, "utf8")) as { files?: unknown }

    expect(packageFileAllowListProblems(fixture.files)).toContain('broad "docs" package allow-list entry is forbidden')
  })

  test("Given synthetic leaked or stale pack entries When checking the parsed file list Then both are rejected", () => {
    expect(packedFileProblems([...MINIMAL_VALID_PACKED_PATHS, "docs/agent-wiki/work-log/leak.md"])).toContain(
      "forbidden packed files: docs/agent-wiki/work-log/leak.md",
    )
    expect(packedFileProblems([...MINIMAL_VALID_PACKED_PATHS, "templates/skills/defuddle/STALE.md"])).toContain(
      "unexpected vendored skill files: templates/skills/defuddle/STALE.md",
    )
  })

  test("Given misleading npm JSON When parsing the file list Then malformed and duplicate entries are rejected", () => {
    expect(() => parseNpmPackFilePaths(JSON.stringify([{ files: [{ path: "README.md" }, {}] }]))).toThrow(
      "every npm pack file entry must contain a non-empty path",
    )
    expect(() =>
      parseNpmPackFilePaths(
        JSON.stringify([{ files: [{ path: "README.md" }, { path: "README.md" }] }]),
      ),
    ).toThrow("npm pack JSON contains duplicate paths: README.md")
  })
})
