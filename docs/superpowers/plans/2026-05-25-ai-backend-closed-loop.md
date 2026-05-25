# AI Backend Closed Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the workbench to a real backend and server-side AI generation flow so goals, generated plans, skill recommendations, stage progress, feedback, and skill states form a persistent product-development loop.

**Architecture:** Add a small Node API service beside the existing Vite frontend. The frontend calls backend endpoints through a typed API client; the backend owns AI provider calls, local skill catalog scanning, GitHub candidate search, persistence, validation, and fallback behavior. Keep the current local rule generator as an offline fallback, but make the normal path server-driven.

**Tech Stack:** React 18, Vite 6, TypeScript, Tailwind CSS 4, Vitest, Node API service, Hono or Express-style HTTP routing, file-backed SQLite or JSON persistence for the first local backend milestone, server-side AI provider adapter via environment variables.

---

## Product Contract

v0.2 must make the loop real:

1. User enters a goal in the Goal view.
2. Frontend sends the goal to the backend.
3. Backend calls a real AI provider with project workflow context.
4. Backend resolves recommended skills from local skill directories first.
5. If local skill coverage is missing, backend can search GitHub and attach candidate suggestions with source URLs and reasons.
6. Backend validates or normalizes the AI response into `GeneratedPlan`.
7. Backend persists the plan.
8. Frontend renders the saved plan and can reopen it from history.
9. User marks stage deliverables as done.
10. Backend persists stage progress.
11. User submits feedback from Process or Role view.
12. Backend persists feedback and exposes feedback counts/status.

Frontend must never read or expose the AI API key.
GitHub suggestions are recommendations only; v0.2 must not auto-install or execute remote code.

## Recommended Technical Decision

Use a local Node API first, with a replaceable persistence adapter:

