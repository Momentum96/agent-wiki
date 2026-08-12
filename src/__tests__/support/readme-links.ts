import { existsSync, readFileSync } from "node:fs"
import { basename, dirname, resolve } from "node:path"

const MARKDOWN_LINK = /(?<!!)(?:\[[^\]]*\])\(([^\s)]+)(?:\s+[^)]*)?\)/g

export function checkMarkdownLocalLinkTargets(markdownPath: string): string[] {
  const markdown = readFileSync(markdownPath, "utf8")
  const errors: string[] = []

  for (const match of markdown.matchAll(MARKDOWN_LINK)) {
    const target = match[1]
    if (target === undefined || isExternalOrFragment(target)) continue

    const targetPath = resolve(dirname(markdownPath), decodeURIComponent(target.split(/[?#]/, 1)[0] ?? target))
    if (!existsSync(targetPath)) {
      errors.push(`${basename(markdownPath)}: missing target ${target}`)
    }
  }

  return errors
}

function isExternalOrFragment(target: string): boolean {
  return target.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(target)
}
