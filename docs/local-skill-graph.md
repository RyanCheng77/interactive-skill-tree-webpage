# Local Skill Graph (v0.2)

v0.2 replaces static demo skill data with a local, AI-free skill graph. The system discovers `SKILL.md` files on the current device, classifies them with deterministic keyword rules, and renders them in role-based and process-based skill trees. No AI provider, GitHub search, or network access is required.

## Architecture

```
┌──────────────┐     HTTP (localhost)     ┌──────────────┐
│   Vite 6     │ ◄──────────────────────► │  Node API    │
│   React 18   │   /api/health            │  Hono        │
│   Frontend   │   /api/skills/catalog    │  TSX runner  │
│   :5173/4    │   /api/skills/classified │  :3001/2     │
└──────────────┘   /api/skills/recommend  └──────┬───────┘
                  /api/skills/inventory          │
                  /api/skills/compatibility      │
                  /api/skills/sync-plan          │
                                                 │
                                          Reads filesystem
                                                 │
                                        ┌────────▼───────┐
                                        │  SKILL.md      │
                                        │  files on disk │
                                        └────────────────┘
```

Frontend and API run as separate processes. The frontend calls the API base URL configured by `VITE_API_BASE_URL`.

## v0.3 Inventory Extension

v0.3 adds a cross-platform management layer on top of this graph. The catalog, classification, and recommendation endpoints now use canonical inventory items grouped by `name + contentSha256`, while the management endpoints expose every occurrence and platform status.

See [Cross-Platform Skill Inventory Management](skill-inventory-management.md) for the full v0.3 behavior.

## Skill Discovery

### Discovery Order

On startup, the API resolves skill roots in this order:

1. **`LOCAL_SKILL_ROOTS`** env var — comma-separated paths, explicitly configured.
2. **`./skills`** — project-local directory, resolved from the project root.
3. **`${CODEX_HOME}/skills`** — when `CODEX_HOME` is set.
4. **`${HOME}/.codex/skills`** — resolved with `os.homedir()`.
5. **`${HOME}/.agents/skills`** — resolved with `os.homedir()`.

Each root is resolved, deduplicated by absolute path, and checked for existence. Missing or unreadable roots are skipped with a warning and do not cause startup failure.

### Path Resolution Rules

- `~` is expanded to the current user's home directory.
- Relative paths are resolved from the project root.
- Absolute paths on macOS, Linux, and Windows are supported.
- Duplicate resolved absolute paths are deduplicated.

### Scanning

Each confirmed root is scanned recursively for `SKILL.md` files. For each found file:

- YAML frontmatter is parsed for `name` and `description`.
- Markdown body is extracted and summarized.
- Tags are inferred from the skill's content and path.
- A stable `id` is generated from the root source + relative skill directory (no absolute home paths).

### Empty State

If no `SKILL.md` files are found across any root, the API returns empty arrays (`[]`) rather than errors. The frontend falls back to a compact "no local skills discovered" notice while keeping the basic workbench UI functional.

## Environment Configuration

### `.env` (API Server)

```bash
API_PORT=3001                  # API listen port (default: 3001)
LOCAL_SKILL_ROOTS=             # Optional: comma-separated extra roots
```

### `.env` (Frontend / Vite)

```bash
VITE_API_BASE_URL=http://127.0.0.1:3001   # API base URL for the frontend client
```

The frontend reads `VITE_API_BASE_URL` at build time through Vite's env mechanism. When the API is unreachable, the frontend shows a compact warning and retains the existing static data fallback.

## API Endpoints

All endpoints return JSON. CORS is configured for local development origins.

### `GET /api/health`

Reports API status and discovered skill roots.

```json
{
  "ok": true,
  "service": "skill-workbench-api",
  "skillRoots": [
    {
      "path": "/Users/ryan/.codex/skills",
      "exists": true,
      "source": "home-codex"
    }
  ]
}
```

### `GET /api/skills/catalog`

Returns all discovered local skills. Each skill includes `id`, `name`, `description`, `path`, `root`, `bodySummary`, and `tags`.

### `GET /api/skills/classified`

Returns the full catalog plus deterministic classifications: `roleIds`, `stageIds`, `depth`, `confidence`, and human-readable `reason`.

### `POST /api/skills/recommend`

Accepts `{ "goal": "我要规划 MVP 需求评审" }` and returns scored recommendations with `skillId`, `score`, `reason`, and `matchedTerms`. Scores are rule scores, not percentages. The frontend rounds them for compact display.

### `GET /api/skills/inventory`

Returns canonical skill inventory items, every discovered occurrence, platform roots, Cursor rule context, and warnings.

