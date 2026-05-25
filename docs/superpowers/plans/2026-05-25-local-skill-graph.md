# Local Skill Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically read local `SKILL.md` files on any device, classify them with deterministic rules, and render them as role-based and process-based skill trees without using AI.

**Architecture:** Add a minimal local API service that can read skill files from portable local roots, parse metadata, classify skills with transparent rules, and expose a typed catalog to the existing Vite frontend. The frontend keeps the current workbench shape but replaces static demo skill data with catalog-derived role and process skill trees. No AI provider, GitHub search, or network access is required for v0.2.

**Tech Stack:** React 18, Vite 6, TypeScript, Tailwind CSS 4, Vitest, Node API service, Hono or Express-style HTTP routing, local filesystem read-only scanning.

---

## Product Contract

v0.2 answers:

- 当前设备本地有哪些 skill？
- 每个 skill 来自哪个本地路径？
- 每个 skill 适合哪个角色、哪个流程阶段、什么学习深度？
- 用户按角色浏览时，如何从入门到深入熟悉这些 skill？
- 用户按流程浏览时，当前阶段应该重点看哪些本地 skill？
- 用户按目标输入时，系统能否用规则推荐相关 skill，而不调用 AI？

This is a local graph feature, not an AI feature and not a package manager.

## Portable Skill Discovery

The implementation must work on any developer machine and must not hard-code a personal path.

Discovery order:

1. `LOCAL_SKILL_ROOTS` when explicitly configured.
2. Project-local `./skills`, resolved from the current project root.
3. `${CODEX_HOME}/skills` when `CODEX_HOME` is set.
4. `${HOME}/.codex/skills`, resolved with `os.homedir()`.
5. `${HOME}/.agents/skills`, resolved with `os.homedir()`.

Path handling requirements:

- Expand `~` to the current user's home directory.
- Resolve relative paths from the project root.
- Support absolute paths on macOS, Linux, and Windows.
- Deduplicate resolved absolute paths.
- Skip missing or unreadable roots with warnings.
- Work when a device has many skills, a few skills, or no skill roots yet.

## File Structure

- Modify: `package.json`
  - Add API scripts and backend dependencies.
- Create: `.env.example`
  - Document API port and optional local skill roots.
- Create: `server/index.ts`
  - Start API server.
- Create: `server/routes/health.ts`
  - Report API status and discovered skill roots.
- Create: `server/types.ts`
  - Backend types for local skills, classifications, and recommendations.
- Create: `server/skills/skillRoots.ts`
  - Resolve portable skill roots.
- Create: `server/skills/localSkillCatalog.ts`
  - Read local `SKILL.md` files and parse frontmatter/body summary.
- Create: `server/skills/skillClassifier.ts`
  - Map skills to roles, workflow stages, tags, and learning depth.
- Create: `server/skills/skillRecommender.ts`
  - Recommend local skills for goal text using deterministic matching.
- Create: `server/routes/skills.ts`
  - Expose catalog, classified graph, and recommendation endpoints.
- Create: `server/test/*.test.ts`
  - Cover root resolution, catalog scanning, classification, and recommendation.
- Create: `src/app/lib/apiClient.ts`
  - Typed frontend client for local skill APIs.
- Modify: `src/app/types.ts`
  - Add local skill graph types.
- Modify: `src/app/App.tsx`
  - Load local skill graph and pass classified skills to views.
- Modify: `src/app/components/GoalView.tsx`
  - Show deterministic skill recommendations for goal input.
- Modify: `src/app/components/ProcessView.tsx`
  - Show catalog-derived skills per process stage.
- Modify: `src/app/components/RoleView.tsx`
  - Show catalog-derived role skill tree.
- Modify: `src/app/components/SkillTree.tsx`
  - Support catalog-derived nodes and local skill metadata.
- Modify: `src/app/components/SkillDetail.tsx`
  - Show local path, source root, description, tags, depth, and classification reason.
- Create: `docs/local-skill-graph.md`
  - Document discovery, classification, empty states, and safety.
