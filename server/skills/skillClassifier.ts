import type { ClassifiedSkill, LocalSkill, SkillClassification, SkillDepth } from "../types";

interface KeywordRule {
  id: string;
  terms: string[];
}

const ROLE_RULES: KeywordRule[] = [
  { id: "lead", terms: ["lead", "planning", "planner", "roadmap", "stakeholder", "review", "pmo", "目标", "规划", "评审"] },
  { id: "pm", terms: ["product", "pm", "requirements", "research", "prd", "opportunity", "用户", "需求", "产品"] },
  { id: "designer", terms: ["design", "figma", "ui", "layout", "visual", "prototype", "设计"] },
  { id: "frontend", terms: ["frontend", "react", "web", "css", "browser", "html", "前端"] },
  { id: "backend", terms: ["backend", "api", "database", "server", "supabase", "postgres", "后端"] },
  { id: "qa", terms: ["qa", "test", "validation", "playwright", "audit", "测试", "验收"] },
  { id: "devops", terms: ["deploy", "ops", "security", "monitoring", "ci", "release", "安全", "发布", "运维"] },
  { id: "docs", terms: ["doc", "docs", "pdf", "presentation", "spreadsheet", "archive", "文档", "沉淀"] },
];

const STAGE_RULES: KeywordRule[] = [
  { id: "discovery", terms: ["opportunity", "research", "brainstorm", "user", "market", "机会", "用户", "调研"] },
  { id: "requirements", terms: ["requirements", "prd", "scope", "roadmap", "planning", "需求", "范围", "规划"] },
  { id: "design", terms: ["design", "figma", "prototype", "layout", "ui", "设计", "原型"] },
  { id: "development", terms: ["implement", "build", "frontend", "backend", "api", "code", "开发", "实现"] },
  { id: "testing", terms: ["test", "qa", "validation", "audit", "playwright", "验收", "测试"] },
  { id: "release", terms: ["deploy", "release", "ops", "monitoring", "ci", "发布", "上线"] },
  { id: "retro", terms: ["retro", "archive", "document", "lesson", "skill", "复盘", "沉淀"] },
];

const DEPTH_RULES: Array<{ depth: SkillDepth; terms: string[] }> = [
  { depth: "expert", terms: ["architecture", "orchestration", "multi-agent", "distributed-system", "架构", "编排"] },
  { depth: "advanced", terms: ["audit", "optimize", "performance", "security", "benchmark", "安全", "性能", "优化"] },
  { depth: "working", terms: ["build", "implement", "create", "edit", "generate", "execute", "开发", "创建", "实现"] },
  { depth: "intro", terms: ["overview", "guide", "learn", "use when", "introduction", "入门", "指南"] },
];

export function classifySkills(skills: LocalSkill[]): ClassifiedSkill[] {
  return skills.map((skill) => ({
    skill,
    classification: classifySkill(skill),
  }));
}

export function classifySkill(skill: LocalSkill): SkillClassification {
  const searchableText = normalizeSearchText(skill);
  const roleMatches = matchRules(searchableText, ROLE_RULES);
  const stageMatches = matchRules(searchableText, STAGE_RULES);
  const depthMatch = matchDepth(searchableText);
  const roleIds = roleMatches.map((match) => match.id);
  const stageIds = stageMatches.map((match) => match.id);
  const matchedTerms = [...roleMatches, ...stageMatches, depthMatch].flatMap((match) => match.terms);
  const confidence = calculateConfidence(roleMatches.length, stageMatches.length, matchedTerms.length);

  return {
    skillId: skill.id,
    roleIds: roleIds.length > 0 ? roleIds : ["lead"],
    stageIds: stageIds.length > 0 ? stageIds : ["requirements"],
    depth: depthMatch.id as SkillDepth,
    confidence,
    reason: createReason(matchedTerms),
  };
}

function normalizeSearchText(skill: LocalSkill): string {
  const skillDir = skill.path.replace(/SKILL\.md$/i, "");

  return [skill.name, skill.description, skillDir, skill.bodySummary, skill.tags.join(" ")]
    .join(" ")
    .toLowerCase();
}

function matchRules(searchableText: string, rules: KeywordRule[]): Array<{ id: string; terms: string[] }> {
  return rules
    .map((rule) => ({
      id: rule.id,
      terms: rule.terms.filter((term) => matchesTerm(searchableText, term)),
    }))
    .filter((match) => match.terms.length > 0);
}

function matchDepth(searchableText: string): { id: SkillDepth; terms: string[] } {
  for (const rule of DEPTH_RULES) {
    const terms = rule.terms.filter((term) => matchesTerm(searchableText, term));
    if (terms.length > 0) return { id: rule.depth, terms };
  }

  return { id: "intro", terms: [] };
}

function matchesTerm(searchableText: string, term: string): boolean {
  const normalizedTerm = term.toLowerCase();

  if (/^[a-z0-9._-]+$/.test(normalizedTerm)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`).test(searchableText);
  }

  return searchableText.includes(normalizedTerm);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function calculateConfidence(roleMatchCount: number, stageMatchCount: number, termCount: number): number {
  const rawScore = 0.35 + roleMatchCount * 0.15 + stageMatchCount * 0.15 + Math.min(termCount, 6) * 0.04;
  return Number(Math.min(rawScore, 0.95).toFixed(2));
}

function createReason(matchedTerms: string[]): string {
  const uniqueTerms = Array.from(new Set(matchedTerms)).slice(0, 5);

  if (uniqueTerms.length === 0) {
    return "未命中明确关键词，默认归入项目负责人/需求定义作为待校准 skill。";
  }

  return `命中关键词：${uniqueTerms.join("、")}。`;
}
