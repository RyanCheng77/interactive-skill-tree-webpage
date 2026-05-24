# Product RD Workbench MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the local-only 产研流程角色工作台 MVP with three entries: 按目标, 按流程, 按角色.

**Architecture:** Split the current single-file app into focused data, pure logic, persistence, export, and view components. Keep all data local and deterministic; generated plans are rule-based from templates and process/role data. Preserve the existing skill-tree value, visual language, and motion system, then embed the skill tree inside the new role workbench with update states. Build all views mobile-first: single-column on phones, compact stacked navigation, and two-column workbench layouts only from `lg` breakpoints upward.

**Tech Stack:** React 18, Vite 6, TypeScript, Tailwind CSS, lucide-react, Vitest for pure function tests, localStorage for persistence.

---

## Mandatory Visual And Motion Contract

Implementation must strictly follow the style already present in `src/app/App.tsx`. The structural wireframes in the design spec are not permission to switch to a white SaaS dashboard style.

Use these existing style rules throughout implementation:

- Keep the dark forge palette:
  - App/page backgrounds: `#070710`, `#08080e`, `#09090f`
  - Panels/cards: `#0a0a12`, `#0d0d16`, `#0e0e18`, `#12121e`
  - Borders/dividers: `#1a1a28`, `#222230`
  - Muted text: `#3a3a50`, `#4a4a60`, `#a09080`
  - Primary text: `#e8dcc8`, `#e0d0b8`, `#c8bca8`
- Keep role colors from data:
  - `color`, `glowColor`, and `accentColor` drive selected states, active tabs, update badges, progress, and skill highlights.
- Keep typography:
  - Brand and major headings use `fontFamily: "'Cinzel', serif"`.
  - Descriptive copy uses `fontFamily: "'Crimson Pro', serif"`.
  - Status labels, tier labels, install commands, counters, and metadata use `font-mono` / `JetBrains Mono`.
- Keep motion behavior:
  - Skill node selected glow uses SVG `<animate>` pulse as in the current `SkillNode`.
  - Available skill nodes use the existing pulsing ring.
  - Buttons use `transition-all duration-150/200`, `hover:brightness-110`, and `active:scale-95` where actions are primary.
  - Avoid large unrelated page transitions; motion should remain subtle and node/status driven.
- Keep component density:
  - Prefer `rounded-lg` and tight operational panels.
  - Avoid `rounded-3xl`, white cards, and large light-gray dashboard surfaces in final code.
- Preserve game-like skill tree expression:
  - Tier badge, locked/available/unlocked states, connector lines, selected node pulse, update badge, and skill detail panel must feel like the existing skill tree.

Before implementation, update any plan snippet that still uses white/slate demo classes into this dark forge style. If a snippet and this contract conflict, this contract wins.

## File Structure

- Modify: `package.json`
  - Add `test` and `test:run` scripts.
  - Add Vitest dev dependency.
- Create: `src/app/types.ts`
  - Own shared domain types: entry mode, role, skill, process stage, goal template, generated plan.
- Create: `src/app/data/workbenchData.ts`
  - Own static MVP data: roles, process stages, goal templates, skill tree data, default generated plan seed values.
- Create: `src/app/lib/skillState.ts`
  - Own pure skill status and update-count logic.
- Create: `src/app/lib/planGeneration.ts`
  - Own pure rule-based generated plan creation and recommendation batching.
- Create: `src/app/lib/storage.ts`
  - Own localStorage keys, serialization, hydration, and safe fallbacks.
- Create: `src/app/lib/exportPlan.ts`
  - Own Markdown and JSON export generation.
- Create: `src/app/lib/*.test.ts`
  - Test pure behavior in skill state, plan generation, storage fallback helpers, and export formatting.
- Create: `src/app/components/WorkbenchShell.tsx`
  - Own responsive navigation and page frame. On desktop it is a left sidebar; on mobile it becomes a top stacked workspace header.
- Create: `src/app/components/GoalView.tsx`
  - Own AI-style goal input, recommendation cards, and 换一批 behavior. Cards are one column on mobile and three columns on desktop.
- Create: `src/app/components/ResultView.tsx`
  - Own generated plan result page with breadcrumb, phase directory, current stage detail, regenerate, and export actions. Phase directory stacks above detail on mobile.
- Create: `src/app/components/ProcessView.tsx`
  - Own process-stage selector and current-stage workbench. Stage selector stacks above current-stage detail on mobile.
- Create: `src/app/components/RoleView.tsx`
  - Own role selector, current-role workbench, feedback button, and default-expanded skill tree. Role selector stacks above current-role detail on mobile.
- Create: `src/app/components/SkillTree.tsx`
  - Own skill tree/list rendering, update badges, and selected skill callbacks. Skill nodes render as one column on mobile, two on tablet, four on desktop.
- Create: `src/app/components/SkillDetail.tsx`
  - Own selected skill details, install command copy, update summary, and mark-as-seen action.
- Modify: `src/app/App.tsx`
  - Reduce to application state orchestration and route between the three entry views plus result view.

## Task 1: Test Harness And Shared Types

**Files:**
- Modify: `package.json`
- Create: `src/app/types.ts`

- [ ] **Step 1: Add test scripts and Vitest**

Edit `package.json` so the scripts and devDependencies include:

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "devDependencies": {
    "@tailwindcss/vite": "4.1.12",
    "@vitejs/plugin-react": "4.7.0",
    "tailwindcss": "4.1.12",
    "vite": "6.3.5",
    "vitest": "2.1.9"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
pnpm install
```

Expected: lockfile is created or updated and `vitest` is available.

- [ ] **Step 3: Create shared types**

Create `src/app/types.ts`:

```ts
export type EntryMode = "goal" | "process" | "role";
export type ResultMode = "none" | "generated";
export type SkillStatus = "locked" | "available" | "unlocked";
export type SkillUpdateType = "new" | "updated" | "review";

export interface Skill {
  id: string;
  roleId: string;
  name: string;
  tagline: string;
  intro: string;
  tier: number;
  col: number;
  prereqs: string[];
  status: SkillStatus;
  version: string;
  size: string;
  downloads: number;
  tags: string[];
  tryUrl: string;
  installCmd: string;
  homepage: string;
  updatedAt?: string;
  changeSummary?: string;
  updateType?: SkillUpdateType;
}

export interface Role {
  id: string;
  name: string;
  title: string;
  shortTitle: string;
  color: string;
  glowColor: string;
  accentColor: string;
  icon: "lightbulb" | "palette" | "monitor" | "server" | "flask" | "cloud" | "crown";
  skills: Skill[];
}

export interface ProcessStage {
  id: string;
  index: number;
  name: string;
  shortName: string;
  summary: string;
  input: string;
  output: string;
  nextStageId?: string;
  roleTasks: RoleTask[];
  skills: string[];
  deliverables: string[];
}

export interface RoleTask {
  roleId: string;
  task: string;
  output: string;
  skills: string[];
}

export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
}

export interface GeneratedPlan {
  id: string;
  title: string;
  goal: string;
  createdAt: string;
  stages: ProcessStage[];
  recommendedSkills: string[];
  deliverables: string[];
}

export interface AppStateSnapshot {
  entryMode: EntryMode;
  activeRoleId: string;
  activeStageId: string;
  selectedSkillId: string | null;
  selectedPlanId: string | null;
  goalInput: string;
  recommendationBatch: number;
  unlockedSkillIds: string[];
  seenSkillIds: string[];
  generatedPlan?: GeneratedPlan;
}
```

- [ ] **Step 4: Verify build still runs**

Run:

```bash
pnpm run build
```

Expected: build succeeds or fails only because imports have not started using the new file. If it fails for missing lockfile dependencies, run `pnpm install` again and rerun.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/app/types.ts
git commit -m "chore: add workbench types and test harness"
```

