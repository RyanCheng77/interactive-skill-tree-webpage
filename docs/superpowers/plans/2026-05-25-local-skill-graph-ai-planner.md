# Local Skill Graph AI Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static demo skill data with a real local skill catalog, organize those skills by role and workflow stage, visualize them as progressive learning paths, and use AI to plan which local skills to call for a user goal.

**Architecture:** Add a minimal Node API service that can read local `SKILL.md` files server-side, classify skills into role/stage/depth metadata, and expose a typed catalog API to the existing Vite frontend. Keep the current frontend workbench structure, but swap static skill-tree inputs for catalog-derived skill groups. Add an AI planning endpoint that receives the user goal plus local skill catalog summaries and returns a structured skill invocation plan.

**Tech Stack:** React 18, Vite 6, TypeScript, Tailwind CSS 4, Vitest, Node API service, Hono or Express-style HTTP routing, local filesystem read-only scanning, server-side AI provider via environment variables.

---

## Product Contract

v0.2 should answer:

- 我本地有哪些 skill？
- 每个 skill 适合哪个角色、哪个流程阶段、什么深度？
- 我作为某个角色应该按什么顺序熟悉这些 skill？
- 我处在某个产研阶段时应该调用哪些 skill？
- 我输入一个目标后，AI 应该如何规划 skill 调用路径？

The app should remain a learning and orchestration workbench, not a package manager. It can recommend GitHub candidates when local skills are missing, but it must not auto-install or execute remote code.

## Portable Local Skill Sources

This feature must work on any developer machine. It must not hard-code a personal path.

Default read-only discovery order:

1. `LOCAL_SKILL_ROOTS` when explicitly configured.
2. Project-local `./skills`, resolved from the current project root.
3. `${CODEX_HOME}/skills` when `CODEX_HOME` is set.
4. `${HOME}/.codex/skills`, resolved with `os.homedir()`.
5. `${HOME}/.agents/skills`, resolved with `os.homedir()`.

`LOCAL_SKILL_ROOTS` should accept comma-separated paths. It must support:

- `~` expansion to the current user's home directory.
- Relative paths resolved from the project root.
- Absolute paths on macOS, Linux, and Windows.
- Missing paths skipped with warnings, not fatal errors.

Example:

```bash
LOCAL_SKILL_ROOTS=~/.codex/skills,~/.agents/skills,./skills
```

Implementation and tests must work whether a device has many skills, a few skills, or no configured skill roots yet.

## File Structure

- Modify: `package.json`
  - Add API scripts and backend dependencies.
- Create: `.env.example`
  - Document API, local skill roots, AI provider, and optional GitHub token.
- Create: `server/index.ts`
  - Start API server.
- Create: `server/types.ts`
  - Backend types for local skills, classifications, and AI plans.
- Create: `server/skills/localSkillCatalog.ts`
  - Read local `SKILL.md` files and parse frontmatter/body summary.
- Create: `server/skills/skillClassifier.ts`
  - Map skills to roles, workflow stages, tags, and learning depth.
- Create: `server/skills/githubSkillSearch.ts`
  - Return source-attributed GitHub candidates when local coverage is missing.
- Create: `server/routes/skills.ts`
  - Expose catalog, classification, and recommendation endpoints.
- Create: `server/ai/skillPlanner.ts`
  - Generate AI skill invocation plans from a user goal and local skill catalog.
- Create: `server/routes/planner.ts`
  - Expose goal planning endpoint.
- Create: `server/test/*.test.ts`
  - Cover catalog scanning, classification, GitHub fallback, and planner fallback.
- Create: `src/app/lib/apiClient.ts`
  - Typed frontend client for catalog and planning APIs.
- Modify: `src/app/types.ts`
  - Add `LocalSkill`, `SkillClassification`, and `SkillInvocationPlan` types.
- Modify: `src/app/App.tsx`
  - Load catalog, pass classified skills to Goal/Process/Role views.
- Modify: `src/app/components/GoalView.tsx`
  - Use AI planner output for goal results.
