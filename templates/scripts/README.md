# Script Templates

This directory contains helper scripts installed by `agent-wiki setup`.

Expected templates:

- `agent-wiki-log.sh`
- `agent-wiki-refresh.sh`

Native Windows helper templates should be added only after they are parser-verified in PowerShell or CI.

Installer code should copy these templates to the target wiki directory and set executable permissions where the platform supports them.
