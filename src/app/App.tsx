import { useEffect, useState } from "react";
import { GoalView } from "./components/GoalView";
import { ProcessView } from "./components/ProcessView";
import { ResultView } from "./components/ResultView";
import { RoleView } from "./components/RoleView";
import { WorkbenchShell } from "./components/WorkbenchShell";
import { GOAL_TEMPLATES, PROCESS_STAGES, ROLES } from "./data/workbenchData";
import { exportPlanAsJson, exportPlanAsMarkdown } from "./lib/exportPlan";
import { createGeneratedPlan, getRecommendationBatch } from "./lib/planGeneration";
import { computeRoleSkills, findSkillById } from "./lib/skillState";
import { loadSnapshot, saveSnapshot } from "./lib/storage";
import type { EntryMode, GeneratedPlan, GoalTemplate } from "./types";

const MODE_TITLES: Record<EntryMode, { eyebrow: string; title: string; description: string }> = {
  goal: {
    eyebrow: "按目标",
    title: "不知道用什么 Skill？",
    description: "从一个产研问题推荐合适 skill/tool，并生成协作路径和阶段任务。",
  },
  process: {
    eyebrow: "按流程",
    title: "产研流程工作台",
    description: "按阶段查看角色任务、输入输出、建议 skill/tool 和阶段产物。",
  },
  role: {
    eyebrow: "按角色",
    title: "角色工作台",
    description: "选择产研角色，查看当前阶段任务、建议 skill/tool 和完整能力路径。",
  },
};