- Modify: `src/app/components/ProcessView.tsx`
  - Show catalog-derived skills per stage.
- Modify: `src/app/components/RoleView.tsx`
  - Show catalog-derived role skill tree.
- Modify: `src/app/components/SkillTree.tsx`
  - Support catalog-derived nodes and local skill metadata.
- Modify: `src/app/components/SkillDetail.tsx`
  - Show local path, source, description, and suggested usage.
- Create: `docs/local-skill-catalog.md`
  - Document local skill scanning, classification, and safety.
- Create: `docs/ai-skill-planner.md`
  - Document AI planning prompt, schema, fallback, and limitations.
- Create: `docs/superpowers/qa/2026-05-25-local-skill-graph-ai-planner-qa.md`
  - Record automated and browser QA.

## Data Model

Add frontend/shared types:

```ts
export type SkillSource = "local" | "github-candidate";
export type SkillDepth = "intro" | "working" | "advanced" | "expert";

export interface LocalSkill {
  id: string;
  name: string;
  description: string;
  path: string;
  root: string;
  source: "local";
  bodySummary: string;
  tags: string[];
}

export interface SkillClassification {
  skillId: string;
  roleIds: string[];
  stageIds: string[];
  depth: SkillDepth;
  confidence: number;
  reason: string;
}

export interface SkillInvocationStep {
  id: string;
  order: number;
  skillId: string;
  title: string;
  reason: string;
  input: string;
  output: string;
  acceptance: string;
}

export interface SkillInvocationPlan {
  id: string;
  goal: string;
  title: string;
  createdAt: string;
  steps: SkillInvocationStep[];
  missingCapabilities: string[];
  githubCandidates: GithubSkillCandidate[];
}
```

## API Contract

### `GET /api/health`

Returns API status and whether local skill roots are readable.

### `GET /api/skills/catalog`

Returns parsed local skills.

### `GET /api/skills/classified`

Returns local skills plus role/stage/depth classification.

### `POST /api/skills/recommend`

Given a goal or capability list, returns local matches first and GitHub candidates only for missing capabilities.

### `POST /api/planner/skill-plan`

Request:

```json
{
  "goal": "我想从 0 到 1 做一个 AI 协作门户"
}
```

Returns a `SkillInvocationPlan` that references local `skillId` values whenever possible.

## Task 1: API Skeleton And Env Contract

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `server/index.ts`
- Create: `server/routes/health.ts`
- Create: `docs/local-skill-catalog.md`

- [ ] **Step 1: Add API scripts and dependencies**

Add scripts:

```json
{
  "dev:api": "tsx server/index.ts",
  "dev:full": "concurrently \"pnpm dev:api\" \"pnpm dev\"",
  "test:server": "vitest run server"
}
```

Add dependencies:

```json
{
  "@hono/node-server": "1.14.0",
  "hono": "4.7.4",
  "zod": "3.24.2"
}
```

Add dev dependencies:

```json
{
  "concurrently": "9.1.2",
  "tsx": "4.19.2"
}
```

- [ ] **Step 2: Add env example**

Create:

```bash
API_PORT=3001
VITE_API_BASE_URL=http://127.0.0.1:3001
LOCAL_SKILL_ROOTS=~/.codex/skills,~/.agents/skills,./skills
AI_PROVIDER=openai-compatible
AI_API_BASE_URL=https://api.openai.com/v1
AI_API_KEY=
AI_MODEL=
GITHUB_TOKEN=
```

- [ ] **Step 3: Add health route**

Health should return:

```json
{
  "ok": true,
  "service": "skill-workbench-api",
  "skillRootsConfigured": true,
  "skillRoots": [
    {
      "path": "/resolved/path/to/skills",
      "exists": true
    }
  ],
  "aiProviderConfigured": false
}
```

- [ ] **Step 4: Verify**

Run:

```bash
pnpm install
pnpm dev:api
curl -s http://127.0.0.1:3001/api/health
```

Expected: JSON with `"ok": true`.

## Task 2: Local Skill Catalog Scanner

