import { describe, expect, it } from "vitest";
import { GOAL_TEMPLATES, PROCESS_STAGES } from "../data/workbenchData";
import { createGeneratedPlan, getRecommendationBatch } from "./planGeneration";

describe("getRecommendationBatch", () => {
  it("returns three templates per batch", () => {
    expect(getRecommendationBatch(GOAL_TEMPLATES, 0).map((item) => item.id)).toEqual([
      "mvp-zero-to-one",
      "requirement-review",
      "design-to-release",
    ]);
    expect(getRecommendationBatch(GOAL_TEMPLATES, 1)).toHaveLength(3);
  });

  it("wraps around when a batch reaches the end of the template list", () => {
    expect(getRecommendationBatch(GOAL_TEMPLATES, 1).map((item) => item.id)).toEqual([
      "dev-qa-release",
      "retro-skill",
      "mvp-zero-to-one",
    ]);
  });
});

describe("createGeneratedPlan", () => {
  it("creates a deterministic local generated plan", () => {
    const plan = createGeneratedPlan({
      goal: "我们要从 0 到 1 做一个内部 AI 协作门户",
      stages: PROCESS_STAGES,
      now: "2026-05-22T00:00:00.000Z",
    });

    expect(plan.id).toBe("plan-2026-05-22T00:00:00.000Z");
    expect(plan.title).toBe("内部 AI 协作门户 MVP");
    expect(plan.goal).toBe("我们要从 0 到 1 做一个内部 AI 协作门户");
    expect(plan.createdAt).toBe("2026-05-22T00:00:00.000Z");
    expect(plan.stages).toHaveLength(7);
    expect(plan.recommendedSkills).toContain("goal-framing");
    expect(plan.deliverables).toContain("目标说明");
  });

  it("infers titles for common product and delivery goals", () => {
    expect(createGeneratedPlan({ goal: "准备需求评审", stages: PROCESS_STAGES }).title).toBe("需求评审推进方案");
    expect(createGeneratedPlan({ goal: "推进设计稿到上线", stages: PROCESS_STAGES }).title).toBe("设计到上线推进方案");
    expect(createGeneratedPlan({ goal: "安排常规产研工作", stages: PROCESS_STAGES }).title).toBe("产研目标推进方案");
  });
});
