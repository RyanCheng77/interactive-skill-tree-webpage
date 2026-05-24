import type { Skill, SkillStatus } from "../types";

export function computeRoleSkills(
  skills: Skill[],
  unlockedSkillIds: Set<string>,
  seenSkillIds: Set<string>,
): Skill[] {
  return skills.map((skill) => {
    const allPrereqsDone = skill.prereqs.every((id) => unlockedSkillIds.has(id));
    let status: SkillStatus;

    if (unlockedSkillIds.has(skill.id)) {
      status = "unlocked";
    } else if (allPrereqsDone) {
      status = "available";
    } else {
      status = "locked";
    }

    return {
      ...skill,
      status,
      seen: seenSkillIds.has(skill.id),
    };
  });
}

export function countUnseenSkillUpdates(skills: Skill[]): number {
  return skills.filter((skill) => Boolean(skill.updateType) && !skill.seen).length;
}

export function findSkillById(skills: Skill[], id: string | null): Skill | null {
  if (!id) return null;
  return skills.find((skill) => skill.id === id) ?? null;
}