export default function App() {
  const [initialSnapshot] = useState(() => loadSnapshot());
  const [activeMode, setActiveMode] = useState<EntryMode>(initialSnapshot.entryMode);
  const [goalInput, setGoalInput] = useState(initialSnapshot.goalInput);
  const [recommendationBatch, setRecommendationBatch] = useState(initialSnapshot.recommendationBatch);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(initialSnapshot.generatedPlan ?? null);
  const [activeStageId, setActiveStageId] = useState(initialSnapshot.activeStageId);
  const [activeRoleId, setActiveRoleId] = useState(initialSnapshot.activeRoleId);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(initialSnapshot.selectedSkillId);
  const [unlockedSkillIds, setUnlockedSkillIds] = useState<string[]>(initialSnapshot.unlockedSkillIds);
  const [seenSkillIds, setSeenSkillIds] = useState<string[]>(initialSnapshot.seenSkillIds);
  const content = MODE_TITLES[activeMode];
  const visibleTemplates = getRecommendationBatch(GOAL_TEMPLATES, recommendationBatch);
  const unlockedSkillIdSet = new Set(unlockedSkillIds);
  const seenSkillIdSet = new Set(seenSkillIds);
  const roles = ROLES.map((role) => ({
    ...role,
    skills: computeRoleSkills(role.skills, unlockedSkillIdSet, seenSkillIdSet),
  }));
  const activeRole = roles.find((role) => role.id === activeRoleId) ?? roles[0];
  const activeStage = PROCESS_STAGES.find((stage) => stage.id === activeStageId) ?? PROCESS_STAGES[0];
  const selectedSkill = findSkillById(activeRole.skills, selectedSkillId);

  useEffect(() => {
    saveSnapshot({
      entryMode: activeMode,
      activeRoleId,
      activeStageId,
      selectedSkillId,
      selectedPlanId: generatedPlan?.id ?? null,
      goalInput,
      recommendationBatch,
      unlockedSkillIds,
      seenSkillIds,
      generatedPlan: generatedPlan ?? undefined,
    });
  }, [
    activeMode,
    activeRoleId,
    activeStageId,
    selectedSkillId,
    generatedPlan,
    goalInput,
    recommendationBatch,
    unlockedSkillIds,
    seenSkillIds,
  ]);

  function handleTemplatePick(template: GoalTemplate) {
    setGoalInput(template.prompt);
  }

  function handleGenerate() {
    const goal = goalInput.trim() || GOAL_TEMPLATES[0].prompt;
    const plan = createGeneratedPlan({ goal, stages: PROCESS_STAGES });
    setGeneratedPlan(plan);
    setActiveStageId(plan.stages[0]?.id ?? "requirements");
  }

  function handleBackToGoal() {
    setGeneratedPlan(null);
    setActiveMode("goal");
  }

  function handleRegenerate() {
    const goal = goalInput.trim() || generatedPlan?.goal || GOAL_TEMPLATES[0].prompt;
    const plan = createGeneratedPlan({ goal, stages: PROCESS_STAGES });
    setGeneratedPlan(plan);
    setActiveStageId(plan.stages[0]?.id ?? "requirements");
  }

  function exportText(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleRoleChange(roleId: string) {
    const nextRole = roles.find((role) => role.id === roleId);
    setActiveRoleId(roleId);
    setSelectedSkillId(nextRole?.skills[0]?.id ?? null);
  }

  function handleUnlockSkill(skillId: string) {
    setUnlockedSkillIds((ids) => Array.from(new Set([...ids, skillId])));
  }

  function handleMarkSeen(skillId: string) {
    setSeenSkillIds((ids) => Array.from(new Set([...ids, skillId])));
  }

  function renderPlaceholder() {
    return (
      <section
        className="min-h-[calc(100vh-2.5rem)] rounded-lg border p-5 sm:p-7 lg:p-8"
        style={{ background: "#09090f", borderColor: "#1a1a28" }}
      >
        <div className="flex min-h-[420px] flex-col justify-center">
          <p className="mb-2 text-xs font-mono tracking-[0.24em]" style={{ color: "#c9963a" }}>
            {content.eyebrow}
          </p>
          <h2
            className="max-w-3xl text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-display)", color: "#e8dcc8", lineHeight: 1.12 }}
          >
            {content.title}
          </h2>
          <p
            className="mt-4 max-w-2xl text-base leading-7 sm:text-lg"
            style={{ color: "#a09080", fontFamily: "var(--font-ui)" }}
          >
            {content.description}
          </p>
          {generatedPlan && (
            <div className="mt-8 max-w-3xl rounded-lg border px-4 py-3" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
              <span className="text-xs font-mono" style={{ color: "#4a4a60" }}>已生成方案</span>
              <p className="mt-1 text-sm font-semibold" style={{ color: "#c8bca8", fontFamily: "var(--font-display)" }}>
                {generatedPlan.title}
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <WorkbenchShell activeMode={activeMode} onModeChange={setActiveMode}>
      {activeMode === "goal" && !generatedPlan ? (
        <GoalView
          goalInput={goalInput}
          templates={visibleTemplates}
          onGoalInputChange={setGoalInput}
          onTemplatePick={handleTemplatePick}
          onNextBatch={() => setRecommendationBatch((value) => value + 1)}
          onGenerate={handleGenerate}
        />
      ) : activeMode === "goal" && generatedPlan ? (
        <ResultView
          plan={generatedPlan}
          activeStageId={activeStageId}
          onStageChange={setActiveStageId}
          onBackToGoal={handleBackToGoal}
          onRegenerate={handleRegenerate}
          onExportMarkdown={() => exportText(exportPlanAsMarkdown(generatedPlan), `${generatedPlan.title}.md`, "text/markdown;charset=utf-8")}
          onExportJson={() => exportText(exportPlanAsJson(generatedPlan), `${generatedPlan.title}.json`, "application/json;charset=utf-8")}
          onOpenProcess={() => setActiveMode("process")}
        />
      ) : activeMode === "process" ? (
        <ProcessView stages={PROCESS_STAGES} activeStageId={activeStageId} onStageChange={setActiveStageId} />
      ) : activeMode === "role" ? (
        <RoleView
          roles={roles}
          activeRoleId={activeRole.id}
          activeStage={activeStage}
          selectedSkill={selectedSkill}
          selectedSkillId={selectedSkillId}
          unlockedSkillIds={unlockedSkillIds}
          onRoleChange={handleRoleChange}
          onSelectSkill={setSelectedSkillId}
          onUnlockSkill={handleUnlockSkill}
          onMarkSeen={handleMarkSeen}
        />
      ) : renderPlaceholder()}
    </WorkbenchShell>
  );
}
