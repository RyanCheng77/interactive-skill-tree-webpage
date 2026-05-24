import { describe, expect, it } from "vitest";
import { PROCESS_STAGES } from "../data/workbenchData";
import type { GeneratedPlan } from "../types";
import { exportPlanAsJson, exportPlanAsMarkdown } from "./exportPlan";

const plan: GeneratedPlan = {
  id: "plan-1",
  title: "内部 AI 协作门户 MVP",
  goal: "做一个门户",
  createdAt: "2026-05-22T00:00:00.000Z",
  stages: PROCESS_STAGES,
  recommendedSkills: ["goal-framing", "pm-1"],
  deliverables: ["目标说明"],
};

describe("exportPlanAsMarkdown", () => {
  it("includes title, goal, stages, skills, and deliverables", () => {
    const markdown = exportPlanAsMarkdown(plan);

    expect(markdown).toContain("# 内部 AI 协作门户 MVP");
    expect(markdown).toContain("**目标：** 做一个门户");
    expect(markdown).toContain("## 阶段路径");
    expect(markdown).toContain("需求定义");
    expect(markdown).toContain("goal-framing");
    expect(markdown).toContain("目标说明");
  });
});

describe("exportPlanAsJson", () => {
  it("pretty prints JSON", () => {
    expect(exportPlanAsJson(plan)).toContain('\n  "title": "内部 AI 协作门户 MVP"');
  });
});
