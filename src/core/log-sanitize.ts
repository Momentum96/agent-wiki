import { relative, resolve } from "node:path"

export type SanitizeProjectLogInput = {
  readonly text: string
  readonly repoRoot: string
  readonly home: string
  readonly codexHome?: string
}

const UNIX_ABSOLUTE_PATH =
  /(?:^|(?<=[\s`"'([{<:,=]))((?:\/Users(?:\/[^/\s`"'<>]+(?:\/[^\s`"'<>]*)?)?|\/home(?:\/[^/\s`"'<>]+(?:\/[^\s`"'<>]*)?)?|\/Volumes(?:\/[^\s`"'<>]*)?|\/opt\/homebrew(?:\/[^\s`"'<>]*)?|\/private\/(?:tmp|var)(?:\/[^\s`"'<>]*)?|\/var\/folders(?:\/[^\s`"'<>]*)?|\/tmp(?:\/[^\s`"'<>]*)?))(?=$|[\s`"'<>),.])/g

export function sanitizeProjectLogText(input: SanitizeProjectLogInput): string {
  const repoRoot = resolve(input.repoRoot)
  const home = resolve(input.home)
  const defaultCodexHome = resolve(home, ".codex")
  const codexHome = input.codexHome ? resolve(input.codexHome) : resolve(home, ".codex")

  let text = input.text
  text = replaceAbsolutePrefix(text, repoRoot, (match) => toRepoRelative(repoRoot, match))
  for (const alias of privatePathAliases(repoRoot)) {
    text = replaceAbsolutePrefix(text, alias, (match) => toRepoRelative(alias, match))
  }
  text = replaceAbsolutePrefix(text, defaultCodexHome, "[local-codex-home]")
  text = replaceAbsolutePrefix(text, codexHome, "[local-codex-home]")
  text = replaceAbsolutePrefix(text, home, "[local-home]")
  text = text.replace(UNIX_ABSOLUTE_PATH, "[machine-local-absolute-path]")
  return text
}

function replaceAbsolutePrefix(
  text: string,
  prefix: string,
  replacement: string | ((match: string) => string),
): string {
  if (prefix.length === 0) return text

  const normalized = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix
  const pattern = new RegExp(`${escapeRegExp(normalized)}(?:/[^\\s\`"'<>]*)?(?=$|[\\s\`"'<>),.])`, "g")
  return text.replace(pattern, (match) =>
    typeof replacement === "string" ? replacementForMatch(match, normalized, replacement) : replacement(match),
  )
}

function replacementForMatch(match: string, prefix: string, placeholder: string): string {
  if (match === prefix) return placeholder
  const suffix = match.slice(prefix.length)
  return `${placeholder}${suffix}`
}

function toRepoRelative(repoRoot: string, absolutePath: string): string {
  const rel = relative(repoRoot, absolutePath)
  if (rel.length === 0) return "."
  if (!rel.startsWith("..")) return rel.split("\\").join("/")
  return absolutePath
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function privatePathAliases(path: string): string[] {
  if (path.startsWith("/private/")) return [path.slice("/private".length)]
  if (path.startsWith("/var/") || path.startsWith("/tmp/")) return [`/private${path}`]
  return []
}