## Task 2: Static Workbench Data

**Files:**
- Create: `src/app/data/workbenchData.ts`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Create the data module**

Create `src/app/data/workbenchData.ts` with this shape. Move the existing role skill entries from `src/app/App.tsx` into the `skills` arrays and add the new project-owner role at the top:

```ts
import type { GoalTemplate, ProcessStage, Role } from "../types";

export const TIER_LABELS = ["入门", "进阶", "熟练", "精通"] as const;

export const ROLES: Role[] = [
  {
    id: "lead",
    name: "项目负责人",
    title: "统筹与决策",
    shortTitle: "统筹",
    color: "#111827",
    glowColor: "rgba(17,24,39,0.18)",
    accentColor: "#4b5563",
    icon: "crown",
    skills: [
      {
        id: "lead-1",
        roleId: "lead",
        name: "目标拆解",
        tagline: "把模糊目标拆成 MVP 边界",
        intro: "用于明确目标、用户、范围、验收口径和决策节奏，是项目负责人推进 MVP 的起点。",
        tier: 0,
        col: 1,
        prereqs: [],
        status: "available",
        version: "v1.3",
        size: "项目方法",
        downloads: 12000,
        tags: ["目标", "范围", "验收"],
        tryUrl: "#",
        installCmd: "use skill brainstorming",
        homepage: "#",
        updatedAt: "2026-05-22",
        changeSummary: "补充 MVP 边界判断清单。",
        updateType: "updated",
      },
      {
        id: "lead-2",
        roleId: "lead",
        name: "范围管理",
        tagline: "控制本轮做与不做",
        intro: "用于把想法收敛成本轮可交付范围，并明确延期项与下一期候选。",
        tier: 1,
        col: 0,
        prereqs: ["lead-1"],
        status: "locked",
        version: "v1.0",
        size: "项目方法",
        downloads: 6800,
        tags: ["范围", "优先级", "取舍"],
        tryUrl: "#",
        installCmd: "export MVP scope decision",
        homepage: "#",
        updatedAt: "2026-05-22",
        changeSummary: "新增砍范围决策模板。",
        updateType: "new",
      },
      {
        id: "lead-3",
        roleId: "lead",
        name: "评审组织",
        tagline: "组织关键节点评审",
        intro: "用于安排需求、设计、开发、上线前后的评审节奏与决策记录。",
        tier: 1,
        col: 2,
        prereqs: ["lead-1"],
        status: "locked",
        version: "v1.0",
        size: "项目方法",
        downloads: 5600,
        tags: ["评审", "决策", "协作"],
        tryUrl: "#",
        installCmd: "create review checklist",
        homepage: "#",
      },
      {
        id: "lead-4",
        roleId: "lead",
        name: "跨角色协同",
        tagline: "连接产品设计研发测试运维",
        intro: "用于识别各角色交接点、依赖和风险。",
        tier: 2,
        col: 1,
        prereqs: ["lead-2", "lead-3"],
        status: "locked",
        version: "v1.0",
        size: "项目方法",
        downloads: 4200,
        tags: ["协同", "依赖", "风险"],
        tryUrl: "#",
        installCmd: "create role collaboration map",
        homepage: "#",
      },
      {
        id: "lead-5",
        roleId: "lead",
        name: "复盘沉淀",
        tagline: "把项目经验沉淀成文档和 skill",
        intro: "用于在项目结束后总结经验、更新流程、沉淀可复用 skill。",
        tier: 3,
        col: 1,
        prereqs: ["lead-4"],
        status: "locked",
        version: "v1.0",
        size: "项目方法",
        downloads: 2600,
        tags: ["复盘", "文档", "skill"],
        tryUrl: "#",
        installCmd: "create retrospective and skill candidate",
        homepage: "#",
      },
    ],
  },
  // Move the existing product/designer/frontend/backend/qa/devops role objects here.
  // Replace `icon: <Lightbulb size={16} />` with `icon: "lightbulb"` and add `roleId` to every skill.
];

export const PROCESS_STAGES: ProcessStage[] = [
  {
    id: "discovery",
    index: 1,
    name: "机会发现",
    shortName: "机会",
    summary: "识别问题、用户和业务机会。",
    input: "业务目标、用户反馈、团队假设",
    output: "机会与目标假设",
    nextStageId: "requirements",
    roleTasks: [
      { roleId: "lead", task: "判断是否值得进入 MVP 规划。", output: "机会判断", skills: ["lead-1"] },
      { roleId: "pm", task: "整理用户场景和问题证据。", output: "用户场景", skills: ["pm-1"] },
    ],
    skills: ["lead-1", "pm-1"],
    deliverables: ["机会说明", "目标假设"],
  },
  {
    id: "requirements",
    index: 2,
    name: "需求定义",
    shortName: "需求",
    summary: "把模糊目标收敛成可设计、可实现、可验收的 MVP 范围。",
    input: "机会与目标假设",
    output: "需求规格与验收口径",
    nextStageId: "design",
    roleTasks: [
      { roleId: "lead", task: "明确 MVP 边界、验收标准和决策节奏。", output: "目标与验收标准", skills: ["lead-1"] },
      { roleId: "pm", task: "整理目标用户、核心场景、功能范围与优先级。", output: "需求范围", skills: ["pm-1", "pm-3"] },
      { roleId: "designer", task: "提前识别交互复杂度和设计验证风险。", output: "设计输入", skills: ["ds-1"] },
      { roleId: "frontend", task: "识别前端实现复杂点。", output: "前端风险", skills: ["fe-1"] },
    ],
    skills: ["lead-1", "pm-1", "pm-3", "ds-1", "fe-1"],
    deliverables: ["MVP 目标与范围", "角色协作路径", "验收标准"],
  },
  {
    id: "design",
    index: 3,
    name: "设计验证",
    shortName: "设计",
    summary: "把需求范围转为流程、界面和可验证原型。",
    input: "需求规格与验收口径",
    output: "流程图、原型和设计交付",
    nextStageId: "implementation",
    roleTasks: [
      { roleId: "designer", task: "完成核心流程和首屏设计。", output: "设计稿", skills: ["ds-1", "ds-2"] },
      { roleId: "pm", task: "确认原型是否覆盖核心场景。", output: "评审结论", skills: ["pm-2"] },
    ],
    skills: ["ds-1", "ds-2", "pm-2"],
    deliverables: ["流程图", "原型", "设计验收说明"],
  },
  {
    id: "implementation",
    index: 4,
    name: "开发实现",
    shortName: "开发",
    summary: "完成前后端实现、联调和工程化交付。",
    input: "设计稿和需求规格",
    output: "可运行 MVP",
    nextStageId: "qa",
    roleTasks: [
      { roleId: "frontend", task: "实现工作台界面和交互。", output: "前端页面", skills: ["fe-1", "fe-2", "fe-3"] },
      { roleId: "backend", task: "识别本期是否需要服务端能力。", output: "数据方案", skills: ["be-1"] },
    ],
    skills: ["fe-1", "fe-2", "fe-3", "be-1"],
    deliverables: ["可运行页面", "数据结构", "构建产物"],
  },
  {
    id: "qa",
    index: 5,
    name: "测试验收",
    shortName: "验收",
    summary: "验证功能、布局、状态持久化和导出结果。",
    input: "可运行 MVP",
    output: "验收结论",
    nextStageId: "release",
    roleTasks: [
      { roleId: "qa", task: "验证三入口、结果页、导出和 skill 更新状态。", output: "验收记录", skills: ["qa-1", "qa-2"] },
    ],
    skills: ["qa-1", "qa-2"],
    deliverables: ["验收清单", "缺陷记录"],
  },
  {
    id: "release",
    index: 6,
    name: "发布运营",
    shortName: "发布",
    summary: "发布本地演示版本并收集反馈。",
    input: "验收结论",
    output: "可演示版本",
    nextStageId: "retro",
    roleTasks: [
      { roleId: "devops", task: "确认部署方式和演示入口。", output: "部署说明", skills: ["do-1", "do-2"] },
    ],
    skills: ["do-1", "do-2"],
    deliverables: ["部署说明", "演示链接"],
  },
  {
    id: "retro",
    index: 7,
    name: "复盘沉淀",
    shortName: "复盘",
    summary: "沉淀项目经验、更新文档、判断是否抽取新 skill。",
    input: "反馈和验收记录",
    output: "复盘文档和 skill 候选",
    roleTasks: [
      { roleId: "lead", task: "复盘目标达成与后续范围。", output: "复盘结论", skills: ["lead-5"] },
    ],
    skills: ["lead-5"],
    deliverables: ["复盘文档", "skill 候选"],
  },
];

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: "mvp-zero-to-one",
    title: "从 0 到 1 做 MVP",
    description: "生成角色协作路径、阶段任务和建议 skill/tool。",
    prompt: "我们要从 0 到 1 做一个内部 AI 协作门户",
    category: "mvp",
  },
  {
    id: "requirement-review",
    title: "组织一次需求评审",
    description: "梳理输入材料、评审角色、关键决策和后续任务。",
    prompt: "我们要组织一次需求评审",
    category: "review",
  },
  {
    id: "design-to-release",
    title: "推进设计到上线",
    description: "连接设计交付、开发联调、测试验收和发布复盘。",
    prompt: "我们要推进一个设计方案进入开发并上线",
    category: "delivery",
  },
  {
    id: "dev-qa-release",
    title: "开发联调与上线验收",
    description: "明确联调角色、验收标准、发布检查和风险项。",
    prompt: "我们要完成开发联调并准备上线验收",
    category: "delivery",
  },
  {
    id: "retro-skill",
    title: "复盘并沉淀项目 skill",
    description: "整理项目经验，判断哪些流程值得沉淀成 skill。",
    prompt: "我们要复盘一个项目并沉淀可复用 skill",
    category: "retro",
  },
];
```

