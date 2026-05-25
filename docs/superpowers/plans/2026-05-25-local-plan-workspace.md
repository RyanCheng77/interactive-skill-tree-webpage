# Local Plan Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current single generated plan result into a local plan workspace with plan history, stage progress, feedback records, full workspace backup, and visual QA evidence.

**Architecture:** Keep the app local-first and deterministic. Extend the existing `AppStateSnapshot` and pure storage/export helpers before wiring UI, so each behavior can be covered with Vitest first. Reuse the existing dark forge workbench layout, compact panels, role colors, and localStorage persistence.

**Tech Stack:** React 18, Vite 6, TypeScript, Tailwind CSS 4, lucide-react, Vitest, browser localStorage.

---

## File Structure

- Modify: `src/app/types.ts`
  - Add plan history, stage progress, feedback, and workspace backup types.
- Modify: `src/app/lib/storage.ts`
  - Persist and hydrate the expanded workspace snapshot with backward-compatible fallbacks.
- Modify: `src/app/lib/storage.test.ts`
  - Cover legacy snapshots, multiple plans, progress, feedback, and invalid import payloads.
- Create: `src/app/lib/workspaceExport.ts`
  - Own full workspace JSON export/import validation.
- Create: `src/app/lib/workspaceExport.test.ts`
  - Cover full backup round trip and invalid JSON handling.
- Modify: `src/app/App.tsx`
  - Own plan history, active plan selection, progress updates, feedback records, and workspace import/export handlers.
- Create: `src/app/components/PlanHistoryPanel.tsx`
  - Render generated plan history and active plan switching.
- Modify: `src/app/components/ResultView.tsx`
  - Add plan history panel and stage deliverable checklist.
- Create: `src/app/components/FeedbackPanel.tsx`
  - Capture local feedback for process and role pages.
- Modify: `src/app/components/ProcessView.tsx`
  - Wire feedback entry and show feedback count.
- Modify: `src/app/components/RoleView.tsx`
  - Wire feedback entry and show feedback count.
- Modify: `src/app/components/WorkbenchShell.tsx`
  - Add workspace export/import actions in the app shell.
- Create: `docs/superpowers/qa/2026-05-25-local-plan-workspace-qa.md`
  - Record automated and manual QA results for v0.2.
- Modify: `README.md`
  - Link roadmap and v0.2 QA notes after implementation.
- Modify: `docs/project-overview.md`
  - Update current scope once v0.2 is complete.

## Task 1: Expand Workspace Domain Types

**Files:**
- Modify: `src/app/types.ts`
- Modify: `src/app/lib/storage.test.ts`

- [ ] **Step 1: Write failing storage tests for v0.2 state**

Add tests that assert the snapshot can contain `plans`, `activePlanId`, `stageProgress`, and `feedbackRecords`, while legacy MVP snapshots still parse.

Run:

```bash
pnpm test:run src/app/lib/storage.test.ts
```

Expected: FAIL because the new fields do not exist yet.

- [ ] **Step 2: Add v0.2 types**

Add these domain concepts to `src/app/types.ts`:

