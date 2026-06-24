import { chmod, copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

export type WriteStatus = "changed" | "unchanged"

export async function writeIfChanged(path: string, content: string): Promise<WriteStatus> {
  const existing = await readExisting(path)
  if (existing === content) return "unchanged"
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
  return "changed"
}

export async function copyIfChanged(input: {
  readonly sourcePath: string
  readonly targetPath: string
}): Promise<WriteStatus> {
  const source = await readFile(input.sourcePath)
  const existing = await readExistingBuffer(input.targetPath)
  if (existing !== undefined && Buffer.compare(source, existing) === 0) return "unchanged"
  await mkdir(dirname(input.targetPath), { recursive: true })
  await copyFile(input.sourcePath, input.targetPath)
  const sourceStat = await stat(input.sourcePath)
  await chmod(input.targetPath, sourceStat.mode & 0o777)
  return "changed"
}

export async function backupIfExists(path: string, stamp: string): Promise<string | undefined> {
  try {
    await stat(path)
  } catch (error) {
    if (error instanceof Error) return undefined
    throw error
  }

  const backupPath = `${path}.bak.${stamp}`
  await copyFile(path, backupPath)
  return backupPath
}

async function readExisting(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8")
  } catch (error) {
    if (error instanceof Error) return undefined
    throw error
  }
}

async function readExistingBuffer(path: string): Promise<Buffer | undefined> {
  try {
    return await readFile(path)
  } catch (error) {
    if (error instanceof Error) return undefined
    throw error
  }
}