- Create: `docs/superpowers/qa/2026-05-25-local-skill-graph-qa.md`
  - Record automated and browser QA.

## Data Model

```ts
export type SkillDepth = "intro" | "working" | "advanced" | "expert";

export interface LocalSkillRoot {
  path: string;
  exists: boolean;
  source: "env" | "project" | "codex-home" | "home-codex" | "home-agents";
}

export interface LocalSkill {
  id: string;
  name: string;
  description: string;
  path: string;
  root: string;
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

export interface ClassifiedSkill {
  skill: LocalSkill;
  classification: SkillClassification;
}

export interface SkillRecommendation {
  skillId: string;
  score: number;
  reason: string;
  matchedTerms: string[];
}
```

## API Contract

### `GET /api/health`

Returns:

```json
{
  "ok": true,
  "service": "skill-workbench-api",
  "skillRoots": [
    {
      "path": "/resolved/path/to/skills",
      "exists": true,
      "source": "home-codex"
    }
  ]
}
```

### `GET /api/skills/catalog`

Returns parsed local skills.

### `GET /api/skills/classified`

Returns local skills plus role/stage/depth classification.

### `POST /api/skills/recommend`

Request:

```json
{
  "goal": "我要把一个想法从 0 到 1 做成 MVP"
}
```

Returns deterministic local skill recommendations with matched terms and reasons.

## Task 1: API Skeleton And Root Discovery

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `server/index.ts`
- Create: `server/routes/health.ts`
- Create: `server/skills/skillRoots.ts`
- Create: `server/test/skillRoots.test.ts`

- [x] **Step 1: Add scripts and dependencies**

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

- [x] **Step 2: Add env example**

```bash
API_PORT=3001
VITE_API_BASE_URL=http://127.0.0.1:3001
LOCAL_SKILL_ROOTS=~/.codex/skills,~/.agents/skills,./skills
```

- [x] **Step 3: Implement portable root resolution**

`server/skills/skillRoots.ts` should resolve roots from env, project, `CODEX_HOME`, and `os.homedir()`. Tests must use temp directories and fake env/home values, not real user paths.

- [x] **Step 4: Add health route**

Health returns service status and discovered roots.

- [x] **Step 5: Verify**

Run:

```bash
pnpm install
pnpm test:server server/test/skillRoots.test.ts
pnpm dev:api
curl -s http://127.0.0.1:3001/api/health
```

Expected: tests pass and health returns JSON with `skillRoots`.

## Task 2: Local Skill Catalog Scanner

**Files:**
- Create: `server/skills/localSkillCatalog.ts`
- Create: `server/test/localSkillCatalog.test.ts`
- Create: `server/routes/skills.ts`

- [x] **Step 1: Parse `SKILL.md` files**

Scan discovered roots recursively for `SKILL.md`. Parse YAML frontmatter fields `name` and `description`. Store path, root, body summary, and inferred tags.

- [x] **Step 2: Normalize skill ids**

Use a stable id derived from root source plus relative skill directory. Do not include absolute home paths in ids.

- [x] **Step 3: Handle empty roots**

If no skills are found, return an empty catalog and a warning. Do not fail app startup.

- [x] **Step 4: Add catalog route**

`GET /api/skills/catalog` returns all local skills sorted by name.

- [x] **Step 5: Verify**

Run:

```bash
pnpm test:server server/test/localSkillCatalog.test.ts
```

Expected: PASS with fixture `SKILL.md` files in temp directories.

## Task 3: Deterministic Classification

**Files:**
- Create: `server/skills/skillClassifier.ts`
- Create: `server/test/skillClassifier.test.ts`
- Modify: `server/routes/skills.ts`

- [x] **Step 1: Define keyword maps**

Create role and stage keyword maps. Start with project lead, product, design, frontend, backend, QA, DevOps/security, and documentation/ops categories.

- [x] **Step 2: Classify depth**

Map language signals to `intro`, `working`, `advanced`, or `expert`.