```ts
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

Update `AppStateSnapshot` so it contains:

```ts
activePlanId: string | null;
plans: GeneratedPlan[];
stageProgress: StageProgress[];
feedbackRecords: FeedbackRecord[];
```

Keep `generatedPlan?: GeneratedPlan` temporarily as a migration field until Task 2 removes UI reliance on it.

- [ ] **Step 3: Run type and storage tests**

Run:

```bash
pnpm test:run src/app/lib/storage.test.ts
pnpm build
```

Expected: storage tests still fail until Task 2 updates parsing, while build errors point to snapshot fields that need migration.

## Task 2: Migrate Storage To Plan History

**Files:**
- Modify: `src/app/lib/storage.ts`
- Modify: `src/app/lib/storage.test.ts`

- [ ] **Step 1: Implement backward-compatible parsing**

Update `DEFAULT_SNAPSHOT` with empty arrays for `plans`, `stageProgress`, and `feedbackRecords`, plus `activePlanId: null`.

In `parseSnapshot`, migrate legacy `generatedPlan` into `plans` when `plans` is missing:

```ts
const legacyPlan = hasGeneratedPlanShape(parsed.generatedPlan) ? parsed.generatedPlan : undefined;
const plans = Array.isArray(parsed.plans) ? parsed.plans.filter(hasGeneratedPlanShape) : legacyPlan ? [legacyPlan] : [];
```

Set `activePlanId` to `parsed.activePlanId` when it matches a plan id; otherwise use `legacyPlan?.id ?? null`.

- [ ] **Step 2: Validate progress and feedback arrays**

Accept only records with string ids, known target/status values, and string timestamps. Drop malformed records instead of throwing.

- [ ] **Step 3: Verify storage tests**

Run:

```bash
pnpm test:run src/app/lib/storage.test.ts
```

Expected: PASS.

## Task 3: Add Full Workspace Backup Helpers

**Files:**
- Create: `src/app/lib/workspaceExport.ts`
- Create: `src/app/lib/workspaceExport.test.ts`

- [ ] **Step 1: Write failing backup tests**

Cover:

- Exporting a snapshot as pretty JSON.
- Importing a valid backup into an `AppStateSnapshot`.
- Returning `null` for invalid JSON.
- Dropping malformed feedback/progress records through `parseSnapshot`.

Run:

```bash
pnpm test:run src/app/lib/workspaceExport.test.ts
```

Expected: FAIL because `workspaceExport.ts` does not exist.

- [ ] **Step 2: Implement backup helpers**

Create pure helpers:

```ts
import type { AppStateSnapshot } from "../types";
import { parseSnapshot, serializeSnapshot } from "./storage";

export function exportWorkspaceSnapshot(snapshot: AppStateSnapshot): string {
  return JSON.stringify(JSON.parse(serializeSnapshot(snapshot)), null, 2);
}

