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
  seen?: boolean;
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