### `GET /api/skills/compatibility`

Returns per-platform compatibility status for each canonical skill.

### `POST /api/skills/sync-plan`

Returns a safe update plan. The plan itself does not write to disk.

### `POST /api/skills/sync-apply`

Executes safe update actions from a freshly generated plan. It only creates missing files for writable `copy-to-target` and Cursor bridge actions, never overwrites existing files, and skips conflicts, read-only sources, and symlink actions.

## Deterministic Classification

Classification uses keyword matching — no AI, no embeddings, no network calls.

### Role Keywords

| Role | Sample Keywords |
|------|----------------|
| lead | 项目, 管理, 规划, 协调, lead, roadmap |
| pm | 产品, 需求, PRD, 原型, 用户, user story |
| designer | 设计, UI, UX, 视觉, Figma, design |
| frontend | 前端, React, CSS, HTML, TypeScript, component |
| backend | 后端, API, server, database, 服务, Go, Python |
| qa | 测试, QA, quality, bug, 验证, E2E |
| devops | CI/CD, deploy, 安全, Docker, 运维, infra |
| docs | 文档, docs, 知识, wiki, 流程, process |

### Stage Keywords

Skills are mapped to workflow stages (`discovery`, `requirements`, `design`, `development`, `testing`, `release`, `retro`) through stage-specific keyword sets.

### Depth Calculation

Depth is determined by keyword strength signals in the skill's name, description, and body:

| Depth | Signal |
|-------|--------|
| `intro` | 入门, beginner, overview, 基础, 介绍 |
| `working` | 使用, usage, 实践, 指南, how-to |
| `advanced` | 高级, advanced, 优化, optimization, 架构 |
| `expert` | 专家, expert, 深度, deep, 原理, principle |

### Classification Reason

Every classification includes a `reason` field describing which keywords matched and why the role/stage/depth was assigned. Confidence is a 0-1 float derived from keyword match density.

## Deterministic Recommendation

Goal text is scored against the catalog using multi-field term matching:

1. Tokenize the goal text (Chinese segmentation + English word split).
2. Score each skill by term matches across: skill name, description, body summary, tags, classified role IDs, and classified stage IDs.
3. Return top-N results ordered by score descending.
4. Each result includes `matchedTerms` (which goal tokens matched) and `reason` (human-readable explanation).

No AI, no vector embeddings, no external API calls. The algorithm runs entirely in-process.

## Privacy and Safety

- **No network calls**: Skill scanning, classification, and recommendation run entirely on localhost. Nothing is sent to external services.
- **Filesystem writes are constrained**: scanning, classification, recommendation, and planning are read-only. `sync-apply` can create missing files only in declared writable target roots or `.cursor/rules`; it never overwrites, deletes, writes read-only roots, or resolves conflicts automatically.
- **Path sanitization**: Skill IDs use stable source+relative-path keys, not absolute home directory paths. Absolute paths appear only in the `path` and `root` fields, which are intended for developer debugging.
- **No execution**: `SKILL.md` files are parsed as text. No code, shell commands, or scripts are executed from skill files.
- **.gitignore**: `.env` with local paths is gitignored. `.env.example` is the committed reference.

## Fallback and Empty States

| Scenario | API Behavior | Frontend Behavior |
|----------|-------------|-------------------|
| No skill roots configured | Return empty arrays in catalog/classified | Show "no local skills discovered" notice, keep static fallback |
| Roots configured but missing on disk | Skip missing roots with warning, continue with any available roots | Same as above |
| `SKILL.md` files exist but have no frontmatter | Include skill with empty name/description, infer from directory name | Show skill with directory name as label |
| API server not running | N/A | Show compact warning banner, fall back to static demo data |
| API server error (500) | Return error JSON | Show warning, fall back to static data |
| Empty goal text in recommend | Return empty recommendations array | Keep the generated plan fallback available |

## Running

### Full Stack

```bash
pnpm dev:full          # Starts API (:3001) + frontend (:5173) concurrently
```

### Individual

```bash
pnpm dev:api           # API server only
pnpm dev               # Vite frontend only
```

### Testing

```bash
pnpm test:run          # Frontend tests (Vitest)
pnpm test:server       # Server tests (Vitest)
```

## Known Limitations

- Classification is keyword-based and will miss skills with novel or non-standard terminology.
- Chinese text segmentation is basic; multi-character compound terms may not be split correctly.
- No incremental scanning — the catalog is rebuilt on every API start.
- No watch mode for file changes.
- Static data fallback is from the MVP era and does not derive from local SKILL.md content.