**Files:**
- Create: `server/skills/localSkillCatalog.ts`
- Create: `server/test/localSkillCatalog.test.ts`
- Modify: `server/routes/skills.ts`

- [ ] **Step 1: Parse local `SKILL.md` files**

Implement read-only scanning over discovered skill roots. For each `SKILL.md`, parse frontmatter fields `name` and `description`, keep absolute path, root, and a short body summary.

Path discovery must be portable:

- Use `process.env.LOCAL_SKILL_ROOTS` first when present.
- Use `process.env.CODEX_HOME` if present.
- Use `os.homedir()` for home defaults.
- Expand `~` manually.
- Resolve relative paths from the project root.
- Deduplicate roots after resolving absolute paths.

- [ ] **Step 2: Normalize skill ids**

Use a stable id derived from root alias plus relative path. Example: `codex/product-lead-planner`.

- [ ] **Step 3: Ignore broken roots gracefully**

Missing roots and unreadable files should be skipped with warnings, not fatal errors.

- [ ] **Step 4: Add catalog route**

`GET /api/skills/catalog` returns all local skills sorted by name.

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test:server server/test/localSkillCatalog.test.ts
curl -s http://127.0.0.1:3001/api/skills/catalog
```

Expected: tests pass and catalog includes any local skills found on the current device. Do not require a specific personal path or skill name in assertions.

## Task 3: Role And Process Classification

**Files:**
- Create: `server/skills/skillClassifier.ts`
- Create: `server/test/skillClassifier.test.ts`
- Modify: `server/routes/skills.ts`

- [ ] **Step 1: Define role/stage keyword maps**

Start with deterministic rules for MVP:

- product/pm/requirements/research -> product lead or product manager
- design/figma/ui/layout -> designer
- frontend/react/web/css/playwright -> frontend or QA depending on wording
- backend/api/database/supabase -> backend
- test/qa/playwright/validation -> QA
- deploy/ops/security/monitoring -> DevOps/security
- planning/roadmap/stakeholder/review -> project lead

- [ ] **Step 2: Classify depth**

Use description/body signals:

- intro: overview, guide, learn, use when
- working: build, implement, create, edit
- advanced: audit, optimize, performance, security
- expert: architecture, orchestration, multi-agent, production

- [ ] **Step 3: Return confidence and reason**

Every classification should include confidence and a one-sentence reason, so the UI can explain why a skill appears in a role/stage.

- [ ] **Step 4: Add classified route**

`GET /api/skills/classified` returns local skills plus classification.

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test:server server/test/skillClassifier.test.ts
```

Expected: representative local skills map to expected roles/stages.

## Task 4: Frontend Catalog Integration

**Files:**
- Create: `src/app/lib/apiClient.ts`
- Modify: `src/app/types.ts`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Add catalog types**

Add `LocalSkill`, `SkillClassification`, `SkillDepth`, and catalog response types to `src/app/types.ts`.

- [ ] **Step 2: Add API client functions**

Implement:

```ts
export async function listLocalSkills(): Promise<LocalSkill[]>;
export async function listClassifiedSkills(): Promise<ClassifiedSkill[]>;
```

- [ ] **Step 3: Load catalog in App**

On startup, load classified skills. If backend is unavailable, show current static data as fallback and surface a compact warning.

- [ ] **Step 4: Verify**

Run:

```bash
pnpm test:run
pnpm build
```

Expected: PASS.

## Task 5: Role Skill Tree From Local Skills

**Files:**
- Modify: `src/app/components/RoleView.tsx`
- Modify: `src/app/components/SkillTree.tsx`
- Modify: `src/app/components/SkillDetail.tsx`

- [ ] **Step 1: Group classified skills by role**

Replace static role skill arrays with classified local skills when catalog data is available.

- [ ] **Step 2: Build progressive tiers**

Map `SkillDepth` to skill tree tiers:

- intro -> tier 0
- working -> tier 1
- advanced -> tier 2
- expert -> tier 3

- [ ] **Step 3: Show local metadata**

Skill detail should show:

