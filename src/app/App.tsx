import { useCallback, useEffect, useMemo, useState } from "react";
import { GoalView } from "./components/GoalView";
import { ProcessView } from "./components/ProcessView";
import { ResultView } from "./components/ResultView";
import { RoleView } from "./components/RoleView";
import { SkillManagementView } from "./components/SkillManagementView";
import { WorkbenchShell } from "./components/WorkbenchShell";
import { GOAL_TEMPLATES, PROCESS_STAGES, ROLES } from "./data/workbenchData";
import { exportPlanAsJson, exportPlanAsMarkdown } from "./lib/exportPlan";
import { classifiedSkillsToRoles } from "./lib/graphTransform";
import { createGeneratedPlan, getRecommendationBatch } from "./lib/planGeneration";
import { computeRoleSkills, findSkillById } from "./lib/skillState";
import { loadSnapshot, saveSnapshot } from "./lib/storage";
import {
  applySyncPlan,
  createSyncPlan,
  fetchClassified,
  fetchCompatibility,
  fetchInventory,
  recommendSkills,
  type ClassifiedSkill,
  type SkillCompatibility,
  type SkillInventory,
  type SkillRecommendation,
  type SkillSyncApplyResult,
  type SkillSyncPlan,
} from "./lib/apiClient";
import type { EntryMode, GeneratedPlan, GoalTemplate, LocalGraphState } from "./types";

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
  manage: {
    eyebrow: "管理",
    title: "跨平台 Skill 资产",
    description: "扫描本机标准 SKILL.md，查看平台识别状态，生成预案并执行安全更新。",
  },
};

const MANAGEMENT_LOADING_MIN_MS = 360;

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
  const [classifiedSkills, setClassifiedSkills] = useState<ClassifiedSkill[]>([]);
  const [graphState, setGraphState] = useState<LocalGraphState>({ loading: true, available: false, warnings: [] });
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([]);
  const [recommending, setRecommending] = useState(false);
  const [inventory, setInventory] = useState<SkillInventory | null>(null);
  const [compatibility, setCompatibility] = useState<SkillCompatibility | null>(null);
  const [syncPlan, setSyncPlan] = useState<SkillSyncPlan | null>(null);
  const [syncApplyResult, setSyncApplyResult] = useState<SkillSyncApplyResult | null>(null);
  const [managementLoading, setManagementLoading] = useState(true);
  const [planningSync, setPlanningSync] = useState(false);
  const [applyingSync, setApplyingSync] = useState(false);
  const content = MODE_TITLES[activeMode];
  const visibleTemplates = getRecommendationBatch(GOAL_TEMPLATES, recommendationBatch);
  const unlockedSkillIdSet = new Set(unlockedSkillIds);
  const seenSkillIdSet = new Set(seenSkillIds);

  const loadGraph = useCallback(async () => {
    try {
      const data = await fetchClassified();
      setClassifiedSkills(data.skills);
      setGraphState({ loading: false, available: true, warnings: data.warnings });
    } catch {
      setGraphState({ loading: false, available: false, warnings: [] });
    }
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const loadManagement = useCallback(async () => {
    setManagementLoading(true);
    setSyncPlan(null);
    setSyncApplyResult(null);
    try {
      const [inventoryData, compatibilityData] = await Promise.all([
        fetchInventory(),
        fetchCompatibility(),
        new Promise((resolve) => window.setTimeout(resolve, MANAGEMENT_LOADING_MIN_MS)),
      ]);
      setInventory(inventoryData);
      setCompatibility(compatibilityData);
    } catch {
      await new Promise((resolve) => window.setTimeout(resolve, MANAGEMENT_LOADING_MIN_MS));
      setInventory(null);
      setCompatibility(null);
    } finally {
      setManagementLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManagement();
  }, [loadManagement]);

  const localRoles = useMemo(() => classifiedSkillsToRoles(classifiedSkills), [classifiedSkills]);

  const roles = useMemo(() => {
    const baseRoles = graphState.available && localRoles.length > 0 ? localRoles : ROLES;

    return baseRoles.map((role) => ({
      ...role,
      skills: computeRoleSkills(role.skills, unlockedSkillIdSet, seenSkillIdSet),
    }));
  }, [graphState.available, localRoles, unlockedSkillIdSet, seenSkillIdSet]);

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

  async function handleGenerate() {
    const goal = goalInput.trim() || GOAL_TEMPLATES[0].prompt;
    
    if (graphState.available) {
      setRecommending(true);
      try {
        const data = await recommendSkills(goal);
        setRecommendations(data.recommendations);
      } catch {
        // 推荐 API 调用失败，继续使用规则生成方案
      }
      setRecommending(false);
    }
    
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

  async function handleCreateSyncPlan() {
    setPlanningSync(true);
    setSyncApplyResult(null);
    try {
      const plan = await createSyncPlan();
      setSyncPlan(plan);
    } catch {
      setSyncPlan({ dryRun: true, actions: [], warnings: ["同步预案生成失败。"] });
    } finally {
      setPlanningSync(false);
    }
  }

  async function handleApplySyncPlan() {
    setApplyingSync(true);
    try {
      const result = await applySyncPlan();
      const [inventoryData, compatibilityData, plan] = await Promise.all([
        fetchInventory(),
        fetchCompatibility(),
        createSyncPlan(),
      ]);
      setSyncApplyResult(result);
      setInventory(inventoryData);
      setCompatibility(compatibilityData);
      setSyncPlan(plan);
    } catch {
      setSyncApplyResult({
        dryRun: false,
        created: [],
        skipped: [],
        errors: [
          {
            type: "manual-review-conflict",
            skillId: "sync-apply",
            skillName: "安全更新",
            platformId: "agents-shared",
            reason: "安全更新执行失败。",
          },
        ],
        warnings: [],
      });
    } finally {
      setApplyingSync(false);
    }
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
      {!graphState.loading && !graphState.available && (
        <div className="mb-4 rounded-lg border px-4 py-2.5" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
          <p className="text-xs font-mono" style={{ color: "#4a4a60" }}>
            本地 Skill 图谱服务未启动，当前使用演示数据。
            {graphState.warnings.length > 0 && ` ${graphState.warnings.join(" ")}`}
          </p>
        </div>
      )}

      {activeMode === "goal" && !generatedPlan ? (
        <GoalView
          goalInput={goalInput}
          templates={visibleTemplates}
          onGoalInputChange={setGoalInput}
          onTemplatePick={handleTemplatePick}
          onNextBatch={() => setRecommendationBatch((value) => value + 1)}
          onGenerate={handleGenerate}
          classifiedSkills={classifiedSkills}
          recommendations={recommendations}
          recommending={recommending}
          graphAvailable={graphState.available}
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
          recommendations={recommendations}
          classifiedSkills={classifiedSkills}
        />
      ) : activeMode === "process" ? (
        <ProcessView
          stages={PROCESS_STAGES}
          activeStageId={activeStageId}
          onStageChange={setActiveStageId}
          classifiedSkills={classifiedSkills}
          graphAvailable={graphState.available}
        />
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
          graphAvailable={graphState.available}
        />
      ) : activeMode === "manage" ? (
        <SkillManagementView
          inventory={inventory}
          compatibility={compatibility}
          syncPlan={syncPlan}
          syncApplyResult={syncApplyResult}
          loading={managementLoading}
          planning={planningSync}
          applying={applyingSync}
          onRefresh={loadManagement}
          onCreateSyncPlan={handleCreateSyncPlan}
          onApplySyncPlan={handleApplySyncPlan}
        />
      ) : renderPlaceholder()}
    </WorkbenchShell>
  );
}
