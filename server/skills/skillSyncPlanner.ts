import path from "node:path";
import type {
  PlatformCompatibilityEntry,
  PlatformId,
  SkillCompatibility,
  SkillInventory,
  SkillInventoryItem,
  SkillPlatformRoot,
  SkillSyncPlan,
  SyncPlanAction,
} from "../types";
import { slugify } from "./skillInventory";
import { PLATFORM_IDS } from "./toolAdapters";

interface CreateSkillSyncPlanInput {
  inventory: SkillInventory;
  compatibility: SkillCompatibility;
  roots: SkillPlatformRoot[];
  projectRoot?: string;
  strategy?: "copy" | "link";
}

export function createSkillSyncPlan({
  inventory,
  compatibility,
  roots,
  projectRoot = process.cwd(),
  strategy = "copy",
}: CreateSkillSyncPlanInput): SkillSyncPlan {
  const actions: SyncPlanAction[] = [];

  for (const compatibilityItem of compatibility.items) {
    const inventoryItem = inventory.items.find((item) => item.id === compatibilityItem.skillId);
    if (!inventoryItem) continue;

    if (inventoryItem.occurrences.every((occurrence) => occurrence.readOnly)) {
      actions.push(...createReadonlySkipActions(inventoryItem));
      continue;
    }

    for (const platformId of PLATFORM_IDS) {
      const entry = compatibilityItem.platforms[platformId];
      actions.push(...createActionsForPlatform({ entry, inventoryItem, roots, projectRoot, strategy }));
    }
  }

  return {
    dryRun: true,
    actions: dedupeActions(actions),
    warnings: compatibility.warnings,
  };
}

function createActionsForPlatform({
  entry,
  inventoryItem,
  roots,
  projectRoot,
  strategy,
}: {
  entry: PlatformCompatibilityEntry;
  inventoryItem: SkillInventoryItem;
  roots: SkillPlatformRoot[];
  projectRoot: string;
  strategy: "copy" | "link";
}): SyncPlanAction[] {
  if (entry.status === "conflict") {
    return [
      {
        type: "manual-review-conflict",
        skillId: inventoryItem.id,
        skillName: inventoryItem.name,
        platformId: entry.platformId,
        reason: entry.reason,
        sourcePath: inventoryItem.canonicalPath,
      },
    ];
  }

  if (entry.status === "bridge-required" && entry.platformId === "cursor") {
    return [
      {
        type: "convert-to-cursor-rule",
        skillId: inventoryItem.id,
        skillName: inventoryItem.name,
        platformId: "cursor",
        reason: entry.reason,
        sourcePath: inventoryItem.canonicalPath,
        targetPath: entry.targetPath ?? path.join(projectRoot, ".cursor/rules", `${slugify(inventoryItem.name)}.md`),
      },
    ];
  }

  if (entry.status === "readonly-source") {
    return createReadonlySkipActions(inventoryItem, entry.platformId);
  }

  if (entry.status !== "missing") return [];

  const targetRoot = roots.find(
    (root) => root.platformId === entry.platformId && root.syncTarget && root.nativeSkillSupport && !root.readOnly,
  );

  if (!targetRoot) return [];

  return [
    {
      type: strategy === "link" ? "link-to-target" : "copy-to-target",
      skillId: inventoryItem.id,
      skillName: inventoryItem.name,
      platformId: entry.platformId,
      reason: `该平台缺少这一版 skill，可安全同步到 ${targetRoot.label}。`,
      sourcePath: inventoryItem.canonicalPath,
      targetPath: path.join(targetRoot.path, slugify(inventoryItem.name), "SKILL.md"),
    },
  ];
}

function createReadonlySkipActions(inventoryItem: SkillInventoryItem, platformId?: PlatformId): SyncPlanAction[] {
  return inventoryItem.occurrences
    .filter((occurrence) => occurrence.readOnly && (!platformId || occurrence.platformId === platformId))
    .map((occurrence) => ({
      type: "skip-readonly-source",
      skillId: inventoryItem.id,
      skillName: inventoryItem.name,
      platformId: occurrence.platformId,
      reason: "该 occurrence 来自内置或缓存目录，第一版只盘点，不写回。",
      sourcePath: occurrence.path,
    }));
}

function dedupeActions(actions: SyncPlanAction[]): SyncPlanAction[] {
  const seen = new Set<string>();

  return actions.filter((action) => {
    const key = `${action.type}:${action.skillId}:${action.platformId}:${action.sourcePath ?? ""}:${action.targetPath ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
