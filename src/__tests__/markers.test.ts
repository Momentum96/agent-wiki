import { describe, expect, test } from "bun:test"

import { applyManagedBlock } from "../core/markers"

const block = "<!-- agent-wiki:start -->\nmanaged\n<!-- agent-wiki:end -->"

describe("applyManagedBlock", () => {
  test("Given unmarked content When applying block Then it appends the managed block", () => {
    const result = applyManagedBlock("Existing\n", block)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("expected marker update to succeed")
    expect(result.value).toBe("Existing\n\n<!-- agent-wiki:start -->\nmanaged\n<!-- agent-wiki:end -->\n")
  })

  test("Given existing managed block When applying block Then it replaces only that block", () => {
    const input = "Before\n<!-- agent-wiki:start -->\nold\n<!-- agent-wiki:end -->\nAfter\n"
    const result = applyManagedBlock(input, block)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("expected marker update to succeed")
    expect(result.value).toBe("Before\n<!-- agent-wiki:start -->\nmanaged\n<!-- agent-wiki:end -->\nAfter\n")
  })

  test("Given partial marker When applying block Then it returns malformed marker error", () => {
    const result = applyManagedBlock("<!-- agent-wiki:start -->\nold\n", block)

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected marker update to fail")
    expect(result.error.kind).toBe("malformed_markers")
  })
})
