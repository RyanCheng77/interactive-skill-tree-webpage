const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:3001";

export type LocalSkillRootSource = "env" | "project" | "codex-home" | "home-codex" | "home-agents";

export interface LocalSkillRoot {
  path: string;
  exists: boolean;
  source: LocalSkillRootSource;
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

export type SkillDepth = "intro" | "working" | "advanced" | "expert";

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

export type PlatformId = "codex" | "claude" | "trae" | "cursor" | "agents-shared";
export type SkillSourceType = "project" | "user" | "cache" | "builtin" | "rules";

export interface SkillPlatformRoot {
  id: string;
  label: string;
  platformId: PlatformId;
  path: string;
  exists: boolean;
  sourceType: SkillSourceType;
  readOnly: boolean;
  nativeSkillSupport: boolean;
  syncTarget: boolean;
  scansSkills: boolean;
  scansRules: boolean;
}

export interface SkillOccurrence {
  id: string;
  name: string;
  description: string;
  path: string;
  root: string;
  rootId: string;
  relativeDir: string;
  platformId: PlatformId;
  sourceType: SkillSourceType;
  readOnly: boolean;
  mtimeMs: number;
  contentSha256: string;
}

export interface SkillInventoryItem {
  id: string;
  name: string;
  description: string;
  bodySummary: string;
  tags: string[];
  contentSha256: string;
  canonicalPath: string;
  canonicalRoot: string;
  platformIds: PlatformId[];
  occurrenceCount: number;
  classification: SkillClassification;
  occurrences: SkillOccurrence[];
}

export interface CursorRuleContext {
  root: string;
  exists: boolean;
  fileCount: number;
}

export interface SkillInventory {
  items: SkillInventoryItem[];
  roots: SkillPlatformRoot[];
  cursorRules: CursorRuleContext[];
  warnings: string[];
}

export type PlatformCompatibilityStatus =
  | "recognized"
  | "missing"
  | "duplicate"
  | "conflict"
  | "readonly-source"
  | "bridge-required";

export interface PlatformCompatibilityEntry {
  platformId: PlatformId;
  status: PlatformCompatibilityStatus;
  occurrenceCount: number;
  reason: string;
  targetPath?: string;
}

export interface SkillCompatibilityItem {
  skillId: string;
  name: string;
  contentSha256: string;
  occurrenceCount: number;
  platforms: Record<PlatformId, PlatformCompatibilityEntry>;
}

export interface SkillCompatibility {
  items: SkillCompatibilityItem[];
  platforms: PlatformId[];
  warnings: string[];
}

export type SyncPlanActionType =
  | "copy-to-target"
  | "link-to-target"
  | "convert-to-cursor-rule"
  | "skip-readonly-source"
  | "manual-review-conflict";

export interface SyncPlanAction {
  type: SyncPlanActionType;
  skillId: string;
  skillName: string;
  platformId: PlatformId;
  reason: string;
  sourcePath?: string;
  targetPath?: string;
}

export interface SkillSyncPlan {
  dryRun: true;
  actions: SyncPlanAction[];
  warnings: string[];
}

export interface SyncApplyEntry extends SyncPlanAction {
  reason: string;
}

export interface SkillSyncApplyResult {
  dryRun: false;
  created: SyncApplyEntry[];
  skipped: SyncApplyEntry[];
  errors: SyncApplyEntry[];
  warnings: string[];
}

export interface HealthResponse {
  ok: boolean;
  service: string;
  skillRoots: LocalSkillRoot[];
}

export interface CatalogResponse {
  skills: LocalSkill[];
  warnings: string[];
}

export interface ClassifiedResponse {
  skills: ClassifiedSkill[];
  warnings: string[];
}

export interface RecommendResponse {
  goal: string;
  recommendations: SkillRecommendation[];
  warnings: string[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API ${path} returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

export async function fetchCatalog(): Promise<CatalogResponse> {
  return request<CatalogResponse>("/api/skills/catalog");
}

export async function fetchClassified(): Promise<ClassifiedResponse> {
  return request<ClassifiedResponse>("/api/skills/classified");
}

export async function recommendSkills(goal: string): Promise<RecommendResponse> {
  return request<RecommendResponse>("/api/skills/recommend", {
    method: "POST",
    body: JSON.stringify({ goal }),
  });
}

export async function fetchInventory(): Promise<SkillInventory> {
  return request<SkillInventory>("/api/skills/inventory");
}

export async function fetchCompatibility(): Promise<SkillCompatibility> {
  return request<SkillCompatibility>("/api/skills/compatibility");
}

export async function createSyncPlan(): Promise<SkillSyncPlan> {
  return request<SkillSyncPlan>("/api/skills/sync-plan", {
    method: "POST",
    body: JSON.stringify({ strategy: "copy" }),
  });
}

export async function applySyncPlan(): Promise<SkillSyncApplyResult> {
  return request<SkillSyncApplyResult>("/api/skills/sync-apply", {
    method: "POST",
    body: JSON.stringify({ strategy: "copy" }),
  });
}
