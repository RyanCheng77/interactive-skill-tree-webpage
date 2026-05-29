import type {
  PlatformCompatibilityStatus,
  SkillCompatibility,
  SkillClassification,
  SkillDepth,
  SkillInventory,
  SkillInventoryItem,
  SkillSyncPlan,
  SyncPlanAction,
  SyncPlanActionType,
  PlatformId,
} from "./apiClient";

export const ROLE_DECISION_LABELS = {
  lead: "统筹",
  pm: "产品",
  designer: "设计",
  frontend: "前端",
  backend: "后端",
  qa: "测试",
  devops: "运维",
  docs: "文档",
} as const;

export const STAGE_DECISION_LABELS = {
  discovery: "发现",
  requirements: "需求",
  design: "设计",
  development: "研发",
  implementation: "研发",
  testing: "测试",
  qa: "测试",
  release: "发布",
  retro: "复盘",
} as const;

export const DEPTH_DECISION_LABELS: Record<SkillDepth, string> = {
  intro: "入门",
  working: "可用",
  advanced: "进阶",
  expert: "专家",
};

export interface SkillManagementSummary {
  totalSkills: number;
  totalOccurrences: number;
  duplicateSkills: number;
  readonlyOccurrences: number;
  conflictSkills: number;
  cursorBridgeRequired: number;
}

export type RoleDecisionId = keyof typeof ROLE_DECISION_LABELS;
export type StageDecisionId = keyof typeof STAGE_DECISION_LABELS;
export type SkillManagementFilter =
  | "all"
  | "duplicates"
  | "conflicts"
  | "readonly"
  | "cursorBridge"
  | `role:${string}`
  | `stage:${string}`;
export type SyncPlanActionFilter = "all" | SyncPlanActionType;

export interface SkillDecisionBucket {
  id: string;
  label: string;
  count: number;
}

export interface SkillDecisionBuckets {
  roles: SkillDecisionBucket[];
  stages: SkillDecisionBucket[];
}

export interface SkillFilterCounts {
  all: number;
  duplicates: number;
  conflicts: number;
  readonly: number;
  cursorBridge: number;
}

export type SyncPlanActionCounts = Record<SyncPlanActionFilter, number>;

