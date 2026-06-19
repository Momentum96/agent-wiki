# Installer Requirements

## Runtime Requirements

- Node.js 22 or newer.
- Bun for installing this CLI globally.
- qmd CLI available before setup can fully pass.
- SQLite available to qmd.

The installer may print package-manager commands for missing dependencies, but it must not install system packages automatically.

## Path Resolution

The installer must resolve:

- `HOME`
- `CODEX_HOME`, defaulting to `$HOME/.codex`
- `AGENT_WIKI_DIR`, defaulting to `$HOME/agent-wiki`
- qmd executable path
- package template directory
- target skill directories

The resolved paths must be visible through `agent-wiki paths`.

Do not rely on `npm bin -g`; it is not available in all npm versions. Prefer direct executable detection and package-manager-specific fallbacks.

## Config Merge Rules

### Codex `config.toml`

The installer must parse and merge TOML.

It should add or update:

```toml
[mcp_servers.qmd]
command = "/absolute/path/to/qmd"
args = ["mcp"]
enabled = true
startup_timeout_sec = 15
```

Rules:

- preserve unrelated config
- preserve comments where practical
- create a timestamped backup before modifying an existing file
- never write `~` as the command path
- report the before/after status

### Global `AGENTS.md`

The installer must add a marker-managed block:

```md
<!-- agent-wiki:start -->
## Agent Wiki Memory

...
<!-- agent-wiki:end -->
```

Rules:

- append the block if missing
- replace only the marked block if present
- preserve unrelated instructions
- create a timestamped backup before modifying an existing file

## qmd Setup Rules

The installer must:

- check `qmd --version`
- check `qmd collection list`
- use `qmd collection show agent-wiki` before adding
- add the collection only if missing
- add qmd context only if missing
- run `qmd update`
- run `qmd embed` only when requested or when `--skip-embed` is not set by policy
- verify search with `qmd search "Agent Wiki Context" --collection agent-wiki --format files`

If embedding fails after `qmd update` succeeds, setup can be considered partially functional. `verify` must report semantic search as degraded rather than treating the whole install as absent.

## Template Rules

All generated long-form content must come from packaged templates:

- skill templates
- helper script templates
- initial wiki context
- session log template
- global `AGENTS.md` managed block

Installer logic should only substitute paths and platform-specific values.

## Reporting

Every command should print a summary with:

- passed checks
- changed files
- existing files left unchanged
- skipped steps
- failed steps
- next command to run

`--json` output should expose the same data for automation.

## Safety

The installer must not:

- delete user files
- overwrite unmarked config sections
- copy secrets
- inspect raw Codex conversation history
- write qmd SQLite cache files into this package
- assume Codex is installed if `$CODEX_HOME` exists

## Verification Matrix

At minimum, the implementation should eventually be tested with:

| Scenario | Expected Result |
| --- | --- |
| Clean macOS setup | Setup creates all expected files and qmd search passes. |
| Re-run setup | No duplicate blocks or duplicate qmd collection. |
| Existing Codex config | qmd MCP block is merged without deleting other config. |
| Missing qmd | `doctor` reports missing qmd and setup stops before config mutation. |
| Missing SQLite support | `doctor` reports likely SQLite remediation. |
| Windows native | Paths and command hints are Windows-safe. |
| WSL | Paths do not cross native Windows and WSL environments. |

## First Implementation Milestone

The first code milestone should only implement:

1. Bun TypeScript CLI skeleton.
2. `paths` command.
3. `doctor` command with no writes.
4. Template files copied into a temporary dry-run target.
5. Unit tests for path resolution and marker-block replacement.

Do not implement real Codex config mutation until dry-run and backup behavior are tested.
