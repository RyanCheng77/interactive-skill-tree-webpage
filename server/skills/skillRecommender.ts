import type { ClassifiedSkill, SkillRecommendation } from "../types";

const GOAL_TERMS = [
  "mvp",
  "ai",
  "api",
  "backend",
  "deploy",
  "design",
  "figma",
  "frontend",
  "github",
  "plan",
  "qa",
  "react",
  "release",
  "research",
  "review",
  "security",
  "skill",
  "test",
  "ui",
  "workflow",
  "上线",
  "产品",
  "前端",
  "后端",
  "复盘",
  "安全",
  "发布",
  "技能",
  "测试",
  "流程",
  "目标",
  "规划",
  "设计",
  "评审",
  "需求",
  "验收",
];

const GOAL_ALIASES: Record<string, string[]> = {
  上线: ["release", "deploy"],
  产品: ["product"],
  前端: ["frontend"],
  后端: ["backend"],
  复盘: ["retro"],
  安全: ["security"],
  发布: ["release"],
  技能: ["skill"],
  测试: ["test", "qa"],
  流程: ["workflow"],
  目标: ["goal", "plan"],
  规划: ["plan", "planning"],
  设计: ["design", "ui"],
  评审: ["review"],
  需求: ["requirements", "scope"],
  验收: ["validation", "qa"],
};

export function recommendSkillsForGoal(goal: string, classifiedSkills: ClassifiedSkill[], limit = 8): SkillRecommendation[] {
  const terms = extractGoalTerms(goal);
  if (terms.length === 0) return [];

  return classifiedSkills
    .map((classifiedSkill) => scoreSkill(terms, classifiedSkill))
    .filter((recommendation) => recommendation.score > 0)
    .sort((left, right) => right.score - left.score || left.skillId.localeCompare(right.skillId))
    .slice(0, limit);
}

function scoreSkill(terms: string[], classifiedSkill: ClassifiedSkill): SkillRecommendation {
  const searchableText = [
    classifiedSkill.skill.name,
    classifiedSkill.skill.description,
    classifiedSkill.skill.bodySummary,
    classifiedSkill.skill.tags.join(" "),
    classifiedSkill.classification.roleIds.join(" "),
    classifiedSkill.classification.stageIds.join(" "),
    classifiedSkill.classification.depth,
  ]
    .join(" ")
    .toLowerCase();
  const matchedTerms = terms.filter((term) => searchableText.includes(term));
  const score = matchedTerms.length * 10 + classifiedSkill.classification.confidence * 10;

  return {
    skillId: classifiedSkill.skill.id,
    score: Number(score.toFixed(2)),
    reason: createRecommendationReason(matchedTerms, classifiedSkill.classification.roleIds, classifiedSkill.classification.stageIds),
    matchedTerms,
  };
}

function extractGoalTerms(goal: string): string[] {
  const normalizedGoal = goal.toLowerCase();
  const words = normalizedGoal.match(/[a-z0-9._-]+/g) ?? [];
  const knownTerms = GOAL_TERMS.filter((term) => normalizedGoal.includes(term));

  const aliases = knownTerms.flatMap((term) => GOAL_ALIASES[term] ?? []);

  return Array.from(new Set([...words, ...knownTerms, ...aliases].filter((term) => term.length > 1)));
}

function createRecommendationReason(matchedTerms: string[], roleIds: string[], stageIds: string[]): string {
  const termText = matchedTerms.length > 0 ? `匹配目标词：${matchedTerms.slice(0, 5).join("、")}` : "未匹配明确目标词";
  const roleText = roleIds.length > 0 ? `角色：${roleIds.slice(0, 3).join("、")}` : "角色待校准";
  const stageText = stageIds.length > 0 ? `阶段：${stageIds.slice(0, 3).join("、")}` : "阶段待校准";

  return `${termText}；${roleText}；${stageText}。`;
}