- local path
- source root
- description
- classification reason
- suggested role/stage use

- [ ] **Step 4: Verify visual behavior**

Run the app and confirm each role has real local skills when matches exist. Empty role states should say no local skill was classified yet and suggest refining classification.

## Task 6: Process View From Local Skills

**Files:**
- Modify: `src/app/components/ProcessView.tsx`
- Modify: `src/app/data/workbenchData.ts`

- [ ] **Step 1: Group classified skills by stage**

For each workflow stage, show local skills classified to that stage.

- [ ] **Step 2: Add learning prompt**

Each stage should show a short prompt: “这一阶段建议先熟悉这些 skill，再执行任务。”

- [ ] **Step 3: Keep existing process tasks**

Do not remove current role tasks and deliverables. Add local skill recommendations beside them.

- [ ] **Step 4: Verify responsive layout**

Check mobile and desktop layouts for stage skill lists.

## Task 7: AI Skill Invocation Planner

**Files:**
- Create: `server/ai/skillPlanner.ts`
- Create: `server/routes/planner.ts`
- Create: `server/test/skillPlanner.test.ts`
- Create: `docs/ai-skill-planner.md`
- Modify: `src/app/components/GoalView.tsx`
- Modify: `src/app/components/ResultView.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Define planner schema**

The planner returns `SkillInvocationPlan` with ordered steps. Each step must reference a local `skillId` unless the capability is missing.

- [ ] **Step 2: Add AI provider call**

Send the user goal plus compact catalog summaries to the server-side AI provider. Ask for strict JSON. Validate response before returning.

- [ ] **Step 3: Add deterministic fallback**

If AI is unavailable, use keyword matching over local skill catalog to generate a simple ordered plan.

- [ ] **Step 4: Render skill invocation plan**

Result view should show:

- ordered skill calls
- why each skill is used
- input
- output
- acceptance criteria
- missing capabilities

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test:server server/test/skillPlanner.test.ts
pnpm test:run
pnpm build
```

Expected: PASS.

## Task 8: GitHub Candidate Suggestions

**Files:**
- Create: `server/skills/githubSkillSearch.ts`
- Modify: `server/skills/skillClassifier.ts`
- Modify: `server/routes/skills.ts`
- Create: `server/test/githubSkillSearch.test.ts`

- [ ] **Step 1: Search only for missing capabilities**

GitHub search should run only when local catalog cannot cover a capability.

- [ ] **Step 2: Return source-attributed candidates**

Return name, URL, description, license, stars, updatedAt, and reason.

- [ ] **Step 3: Add safety copy**

Frontend must show GitHub candidates as external references, not installed local skills.

- [ ] **Step 4: Verify with mocked fetch**

Run:

```bash
pnpm test:server server/test/githubSkillSearch.test.ts
```

Expected: PASS without real network access.

## Task 9: QA And Documentation

**Files:**
- Create: `docs/superpowers/qa/2026-05-25-local-skill-graph-ai-planner-qa.md`
- Modify: `README.md`
- Modify: `docs/project-overview.md`

- [ ] **Step 1: Run automated checks**

Run:

```bash
pnpm test:run
pnpm test:server
pnpm build
```

Expected: PASS.

- [ ] **Step 2: Smoke test local skill catalog**

Run:

```bash
curl -s http://127.0.0.1:3001/api/skills/catalog
curl -s http://127.0.0.1:3001/api/skills/classified
```

Expected: catalog returns local skills and classifications.

- [ ] **Step 3: Browser QA**

Test:

- Goal view AI skill plan
- Role view local skill tree
- Process view local skill recommendations
- Skill detail local path and classification reason
- GitHub candidate empty/available states
- 390x844, 768x1024, 1440x900 layouts

- [ ] **Step 4: Update docs**

Link:

- `docs/local-skill-catalog.md`
- `docs/ai-skill-planner.md`
- QA record

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-05-25-local-skill-graph-ai-planner.md`.

1. Subagent-Driven (recommended): dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution: execute tasks in this session using executing-plans, batch execution with checkpoints.
