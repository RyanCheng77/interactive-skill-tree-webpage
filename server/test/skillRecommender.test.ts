import { describe, expect, it } from "vitest";
import { classifySkills } from "../skills/skillClassifier";
import { recommendSkillsForGoal } from "../skills/skillRecommender";
import type { LocalSkill } from "../types";

function makeSkill(overrides: Partial<LocalSkill>): LocalSkill {
  return {
    id: "fixture/skill",
    name: "fixture",
    description: "",
    path: "/tmp/fixture/SKILL.md",
    root: "/tmp",
    bodySummary: "",
    tags: [],
    ...overrides,
  };
}

describe("recommendSkillsForGoal", () => {
  it("recommends matching local skills with reasons and matched terms", () => {
    const classifiedSkills = classifySkills([
      makeSkill({
        id: "fixture/product-lead-planner",
        name: "product-lead-planner",
        description: "Plan MVP scope, requirements, roadmap, and stakeholder review.",
        tags: ["plan"],
      }),
      makeSkill({
        id: "fixture/frontend-design",
        name: "frontend-design",
        description: "Build React frontend UI and design layouts.",
        tags: ["frontend", "ui"],
      }),
    ]);

    const recommendations = recommendSkillsForGoal("我要规划 MVP 需求评审", classifiedSkills);

    expect(recommendations[0]).toMatchObject({
      skillId: "fixture/product-lead-planner",
      matchedTerms: expect.arrayContaining(["mvp", "requirements", "review"]),
    });
    expect(recommendations[0].reason).toContain("匹配目标词");
  });

  it("returns no recommendations when goal has no searchable terms", () => {
    expect(recommendSkillsForGoal("", [])).toEqual([]);
  });

  it("limits recommendations", () => {
    const classifiedSkills = classifySkills([
      makeSkill({ id: "fixture/one", name: "one", description: "test qa validation" }),
      makeSkill({ id: "fixture/two", name: "two", description: "test qa validation" }),
    ]);

    expect(recommendSkillsForGoal("test qa", classifiedSkills, 1)).toHaveLength(1);
  });
});
