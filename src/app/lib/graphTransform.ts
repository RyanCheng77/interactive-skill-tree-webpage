import type { ClassifiedSkill, LocalSkill, SkillClassification } from "../lib/apiClient";
import type { Role, Skill, SkillDepth } from "../types";

const DEPTH_TO_TIER: Record<SkillDepth, number> = {
  intro: 0,
  working: 1,
  advanced: 2,
  expert: 3,
};

const ROLE_DISPLAY: Record<string, { name: string; title: string; shortTitle: string; color: string; glowColor: string; accentColor: string; icon: Role["icon"] }> = {
  lead: { name: "项目负责人", title: "统筹与决策", shortTitle: "统筹", color: "#d4a24c", glowColor: "rgba(212,162,76,0.35)", accentColor: "#f0c06a", icon: "crown" },
  pm: { name: "产品经理", title: "需求与规划", shortTitle: "需求", color: "#c9963a", glowColor: "rgba(201,150,58,0.35)", accentColor: "#f0c06a", icon: "lightbulb" },
  designer: { name: "设计师", title: "视觉与交互", shortTitle: "设计", color: "#a855f7", glowColor: "rgba(168,85,247,0.35)", accentColor: "#d8b4fe", icon: "palette" },
  frontend: { name: "前端工程师", title: "界面与体验", shortTitle: "前端", color: "#3b82f6", glowColor: "rgba(59,130,246,0.35)", accentColor: "#93c5fd", icon: "monitor" },
  backend: { name: "后端工程师", title: "服务与数据", shortTitle: "后端", color: "#10b981", glowColor: "rgba(16,185,129,0.35)", accentColor: "#6ee7b7", icon: "server" },
  qa: { name: "测试工程师", title: "质量与保障", shortTitle: "测试", color: "#f59e0b", glowColor: "rgba(245,158,11,0.35)", accentColor: "#fcd34d", icon: "flask" },
  devops: { name: "运维工程师", title: "部署与运营", shortTitle: "运维", color: "#6ab4d4", glowColor: "rgba(106,180,212,0.35)", accentColor: "#a2d4ea", icon: "cloud" },
  docs: { name: "文档工程师", title: "文档与知识", shortTitle: "文档", color: "#8b5cf6", glowColor: "rgba(139,92,246,0.35)", accentColor: "#a78bfa", icon: "lightbulb" },
};

function classifyToLocalSkill(skill: LocalSkill, classification: SkillClassification): Skill {
  const tier = DEPTH_TO_TIER[classification.depth] ?? 0;
  const roleId = classification.roleIds[0] ?? "lead";

  return {
    id: skill.id,
    roleId,
    name: skill.name,
    tagline: skill.description.slice(0, 50),
    intro: skill.bodySummary || skill.description,
    tier,
    col: 0,
    prereqs: [],
    status: "available",
    version: "",
    size: "",
    downloads: 0,
    tags: skill.tags,
    tryUrl: "#",
    installCmd: "",
    homepage: "",
    seen: false,
    isLocal: true,
    localPath: skill.path,
    localRoot: skill.root,
    classificationReason: classification.reason,
    confidence: classification.confidence,
    stageIds: classification.stageIds,
  } as Skill & { isLocal: boolean; localPath: string; localRoot: string; classificationReason: string; confidence: number; stageIds: string[] };
}

export function classifiedSkillsToRoles(classifiedSkills: ClassifiedSkill[]): Role[] {
  const roleMap = new Map<string, Array<{ skill: LocalSkill; classification: SkillClassification }>>();

  for (const classified of classifiedSkills) {
    const primaryRoleId = classified.classification.roleIds[0] ?? "lead";

    if (!roleMap.has(primaryRoleId)) {
      roleMap.set(primaryRoleId, []);
    }
    roleMap.get(primaryRoleId)!.push(classified);
  }

  const roles: Role[] = [];

  for (const [roleId, items] of roleMap) {
    const display = ROLE_DISPLAY[roleId] ?? ROLE_DISPLAY.lead;

    const skillsByTier = new Map<number, Array<{ skill: LocalSkill; classification: SkillClassification }>>();

    for (const item of items) {
      const tier = DEPTH_TO_TIER[item.classification.depth] ?? 0;

      if (!skillsByTier.has(tier)) {
        skillsByTier.set(tier, []);
      }
      skillsByTier.get(tier)!.push(item);
    }

    const skills: Skill[] = [];

    for (const [tier, tierItems] of skillsByTier) {
      tierItems.forEach((item, colIndex) => {
        const skill = classifyToLocalSkill(item.skill, item.classification);
        skill.tier = tier;
        skill.col = colIndex % 3;
        skills.push(skill);
      });
    }

    roles.push({
      id: roleId,
      name: display.name,
      title: display.title,
      shortTitle: display.shortTitle,
      color: display.color,
      glowColor: display.glowColor,
      accentColor: display.accentColor,
      icon: display.icon,
      skills: skills.sort((a, b) => a.tier - b.tier || a.col - b.col),
    });
  }

  return roles.sort((a, b) => {
    const order = ["lead", "pm", "designer", "frontend", "backend", "qa", "devops", "docs"];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });
}

export function getLocalSkillMeta(skill: Skill): { isLocal: boolean; localPath: string; localRoot: string; classificationReason: string; confidence: number; stageIds: string[] } {
  const extended = skill as Skill & { isLocal?: boolean; localPath?: string; localRoot?: string; classificationReason?: string; confidence?: number; stageIds?: string[] };

  return {
    isLocal: extended.isLocal ?? false,
    localPath: extended.localPath ?? "",
    localRoot: extended.localRoot ?? "",
    classificationReason: extended.classificationReason ?? "",
    confidence: extended.confidence ?? 0,
    stageIds: extended.stageIds ?? [],
  };
}