- [ ] **Step 2: Move existing role data**

In `src/app/App.tsx`, move the existing `CHARACTERS` data into `ROLES` in `src/app/data/workbenchData.ts`.

For every moved role:

```ts
// Before
icon: <Lightbulb size={16} />,

// After
icon: "lightbulb",
```

For every moved skill add `roleId`, matching the parent role:

```ts
{
  id: "pm-1",
  roleId: "pm",
  name: "Notion",
  // keep the rest of the existing skill fields
}
```

- [ ] **Step 3: Temporarily import data back into App**

At the top of `src/app/App.tsx`, replace the inline data constants with:

```ts
import { ROLES, TIER_LABELS } from "./data/workbenchData";
import type { Role, Skill, SkillStatus } from "./types";
```

Replace all `Character` references with `Role`.

Replace `CHARACTERS` references with `ROLES`.

- [ ] **Step 4: Run build**

Run:

```bash
pnpm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/App.tsx src/app/data/workbenchData.ts
git commit -m "refactor: move workbench data into module"
```

## Task 3: Pure Skill State Logic

**Files:**
- Create: `src/app/lib/skillState.ts`
- Create: `src/app/lib/skillState.test.ts`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/app/lib/skillState.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Skill } from "../types";
import { computeRoleSkills, countUnseenSkillUpdates } from "./skillState";

const baseSkills: Skill[] = [
  {
    id: "a",
    roleId: "lead",
    name: "A",
    tagline: "",
    intro: "",
    tier: 0,
    col: 1,
    prereqs: [],
    status: "locked",
    version: "v1",
    size: "",
    downloads: 0,
    tags: [],
    tryUrl: "#",
    installCmd: "",
    homepage: "#",
    updateType: "updated",
  },
  {
    id: "b",
    roleId: "lead",
    name: "B",
    tagline: "",
    intro: "",
    tier: 1,
    col: 1,
    prereqs: ["a"],
    status: "locked",
    version: "v1",
    size: "",
    downloads: 0,
    tags: [],
    tryUrl: "#",
    installCmd: "",
    homepage: "#",
    updateType: "new",
  },
];

describe("computeRoleSkills", () => {
  it("marks no-prereq skills available when they are not unlocked", () => {
    const result = computeRoleSkills(baseSkills, new Set(), new Set());
    expect(result[0].status).toBe("available");
    expect(result[1].status).toBe("locked");
  });

  it("marks unlocked skills unlocked and dependent skills available", () => {
    const result = computeRoleSkills(baseSkills, new Set(["a"]), new Set());
    expect(result[0].status).toBe("unlocked");
    expect(result[1].status).toBe("available");
  });

  it("marks seen update skills with seen true", () => {
    const result = computeRoleSkills(baseSkills, new Set(), new Set(["a"]));
    expect(result[0].seen).toBe(true);
    expect(result[1].seen).toBe(false);
  });
});

