import type { GeneratedPlan } from "../types";

export function exportPlanAsMarkdown(plan: GeneratedPlan): string {
  const stageSections = plan.stages
    .map((stage) => {
      const roleLines = stage.roleTasks
        .map((task) => `- ${task.roleId}: ${task.task}（产物：${task.output}；skill：${task.skills.join(", ")}）`)
        .join("\n");

      return `### ${stage.index + 1}. ${stage.name}

${stage.summary}

**输入：** ${stage.input}

**输出：** ${stage.output}

**角色任务：**
${roleLines}

**阶段产物：** ${stage.deliverables.join("、")}`;
    })
    .join("\n\n");

  return `# ${plan.title}

**目标：** ${plan.goal}

**生成时间：** ${plan.createdAt}

## 阶段路径

${stageSections}

## 建议 Skill/Tool

${plan.recommendedSkills.map((skill) => `- ${skill}`).join("\n")}

## 关键产物

${plan.deliverables.map((deliverable) => `- ${deliverable}`).join("\n")}
`;
}

export function exportPlanAsJson(plan: GeneratedPlan): string {
  return JSON.stringify(plan, null, 2);
}
