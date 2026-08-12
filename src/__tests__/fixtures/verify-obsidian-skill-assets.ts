import { createHash } from "node:crypto"
import { readdir, readFile } from "node:fs/promises"
import { join, relative, sep } from "node:path"

import manifest from "./obsidian-skill-assets.json"

export interface AssetHashResult {
  readonly relativePath: string
  readonly expectedSha256: string
  readonly actualSha256: string | null
  readonly matches: boolean
}

export interface ObsidianSkillAssetVerification {
  readonly ok: boolean
  readonly source: string
  readonly revision: string
  readonly expectedPaths: readonly string[]
  readonly actualPaths: readonly string[]
  readonly missingPaths: readonly string[]
  readonly stalePaths: readonly string[]
  readonly forbiddenPaths: readonly string[]
  readonly assets: readonly AssetHashResult[]
  readonly noticeMatches: boolean
}

const skillNames = [
  "defuddle",
  "json-canvas",
  "obsidian-bases",
  "obsidian-cli",
  "obsidian-markdown",
] as const

const mitTerms = `MIT License

${manifest.copyright}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`

export const expectedThirdPartyNotice = `# Third-Party Notices

## Kepano Obsidian Skills

Source: ${manifest.source}
Revision: ${manifest.revision}

The vendored Obsidian skill assets are licensed under the MIT License:

${mitTerms}
`

export async function verifyObsidianSkillAssets(
  skillsRoot: string,
  noticePath: string,
): Promise<ObsidianSkillAssetVerification> {
  const expectedPaths = Object.keys(manifest.assets).sort()
  const actualPaths = (
    await Promise.all(skillNames.map((name) => listFiles(join(skillsRoot, name), skillsRoot)))
  ).flat().sort()
  const actualSet = new Set(actualPaths)
  const expectedSet = new Set(expectedPaths)
  const missingPaths = expectedPaths.filter((path) => !actualSet.has(path))
  const stalePaths = actualPaths.filter((path) => !expectedSet.has(path))
  const forbiddenPaths = await listFiles(join(skillsRoot, "obsidian-zettelkasten"), skillsRoot)

  const assets = await Promise.all(
    expectedPaths.map(async (relativePath): Promise<AssetHashResult> => {
      const expectedSha256 = manifest.assets[relativePath as keyof typeof manifest.assets]
      const actualSha256 = await sha256OrNull(join(skillsRoot, relativePath))
      return {
        relativePath,
        expectedSha256,
        actualSha256,
        matches: actualSha256 === expectedSha256,
      }
    }),
  )

  const notice = await readTextOrNull(noticePath)
  const noticeMatches = notice === expectedThirdPartyNotice
  const ok =
    missingPaths.length === 0 &&
    stalePaths.length === 0 &&
    forbiddenPaths.length === 0 &&
    assets.every((asset) => asset.matches) &&
    noticeMatches

  return {
    ok,
    source: manifest.source,
    revision: manifest.revision,
    expectedPaths,
    actualPaths,
    missingPaths,
    stalePaths,
    forbiddenPaths,
    assets,
    noticeMatches,
  }
}

export async function assertObsidianSkillAssets(
  skillsRoot: string,
  noticePath: string,
): Promise<ObsidianSkillAssetVerification> {
  const result = await verifyObsidianSkillAssets(skillsRoot, noticePath)
  if (!result.ok) {
    throw new Error(`Obsidian skill asset verification failed: ${JSON.stringify(result)}`)
  }
  return result
}

async function listFiles(directory: string, root: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (isMissing(error)) return []
    throw error
  }

  const paths = await Promise.all(
    entries.map(async (entry): Promise<string[]> => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return listFiles(path, root)
      return [relative(root, path).split(sep).join("/")]
    }),
  )
  return paths.flat()
}

async function sha256OrNull(path: string): Promise<string | null> {
  try {
    const content = await readFile(path)
    return createHash("sha256").update(content).digest("hex")
  } catch (error) {
    if (isMissing(error)) return null
    throw error
  }
}

async function readTextOrNull(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8")
  } catch (error) {
    if (isMissing(error)) return null
    throw error
  }
}

function isMissing(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT"
}