- `server/` owns API routes, AI provider, repository layer, validation, and local persistence.
- `src/app/lib/apiClient.ts` owns frontend calls.
- `.env.example` documents `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `API_PORT`, `VITE_API_BASE_URL`, `LOCAL_SKILL_ROOTS`, and optional `GITHUB_TOKEN`.
- Local persistence can start with JSON files under `.data/` for fastest iteration, but repository interfaces must allow swapping to SQLite/Postgres/Supabase later.
- Local skill roots should default to known user skill locations and the project skill folder when present. GitHub search should be optional and cached.

This keeps v0.2 shippable without forcing a cloud decision today.

## File Structure

- Modify: `package.json`
  - Add backend dev scripts and backend dependencies.
- Create: `.env.example`
  - Document required local environment variables without secrets.
- Create: `server/index.ts`
  - Start the HTTP API server.
- Create: `server/types.ts`
  - Share backend request/response and repository types.
- Create: `server/data/workbenchContext.ts`
  - Export compact workflow context derived from the current local workbench data.
- Create: `server/skills/localSkillCatalog.ts`
  - Scan local skill roots and parse `SKILL.md` frontmatter/summary.
- Create: `server/skills/githubSkillSearch.ts`
  - Search GitHub for missing skill candidates and return source-attributed recommendations.
- Create: `server/skills/skillRecommendationService.ts`
  - Merge local skill matches and GitHub candidates into a normalized recommendation list.
- Create: `server/ai/aiProvider.ts`
  - Define provider interface and fallback behavior.
- Create: `server/ai/openAiCompatibleProvider.ts`
  - Implement server-side AI call through configurable endpoint/model/key.
- Create: `server/ai/ruleFallbackProvider.ts`
  - Adapt the existing local deterministic generation as fallback.
- Create: `server/repositories/workspaceRepository.ts`
  - Define persistence operations.
- Create: `server/repositories/fileWorkspaceRepository.ts`
  - Store workspace state in local JSON files.
- Create: `server/routes/health.ts`
  - `GET /api/health`.
- Create: `server/routes/plans.ts`
  - Plan generation, listing, retrieval, and progress routes.
- Create: `server/routes/feedback.ts`
  - Feedback create/list/update routes.
- Create: `server/routes/skillStates.ts`
  - Skill seen/unlocked state sync routes.
- Create: `server/routes/skills.ts`
  - Local skill catalog and skill recommendation routes.
- Create: `server/test/*.test.ts`
  - Cover provider fallback, repository persistence, and API response shapes.
- Create: `src/app/lib/apiClient.ts`
  - Typed frontend API client.
- Create: `src/app/lib/apiClient.test.ts`
  - Cover response parsing and error handling.
- Modify: `src/app/types.ts`
  - Add backend-backed plan history, progress, feedback, and API state types.
- Modify: `src/app/App.tsx`
  - Load initial state from backend, generate through backend, persist progress/feedback through backend.
- Modify: `src/app/components/GoalView.tsx`
  - Add loading/error states for AI generation.
- Modify: `src/app/components/ResultView.tsx`
  - Add plan history and stage progress controls.
- Create: `src/app/components/FeedbackPanel.tsx`
  - Submit and review backend feedback records.
- Modify: `src/app/components/ProcessView.tsx`
  - Wire feedback panel and feedback counts.
- Modify: `src/app/components/RoleView.tsx`
  - Wire feedback panel and feedback counts.
- Create: `docs/backend.md`
  - Backend architecture, API routes, environment variables, and local run instructions.
- Create: `docs/ai-provider.md`
  - AI provider contract, prompt shape, response schema, validation, and fallback behavior.
- Create: `docs/superpowers/qa/2026-05-25-ai-backend-closed-loop-qa.md`
  - Automated and manual QA record.

## API Contract

### `GET /api/health`

Returns:

```json
{
  "ok": true,
  "service": "skill-workbench-api",
  "aiProviderConfigured": true
}
```

### `POST /api/plans/generate`

Request:

```json
{
  "goal": "我们要从 0 到 1 做一个内部 AI 协作门户"
}
```

Returns:

```json
{
  "plan": {
    "id": "plan_...",
    "title": "内部 AI 协作门户 MVP",
    "goal": "我们要从 0 到 1 做一个内部 AI 协作门户",
    "createdAt": "2026-05-25T00:00:00.000Z",
    "stages": [],
    "recommendedSkills": [],
    "deliverables": []
  },
  "source": "ai"
}
```

`source` can be `"ai"` or `"fallback"`.

### `GET /api/plans`

Returns saved plans ordered by newest first.

### `GET /api/plans/:planId`

Returns one saved plan plus progress records.

### `PATCH /api/plans/:planId/stages/:stageId/progress`

Request:

```json
{
  "completedDeliverables": ["需求范围说明", "验收标准"]
}
```

Returns updated progress record.

### `GET /api/feedback?targetType=process&targetId=requirements`

Returns feedback records for a target.

### `POST /api/feedback`

Request:

```json
{
  "targetType": "process",
  "targetId": "requirements",
  "message": "这个阶段需要补一个风险评审产物"
}
```

Returns created feedback record.

### `PATCH /api/feedback/:feedbackId`

Request:

```json
{
  "status": "reviewed"
}
```

Returns updated feedback record.

### `GET /api/skills/catalog`

Returns locally available skills discovered from configured skill roots.

### `POST /api/skills/recommend`

Request:

```json
{
  "goal": "我要把复盘沉淀成可复用 skill",
  "missingCapabilities": ["复盘沉淀", "skill 创建"]
}
```

Returns:

```json
{
  "local": [
    {
      "id": "skill-creator",
      "name": "skill-creator",
      "source": "local",
      "path": "/home/current-user/.codex/skills/.system/skill-creator/SKILL.md",
      "reason": "本地存在用于创建和脚手架 skill 的说明"
    }
  ],
  "github": [
    {
      "name": "example/agent-skill",
      "source": "github",
      "url": "https://github.com/example/agent-skill",
      "reason": "本地没有匹配项时的候选参考",
      "license": "MIT",
      "stars": 120
    }
  ]
}
```

GitHub candidates must always show source URL. Do not install them automatically.

## Task 1: Backend Skeleton And Environment Contract

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `server/index.ts`
- Create: `server/routes/health.ts`
- Create: `docs/backend.md`

- [ ] **Step 1: Add backend scripts and dependencies**

Add scripts:

```json
{
  "dev:api": "tsx server/index.ts",
  "dev:full": "concurrently \"pnpm dev:api\" \"pnpm dev\"",
  "test:server": "vitest run server"
}
```

Add dev dependencies:

```json
{
  "concurrently": "9.1.2",
  "tsx": "4.19.2"
}
```

Add backend dependencies:

```json
{
  "@hono/node-server": "1.14.0",
  "hono": "4.7.4",
  "zod": "3.24.2"
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
pnpm install
```

Expected: lockfile updates and the new scripts can resolve.

- [ ] **Step 3: Create environment template**

Create `.env.example`:

```bash
API_PORT=3001
VITE_API_BASE_URL=http://127.0.0.1:3001
AI_PROVIDER=openai-compatible
AI_API_BASE_URL=https://api.openai.com/v1
AI_API_KEY=
AI_MODEL=
DATA_DIR=.data
LOCAL_SKILL_ROOTS=~/.codex/skills,~/.agents/skills,./skills
GITHUB_TOKEN=
```

- [ ] **Step 4: Create health route**

Implement `GET /api/health` returning the API service name and whether `AI_API_KEY` is configured.

- [ ] **Step 5: Document backend run flow**

Add `docs/backend.md` with:

- Required env vars.
- `pnpm dev:api`.
- `pnpm dev:full`.
- Health check command: `curl -s http://127.0.0.1:3001/api/health`.
- Security note: AI key only belongs on the server.
- Skill note: local skill roots are read-only; GitHub candidates are suggestions and require user approval before any future install.

- [ ] **Step 6: Verify health check**

Run:

```bash
pnpm dev:api
curl -s http://127.0.0.1:3001/api/health
```

Expected: JSON with `"ok": true`.

## Task 2: Shared Backend Domain And Repository

**Files:**
- Modify: `src/app/types.ts`
- Create: `server/types.ts`
- Create: `server/repositories/workspaceRepository.ts`
- Create: `server/repositories/fileWorkspaceRepository.ts`
- Create: `server/test/fileWorkspaceRepository.test.ts`

- [ ] **Step 1: Add shared workflow types**

Extend frontend `types.ts` with:

```ts
export type PlanSource = "ai" | "fallback";
export type FeedbackTargetType = "process" | "role" | "plan-stage";
export type FeedbackStatus = "open" | "reviewed";

export interface StageProgress {
  planId: string;
  stageId: string;
  completedDeliverables: string[];
  updatedAt: string;
}

export interface FeedbackRecord {
  id: string;
  targetType: FeedbackTargetType;
  targetId: string;
  message: string;
  status: FeedbackStatus;
  createdAt: string;
}
```

- [ ] **Step 2: Define repository interface**

`server/repositories/workspaceRepository.ts` should expose:

```ts
export interface WorkspaceRepository {
  listPlans(): Promise<GeneratedPlan[]>;
  getPlan(planId: string): Promise<GeneratedPlan | null>;
  savePlan(plan: GeneratedPlan): Promise<void>;
  getStageProgress(planId: string, stageId: string): Promise<StageProgress | null>;
  saveStageProgress(progress: StageProgress): Promise<StageProgress>;
  listFeedback(targetType?: FeedbackTargetType, targetId?: string): Promise<FeedbackRecord[]>;
  saveFeedback(record: FeedbackRecord): Promise<FeedbackRecord>;
  updateFeedbackStatus(feedbackId: string, status: FeedbackStatus): Promise<FeedbackRecord | null>;
}
```

- [ ] **Step 3: Implement file repository**

Store JSON under `${DATA_DIR:-.data}/workspace.json`. Writes should be atomic enough for local development: write a temp file, then rename it.

- [ ] **Step 4: Test repository persistence**

Create tests for:

- Saving and listing multiple plans newest first.
- Saving and reading stage progress.
- Creating and marking feedback reviewed.

Run:

```bash
pnpm test:server server/test/fileWorkspaceRepository.test.ts
```

Expected: PASS.

## Task 3: Skill Catalog And GitHub Recommendation Service

**Files:**
- Create: `server/skills/localSkillCatalog.ts`
- Create: `server/skills/githubSkillSearch.ts`
- Create: `server/skills/skillRecommendationService.ts`
- Create: `server/routes/skills.ts`
- Modify: `server/index.ts`
- Create: `server/test/skillRecommendationService.test.ts`
- Create: `docs/skill-recommendations.md`

- [ ] **Step 1: Define skill metadata shape**

Create a normalized shape:

```ts
export type SkillRecommendationSource = "local" | "github";

export interface LocalSkillMetadata {
  id: string;
  name: string;
  description: string;
  path: string;
  source: "local";
}

export interface GithubSkillCandidate {
  name: string;
  description: string;
  url: string;
  license?: string;
  stars?: number;
  updatedAt?: string;
  source: "github";
}
```

- [ ] **Step 2: Scan local skill roots**

Read discovered skill roots as portable paths. Use `LOCAL_SKILL_ROOTS` first when present, then project `./skills`, `CODEX_HOME/skills`, `~/.codex/skills`, and `~/.agents/skills`. Expand `~`, resolve relative paths from the project root, deduplicate absolute paths, and ignore missing roots with warnings. For each root, find `SKILL.md` files, parse YAML frontmatter when present, and return metadata.

- [ ] **Step 3: Match local skills first**

Implement a simple scoring function over skill name, description, and path. Return local matches before calling GitHub.

- [ ] **Step 4: Add GitHub fallback search**

When local score is below threshold, query GitHub search API using the missing capability terms. If `GITHUB_TOKEN` is present, send it server-side; if not present, use unauthenticated search with lower rate-limit expectations.

Return only metadata: repo full name, URL, description, license, stars, updated date, and reason. Do not download, install, or execute repository content.

- [ ] **Step 5: Add skill routes**

Add:

- `GET /api/skills/catalog`
- `POST /api/skills/recommend`

- [ ] **Step 6: Document skill recommendation behavior**

`docs/skill-recommendations.md` should explain:

- Local roots read order.
- Why local wins over GitHub.
- GitHub recommendation fields.
- Security stance: recommendation only, no automatic install.
- How users can later approve a skill install flow.

- [ ] **Step 7: Verify tests**

Run:

```bash
pnpm test:server server/test/skillRecommendationService.test.ts
```

Expected: PASS with mocked filesystem and mocked GitHub fetch.

## Task 4: AI Provider Adapter And Fallback

**Files:**
- Create: `server/ai/aiProvider.ts`
- Create: `server/ai/openAiCompatibleProvider.ts`
- Create: `server/ai/ruleFallbackProvider.ts`
- Create: `server/data/workbenchContext.ts`
- Create: `server/test/aiProvider.test.ts`
- Create: `docs/ai-provider.md`

- [ ] **Step 1: Define AI provider contract**

Create:

```ts
export interface GeneratePlanInput {
  goal: string;
}

export interface GeneratePlanResult {
  plan: GeneratedPlan;
  source: "ai" | "fallback";
}

export interface AiProvider {
  generatePlan(input: GeneratePlanInput): Promise<GeneratePlanResult>;
}
```

- [ ] **Step 2: Add compact workbench context**

Expose role names, process stages, stage outputs, known local skill ids/names, and GitHub candidate summaries. Do not send unnecessary UI copy to the model.

- [ ] **Step 3: Implement OpenAI-compatible provider**

The provider reads `AI_API_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` from server env. It sends the goal and workbench context to a chat/completions-style endpoint and asks for strict JSON matching `GeneratedPlan`.

If the key or model is missing, throw a typed configuration error that the route can catch.

- [ ] **Step 4: Implement fallback provider**

Use the existing deterministic logic as the fallback. It should return `source: "fallback"`.

- [ ] **Step 5: Normalize AI output**

Validate AI JSON before saving. If the model returns malformed content, fall back to deterministic generation and include `source: "fallback"`.

- [ ] **Step 6: Document AI behavior**

`docs/ai-provider.md` should include:

- Where the API key lives.
- Prompt responsibilities.
- Expected JSON schema.
- Fallback behavior.
- Known limitations.

- [ ] **Step 7: Verify provider tests**

Run:

```bash
pnpm test:server server/test/aiProvider.test.ts
```

Expected: PASS for fallback and malformed-response handling. Do not call the real network in unit tests.

## Task 5: Plan And Progress API Routes

**Files:**
- Create: `server/routes/plans.ts`
- Modify: `server/index.ts`
- Create: `server/test/plansRoutes.test.ts`

- [ ] **Step 1: Add generate route**

`POST /api/plans/generate` validates the goal, calls the AI provider, saves the resulting plan, and returns `{ plan, source }`.

- [ ] **Step 2: Add plan history route**

`GET /api/plans` returns saved plans ordered newest first.

- [ ] **Step 3: Add plan detail route**

`GET /api/plans/:planId` returns:

```json
{
  "plan": {},
  "progress": []
}
```

Return 404 when missing.

- [ ] **Step 4: Add progress update route**

`PATCH /api/plans/:planId/stages/:stageId/progress` validates `completedDeliverables` and persists the record.

- [ ] **Step 5: Verify route tests**

Run:

```bash
pnpm test:server server/test/plansRoutes.test.ts
```

Expected: PASS.

## Task 6: Feedback And Skill State API Routes

**Files:**
- Create: `server/routes/feedback.ts`
- Create: `server/routes/skillStates.ts`
- Modify: `server/index.ts`
- Create: `server/test/feedbackRoutes.test.ts`

- [ ] **Step 1: Add feedback list route**

`GET /api/feedback` supports optional `targetType` and `targetId` query filters.

- [ ] **Step 2: Add feedback create route**

`POST /api/feedback` creates a record with `status: "open"` and server timestamp.

- [ ] **Step 3: Add feedback status route**

`PATCH /api/feedback/:feedbackId` updates status to `"open"` or `"reviewed"`.

- [ ] **Step 4: Add skill state sync route**

Add simple endpoints for seen/unlocked skill ids:

- `GET /api/skill-states`
- `PUT /api/skill-states`

This keeps current skill update behavior persistent beyond one browser.

- [ ] **Step 5: Verify route tests**

Run:

```bash
pnpm test:server server/test/feedbackRoutes.test.ts
```

Expected: PASS.

## Task 7: Frontend API Client

**Files:**
- Create: `src/app/lib/apiClient.ts`
- Create: `src/app/lib/apiClient.test.ts`

- [ ] **Step 1: Create typed client**

Implement functions:

```ts
export async function generatePlan(goal: string): Promise<{ plan: GeneratedPlan; source: PlanSource }>;
export async function listPlans(): Promise<GeneratedPlan[]>;
export async function getPlan(planId: string): Promise<{ plan: GeneratedPlan; progress: StageProgress[] }>;
export async function updateStageProgress(planId: string, stageId: string, completedDeliverables: string[]): Promise<StageProgress>;
export async function listFeedback(targetType?: FeedbackTargetType, targetId?: string): Promise<FeedbackRecord[]>;
export async function createFeedback(targetType: FeedbackTargetType, targetId: string, message: string): Promise<FeedbackRecord>;
export async function updateFeedbackStatus(feedbackId: string, status: FeedbackStatus): Promise<FeedbackRecord>;
export async function listSkillCatalog(): Promise<LocalSkillMetadata[]>;
export async function recommendSkills(goal: string, missingCapabilities: string[]): Promise<SkillRecommendationResponse>;
```

Read base URL from `import.meta.env.VITE_API_BASE_URL`, defaulting to `http://127.0.0.1:3001`.

- [ ] **Step 2: Add error handling**

Throw readable errors for non-2xx responses and invalid JSON.

- [ ] **Step 3: Verify client tests**

Run:

```bash
pnpm test:run src/app/lib/apiClient.test.ts
```

Expected: PASS using mocked `fetch`.

## Task 8: Wire AI Generation In Goal Flow

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/components/GoalView.tsx`
- Modify: `src/app/lib/planGeneration.ts`

- [ ] **Step 1: Add generation UI states**

`GoalView` should accept:

```ts
isGenerating: boolean;
generationError: string | null;
generationSource: PlanSource | null;
```

Disable the submit button while generating and show a concise error panel when backend generation fails.

- [ ] **Step 2: Resolve skills before generation**

Before calling the plan generation endpoint, call `recommendSkills(goal, [])` or let `/api/plans/generate` call the recommendation service internally. The generated plan should mark whether recommended skills are local or GitHub candidates.

- [ ] **Step 3: Call backend generate endpoint**

In `handleGenerate`, call `apiClient.generatePlan(goal)`. On success, save the active plan in frontend state and switch to result view.

- [ ] **Step 4: Keep deterministic fallback available**

If backend is unreachable, show the error and offer a button: `使用本地规则生成`. That button uses existing `createGeneratedPlan`.

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test:run
pnpm build
```

Expected: PASS.

## Task 9: Plan History And Stage Progress UI

**Files:**
- Create: `src/app/components/PlanHistoryPanel.tsx`
- Modify: `src/app/components/ResultView.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Load plan history on startup**

On app startup, fetch `GET /api/plans`. If backend is unavailable, retain local snapshot behavior and show a non-blocking backend status warning.

- [ ] **Step 2: Add plan history panel**

Render saved plans with title, created date, and goal preview. Selecting a plan loads detail from backend.

- [ ] **Step 3: Add deliverable checklist**

Render stage deliverables as checkboxes and persist changes through `PATCH /api/plans/:planId/stages/:stageId/progress`.

- [ ] **Step 4: Verify persistence**

Generate a plan, check a deliverable, refresh the browser, and confirm the checkbox remains checked.

## Task 10: Feedback Closed Loop UI

**Files:**
- Create: `src/app/components/FeedbackPanel.tsx`
- Modify: `src/app/components/ProcessView.tsx`
- Modify: `src/app/components/RoleView.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Create feedback panel**

Build a compact dark drawer/dialog that lists feedback records, supports submit, and marks records reviewed.

- [ ] **Step 2: Wire Process feedback**

Target: `targetType: "process"`, `targetId: activeStageId`.

- [ ] **Step 3: Wire Role feedback**

Target: `targetType: "role"`, `targetId: activeRoleId`.

- [ ] **Step 4: Show counts**

Display open feedback count near the feedback button. Keep the button compact and consistent with existing UI.

- [ ] **Step 5: Verify persistence**

Submit feedback, refresh, and confirm the record is still visible from backend.

## Task 11: End-To-End Smoke Test And QA Docs

**Files:**
- Create: `scripts/smoke-ai-backend.mjs`
- Create: `docs/superpowers/qa/2026-05-25-ai-backend-closed-loop-qa.md`
- Modify: `README.md`
- Modify: `docs/project-overview.md`

- [ ] **Step 1: Add smoke test**

The smoke test should:

1. Check `/api/health`.
2. Generate a plan.
3. List local skill catalog.
4. Request skill recommendations with mocked/no-network GitHub fallback expectations.
5. List plans and find the generated plan.
6. Update one stage progress record.
7. Create one feedback record.
8. Mark feedback reviewed.

- [ ] **Step 2: Run full verification**

Run:

```bash
pnpm test:run
pnpm test:server
pnpm build
node scripts/smoke-ai-backend.mjs
```

Expected: all pass. If no `AI_API_KEY` is configured, smoke test should assert fallback generation works and clearly label it.

- [ ] **Step 3: Manual browser QA**

Test:

- 390x844
- 768x1024
- 1440x900

Cover:

- AI generation loading and result state.
- Backend unavailable error.
- Local fallback generation.
- Local skill catalog results.
- GitHub candidate display when local skill is missing.
- Plan history switching.
- Stage progress persistence.
- Feedback submission and review.
- Existing skill tree update states.

- [ ] **Step 4: Update docs**

README should link:

- `docs/backend.md`
- `docs/ai-provider.md`
- `docs/skill-recommendations.md`
- QA record

`docs/project-overview.md` should update current scope after implementation is complete.

## Open Decisions Before Execution

These can be decided at implementation start:

- AI provider: OpenAI-compatible API, local model proxy, or another provider.
- First persistence adapter: local JSON file, SQLite, Supabase, or Postgres.
- Whether v0.2 needs cloud deployment now, or only a local backend.

Default recommendation: OpenAI-compatible provider + local JSON repository for the first working slice, then swap persistence once the API shape is stable.

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-05-25-ai-backend-closed-loop.md`.

1. Subagent-Driven (recommended): dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution: execute tasks in this session using executing-plans, batch execution with checkpoints.
