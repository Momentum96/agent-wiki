import { err, ok, type Result } from "./result"

const START_MARKER = "<!-- agent-wiki:start -->"
const END_MARKER = "<!-- agent-wiki:end -->"

export type MarkerError = {
  readonly kind: "malformed_markers"
  readonly message: string
}

export function applyManagedBlock(content: string, block: string): Result<string, MarkerError> {
  const startIndexes = allIndexes(content, START_MARKER)
  const endIndexes = allIndexes(content, END_MARKER)

  if (startIndexes.length !== endIndexes.length || startIndexes.length > 1) {
    return err({ kind: "malformed_markers", message: "Expected zero or one complete marker block." })
  }

  if (startIndexes.length === 0) {
    const separator = content.endsWith("\n") ? "\n" : "\n\n"
    return ok(`${content}${separator}${ensureTrailingNewline(block)}`)
  }

  const start = startIndexes[0]
  const end = endIndexes[0]
  if (start === undefined || end === undefined || end < start) {
    return err({ kind: "malformed_markers", message: "Marker block is out of order." })
  }

  const replacementEnd = end + END_MARKER.length
  return ok(`${content.slice(0, start)}${block}${content.slice(replacementEnd)}`)
}

function allIndexes(content: string, search: string): readonly number[] {
  const indexes: number[] = []
  let cursor = 0
  while (cursor < content.length) {
    const index = content.indexOf(search, cursor)
    if (index === -1) return indexes
    indexes.push(index)
    cursor = index + search.length
  }
  return indexes
}

function ensureTrailingNewline(value: string): string {
  if (value.endsWith("\n")) return value
  return `${value}\n`
}
