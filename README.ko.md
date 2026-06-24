# Agent Wiki

[English](README.md) | [한국어](README.ko.md)

`agent-wiki`는 Codex와 호환 coding agent를 위해 qmd 기반 로컬 markdown 메모리 워크플로를 세팅하는 Bun/TypeScript CLI입니다.

이 README는 두 독자를 기준으로 구성되어 있습니다.

- 실행 전에 무엇이 바뀌는지 알고 싶은 사람
- 사용자의 설치 요청을 받고 정확한 절차를 따라야 하는 AI Agent

## 현재 상태

이 저장소는 첫 CLI 마일스톤 단계입니다.

현재 구현됨:

- `agent-wiki paths`
- `agent-wiki doctor`
- `agent-wiki setup --dry-run`
- `agent-wiki setup --install-prereqs`

아직 미구현:

- Codex config, qmd collection, skills, helper scripts를 실제로 수정하는 전체 `agent-wiki setup`
- 운영용 `agent-wiki verify`
- npm/Bun 패키지 배포

## 사람을 위한 안내

추천 방식은 coding agent에게 이 저장소를 읽고 검증하게 맡기는 것입니다.

Codex, Claude Code, Cursor, OpenCode 같은 agent에 아래 프롬프트를 붙여 넣으세요.

```text
Install and validate agent-wiki from this repository:
https://github.com/Momentum96/agent-wiki

Read the README and docs/guide/installation.md first. Do not install Bun, Node.js, or Codex automatically. If qmd or SQLite is missing, show me the exact command and ask before installing.
```

직접 확인하려면:

```bash
git clone https://github.com/Momentum96/agent-wiki.git
cd agent-wiki
bun install
bun run typecheck
bun test
bun run src/cli.ts doctor
```

Codex 설정을 건드리지 않고 setup이 복사할 파일만 보려면:

```bash
bun run src/cli.ts setup --dry-run
```

qmd와 SQLite 선행 조건을 확인하려면:

```bash
bun run src/cli.ts setup --install-prereqs
```

이 명령은 qmd나 SQLite가 없을 때 설치를 제안할 수 있지만, 기본값은 `N`이고 명시적으로 승인해야 설치합니다.

## AI Agent를 위한 안내

설치 가이드를 가져와서 단계별로 따르세요.

```bash
curl -fsSL https://raw.githubusercontent.com/Momentum96/agent-wiki/refs/heads/main/docs/guide/installation.md
```

Agent 규칙:

- 명령 실행 전에 이 README와 `docs/guide/installation.md`를 읽으세요.
- `git status --short`로 현재 작업트리 상태를 확인하세요.
- Bun, Node.js, Codex, Homebrew, apt package, winget package는 사용자 승인 없이 설치하지 마세요.
- `agent-wiki setup --install-prereqs` 또는 `bun run src/cli.ts setup --install-prereqs`는 실행해도 됩니다. qmd나 SQLite가 없어서 설치 질문이 나오면, `y`를 입력하기 전에 사용자에게 물어보세요.
- 전체 setup mutation이 구현되기 전까지는 `setup --dry-run`을 사용하세요.
- `verify`는 구현 전 예약 명령으로 취급하세요.
- 실행한 명령과 pass/fail 결과를 사용자에게 정확히 보고하세요.

최소 로컬 검증 흐름:

```bash
bun install
bun run typecheck
bun test
bun run src/cli.ts paths --json
bun run src/cli.ts doctor --json
bun run src/cli.ts setup --dry-run --json
```

## 관리 대상

기본 사용자-facing wiki content:

- `$HOME/agent-wiki/context.md`
- `$HOME/agent-wiki/templates/session-log.md`
- `$HOME/agent-wiki/scripts/agent-wiki-log.sh`
- `$HOME/agent-wiki/scripts/agent-wiki-refresh.sh`

기본 내부 상태 경로:

- `$HOME/.agent-wiki`

기본 Codex 대상:

- `$CODEX_HOME/AGENTS.md`
- `$CODEX_HOME/config.toml`
- `$CODEX_HOME/skills/qmd-cli/SKILL.md`
- `$CODEX_HOME/skills/agent-wiki-memory/SKILL.md`

## 안전 원칙

installer는 idempotent해야 합니다. setup을 여러 번 실행해도 qmd collection, qmd context, skill, script, global `AGENTS.md` block이 중복되면 안 됩니다.

installer가 절대 복사하거나 패키징하면 안 되는 것:

- Codex auth files
- API keys
- `.env` files
- SSH keys
- database dumps
- qmd SQLite index files
- raw chat transcripts
- 사용자별 전체 `config.toml`

## 명령어

| Command | 상태 | 목적 |
| --- | --- | --- |
| `agent-wiki paths` | 구현됨 | home, Codex, wiki, state, template, skill 경로 출력 |
| `agent-wiki doctor` | 구현됨 | Bun, Node.js, qmd, SQLite, Codex 파일을 쓰기 없이 점검 |
| `agent-wiki setup --install-prereqs` | 구현됨 | qmd와 SQLite를 확인하고, 빠진 항목만 승인 후 설치 제안 |
| `agent-wiki setup --dry-run` | 구현됨 | packaged template을 임시 대상에 복사해 검사 |
| `agent-wiki setup` | 이후 마일스톤 | 전체 로컬 agent wiki setup 생성/복구 |
| `agent-wiki verify` | 이후 마일스톤 | 설치된 workflow에 대해 qmd smoke check 실행 |

## 문서

- [docs/guide/installation.md](docs/guide/installation.md): AI Agent와 사람이 따라갈 단계별 설치 가이드
- [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md): 제품 목표, 성공 기준, 범위
- [docs/INSTALLER_REQUIREMENTS.md](docs/INSTALLER_REQUIREMENTS.md): 기능 요구사항
- [docs/GENERATED_ASSETS.md](docs/GENERATED_ASSETS.md): setup이 template에서 복사할 파일 목록
