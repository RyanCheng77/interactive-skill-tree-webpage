import { describe, expect, it } from "vitest";
import { classifySkill, classifySkills } from "../skills/skillClassifier";
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

describe("classifySkill", () => {
  it("maps product planning skills to project lead and requirements", () => {
    const classification = classifySkill(
      makeSkill({
        id: "fixture/product-lead-planner",
        name: "product-lead-planner",
        description: "Use when clarifying product scope, roadmap, stakeholder review, and MVP planning.",
        bodySummary: "Define requirements and planning outputs.",
        tags: ["plan"],
      }),
    );

    expect(classification.roleIds).toEqual(expect.arrayContaining(["lead", "pm"]));
    expect(classification.stageIds).toEqual(expect.arrayContaining(["requirements"]));
    expect(classification.depth).toBe("intro");
    expect(classification.reason).toContain("planning");
    expect(classification.confidence).toBeGreaterThan(0.5);
  });

  it("maps implementation skills to frontend and development", () => {
    const classification = classifySkill(
      makeSkill({
        id: "fixture/frontend-design",
        name: "frontend-design",
        description: "Build React web UI with CSS layout and implement polished frontend experiences.",
        bodySummary: "Create production UI components.",
        tags: ["frontend", "ui"],
      }),
    );

    expect(classification.roleIds).toEqual(expect.arrayContaining(["designer", "frontend"]));
    expect(classification.stageIds).toEqual(expect.arrayContaining(["design", "development"]));
    expect(classification.depth).toBe("working");
  });

  it("falls back to lead and requirements with an explanation", () => {
    const classification = classifySkill(
      makeSkill({
        id: "fixture/unknown",
        name: "unknown",
        description: "A specialized internal capability.",
      }),
    );

    expect(classification.roleIds).toEqual(["lead"]);
    expect(classification.stageIds).toEqual(["requirements"]);
    expect(classification.depth).toBe("intro");
    expect(classification.reason).toContain("默认归入");
  });
});

describe("classifySkills", () => {
  it("returns each skill with its classification", () => {
    const skills = [makeSkill({ id: "fixture/qa", name: "qa-validation", description: "Run QA test validation." })];

    expect(classifySkills(skills)).toHaveLength(1);
    expect(classifySkills(skills)[0].classification.roleIds).toContain("qa");
  });
});
