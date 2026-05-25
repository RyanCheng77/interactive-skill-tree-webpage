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