describe("countUnseenSkillUpdates", () => {
  it("counts only skills with update type and unseen state", () => {
    const result = computeRoleSkills(baseSkills, new Set(), new Set(["a"]));
    expect(countUnseenSkillUpdates(result)).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm test:run src/app/lib/skillState.test.ts
```

Expected: FAIL because `skillState.ts` does not exist.

- [ ] **Step 3: Implement pure logic**

Create `src/app/lib/skillState.ts`:

```ts
import type { Skill, SkillStatus } from "../types";

export function computeRoleSkills(
  skills: Skill[],
  unlockedSkillIds: Set<string>,
  seenSkillIds: Set<string>,
): Skill[] {
  return skills.map((skill) => {
    const allPrereqsDone = skill.prereqs.every((id) => unlockedSkillIds.has(id));
    let status: SkillStatus;

    if (unlockedSkillIds.has(skill.id)) status = "unlocked";
    else if (allPrereqsDone) status = "available";
    else status = "locked";

    return {
      ...skill,
      status,
      seen: seenSkillIds.has(skill.id),
    };
  });
}

export function countUnseenSkillUpdates(skills: Skill[]): number {
  return skills.filter((skill) => Boolean(skill.updateType) && !skill.seen).length;
}

export function findSkillById(skills: Skill[], id: string | null): Skill | null {
  if (!id) return null;
  return skills.find((skill) => skill.id === id) ?? null;
}
```

- [ ] **Step 4: Replace inline computeSkills**

In `src/app/App.tsx`, remove the inline `computeSkills` function and import:

```ts
import { computeRoleSkills, findSkillById } from "./lib/skillState";
```

Replace:

```ts
const char = { ...rawChar, skills: computeSkills(rawChar.skills, downloaded) };
const selectedSkill = char.skills.find((s) => s.id === selectedSkillId) ?? null;
```

with:

```ts
const char = { ...rawChar, skills: computeRoleSkills(rawChar.skills, downloaded, new Set()) };
const selectedSkill = findSkillById(char.skills, selectedSkillId);
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
pnpm test:run src/app/lib/skillState.test.ts
pnpm run build
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/App.tsx src/app/lib/skillState.ts src/app/lib/skillState.test.ts
git commit -m "test: add skill state logic"
```

## Task 4: Plan Generation And Recommendation Batches

**Files:**
- Create: `src/app/lib/planGeneration.ts`
- Create: `src/app/lib/planGeneration.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/lib/planGeneration.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GOAL_TEMPLATES, PROCESS_STAGES } from "../data/workbenchData";
import { createGeneratedPlan, getRecommendationBatch } from "./planGeneration";

describe("getRecommendationBatch", () => {
  it("returns three templates per batch and wraps around", () => {
    expect(getRecommendationBatch(GOAL_TEMPLATES, 0).map((item) => item.id)).toEqual([
      "mvp-zero-to-one",
      "requirement-review",
      "design-to-release",
    ]);
    expect(getRecommendationBatch(GOAL_TEMPLATES, 1)).toHaveLength(3);
  });
});

describe("createGeneratedPlan", () => {
  it("creates a deterministic local generated plan", () => {
    const plan = createGeneratedPlan({
      goal: "我们要从 0 到 1 做一个内部 AI 协作门户",
      stages: PROCESS_STAGES,
      now: "2026-05-22T00:00:00.000Z",
    });

    expect(plan.title).toBe("内部 AI 协作门户 MVP");
    expect(plan.stages).toHaveLength(7);
    expect(plan.recommendedSkills).toContain("lead-1");
    expect(plan.deliverables).toContain("MVP 目标与范围");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm test:run src/app/lib/planGeneration.test.ts
```

Expected: FAIL because `planGeneration.ts` does not exist.

- [ ] **Step 3: Implement plan generation**

Create `src/app/lib/planGeneration.ts`:

```ts
import type { GeneratedPlan, GoalTemplate, ProcessStage } from "../types";

interface CreateGeneratedPlanInput {
  goal: string;
  stages: ProcessStage[];
  now?: string;
}

export function getRecommendationBatch(templates: GoalTemplate[], batchIndex: number, batchSize = 3): GoalTemplate[] {
  if (templates.length <= batchSize) return templates;

  const start = (batchIndex * batchSize) % templates.length;
  return Array.from({ length: batchSize }, (_, offset) => templates[(start + offset) % templates.length]);
}

export function createGeneratedPlan({ goal, stages, now = new Date().toISOString() }: CreateGeneratedPlanInput): GeneratedPlan {
  const recommendedSkills = Array.from(new Set(stages.flatMap((stage) => stage.skills)));
  const deliverables = Array.from(new Set(stages.flatMap((stage) => stage.deliverables)));

  return {
    id: `plan-${now}`,
    title: inferPlanTitle(goal),
    goal,
    createdAt: now,
    stages,
    recommendedSkills,
    deliverables,
  };
}

function inferPlanTitle(goal: string): string {
  if (goal.includes("AI 协作门户")) return "内部 AI 协作门户 MVP";
  if (goal.includes("需求评审")) return "需求评审推进方案";
  if (goal.includes("设计") && goal.includes("上线")) return "设计到上线推进方案";
  return "产研目标推进方案";
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:run src/app/lib/planGeneration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/planGeneration.ts src/app/lib/planGeneration.test.ts
git commit -m "test: add local plan generation"
```

## Task 5: Local Storage

**Files:**
- Create: `src/app/lib/storage.ts`
- Create: `src/app/lib/storage.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/lib/storage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { AppStateSnapshot } from "../types";
import { DEFAULT_SNAPSHOT, parseSnapshot, serializeSnapshot } from "./storage";

describe("parseSnapshot", () => {
  it("returns default snapshot for invalid JSON", () => {
    expect(parseSnapshot("{broken")).toEqual(DEFAULT_SNAPSHOT);
  });

  it("merges partial snapshots with defaults", () => {
    expect(parseSnapshot(JSON.stringify({ entryMode: "role", activeRoleId: "pm" }))).toMatchObject({
      entryMode: "role",
      activeRoleId: "pm",
      activeStageId: "requirements",
    });
  });
});

describe("serializeSnapshot", () => {
  it("serializes a snapshot into JSON", () => {
    const snapshot: AppStateSnapshot = { ...DEFAULT_SNAPSHOT, goalInput: "hello" };
    expect(JSON.parse(serializeSnapshot(snapshot)).goalInput).toBe("hello");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm test:run src/app/lib/storage.test.ts
```

Expected: FAIL because `storage.ts` does not exist.

- [ ] **Step 3: Implement storage helpers**

Create `src/app/lib/storage.ts`:

```ts
import type { AppStateSnapshot } from "../types";

export const STORAGE_KEY = "skill-forge-workbench-state";

export const DEFAULT_SNAPSHOT: AppStateSnapshot = {
  entryMode: "goal",
  activeRoleId: "lead",
  activeStageId: "requirements",
  selectedSkillId: "lead-1",
  selectedPlanId: null,
  goalInput: "",
  recommendationBatch: 0,
  unlockedSkillIds: [],
  seenSkillIds: [],
};

export function parseSnapshot(raw: string | null): AppStateSnapshot {
  if (!raw) return DEFAULT_SNAPSHOT;

  try {
    const parsed = JSON.parse(raw) as Partial<AppStateSnapshot>;
    return {
      ...DEFAULT_SNAPSHOT,
      ...parsed,
      unlockedSkillIds: Array.isArray(parsed.unlockedSkillIds) ? parsed.unlockedSkillIds : [],
      seenSkillIds: Array.isArray(parsed.seenSkillIds) ? parsed.seenSkillIds : [],
    };
  } catch {
    return DEFAULT_SNAPSHOT;
  }
}

export function serializeSnapshot(snapshot: AppStateSnapshot): string {
  return JSON.stringify(snapshot);
}

export function loadSnapshot(storage: Storage = window.localStorage): AppStateSnapshot {
  return parseSnapshot(storage.getItem(STORAGE_KEY));
}

export function saveSnapshot(snapshot: AppStateSnapshot, storage: Storage = window.localStorage): void {
  storage.setItem(STORAGE_KEY, serializeSnapshot(snapshot));
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:run src/app/lib/storage.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/storage.ts src/app/lib/storage.test.ts
git commit -m "test: add local storage helpers"
```

## Task 6: Export Formatting

**Files:**
- Create: `src/app/lib/exportPlan.ts`
- Create: `src/app/lib/exportPlan.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/lib/exportPlan.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PROCESS_STAGES } from "../data/workbenchData";
import type { GeneratedPlan } from "../types";
import { exportPlanAsJson, exportPlanAsMarkdown } from "./exportPlan";

const plan: GeneratedPlan = {
  id: "plan-1",
  title: "内部 AI 协作门户 MVP",
  goal: "做一个门户",
  createdAt: "2026-05-22T00:00:00.000Z",
  stages: PROCESS_STAGES,
  recommendedSkills: ["lead-1", "pm-1"],
  deliverables: ["MVP 目标与范围"],
};

describe("exportPlanAsMarkdown", () => {
  it("includes title, goal, stages, skills, and deliverables", () => {
    const markdown = exportPlanAsMarkdown(plan);
    expect(markdown).toContain("# 内部 AI 协作门户 MVP");
    expect(markdown).toContain("## 阶段路径");
    expect(markdown).toContain("需求定义");
    expect(markdown).toContain("lead-1");
    expect(markdown).toContain("MVP 目标与范围");
  });
});

describe("exportPlanAsJson", () => {
  it("pretty prints JSON", () => {
    expect(exportPlanAsJson(plan)).toContain('\n  "title": "内部 AI 协作门户 MVP"');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm test:run src/app/lib/exportPlan.test.ts
```

Expected: FAIL because `exportPlan.ts` does not exist.

- [ ] **Step 3: Implement export functions**

Create `src/app/lib/exportPlan.ts`:

```ts
import type { GeneratedPlan } from "../types";

export function exportPlanAsMarkdown(plan: GeneratedPlan): string {
  const stageSections = plan.stages
    .map((stage) => {
      const roleLines = stage.roleTasks
        .map((task) => `- ${task.roleId}: ${task.task}（产物：${task.output}；skill：${task.skills.join(", ")}）`)
        .join("\n");

      return `### ${stage.index}. ${stage.name}

${stage.summary}

**输入：** ${stage.input}

**输出：** ${stage.output}

**角色任务：**
${roleLines}

**阶段产物：** ${stage.deliverables.join("、")}`;
    })
    .join("\n\n");

  return `# ${plan.title}

**目标：** ${plan.goal}

**生成时间：** ${plan.createdAt}

## 阶段路径

${stageSections}

## 建议 Skill/Tool

${plan.recommendedSkills.map((skill) => `- ${skill}`).join("\n")}

## 关键产物

${plan.deliverables.map((deliverable) => `- ${deliverable}`).join("\n")}
`;
}

export function exportPlanAsJson(plan: GeneratedPlan): string {
  return JSON.stringify(plan, null, 2);
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:run src/app/lib/exportPlan.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/exportPlan.ts src/app/lib/exportPlan.test.ts
git commit -m "test: add plan export formatting"
```

## Task 7: Workbench Shell

**Files:**
- Create: `src/app/components/WorkbenchShell.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 0: Apply the existing visual contract**

Before writing `WorkbenchShell`, copy the current app's visual decisions into the new shell:

```tsx
const shellStyle = {
  background: "#070710",
  color: "#e8dcc8",
  fontFamily: "'Crimson Pro', serif",
};

const panelStyle = {
  background: "#0a0a12",
  borderColor: "#1a1a28",
};
```

Use these values in the shell and do not introduce a white page background.

- [ ] **Step 1: Create shell component**

Create `src/app/components/WorkbenchShell.tsx`:

```tsx
import type { EntryMode } from "../types";

interface WorkbenchShellProps {
  activeMode: EntryMode;
  onModeChange: (mode: EntryMode) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{ id: EntryMode; label: string }> = [
  { id: "goal", label: "按目标" },
  { id: "process", label: "按流程" },
  { id: "role", label: "按角色" },
];

export function WorkbenchShell({ activeMode, onModeChange, children }: WorkbenchShellProps) {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[196px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50 px-4 py-4 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="mb-4 lg:mb-10">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
              炉
            </div>
            <h1 className="text-lg font-bold">技能熔炉</h1>
            <p className="mt-1 text-xs text-slate-500">产研流程工作台</p>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onModeChange(item.id)}
                className={[
                  "shrink-0 rounded-xl px-4 py-3 text-left text-sm font-semibold transition lg:w-full",
                  activeMode === item.id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire shell in App**

Temporarily replace `src/app/App.tsx` render with:

```tsx
import { useState } from "react";
import { WorkbenchShell } from "./components/WorkbenchShell";
import type { EntryMode } from "./types";

export default function App() {
  const [activeMode, setActiveMode] = useState<EntryMode>("goal");

  return (
    <WorkbenchShell activeMode={activeMode} onModeChange={setActiveMode}>
      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        <p className="text-sm font-semibold text-slate-500">当前入口</p>
        <h2 className="mt-2 text-3xl font-bold">
          {activeMode === "goal" ? "按目标" : activeMode === "process" ? "按流程" : "按角色"}
        </h2>
      </div>
    </WorkbenchShell>
  );
}
```

- [ ] **Step 3: Run build**

Run:

```bash
pnpm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx src/app/components/WorkbenchShell.tsx
git commit -m "feat: add workbench shell navigation"
```

## Task 8: Goal View

**Files:**
- Create: `src/app/components/GoalView.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 0: Apply the existing visual contract**

Before writing `GoalView`, adapt the AI-style input to the current dark forge style:

```tsx
const inputPanelStyle = {
  background: "#0d0d16",
  border: "1px solid #1a1a28",
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
};

const templateCardStyle = {
  background: "#09090f",
  border: "1px solid #1a1a28",
};
```

The result should feel like the existing skill tree UI with a new input affordance, not a generic white AI homepage.

- [ ] **Step 1: Create GoalView**

Create `src/app/components/GoalView.tsx`:

```tsx
import type { GoalTemplate } from "../types";

interface GoalViewProps {
  goalInput: string;
  templates: GoalTemplate[];
  onGoalInputChange: (value: string) => void;
  onTemplatePick: (template: GoalTemplate) => void;
  onNextBatch: () => void;
  onGenerate: () => void;
}

export function GoalView({
  goalInput,
  templates,
  onGoalInputChange,
  onTemplatePick,
  onNextBatch,
  onGenerate,
}: GoalViewProps) {
  return (
    <section className="mx-auto max-w-5xl pt-8 lg:pt-16">
      <div className="mb-8 text-center lg:mb-10">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">我们该推进什么？</h2>
        <p className="mt-4 text-base text-slate-500">
          描述一个产研目标，我会生成角色协作路径、阶段任务和 skill/tool 调用建议。
        </p>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
        <textarea
          value={goalInput}
          onChange={(event) => onGoalInputChange(event.target.value)}
          className="min-h-32 w-full resize-none border-0 px-5 py-5 text-lg font-semibold text-slate-900 outline-none placeholder:text-slate-300 sm:min-h-36 sm:px-7 sm:py-6 sm:text-xl"
          placeholder="尽管问，比如：我们要从 0 到 1 做一个内部 AI 协作门户"
        />
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="text-2xl leading-none">+</span>
            <span className="font-bold text-blue-600">自动规划</span>
            <span>输出：协作路径 + 任务清单</span>
          </div>
          <button
            onClick={onGenerate}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-2xl text-white"
            aria-label="生成"
          >
            ↑
          </button>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold">推荐任务</h3>
          <p className="mt-1 text-sm text-slate-500">不知道怎么问时，可以先从这些目标开始。</p>
        </div>
        <button onClick={onNextBatch} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">
          换一批
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplatePick(template)}
            className="min-h-40 rounded-3xl border border-slate-200 bg-white p-6 text-left transition hover:border-slate-950"
          >
            <div className="mb-5 text-2xl">◎</div>
            <h4 className="text-xl font-bold">{template.title}</h4>
            <p className="mt-3 text-sm leading-6 text-slate-500">{template.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire GoalView**

In `src/app/App.tsx`, import `GoalView`, `GOAL_TEMPLATES`, `PROCESS_STAGES`, `getRecommendationBatch`, and `createGeneratedPlan`.

Use this state and handlers:

```tsx
const [goalInput, setGoalInput] = useState("");
const [recommendationBatch, setRecommendationBatch] = useState(0);
const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
const [activeStageId, setActiveStageId] = useState("requirements");
const [activeRoleId, setActiveRoleId] = useState("lead");
const [selectedSkillId, setSelectedSkillId] = useState<string | null>("lead-1");
const [unlockedSkillIds, setUnlockedSkillIds] = useState<string[]>([]);
const [seenSkillIds, setSeenSkillIds] = useState<string[]>([]);

const visibleTemplates = getRecommendationBatch(GOAL_TEMPLATES, recommendationBatch);

function handleTemplatePick(template: GoalTemplate) {
  setGoalInput(template.prompt);
}

function handleGenerate() {
  const goal = goalInput.trim() || GOAL_TEMPLATES[0].prompt;
  setGeneratedPlan(createGeneratedPlan({ goal, stages: PROCESS_STAGES }));
}
```

Render:

```tsx
{activeMode === "goal" && !generatedPlan && (
  <GoalView
    goalInput={goalInput}
    templates={visibleTemplates}
    onGoalInputChange={setGoalInput}
    onTemplatePick={handleTemplatePick}
    onNextBatch={() => setRecommendationBatch((value) => value + 1)}
    onGenerate={handleGenerate}
  />
)}
```

- [ ] **Step 3: Run tests and build**

Run:

```bash
pnpm test:run
pnpm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx src/app/components/GoalView.tsx
git commit -m "feat: add goal entry view"
```

## Task 9: Generated Result View

**Files:**
- Create: `src/app/components/ResultView.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 0: Apply the existing visual contract**

Before writing `ResultView`, use dark panels, role-color accents, and compact cards:

```tsx
const resultShellStyle = {
  background: "#09090f",
  border: "1px solid #1a1a28",
};

const activeStageStyle = {
  background: "#0d0d16",
  border: "1px solid #c9963a55",
};
```

Breadcrumbs, phase directory, and stage detail must sit inside the same dark visual system as the current app.

- [ ] **Step 1: Create ResultView**

Create `src/app/components/ResultView.tsx`:

```tsx
import type { GeneratedPlan } from "../types";

interface ResultViewProps {
  plan: GeneratedPlan;
  activeStageId: string;
  onStageChange: (stageId: string) => void;
  onBackToGoal: () => void;
  onRegenerate: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onOpenProcess: () => void;
}

export function ResultView({
  plan,
  activeStageId,
  onStageChange,
  onBackToGoal,
  onRegenerate,
  onExportMarkdown,
  onExportJson,
  onOpenProcess,
}: ResultViewProps) {
  const activeStage = plan.stages.find((stage) => stage.id === activeStageId) ?? plan.stages[0];

  return (
    <section>
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <button onClick={onBackToGoal} className="font-semibold text-slate-950">按目标</button>
        <span>›</span>
        <span>生成结果</span>
        <span>›</span>
        <span>{plan.title}</span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <header className="flex flex-col gap-5 border-b border-slate-100 bg-slate-50/60 px-5 py-6 lg:flex-row lg:items-start lg:justify-between lg:px-8 lg:py-7">
          <div>
            <p className="text-sm font-bold text-slate-500">生成方案</p>
            <h2 className="mt-2 text-3xl font-bold">{plan.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">{plan.goal}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onRegenerate} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">
              重新生成
            </button>
            <button onClick={onExportJson} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">
              导出 JSON
            </button>
            <button onClick={onExportMarkdown} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              导出文档
            </button>
          </div>
        </header>

        <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-slate-100 bg-slate-50 p-4 lg:border-b-0 lg:border-r lg:p-5">
            <p className="mb-3 px-2 text-sm font-bold text-slate-500">阶段目录</p>
            <div className="flex flex-col gap-2">
              {plan.stages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => onStageChange(stage.id)}
                  className={[
                    "rounded-2xl p-4 text-left transition",
                    stage.id === activeStage.id ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-950",
                  ].join(" ")}
                >
                  <p className="text-xs font-bold opacity-70">{String(stage.index).padStart(2, "0")}</p>
                  <h3 className="mt-1 text-base font-bold">{stage.name}</h3>
                  <p className="mt-1 text-xs opacity-70">{stage.output}</p>
                </button>
              ))}
            </div>
          </aside>

          <article className="p-5 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
              <div>
                <p className="text-sm font-bold text-slate-500">当前阶段</p>
                <h3 className="mt-2 text-3xl font-bold">{activeStage.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{activeStage.summary}</p>
              </div>
              <button onClick={onOpenProcess} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">
                进入按流程查看
              </button>
            </div>

            <section>
              <p className="mb-3 text-sm font-bold text-slate-500">角色任务</p>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                {activeStage.roleTasks.map((task, index) => (
                  <div
                    key={`${task.roleId}-${task.task}`}
                    className={[
                      "grid grid-cols-1 gap-2 px-5 py-4 text-sm lg:grid-cols-[132px_1fr_160px] lg:gap-4",
                      index < activeStage.roleTasks.length - 1 ? "border-b border-slate-100" : "",
                    ].join(" ")}
                  >
                    <strong>{task.roleId}</strong>
                    <span className="text-slate-500">{task.task}</span>
                    <span className="font-bold text-blue-600">{task.skills.join(", ")}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-500">阶段产物</p>
                <ul className="mt-3 list-disc pl-5 text-sm leading-7 text-slate-600">
                  {activeStage.deliverables.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-500">下一步</p>
                <h4 className="mt-3 font-bold">{activeStage.nextStageId ?? "进入实施计划"}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">确认本阶段后，继续推进下一阶段或进入 writing-plans。</p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire ResultView and exports**

In `src/app/App.tsx`, render `ResultView` when `activeMode === "goal" && generatedPlan`.

Add export handlers:

```tsx
function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function handleExportMarkdown() {
  if (!generatedPlan) return;
  downloadText(`${generatedPlan.title}.md`, exportPlanAsMarkdown(generatedPlan));
}

function handleExportJson() {
  if (!generatedPlan) return;
  downloadText(`${generatedPlan.title}.json`, exportPlanAsJson(generatedPlan));
}
```

- [ ] **Step 3: Run tests and build**

Run:

```bash
pnpm test:run
pnpm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx src/app/components/ResultView.tsx
git commit -m "feat: add generated plan result view"
```

## Task 10: Process View

**Files:**
- Create: `src/app/components/ProcessView.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 0: Apply the existing visual contract**

Before writing `ProcessView`, use the same strong-selection treatment as the existing role tabs and skill nodes:

```tsx
const stageListStyle = {
  background: "#09090f",
  border: "1px solid #1a1a28",
};

const selectedStageStyle = {
  background: "#0d0d16",
  border: "1px solid #c9963a66",
  boxShadow: "0 0 18px rgba(201,150,58,0.18)",
};
```

Do not use light timeline cards as final styling.

- [ ] **Step 1: Create ProcessView**

Create `src/app/components/ProcessView.tsx`:

```tsx
import type { ProcessStage } from "../types";

interface ProcessViewProps {
  stages: ProcessStage[];
  activeStageId: string;
  onStageChange: (stageId: string) => void;
}

export function ProcessView({ stages, activeStageId, onStageChange }: ProcessViewProps) {
  const activeStage = stages.find((stage) => stage.id === activeStageId) ?? stages[0];

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div>
          <p className="text-sm font-bold text-slate-500">按流程</p>
          <h2 className="mt-2 text-4xl font-bold">产研流程工作台</h2>
          <p className="mt-3 text-sm text-slate-500">先选择流程阶段，再查看该阶段的角色任务、阶段产物和建议 skill/tool。</p>
        </div>
        <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">反馈</button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 px-2 text-sm font-bold text-slate-500">选择流程阶段</p>
          <div className="flex flex-col gap-2">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => onStageChange(stage.id)}
                className={[
                  "rounded-2xl p-4 text-left transition",
                  stage.id === activeStage.id ? "bg-slate-950 text-white shadow-lg" : "border border-slate-200 bg-white text-slate-950",
                ].join(" ")}
              >
                <p className="text-xs font-bold opacity-70">{String(stage.index).padStart(2, "0")}</p>
                <h3 className="mt-1 text-base font-bold">{stage.name}</h3>
                <p className="mt-1 text-xs opacity-70">{stage.summary}</p>
              </button>
            ))}
          </div>
        </aside>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <header className="flex items-start justify-between border-b border-slate-100 bg-slate-50/60 px-8 py-7">
            <div>
              <p className="text-sm font-bold text-slate-500">当前阶段</p>
              <h3 className="mt-2 text-3xl font-bold">{activeStage.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{activeStage.summary}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
              阶段 {activeStage.index} / {stages.length}
            </span>
          </header>

          <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
            <section>
              <p className="mb-3 text-sm font-bold text-slate-500">参与角色与任务</p>
              <div className="flex flex-col gap-3">
                {activeStage.roleTasks.map((task) => (
                  <div key={`${task.roleId}-${task.task}`} className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-[120px_1fr] sm:gap-4">
                    <strong>{task.roleId}</strong>
                    <span className="text-slate-500">{task.task}</span>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <p className="mb-3 text-sm font-bold text-slate-500">建议 skill/tool</p>
              <div className="mb-6 flex flex-wrap gap-2">
                {activeStage.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                    {skill}
                  </span>
                ))}
              </div>
              <p className="mb-3 text-sm font-bold text-slate-500">阶段产物</p>
              <div className="flex flex-col gap-2">
                {activeStage.deliverables.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </article>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire ProcessView**

In `src/app/App.tsx`, render:

```tsx
{activeMode === "process" && (
  <ProcessView stages={PROCESS_STAGES} activeStageId={activeStageId} onStageChange={setActiveStageId} />
)}
```

- [ ] **Step 3: Run build**

Run:

```bash
pnpm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx src/app/components/ProcessView.tsx
git commit -m "feat: add process workbench view"
```

## Task 11: Role View, Skill Tree, And Updates

**Files:**
- Create: `src/app/components/RoleView.tsx`
- Create: `src/app/components/SkillTree.tsx`
- Create: `src/app/components/SkillDetail.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 0: Preserve existing skill tree motion**

Before writing `RoleView`, extract the current `SkillNode`, `Connectors`, and skill detail interaction instead of replacing them with flat cards. Keep:

```tsx
<animate attributeName="r" values={`${r + 7};${r + 14};${r + 7}`} dur="2s" repeatCount="indefinite" />
<animate attributeName="opacity" values="0.45;0.15;0.45" dur="2s" repeatCount="indefinite" />
```

and the available-node pulse:

```tsx
<animate attributeName="r" values={`${r + 3};${r + 10};${r + 3}`} dur="2.8s" repeatCount="indefinite" />
<animate attributeName="opacity" values="0.5;0;0.5" dur="2.8s" repeatCount="indefinite" />
```

Skill updates should be added as badges or rings on the existing node style, not by replacing the tree with static cards.

- [ ] **Step 1: Create SkillTree**

Create `src/app/components/SkillTree.tsx`:

```tsx
import type { Skill } from "../types";

interface SkillTreeProps {
  skills: Skill[];
  selectedSkillId: string | null;
  onSelectSkill: (skillId: string) => void;
}

export function SkillTree({ skills, selectedSkillId, onSelectSkill }: SkillTreeProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {skills.map((skill) => (
        <button
          key={skill.id}
          onClick={() => onSelectSkill(skill.id)}
          className={[
            "relative min-h-28 rounded-2xl p-4 text-left transition",
            selectedSkillId === skill.id ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-950",
            skill.status === "locked" ? "border-dashed bg-slate-100 text-slate-400" : "",
          ].join(" ")}
        >
          {skill.updateType && !skill.seen && (
            <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-2 py-1 text-xs font-bold text-white">
              {skill.updateType === "new" ? "新增" : skill.updateType === "review" ? "复习" : "更新"}
            </span>
          )}
          <p className="text-xs font-bold opacity-70">T{skill.tier + 1}</p>
          <h4 className="mt-4 text-lg font-bold">{skill.name}</h4>
          <p className="mt-1 text-xs opacity-70">{skill.status === "locked" ? "待解锁" : skill.tagline}</p>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create SkillDetail**

Create `src/app/components/SkillDetail.tsx`:

```tsx
import type { Skill } from "../types";

interface SkillDetailProps {
  skill: Skill | null;
  onMarkSeen: (skillId: string) => void;
}

export function SkillDetail({ skill, onMarkSeen }: SkillDetailProps) {
  if (!skill) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        选择一个 skill 查看详情。
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">Skill 详情</p>
          <h4 className="mt-2 text-xl font-bold">{skill.name}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-500">{skill.intro}</p>
        </div>
        {skill.updateType && !skill.seen && (
          <button onClick={() => onMarkSeen(skill.id)} className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white">
            标为已读
          </button>
        )}
      </div>
      {skill.changeSummary && (
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          <strong>更新摘要：</strong>
          {skill.changeSummary}
        </div>
      )}
      <div className="mt-4 rounded-xl bg-white p-4 font-mono text-xs text-slate-600">{skill.installCmd}</div>
    </div>
  );
}
```

- [ ] **Step 3: Create RoleView**

Create `src/app/components/RoleView.tsx`:

```tsx
import type { ProcessStage, Role, Skill } from "../types";
import { countUnseenSkillUpdates } from "../lib/skillState";
import { SkillDetail } from "./SkillDetail";
import { SkillTree } from "./SkillTree";

interface RoleViewProps {
  roles: Role[];
  activeRoleId: string;
  activeStage: ProcessStage;
  selectedSkill: Skill | null;
  selectedSkillId: string | null;
  onRoleChange: (roleId: string) => void;
  onSelectSkill: (skillId: string) => void;
  onMarkSeen: (skillId: string) => void;
}

export function RoleView({
  roles,
  activeRoleId,
  activeStage,
  selectedSkill,
  selectedSkillId,
  onRoleChange,
  onSelectSkill,
  onMarkSeen,
}: RoleViewProps) {
  const activeRole = roles.find((role) => role.id === activeRoleId) ?? roles[0];
  const roleTask = activeStage.roleTasks.find((task) => task.roleId === activeRole.id);

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div>
          <p className="text-sm font-bold text-slate-500">按角色</p>
          <h2 className="mt-2 text-4xl font-bold">角色工作台</h2>
          <p className="mt-3 text-sm text-slate-500">先选择角色，再查看该角色在当前阶段的任务、skill/tool 和完整技能树。</p>
        </div>
        <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">反馈</button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 px-2 text-sm font-bold text-slate-500">选择角色</p>
          <div className="flex flex-col gap-2">
            {roles.map((role) => {
              const updateCount = countUnseenSkillUpdates(role.skills);
              return (
                <button
                  key={role.id}
                  onClick={() => onRoleChange(role.id)}
                  className={[
                    "flex items-center gap-3 rounded-2xl p-4 text-left transition",
                    role.id === activeRole.id ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-950",
                  ].join(" ")}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-950">◎</span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold">{role.name}</span>
                    <span className="mt-1 block text-xs opacity-70">{updateCount > 0 ? `${updateCount} 个 skill 更新` : role.title}</span>
                  </span>
                  {updateCount > 0 && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                </button>
              );
            })}
          </div>
        </aside>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <header className="border-b border-slate-100 bg-slate-50/60 px-8 py-7">
            <p className="text-sm font-bold text-slate-500">当前角色</p>
            <h3 className="mt-2 text-3xl font-bold">{activeRole.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{activeRole.title} · 当前阶段：{activeStage.name}</p>
          </header>

          <div className="grid grid-cols-1 gap-6 border-b border-slate-100 p-5 lg:grid-cols-[1fr_320px] lg:p-8">
            <section>
              <p className="mb-3 text-sm font-bold text-slate-500">本阶段核心任务</p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="font-bold">{roleTask?.task ?? "当前阶段暂无明确任务"}</h4>
                <p className="mt-2 text-sm text-slate-500">产物：{roleTask?.output ?? "无"}</p>
              </div>
            </section>
            <section>
              <p className="mb-3 text-sm font-bold text-slate-500">建议 skill/tool</p>
              <div className="flex flex-wrap gap-2">
                {(roleTask?.skills ?? activeRole.skills.slice(0, 3).map((skill) => skill.id)).map((skillId) => (
                  <span key={skillId} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                    {skillId}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div className="p-5 lg:p-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">完整技能树</p>
                <h3 className="mt-1 text-2xl font-bold">{activeRole.name}能力路径</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">默认展开</span>
            </div>
            <SkillTree skills={activeRole.skills} selectedSkillId={selectedSkillId} onSelectSkill={onSelectSkill} />
            <div className="mt-5">
              <SkillDetail skill={selectedSkill} onMarkSeen={onMarkSeen} />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire RoleView**

In `src/app/App.tsx`, compute roles with skill state:

```tsx
const unlockedSkillIdSet = new Set(unlockedSkillIds);
const seenSkillIdSet = new Set(seenSkillIds);
const roles = ROLES.map((role) => ({
  ...role,
  skills: computeRoleSkills(role.skills, unlockedSkillIdSet, seenSkillIdSet),
}));
const activeRole = roles.find((role) => role.id === activeRoleId) ?? roles[0];
const activeStage = PROCESS_STAGES.find((stage) => stage.id === activeStageId) ?? PROCESS_STAGES[1];
const selectedSkill = findSkillById(activeRole.skills, selectedSkillId);
```

Render:

```tsx
{activeMode === "role" && (
  <RoleView
    roles={roles}
    activeRoleId={activeRole.id}
    activeStage={activeStage}
    selectedSkill={selectedSkill}
    selectedSkillId={selectedSkillId}
    onRoleChange={setActiveRoleId}
    onSelectSkill={setSelectedSkillId}
    onMarkSeen={handleMarkSeen}
  />
)}
```

Implement:

```tsx
function handleMarkSeen(skillId: string) {
  setSeenSkillIds((ids) => Array.from(new Set([...ids, skillId])));
}
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
pnpm test:run
pnpm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/App.tsx src/app/components/RoleView.tsx src/app/components/SkillTree.tsx src/app/components/SkillDetail.tsx
git commit -m "feat: add role workbench and skill updates"
```

## Task 12: Persistence Integration

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Hydrate App state from storage**

In `src/app/App.tsx`, initialize state from `loadSnapshot()`:

```tsx
const initialSnapshot = loadSnapshot();
const [activeMode, setActiveMode] = useState<EntryMode>(initialSnapshot.entryMode);
const [activeRoleId, setActiveRoleId] = useState(initialSnapshot.activeRoleId);
const [activeStageId, setActiveStageId] = useState(initialSnapshot.activeStageId);
const [selectedSkillId, setSelectedSkillId] = useState<string | null>(initialSnapshot.selectedSkillId);
const [goalInput, setGoalInput] = useState(initialSnapshot.goalInput);
const [recommendationBatch, setRecommendationBatch] = useState(initialSnapshot.recommendationBatch);
const [unlockedSkillIds, setUnlockedSkillIds] = useState<string[]>(initialSnapshot.unlockedSkillIds);
const [seenSkillIds, setSeenSkillIds] = useState<string[]>(initialSnapshot.seenSkillIds);
const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(initialSnapshot.generatedPlan ?? null);
```

- [ ] **Step 2: Persist state on change**

Add:

```tsx
useEffect(() => {
  saveSnapshot({
    entryMode: activeMode,
    activeRoleId,
    activeStageId,
    selectedSkillId,
    selectedPlanId: generatedPlan?.id ?? null,
    goalInput,
    recommendationBatch,
    unlockedSkillIds,
    seenSkillIds,
    generatedPlan: generatedPlan ?? undefined,
  });
}, [
  activeMode,
  activeRoleId,
  activeStageId,
  selectedSkillId,
  generatedPlan,
  goalInput,
  recommendationBatch,
  unlockedSkillIds,
  seenSkillIds,
]);
```

- [ ] **Step 3: Run tests and build**

Run:

```bash
pnpm test:run
pnpm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx
git commit -m "feat: persist workbench state locally"
```

## Task 13: Final Browser QA

**Files:**
- No source file required unless QA finds defects.

- [ ] **Step 1: Start dev server**

Run:

```bash
pnpm run dev -- --host 127.0.0.1
```

Expected: Vite prints a localhost URL.

- [ ] **Step 2: Verify the default goal page**

Open the app in Browser.

Expected:

- Left nav has only 按目标, 按流程, 按角色.
- 按目标 is active.
- AI-style input is centered.
- Recommendation cards show three templates.
- 换一批 changes visible cards.

- [ ] **Step 3: Verify generated result**

Generate from the default template.

Expected:

- Result page appears.
- Breadcrumb shows 按目标 > 生成结果 > 当前方案.
- Stage directory is on the left.
- Current stage detail is on the right.
- Export Markdown and JSON buttons trigger downloads.

- [ ] **Step 4: Verify process view**

Click 按流程.

Expected:

- Left stage selector appears.
- Right stage workbench changes when selecting another stage.
- Feedback button is visible but does not need a full panel in this MVP.

- [ ] **Step 5: Verify role view**

Click 按角色.

Expected:

- Left role selector appears.
- Current role workbench appears on the right.
- Full skill tree is visible by default.
- Skill update badges appear on updated skills.
- Marking an updated skill as seen removes the badge after refresh.

- [ ] **Step 6: Verify mobile responsive layouts**

Use Browser responsive viewport checks at `390x844` and `768x1024`.

Expected at `390x844`:

- Global navigation stacks above content; there is no horizontal page overflow.
- 按目标 input fits the viewport, controls wrap cleanly, and recommendation cards render one per row.
- 结果页 shows breadcrumb, then plan header, then stage directory, then stage detail in one column.
- 按流程 shows stage selector above stage detail.
- 按角色 shows role selector above role detail, and skill tree nodes render one per row.
- Buttons remain tappable, with at least 40px height.

Expected at `768x1024`:

- Recommendation cards can use two or three columns if space allows.
- Result, process, and role pages remain readable without clipped text or overlapping panels.

- [ ] **Step 7: Verify visual style and motion parity**

Compare the MVP against the original `src/app/App.tsx` visual language.

Expected:

- Overall app remains dark, using the forge palette from the original code.
- Role colors drive active states and highlights.
- Major headings still use `Cinzel`; body copy still uses `Crimson Pro`; metadata and commands use monospace.
- Skill tree is still visually recognizable as the original skill tree.
- Selected nodes pulse; available nodes pulse; connector activation remains visible.
- New update badges sit on top of the existing node style without flattening the tree into plain cards.
- No large white or light-gray dashboard surface is used as the final UI.

- [ ] **Step 8: Commit QA fixes**

If fixes are needed:

```bash
git add src/app
git commit -m "fix: polish workbench MVP QA issues"
```

If no fixes are needed, do not create an empty commit.

## Self-Review

- Spec coverage:
  - Three-entry left navigation is covered by Task 7.
  - Goal input, recommendation cards, and 换一批 are covered by Task 8.
  - Structured generated result page, breadcrumb, Markdown and JSON export are covered by Tasks 6 and 9.
  - Process view with focused stage selector is covered by Task 10.
  - Role view with focused role selector and default-expanded skill tree is covered by Task 11.
  - Skill update display and seen state are covered by Tasks 3, 11, and 12.
  - localStorage persistence is covered by Task 12.
  - Mobile responsive adaptation is covered in every component snippet and final QA Task 13, Step 6.
  - Existing visual style and motion parity is covered by the mandatory visual contract and final QA Task 13, Step 7.
  - Feedback panel and generation history are intentionally excluded; buttons are visible without next-phase implementation.
- Placeholder scan:
  - The only instruction that relies on existing code movement is Task 2, Step 2, because the existing skill dataset is already present and large. The exact transformation is specified: move entries, replace icon JSX with icon keys, and add `roleId` to every skill.
- Type consistency:
  - Type names match `src/app/types.ts`.
  - `seenSkillIds` is persisted as string IDs and merged into skill objects through `computeRoleSkills`.
  - `GeneratedPlan.stages` uses `ProcessStage[]`, matching export and result view code.
