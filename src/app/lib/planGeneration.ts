import type { GeneratedPlan, GoalTemplate, ProcessStage } from "../types";

interface CreateGeneratedPlanInput {
  goal: string;
  stages: ProcessStage[];
  now?: string;
}

export function getRecommendationBatch(
  templates: GoalTemplate[],
  batchIndex: number,
  batchSize = 3,
): GoalTemplate[] {
  if (templates.length <= batchSize) return templates;

  const start = (batchIndex * batchSize) % templates.length;
  return Array.from({ length: batchSize }, (_, offset) => templates[(start + offset) % templates.length]);
}

export function createGeneratedPlan({
  goal,
  stages,
  now = new Date().toISOString(),
}: CreateGeneratedPlanInput): GeneratedPlan {
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
