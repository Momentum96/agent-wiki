import { afterEach, describe, expect, test } from "bun:test"
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  assertObsidianSkillAssets,
  expectedThirdPartyNotice,
  verifyObsidianSkillAssets,
} from "./fixtures/verify-obsidian-skill-assets"

const tempDirs: string[] = []

const skillsRoot = "templates/skills"
const noticePath = "THIRD_PARTY_NOTICES.md"

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => rm(directory, { force: true, recursive: true })))
})

describe("vendored Obsidian skill assets", () => {
  test("Given the pinned local manifest When checking shipped assets Then inventory, hashes, licenses, and provenance are exact", async () => {
    const result = await verifyObsidianSkillAssets(skillsRoot, noticePath)

    expect(result.source).toBe("https://github.com/kepano/obsidian-skills")
    expect(result.revision).toBe("a1dc48e68138490d522c04cbf5822214c6eb1202")
    expect(result.expectedPaths).toHaveLength(15)
    expect(result.actualPaths).toEqual(result.expectedPaths)
    expect(result.assets.every((asset) => asset.matches)).toBe(true)
    expect(result.noticeMatches).toBe(true)
    expect(result.forbiddenPaths).toEqual([])
    expect(result.ok).toBe(true)
  })

  test("Given a copied asset tree with one mutated byte When checking hashes Then verification fails locally", async () => {
    const root = await mkdtemp(join(tmpdir(), "obsidian-skill-assets-"))
    tempDirs.push(root)
    const copiedSkills = join(root, "skills")
    await cp(skillsRoot, copiedSkills, { recursive: true })
    const copiedNotice = join(root, "THIRD_PARTY_NOTICES.md")
    await writeFile(copiedNotice, expectedThirdPartyNotice)
    await writeFile(join(copiedSkills, "defuddle/SKILL.md"), "mutated\n")

    const result = await verifyObsidianSkillAssets(copiedSkills, copiedNotice)
    expect(result.ok).toBe(false)
    expect(result.assets.find((asset) => asset.relativePath === "defuddle/SKILL.md")?.matches).toBe(false)
    let thrown: unknown
    try {
      await assertObsidianSkillAssets(copiedSkills, copiedNotice)
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as Error).message).toContain("Obsidian skill asset verification failed")
  })

  test("Given stale or forbidden files When checking inventory Then exact-set verification rejects them", async () => {
    const root = await mkdtemp(join(tmpdir(), "obsidian-skill-inventory-"))
    tempDirs.push(root)
    const copiedSkills = join(root, "skills")
    await cp(skillsRoot, copiedSkills, { recursive: true })
    const copiedNotice = join(root, "THIRD_PARTY_NOTICES.md")
    await writeFile(copiedNotice, expectedThirdPartyNotice)
    await writeFile(join(copiedSkills, "defuddle/STALE.md"), "stale\n")
    await mkdir(join(copiedSkills, "obsidian-zettelkasten"))
    await writeFile(join(copiedSkills, "obsidian-zettelkasten/SKILL.md"), "forbidden\n")

    const result = await verifyObsidianSkillAssets(copiedSkills, copiedNotice)
    expect(result.ok).toBe(false)
    expect(result.stalePaths).toEqual(["defuddle/STALE.md"])
    expect(result.forbiddenPaths).toEqual(["obsidian-zettelkasten/SKILL.md"])
  })
})