- [x] **Step 3: Return reason**

Every classification includes confidence and a human-readable reason based on matched terms.

- [x] **Step 4: Add classified route**

`GET /api/skills/classified` returns local skills plus classifications.

- [x] **Step 5: Verify**

Run:

```bash
pnpm test:server server/test/skillClassifier.test.ts
```

Expected: PASS with deterministic fixture cases.

## Task 4: Deterministic Goal Recommendation

**Files:**
- Create: `server/skills/skillRecommender.ts`
- Create: `server/test/skillRecommender.test.ts`
- Modify: `server/routes/skills.ts`

- [x] **Step 1: Score goal against catalog**

Score by matches across skill name, description, body summary, tags, role ids, and stage ids.

- [x] **Step 2: Explain matches**

Return `matchedTerms` and `reason` for each recommendation.

- [x] **Step 3: Add recommend route**

`POST /api/skills/recommend` returns top recommendations, grouped by likely role and stage when possible.

- [x] **Step 4: Verify**

Run:

```bash
pnpm test:server server/test/skillRecommender.test.ts
```

Expected: PASS. No AI or network mocks needed.

## Task 5: Frontend Graph Integration

**Files:**
- Create: `src/app/lib/apiClient.ts`
- Modify: `src/app/types.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/app/components/RoleView.tsx`
- Modify: `src/app/components/ProcessView.tsx`
- Modify: `src/app/components/SkillTree.tsx`
- Modify: `src/app/components/SkillDetail.tsx`

- [ ] **Step 1: Add frontend types and API client**

Add local skill graph types and client functions for health, catalog, classified skills, and recommendations.

- [ ] **Step 2: Load graph on startup**

Load classified skills from backend. If backend is unavailable, retain current static data fallback and show a compact warning.

- [ ] **Step 3: Render role graph**

Use classified local skills grouped by role. Map depth to skill tree tiers.

- [ ] **Step 4: Render process recommendations**

Use classified local skills grouped by stage. Keep existing process tasks and deliverables.

- [ ] **Step 5: Render local skill details**

Show path, root, description, tags, depth, confidence, and classification reason.

- [ ] **Step 6: Verify**

Run:

```bash
pnpm test:run
pnpm build
```

Expected: PASS.

## Task 6: Goal View Rule Recommendations

**Files:**
- Modify: `src/app/components/GoalView.tsx`
- Modify: `src/app/components/ResultView.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Call recommend endpoint**

When the user submits a goal, call `POST /api/skills/recommend` instead of AI planning.

- [ ] **Step 2: Show recommendation result**

Show recommended local skills, matched terms, role/stage grouping, and next suggested stage.

- [ ] **Step 3: Keep existing generated plan fallback**

If the local API is unavailable, keep the existing rule-based generated plan as fallback.

- [ ] **Step 4: Verify**

Run:

```bash
pnpm test:run
pnpm build
```

Expected: PASS.

## Task 7: QA And Documentation

**Files:**
- Create: `docs/local-skill-graph.md`
- Create: `docs/superpowers/qa/2026-05-25-local-skill-graph-qa.md`
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

- [ ] **Step 2: Smoke test local APIs**

Run:

```bash
curl -s http://127.0.0.1:3001/api/health
curl -s http://127.0.0.1:3001/api/skills/catalog
curl -s http://127.0.0.1:3001/api/skills/classified
```

Expected: APIs return JSON whether local skills exist or not.

- [ ] **Step 3: Browser QA**

Test:

- Empty skill roots state.
- Role view local skill tree.
- Process view local skill recommendations.
- Skill detail local path and classification reason.
- Goal view deterministic recommendations.
- 390x844, 768x1024, 1440x900 layouts.

- [ ] **Step 4: Update docs**

Document local discovery, deterministic classification rules, privacy/safety, and how users can configure skill roots.

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-05-25-local-skill-graph.md`.

1. Subagent-Driven (recommended): dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution: execute tasks in this session using executing-plans, batch execution with checkpoints.