export interface SkillInventoryPage {
  items: SkillInventoryItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function summarizeSkillManagement(
  inventory: SkillInventory | null,
  compatibility: SkillCompatibility | null,
): SkillManagementSummary {
  if (!inventory || !compatibility) {
    return {
      totalSkills: 0,
      totalOccurrences: 0,
      duplicateSkills: 0,
      readonlyOccurrences: 0,
      conflictSkills: 0,
      cursorBridgeRequired: 0,
    };
  }

  return {
    totalSkills: inventory.items.length,
    totalOccurrences: inventory.items.reduce((sum, item) => sum + item.occurrenceCount, 0),
    duplicateSkills: inventory.items.filter((item) => item.occurrenceCount > 1).length,
    readonlyOccurrences: inventory.items.flatMap((item) => item.occurrences).filter((occurrence) => occurrence.readOnly).length,
    conflictSkills: compatibility.items.filter((item) =>
      Object.values(item.platforms).some((entry) => entry.status === "conflict"),
    ).length,
    cursorBridgeRequired: compatibility.items.filter((item) => item.platforms.cursor.status === "bridge-required").length,
  };
}

export function getSkillFilterCounts(inventory: SkillInventory, compatibility: SkillCompatibility): SkillFilterCounts {
  return {
    all: inventory.items.length,
    duplicates: inventory.items.filter((item) => item.occurrenceCount > 1).length,
    conflicts: inventory.items.filter((item) => hasStatus(item.id, compatibility, "conflict")).length,
    readonly: inventory.items.filter((item) => item.occurrences.some((occurrence) => occurrence.readOnly)).length,
    cursorBridge: inventory.items.filter((item) => hasStatus(item.id, compatibility, "bridge-required")).length,
  };
}

export function filterSkillInventoryItems({
  inventory,
  compatibility,
  filter,
  query,
  roleId,
  stageId,
  platformId,
}: {
  inventory: SkillInventory;
  compatibility: SkillCompatibility;
  filter: SkillManagementFilter;
  query: string;
  roleId?: string | null;
  stageId?: string | null;
  platformId?: PlatformId | null;
}): SkillInventoryItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return inventory.items.filter((item) => {
    if (filter === "duplicates" && item.occurrenceCount <= 1) return false;
    if (filter === "conflicts" && !hasStatus(item.id, compatibility, "conflict")) return false;
    if (filter === "readonly" && !item.occurrences.some((occurrence) => occurrence.readOnly)) return false;
    if (filter === "cursorBridge" && !hasStatus(item.id, compatibility, "bridge-required")) return false;
    if (filter.startsWith("role:") && !item.classification.roleIds.includes(filter.slice("role:".length))) return false;
    if (filter.startsWith("stage:") && !stageMatches(item.classification, filter.slice("stage:".length))) return false;
    if (roleId && !item.classification.roleIds.includes(roleId)) return false;
    if (stageId && !stageMatches(item.classification, stageId)) return false;
    if (platformId && !item.platformIds.includes(platformId)) return false;

    if (!normalizedQuery) return true;

    const searchableText = [
      item.name,
      item.description,
      item.bodySummary,
      item.canonicalPath,
      item.contentSha256,
      item.tags.join(" "),
      item.platformIds.join(" "),
      ...item.occurrences.map((occurrence) => `${occurrence.path} ${occurrence.platformId} ${occurrence.sourceType}`),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}

export function getSkillDecisionBuckets(inventory: SkillInventory): SkillDecisionBuckets {
  return {
    roles: buildDecisionBuckets(
      Object.entries(ROLE_DECISION_LABELS),
      inventory.items.flatMap((item) => item.classification.roleIds),
    ),
    stages: buildDecisionBuckets(
      Object.entries(STAGE_DECISION_LABELS).filter(([id]) => !["implementation", "qa"].includes(id)),
      inventory.items.flatMap((item) => normalizeStageIds(item.classification.stageIds)),
    ),
  };
}

export function getDecisionFilterLabel(filter: SkillManagementFilter): string {
  if (filter.startsWith("role:")) return ROLE_DECISION_LABELS[filter.slice("role:".length) as RoleDecisionId] ?? filter.slice("role:".length);
  if (filter.startsWith("stage:")) return STAGE_DECISION_LABELS[filter.slice("stage:".length) as StageDecisionId] ?? filter.slice("stage:".length);

  const labels: Record<Exclude<SkillManagementFilter, `role:${string}` | `stage:${string}`>, string> = {
    all: "Skill",
    duplicates: "重复",
    readonly: "只读",
    conflicts: "冲突",
    cursorBridge: "Cursor",
  };

  return labels[filter];
}

export function paginateSkillInventoryItems(
  items: SkillInventoryItem[],
  { page, pageSize }: { page: number; pageSize: number },
): SkillInventoryPage {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const startIndex = (safePage - 1) * safePageSize;
  const pageItems = items.slice(startIndex, startIndex + safePageSize);

  return {
    items: pageItems,
    page: safePage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: totalItems === 0 ? 0 : startIndex + pageItems.length,
    hasPrevious: safePage > 1,
    hasNext: safePage < totalPages,
  };
}

export function getSyncPlanActionCounts(syncPlan: SkillSyncPlan | null): SyncPlanActionCounts {
  const counts: SyncPlanActionCounts = {
    all: syncPlan?.actions.length ?? 0,
    "copy-to-target": 0,
    "link-to-target": 0,
    "convert-to-cursor-rule": 0,
    "skip-readonly-source": 0,
    "manual-review-conflict": 0,
  };

  for (const action of syncPlan?.actions ?? []) {
    counts[action.type] += 1;
  }

  return counts;
}

export function filterSyncPlanActions(syncPlan: SkillSyncPlan | null, filter: SyncPlanActionFilter): SyncPlanAction[] {
  if (!syncPlan) return [];
  if (filter === "all") return syncPlan.actions;

  return syncPlan.actions.filter((action) => action.type === filter);
}

export function getPlatformStatusLabel(status: PlatformCompatibilityStatus): string {
  const labels: Record<PlatformCompatibilityStatus, string> = {
    recognized: "已识别",
    missing: "缺失",
    duplicate: "重复",
    conflict: "冲突",
    "readonly-source": "只读来源",
    "bridge-required": "需桥接",
  };

  return labels[status];
}

export function getPlatformStatusTone(status: PlatformCompatibilityStatus): { background: string; border: string; color: string } {
  if (status === "recognized") return { background: "#0f1a15", border: "#2a5a3a", color: "#4db885" };
  if (status === "missing") return { background: "#111827", border: "#263348", color: "#93a4bd" };
  if (status === "duplicate") return { background: "#19140a", border: "#5a4620", color: "#f0c06a" };
  if (status === "conflict") return { background: "#1f1010", border: "#6a2a2a", color: "#ff8a8a" };
  if (status === "readonly-source") return { background: "#141021", border: "#49316e", color: "#d8b4fe" };
  return { background: "#10171f", border: "#25506a", color: "#7dd3fc" };
}

function hasStatus(skillId: string, compatibility: SkillCompatibility, status: PlatformCompatibilityStatus): boolean {
  const item = compatibility.items.find((entry) => entry.skillId === skillId);

  return item ? Object.values(item.platforms).some((entry) => entry.status === status) : false;
}

function buildDecisionBuckets(labelEntries: Array<[string, string]>, ids: string[]): SkillDecisionBucket[] {
  return labelEntries
    .map(([id, label]) => ({
      id,
      label,
      count: ids.filter((itemId) => itemId === id).length,
    }))
    .filter((bucket) => bucket.count > 0);
}

function stageMatches(classification: SkillClassification, stageId: string): boolean {
  return normalizeStageIds(classification.stageIds).includes(normalizeStageId(stageId));
}

function normalizeStageIds(stageIds: string[]): string[] {
  return Array.from(new Set(stageIds.map(normalizeStageId)));
}

function normalizeStageId(stageId: string): string {
  if (stageId === "implementation") return "development";
  if (stageId === "qa") return "testing";
  return stageId;
}
