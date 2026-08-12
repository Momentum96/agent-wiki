import { describe, expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { checkMarkdownLocalLinkTargets } from "./support/readme-links"

describe("README local Markdown links", () => {
  test("English and Korean READMEs resolve every local Markdown link target", () => {
    expect(checkMarkdownLocalLinkTargets("README.md")).toEqual([])
    expect(checkMarkdownLocalLinkTargets("README.ko.md")).toEqual([])
  })

  test("checker rejects a missing relative Markdown target", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-wiki-readme-links-"))
    const readmePath = join(directory, "README.md")

    try {
      await writeFile(readmePath, "[missing](missing.md)\n")

      expect(checkMarkdownLocalLinkTargets(readmePath)).toEqual([
        "README.md: missing target missing.md",
      ])
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })
})