export function importWorkspaceSnapshot(raw: string): AppStateSnapshot | null {
  try {
    return parseSnapshot(raw);
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Verify backup tests**

Run:

```bash
pnpm test:run src/app/lib/workspaceExport.test.ts
```

Expected: PASS.

## Task 4: Wire Plan History In App State

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/lib/planGeneration.ts`
- Modify: `src/app/lib/planGeneration.test.ts`

- [ ] **Step 1: Make generated plan ids stable enough for history**

Update `createGeneratedPlan` tests to assert distinct ids for distinct `now` values and no dependency on array position.

- [ ] **Step 2: Replace single `generatedPlan` UI state with history state**

In `App.tsx`, derive:

```ts
const activePlan = plans.find((plan) => plan.id === activePlanId) ?? null;
```

When generating, prepend the new plan unless an existing plan has the same id:

```ts
setPlans((items) => [plan, ...items.filter((item) => item.id !== plan.id)]);
setActivePlanId(plan.id);
```

Preserve existing result behavior by rendering `ResultView` when `activeMode === "goal" && activePlan`.

- [ ] **Step 3: Persist plan history**

Save `plans`, `activePlanId`, `stageProgress`, and `feedbackRecords` in the snapshot. Stop writing `generatedPlan` once all consumers use `activePlan`.

- [ ] **Step 4: Verify app state**

Run:

```bash
pnpm test:run
pnpm build
```

Expected: PASS.

## Task 5: Add Plan History Panel

**Files:**
- Create: `src/app/components/PlanHistoryPanel.tsx`
- Modify: `src/app/components/ResultView.tsx`

- [ ] **Step 1: Create presentational history component**

Props:

```ts
interface PlanHistoryPanelProps {
  plans: GeneratedPlan[];
  activePlanId: string | null;
  onSelectPlan: (planId: string) => void;
}
```

Render compact dark cards with title, goal preview, and created date. Use horizontal scroll on mobile and a vertical stack on desktop.

- [ ] **Step 2: Wire into `ResultView`**

Place the history panel above the stage directory on mobile and inside the left column on desktop. Keep the existing stage directory visible and do not hide current result controls.

- [ ] **Step 3: Verify manually in browser**

Run the dev server:

```bash
pnpm dev
```

Generate three plans and confirm switching does not lose stage selection for the active plan.

## Task 6: Add Stage Deliverable Progress

**Files:**
- Modify: `src/app/components/ResultView.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Add props**

Add to `ResultView`:

```ts
stageProgress: StageProgress | null;
onToggleDeliverable: (stageId: string, deliverable: string) => void;
```

- [ ] **Step 2: Render deliverables as checkboxes**

Use existing dark panel styling. Each deliverable should be a checkbox row with stable height and no layout shift.

- [ ] **Step 3: Persist progress**

In `App.tsx`, update the matching `StageProgress` record by `planId + stageId`, toggling `completedDeliverables` and `updatedAt`.

- [ ] **Step 4: Verify**

Run:

```bash
pnpm test:run
pnpm build
```

Expected: PASS. Then refresh the browser and confirm checked deliverables remain checked.

## Task 7: Implement Local Feedback Panel

**Files:**
- Create: `src/app/components/FeedbackPanel.tsx`
- Modify: `src/app/components/ProcessView.tsx`
- Modify: `src/app/components/RoleView.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Build `FeedbackPanel`**

Props:

```ts
interface FeedbackPanelProps {
  open: boolean;
  targetLabel: string;
  records: FeedbackRecord[];
  onClose: () => void;
  onSubmit: (message: string) => void;
  onMarkReviewed: (id: string) => void;
}
```

Use a dialog-style overlay or inline drawer with textarea, submit button, and existing feedback records.

- [ ] **Step 2: Wire process feedback**

The Process view feedback target should be `process:${activeStageId}` and show open feedback count near the button.

- [ ] **Step 3: Wire role feedback**

The Role view feedback target should be `role:${activeRoleId}` and show open feedback count near the button.

- [ ] **Step 4: Persist feedback**

Create records with:

```ts
{
  id: `feedback-${Date.now()}`,
  targetType,
  targetId,
  message,
  status: "open",
  createdAt: new Date().toISOString(),
}
```

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test:run
pnpm build
```

Expected: PASS. Then submit feedback from both Process and Role pages and refresh to confirm persistence.

## Task 8: Add Workspace Export And Import

**Files:**
- Modify: `src/app/components/WorkbenchShell.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Add shell actions**

Expose two compact actions in the shell:

- Export workspace
- Import workspace

Use icon buttons with accessible labels and tooltips if space is tight.

- [ ] **Step 2: Export full workspace JSON**

Use `exportWorkspaceSnapshot(currentSnapshot)` and the existing Blob download pattern. Filename: `skill-workbench-backup.json`.

- [ ] **Step 3: Import full workspace JSON**

Use a hidden file input, read the selected file as text, pass it to `importWorkspaceSnapshot`, and replace app state only when parsing succeeds.

- [ ] **Step 4: Verify import/export manually**

Generate plans, create progress and feedback, export the workspace, clear localStorage in devtools, import the file, and confirm all state is restored.

## Task 9: QA And Documentation

**Files:**
- Create: `docs/superpowers/qa/2026-05-25-local-plan-workspace-qa.md`
- Modify: `README.md`
- Modify: `docs/project-overview.md`

- [ ] **Step 1: Run automated checks**

Run:

```bash
pnpm test:run
pnpm build
```

Expected: PASS.

- [ ] **Step 2: Record manual browser QA**

Test these viewports:

- 390x844
- 768x1024
- 1440x900

Record results for plan history, stage checklist, feedback panel, workspace export/import, and existing skill tree interactions.

- [ ] **Step 3: Update README and project overview**

Link the roadmap, v0.2 implementation plan, and QA record. Update current scope only after v0.2 behavior is implemented and verified.

- [ ] **Step 4: Final review**

Check there are no unrelated formatting changes. Run:

```bash
git status --short
```

Expected: only v0.2 implementation, tests, and docs files are changed.

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-05-25-local-plan-workspace.md`.

1. Subagent-Driven (recommended): dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution: execute tasks in this session using executing-plans, batch execution with checkpoints.
