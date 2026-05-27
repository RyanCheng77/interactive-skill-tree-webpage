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
