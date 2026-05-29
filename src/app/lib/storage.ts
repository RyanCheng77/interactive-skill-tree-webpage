import type { AppStateSnapshot } from "../types";

export const STORAGE_KEY = "skill-forge-workbench-state";

export const DEFAULT_SNAPSHOT: AppStateSnapshot = {
  entryMode: "goal",
  activeRoleId: "lead",
  activeStageId: "requirements",
  selectedSkillId: "goal-framing",
  selectedPlanId: null,
  goalInput: "",
  recommendationBatch: 0,
  unlockedSkillIds: [],
  seenSkillIds: [],
};

function copySnapshot(snapshot: AppStateSnapshot): AppStateSnapshot {
  return {
    ...snapshot,
    unlockedSkillIds: [...snapshot.unlockedSkillIds],
    seenSkillIds: [...snapshot.seenSkillIds],
  };
}

function isEntryMode(value: unknown): value is AppStateSnapshot["entryMode"] {
  return value === "goal" || value === "process" || value === "role" || value === "manage";
}

function hasGeneratedPlanShape(value: unknown): value is AppStateSnapshot["generatedPlan"] {
  if (!value || typeof value !== "object") return false;
  const plan = value as { stages?: unknown; id?: unknown; title?: unknown; goal?: unknown; createdAt?: unknown };
  return (
    typeof plan.id === "string" &&
    typeof plan.title === "string" &&
    typeof plan.goal === "string" &&
    typeof plan.createdAt === "string" &&
    Array.isArray(plan.stages) &&
    plan.stages.length > 0
  );
}

export function parseSnapshot(raw: string | null): AppStateSnapshot {
  if (!raw) return copySnapshot(DEFAULT_SNAPSHOT);

  try {
    const parsed = JSON.parse(raw) as Partial<AppStateSnapshot>;

    return {
      ...DEFAULT_SNAPSHOT,
      ...parsed,
      entryMode: isEntryMode(parsed.entryMode) ? parsed.entryMode : DEFAULT_SNAPSHOT.entryMode,
      unlockedSkillIds: Array.isArray(parsed.unlockedSkillIds) ? parsed.unlockedSkillIds : [],
      seenSkillIds: Array.isArray(parsed.seenSkillIds) ? parsed.seenSkillIds : [],
      generatedPlan: hasGeneratedPlanShape(parsed.generatedPlan) ? parsed.generatedPlan : undefined,
    };
  } catch {
    return copySnapshot(DEFAULT_SNAPSHOT);
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
