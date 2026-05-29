import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  FileSymlink,
  ListFilter,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import type { PlatformId, SkillCompatibility, SkillInventory, SkillInventoryItem, SkillSyncApplyResult, SkillSyncPlan } from "../lib/apiClient";
import {
  filterSkillInventoryItems,
  filterSyncPlanActions,
  DEPTH_DECISION_LABELS,
  getDecisionFilterLabel,
  getPlatformStatusLabel,
  getPlatformStatusTone,
  getSkillDecisionBuckets,
  getSkillFilterCounts,
  getSyncPlanActionCounts,
  paginateSkillInventoryItems,
  summarizeSkillManagement,
  type SkillManagementFilter,
  type SkillInventoryPage,
  type SyncPlanActionFilter,
} from "../lib/skillManagement";

interface SkillManagementViewProps {
  inventory: SkillInventory | null;
  compatibility: SkillCompatibility | null;
  syncPlan: SkillSyncPlan | null;
  syncApplyResult: SkillSyncApplyResult | null;
  loading: boolean;
  planning: boolean;
  applying: boolean;
  initialQuery?: string;
  onRefresh: () => void;
  onCreateSyncPlan: () => void;
  onApplySyncPlan: () => void;
}

const PLATFORM_LABELS: Record<PlatformId, string> = {
  codex: "Codex",
  claude: "Claude",
  trae: "Trae",
  cursor: "Cursor",
  "agents-shared": ".agents",
};

const ACTION_LABELS: Record<string, string> = {
  "copy-to-target": "复制预案",
  "link-to-target": "软链预案",
  "convert-to-cursor-rule": "Cursor 桥接",
  "skip-readonly-source": "跳过只读",
  "manual-review-conflict": "人工复核",
};

const SKILL_PAGE_SIZE = 24;
const MAX_PAGE_BUTTONS = 5;

export function SkillManagementView({
  inventory,
  compatibility,
  syncPlan,
  syncApplyResult,
  loading,
  planning,
  applying,
  initialQuery,
  onRefresh,
  onCreateSyncPlan,
  onApplySyncPlan,
}: SkillManagementViewProps) {
  const [activeFilter, setActiveFilter] = useState<SkillManagementFilter>("all");
  const [query, setQuery] = useState(initialQuery ?? "");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<SyncPlanActionFilter>("all");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedPlatformId, setSelectedPlatformId] = useState<PlatformId | null>(null);
  const summary = summarizeSkillManagement(inventory, compatibility);

  if (loading) {
    return <SkillManagementSkeleton />;
  }

  if (!inventory || !compatibility) {
    return (
      <section className="mx-auto max-w-7xl">
        <div className="rounded-lg border p-6" style={{ background: "#09090f", borderColor: "#6a2a2a" }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} style={{ color: "#ff8a8a" }} />
                <p className="text-sm font-semibold" style={{ color: "#ffb0b0", fontFamily: "var(--font-display)" }}>管理数据不可用</p>
              </div>
              <p className="mt-2 text-sm font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>重新连接并刷新</p>
              <p className="mt-2 max-w-2xl text-xs leading-5" style={{ color: "#a09080" }}>
                请确认本地 API 服务已启动，然后重新扫描 inventory、compatibility 和同步预案数据。
              </p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-bold transition-all duration-200 hover:brightness-125 active:scale-95"
              style={{ background: "#19140a", borderColor: "#5a4620", color: "#f0c06a", fontFamily: "var(--font-display)" }}
            >
              <RefreshCw size={14} />
              刷新资产
            </button>
          </div>
        </div>
      </section>
    );
  }

  const filterCounts = getSkillFilterCounts(inventory, compatibility);
  const decisionBuckets = getSkillDecisionBuckets(inventory);
  const platformBuckets = compatibility.platforms
    .map((platformId) => ({
      id: platformId,
      label: PLATFORM_LABELS[platformId],
      count: inventory.items.filter((item) => item.platformIds.includes(platformId)).length,
    }))
    .filter((bucket) => bucket.count > 0);
  const filteredItems = filterSkillInventoryItems({
    inventory,
    compatibility,
    filter: activeFilter,
    query,
    roleId: selectedRoleId,
    stageId: selectedStageId,
    platformId: selectedPlatformId,
  });
  const skillPage = paginateSkillInventoryItems(filteredItems, { page: currentPage, pageSize: SKILL_PAGE_SIZE });
  const selectedItem = filteredItems.find((item) => item.id === selectedSkillId) ?? skillPage.items[0] ?? null;
  const selectedCompatibility = selectedItem ? compatibility.items.find((entry) => entry.skillId === selectedItem.id) : null;
  const actionCounts = getSyncPlanActionCounts(syncPlan);
  const filteredActions = filterSyncPlanActions(syncPlan, actionFilter);

  function handleFilterChange(filter: SkillManagementFilter) {
    setActiveFilter(filter);
    setSelectedSkillId(null);
    setCurrentPage(1);
  }

  function handlePageChange(page: number) {
    const nextPage = Math.min(Math.max(1, page), skillPage.totalPages);
    setCurrentPage(nextPage);
    setSelectedSkillId(null);
  }

  function handleClearFilters() {
    setActiveFilter("all");
    setSelectedRoleId(null);
    setSelectedStageId(null);
    setSelectedPlatformId(null);
    setQuery("");
    setSelectedSkillId(null);
    setCurrentPage(1);
  }

  const hasInventoryItems = inventory.items.length > 0;
  const hasFilteredItems = filteredItems.length > 0;

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-mono tracking-[0.28em]" style={{ color: "#c9963a" }}>管理</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-display)", color: "#e8dcc8" }}>
            跨平台 Skill 资产
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "#a09080" }}>
            按角色、流程和平台查看本地 Skill 状态，先判断缺口，再安全补齐缺失项。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition-all duration-200 hover:brightness-125 active:scale-95"
            style={{ background: "#0d0d16", borderColor: "#1a1a28", color: "#c8bca8", fontFamily: "var(--font-display)" }}
          >
            <RefreshCw size={15} />
            刷新资产
          </button>
          <button
            type="button"
            onClick={syncPlan ? onApplySyncPlan : onCreateSyncPlan}
            disabled={planning || applying}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-all duration-200 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: syncPlan ? "#4db885" : "#c9963a", color: syncPlan ? "#06100b" : "#0a0a10", fontFamily: "var(--font-display)" }}
          >
            <RefreshCw size={15} className={planning || applying ? "animate-spin" : ""} />
            {syncPlan ? (applying ? "正在安全补齐" : "安全补齐") : planning ? "正在检查更新" : "检查更新"}
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {(["all", "duplicates", "readonly", "conflicts", "cursorBridge"] as SkillManagementFilter[]).map((filter) => (
          <MetricButton
            key={filter}
            active={activeFilter === filter}
            label={getDecisionFilterLabel(filter)}
            value={filterCounts[filter]}
            onClick={() => handleFilterChange(filter)}
          />
        ))}
        <div className="rounded-lg border p-4" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
          <p className="text-xs font-mono" style={{ color: "#4a4a60" }}>Occurrence</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>{summary.totalOccurrences}</p>
        </div>
      </div>

      <DecisionFilterPanel
        roleBuckets={decisionBuckets.roles}
        stageBuckets={decisionBuckets.stages}
        platformBuckets={platformBuckets}
        activeFilter={activeFilter}
        selectedRoleId={selectedRoleId}
        selectedStageId={selectedStageId}
        selectedPlatformId={selectedPlatformId}
        onSelectRole={(roleId) => {
          setSelectedRoleId(selectedRoleId === roleId ? null : roleId);
          setSelectedSkillId(null);
          setCurrentPage(1);
        }}
        onSelectStage={(stageId) => {
          setSelectedStageId(selectedStageId === stageId ? null : stageId);
          setSelectedSkillId(null);
          setCurrentPage(1);
        }}
        onSelectPlatform={(platformId) => {
          setSelectedPlatformId(selectedPlatformId === platformId ? null : platformId);
          setSelectedSkillId(null);
          setCurrentPage(1);
        }}
        onClear={handleClearFilters}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <section className="rounded-lg border" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
            <header className="border-b px-5 py-4" style={{ borderColor: "#1a1a28" }}>
              <p className="text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>平台矩阵</p>
            </header>
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-5">
              {compatibility.platforms.map((platformId) => {
                const counts = countStatuses(compatibility, platformId);
                return (
                  <div key={platformId} className="rounded-lg border p-4" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
                    <p className="font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>{PLATFORM_LABELS[platformId]}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Object.entries(counts).map(([status, count]) => {
                        const tone = getPlatformStatusTone(status as keyof typeof counts);
                        return (
                          <span key={status} className="rounded-full border px-2 py-0.5 text-xs font-mono" style={{ background: tone.background, borderColor: tone.border, color: tone.color }}>
                            {getPlatformStatusLabel(status as keyof typeof counts)} {count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
            <header className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: "#1a1a28" }}>
              <div>
                <p className="text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>Skill 清单</p>
                <p className="mt-1 text-xs" style={{ color: "#a09080" }}>
                  {activeFilter === "all" ? "全部 Skill" : getDecisionFilterLabel(activeFilter)} · 显示 {skillPage.startItem}-{skillPage.endItem} / {filteredItems.length}，第 {skillPage.page} / {skillPage.totalPages} 页。
                </p>
              </div>
              <label className="flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 lg:w-80" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
                <Search size={14} style={{ color: "#4a4a60" }} />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setCurrentPage(1);
                    setSelectedSkillId(null);
                  }}
                  placeholder="搜索名称、路径、平台或 hash"
                  className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                  style={{ color: "#e8dcc8" }}
                />
              </label>
            </header>
            <div className="divide-y" style={{ borderColor: "#1a1a28" }}>
              {skillPage.items.map((item) => {
                const itemCompatibility = compatibility.items.find((entry) => entry.skillId === item.id);
                const hasConflict = itemCompatibility
                  ? Object.values(itemCompatibility.platforms).some((entry) => entry.status === "conflict")
                  : false;
                const active = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedSkillId(item.id)}
                    className="block w-full px-5 py-4 text-left transition-all duration-200 hover:brightness-125"
                    style={{ background: active ? "#101827" : "transparent" }}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>{item.name}</h3>
                          {item.occurrenceCount > 1 && <Badge label={`${item.occurrenceCount} 份`} tone="gold" />}
                          {hasConflict && <Badge label="冲突" tone="red" />}
                          <Badge label={getDecisionFilterLabel(`role:${item.classification.roleIds[0] ?? "lead"}`)} tone="blue" />
                          <Badge label={getDecisionFilterLabel(`stage:${item.classification.stageIds[0] ?? "requirements"}`)} tone="purple" />
                        </div>
                        <p className="mt-1 text-xs leading-5" style={{ color: "#a09080" }}>{item.description}</p>
                        <p className="mt-2 break-all text-xs font-mono" style={{ color: "#3a3a50" }}>{item.contentSha256.slice(0, 16)} · {item.canonicalPath}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 lg:justify-end">
                        {item.platformIds.map((platformId) => (
                          <Badge key={platformId} label={PLATFORM_LABELS[platformId]} tone={platformId === "trae" ? "purple" : "green"} />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
              {!hasInventoryItems && <SkillEmptyState onRefresh={onRefresh} />}
              {hasInventoryItems && !hasFilteredItems && <SkillNoResultsState onClear={handleClearFilters} />}
              {hasFilteredItems && <SkillPaginationControls page={skillPage} onPageChange={handlePageChange} />}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <SkillDetailCard item={selectedItem} compatibility={selectedCompatibility} />

          <section className="rounded-lg border p-5" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={15} style={{ color: "#4db885" }} />
              <p className="text-sm font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>扫描根</p>
            </div>
            <div className="flex flex-col gap-2">
              {inventory.roots.map((root) => (
                <div key={root.id} className="rounded border px-3 py-2" style={{ background: "#0d0d16", borderColor: root.exists ? "#1a1a28" : "#3a2430" }}>
                  <div className="flex items-center gap-2">
                    {root.exists ? <CheckCircle2 size={13} style={{ color: "#4db885" }} /> : <AlertTriangle size={13} style={{ color: "#ff8a8a" }} />}
                    <span className="text-xs font-bold" style={{ color: "#c8bca8" }}>{root.label}</span>
                    {root.readOnly && <Badge label="只读" tone="purple" />}
                  </div>
                  <p className="mt-1 break-all text-xs font-mono" style={{ color: "#4a4a60" }}>{root.path}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border p-5" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSymlink size={15} style={{ color: "#7dd3fc" }} />
                <p className="text-sm font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>安全补齐</p>
              </div>
              {syncPlan && <Badge label={syncApplyResult ? "Applied" : "Ready"} tone={syncApplyResult ? "green" : "blue"} />}
            </div>
            {!syncPlan ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs leading-5" style={{ color: "#4a4a60" }}>
                  先检查各平台缺少哪些 Skill。这里只做检查，不会写入文件。
                </p>
                {planning && (
                  <div className="rounded-lg border px-3 py-2" style={{ background: "#10171f", borderColor: "#25506a" }}>
                    <div className="flex items-center gap-2">
                      <RefreshCw size={13} className="animate-spin" style={{ color: "#7dd3fc" }} />
                      <p className="text-xs font-bold" style={{ color: "#7dd3fc", fontFamily: "var(--font-display)" }}>
                        正在检查哪些 Skill 可以安全补齐
                      </p>
                    </div>
                    <p className="mt-1 text-xs leading-5" style={{ color: "#93a4bd" }}>
                      正在比对缺失、冲突、只读来源和 Cursor 规则桥接。
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onCreateSyncPlan}
                  disabled={planning}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all duration-200 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "#c9963a", color: "#0a0a10", fontFamily: "var(--font-display)" }}
                >
                  <RefreshCw size={14} className={planning ? "animate-spin" : ""} />
                  检查可补齐项
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs leading-5" style={{ color: "#a09080" }}>
                  找到 {syncPlan.actions.length} 个可处理项。安全补齐只创建缺失文件，不覆盖已有文件，冲突和只读来源会跳过。
                </p>
                <button
                  type="button"
                  onClick={onApplySyncPlan}
                  disabled={applying}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all duration-200 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "#4db885", color: "#06100b", fontFamily: "var(--font-display)" }}
                >
                  <RefreshCw size={14} className={applying ? "animate-spin" : ""} />
                  {applying ? "正在同步缺失的 Skill" : "同步缺失的 Skill"}
                </button>
                {syncApplyResult && <SyncApplyResultPanel result={syncApplyResult} />}
                {syncPlan.warnings.length > 0 && (
                  <div className="rounded-lg border p-3" style={{ background: "#1f1010", borderColor: "#6a2a2a" }}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={13} style={{ color: "#ff8a8a" }} />
                      <p className="text-xs font-bold" style={{ color: "#ffb0b0", fontFamily: "var(--font-display)" }}>需要你确认的项目</p>
                    </div>
                    <ul className="mt-2 flex flex-col gap-1">
                      {syncPlan.warnings.map((warning) => (
                        <li key={warning} className="text-xs leading-5" style={{ color: "#ffd0d0" }}>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(actionCounts) as SyncPlanActionFilter[]).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActionFilter(filter)}
                      className="rounded-full border px-2 py-0.5 text-xs font-mono transition-all duration-200 hover:brightness-125"
                      style={{
                        background: actionFilter === filter ? "#19140a" : "#0d0d16",
                        borderColor: actionFilter === filter ? "#5a4620" : "#1a1a28",
                        color: actionFilter === filter ? "#f0c06a" : "#a09080",
                      }}
                    >
                      {filter === "all" ? "全部" : ACTION_LABELS[filter]} {actionCounts[filter]}
                    </button>
                  ))}
                </div>
                <div className="flex max-h-[520px] flex-col gap-2 overflow-auto pr-1">
                  {filteredActions.map((action, index) => (
                    <div key={`${action.type}-${action.skillId}-${action.platformId}-${index}`} className="rounded border p-3" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
                      <div className="flex items-center gap-2">
                        <Copy size={13} style={{ color: action.type === "manual-review-conflict" ? "#ff8a8a" : "#c9963a" }} />
                        <span className="text-xs font-bold" style={{ color: "#e8dcc8" }}>{ACTION_LABELS[action.type] ?? action.type}</span>
                        <Badge label={PLATFORM_LABELS[action.platformId]} tone="green" />
                      </div>
                      <p className="mt-1 text-xs leading-5" style={{ color: "#a09080" }}>{action.skillName}</p>
                      {action.targetPath && <p className="mt-1 break-all text-xs font-mono" style={{ color: "#4a4a60" }}>{action.targetPath}</p>}
                    </div>
                  ))}
                  {filteredActions.length === 0 && <p className="text-xs" style={{ color: "#4a4a60" }}>暂无动作。</p>}
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}

function SkillManagementSkeleton() {
  return (
    <section className="mx-auto max-w-7xl" data-testid="skill-management-skeleton">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-mono tracking-[0.28em]" style={{ color: "#c9963a" }}>管理</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-display)", color: "#e8dcc8" }}>
            正在刷新 Skill 资产
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "#a09080" }}>
            正在重新扫描本机目录、计算内容指纹和平台识别状态。
          </p>
        </div>
        <div className="h-11 w-32 animate-pulse rounded-lg" style={{ background: "#111827" }} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <section className="rounded-lg border" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
            <div className="border-b px-5 py-4" style={{ borderColor: "#1a1a28" }}>
              <SkeletonLine width="w-28" />
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-5">
              {Array.from({ length: 5 }, (_, index) => (
                <SkeletonCard key={index} compact />
              ))}
            </div>
          </section>

          <section className="rounded-lg border" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
            <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: "#1a1a28" }}>
              <div className="flex flex-col gap-2">
                <SkeletonLine width="w-24" />
                <SkeletonLine width="w-48" />
              </div>
              <div className="h-9 rounded-lg" style={{ background: "#0d0d16", border: "1px solid #1a1a28", width: "min(100%, 320px)" }} />
            </div>
            <div className="divide-y" style={{ borderColor: "#1a1a28" }}>
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} data-testid="skill-skeleton-row" className="px-5 py-4">
                  <SkeletonLine width={index % 2 === 0 ? "w-40" : "w-56"} />
                  <div className="mt-3 flex flex-col gap-2">
                    <SkeletonLine width="w-full" />
                    <SkeletonLine width="w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          {Array.from({ length: 3 }, (_, index) => (
            <section key={index} className="rounded-lg border p-5" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
              <SkeletonLine width="w-32" />
              <div className="mt-4 flex flex-col gap-2">
                <SkeletonLine width="w-full" />
                <SkeletonLine width="w-3/4" />
                <SkeletonLine width="w-1/2" />
              </div>
            </section>
          ))}
        </aside>
      </div>
    </section>
  );
}

function SkillEmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="px-5 py-10">
      <div className="rounded-lg border p-6" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-base font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>
              还没有发现标准 SKILL.md
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "#a09080" }}>
              检查这些扫描根是否存在，或把 skill 放到项目 `skills/`、`~/.codex/skills`、`~/.agents/skills`、`~/.claude/skills` 等标准目录后刷新。
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-bold transition-all duration-200 hover:brightness-125 active:scale-95"
            style={{ background: "#19140a", borderColor: "#5a4620", color: "#f0c06a", fontFamily: "var(--font-display)" }}
          >
            <RefreshCw size={14} />
            刷新资产
          </button>
        </div>
      </div>
    </div>
  );
}

function SkillNoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <div className="px-5 py-10">
      <div className="rounded-lg border p-6" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-base font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>
              没有匹配的 Skill
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "#a09080" }}>
              当前关键词或筛选条件没有命中本地 inventory。清除筛选后可回到完整清单。
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-bold transition-all duration-200 hover:brightness-125 active:scale-95"
            style={{ background: "#10171f", borderColor: "#25506a", color: "#7dd3fc", fontFamily: "var(--font-display)" }}
          >
            <ListFilter size={14} />
            清除筛选
          </button>
        </div>
      </div>
    </div>
  );
}

function SyncApplyResultPanel({ result }: { result: SkillSyncApplyResult }) {
  const firstEntries = [...result.errors, ...result.created, ...result.skipped].slice(0, 6);

  return (
    <div className="rounded-lg border p-3" style={{ background: "#0d0d16", borderColor: result.errors.length > 0 ? "#6a2a2a" : "#2a5a3a" }}>
      <p className="text-xs font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>同步完成</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <ResultMetric label="已补齐" value={result.created.length} tone="green" />
        <ResultMetric label="跳过" value={result.skipped.length} tone="gold" />
        <ResultMetric label="需处理" value={result.errors.length} tone={result.errors.length > 0 ? "red" : "blue"} />
      </div>
      {firstEntries.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {firstEntries.map((entry, index) => (
            <div key={`${entry.type}-${entry.skillId}-${entry.platformId}-${index}`} className="rounded border px-2 py-1.5" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge label={ACTION_LABELS[entry.type] ?? entry.type} tone={entry.type === "manual-review-conflict" ? "red" : "blue"} />
                <span className="text-xs font-bold" style={{ color: "#c8bca8" }}>{entry.skillName}</span>
              </div>
              <p className="mt-1 text-xs leading-5" style={{ color: "#a09080" }}>{entry.reason}</p>
              {entry.targetPath && <p className="mt-1 break-all text-xs font-mono" style={{ color: "#4a4a60" }}>{entry.targetPath}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DecisionFilterPanel({
  roleBuckets,
  stageBuckets,
  platformBuckets,
  activeFilter,
  selectedRoleId,
  selectedStageId,
  selectedPlatformId,
  onSelectRole,
  onSelectStage,
  onSelectPlatform,
  onClear,
}: {
  roleBuckets: Array<{ id: string; label: string; count: number }>;
  stageBuckets: Array<{ id: string; label: string; count: number }>;
  platformBuckets: Array<{ id: PlatformId; label: string; count: number }>;
  activeFilter: SkillManagementFilter;
  selectedRoleId: string | null;
  selectedStageId: string | null;
  selectedPlatformId: PlatformId | null;
  onSelectRole: (roleId: string) => void;
  onSelectStage: (stageId: string) => void;
  onSelectPlatform: (platformId: PlatformId) => void;
  onClear: () => void;
}) {
  const hasDecisionFilter = Boolean(selectedRoleId || selectedStageId || selectedPlatformId || activeFilter !== "all");

  return (
    <section className="mb-5 rounded-lg border p-4" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>决策筛选</p>
          <p className="mt-1 text-xs leading-5" style={{ color: "#a09080" }}>
            角色、流程、工具可以同时选择，清单会按组合条件收敛。
          </p>
        </div>
        {hasDecisionFilter && (
          <button
            type="button"
            onClick={onClear}
            className="w-fit rounded-lg border px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:brightness-125"
            style={{ background: "#0d0d16", borderColor: "#1a1a28", color: "#a09080", fontFamily: "var(--font-display)" }}
          >
            清除筛选
          </button>
        )}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <DecisionFilterRow
          title="角色"
          buckets={roleBuckets}
          selectedId={selectedRoleId}
          onSelect={onSelectRole}
        />
        <DecisionFilterRow
          title="流程"
          buckets={stageBuckets}
          selectedId={selectedStageId}
          onSelect={onSelectStage}
        />
        <DecisionFilterRow
          title="工具"
          buckets={platformBuckets}
          selectedId={selectedPlatformId}
          onSelect={onSelectPlatform}
        />
      </div>
    </section>
  );
}

function DecisionFilterRow<TId extends string>({
  title,
  buckets,
  selectedId,
  onSelect,
}: {
  title: string;
  buckets: Array<{ id: TId; label: string; count: number }>;
  selectedId: TId | null;
  onSelect: (id: TId) => void;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-mono" style={{ color: "#4a4a60" }}>{title}</p>
      <div className="flex flex-wrap gap-2">
        {buckets.map((bucket) => {
          const active = selectedId === bucket.id;
          return (
            <button
              key={bucket.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(bucket.id)}
              className="inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:brightness-125"
              style={{
                background: active ? "#19140a" : "#0d0d16",
                borderColor: active ? "#5a4620" : "#1a1a28",
                color: active ? "#f0c06a" : "#c8bca8",
                fontFamily: "var(--font-display)",
              }}
            >
              <span className="truncate">{bucket.label}</span>
              <span className="font-mono" style={{ color: active ? "#f0c06a" : "#4a4a60" }}>{bucket.count}</span>
            </button>
          );
        })}
        {buckets.length === 0 && <p className="text-xs" style={{ color: "#4a4a60" }}>暂无可筛选项。</p>}
      </div>
    </div>
  );
}

function ResultMetric({ label, value, tone }: { label: string; value: number; tone: "green" | "gold" | "red" | "blue" }) {
  const color = {
    green: "#4db885",
    gold: "#f0c06a",
    red: "#ff8a8a",
    blue: "#7dd3fc",
  }[tone];

  return (
    <div className="rounded border px-2 py-1.5" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
      <p className="text-[11px] font-mono" style={{ color: "#4a4a60" }}>{label}</p>
      <p className="mt-1 text-sm font-bold" style={{ color, fontFamily: "var(--font-display)" }}>{label} {value}</p>
    </div>
  );
}

function SkeletonCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg border p-4" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
      <SkeletonLine width={compact ? "w-20" : "w-16"} />
      <div className={compact ? "mt-4" : "mt-5"}>
        <SkeletonLine width={compact ? "w-24" : "w-12"} height={compact ? "h-4" : "h-7"} />
      </div>
    </div>
  );
}

function SkeletonLine({ width, height = "h-3" }: { width: string; height?: string }) {
  return <div className={`${height} ${width} animate-pulse rounded-full`} style={{ background: "#151522" }} />;
}

function SkillPaginationControls({
  page,
  onPageChange,
}: {
  page: SkillInventoryPage;
  onPageChange: (page: number) => void;
}) {
  const pages = getVisiblePages(page.page, page.totalPages);

  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-mono" style={{ color: "#4a4a60" }}>
        {page.totalItems === 0 ? "0 条结果" : `${page.startItem}-${page.endItem} / ${page.totalItems} 条`}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <PaginationIconButton
          label="第一页"
          disabled={!page.hasPrevious}
          onClick={() => onPageChange(1)}
          icon={<ChevronsLeft size={14} />}
        />
        <PaginationIconButton
          label="上一页"
          disabled={!page.hasPrevious}
          onClick={() => onPageChange(page.page - 1)}
          icon={<ChevronLeft size={14} />}
        />
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            aria-current={pageNumber === page.page ? "page" : undefined}
            className="flex h-8 min-w-8 items-center justify-center rounded border px-2 text-xs font-bold transition-all duration-200 hover:brightness-125"
            style={{
              background: pageNumber === page.page ? "#19140a" : "#0d0d16",
              borderColor: pageNumber === page.page ? "#5a4620" : "#1a1a28",
              color: pageNumber === page.page ? "#f0c06a" : "#a09080",
              fontFamily: "var(--font-display)",
            }}
          >
            {pageNumber}
          </button>
        ))}
        <PaginationIconButton
          label="下一页"
          disabled={!page.hasNext}
          onClick={() => onPageChange(page.page + 1)}
          icon={<ChevronRight size={14} />}
        />
        <PaginationIconButton
          label="最后一页"
          disabled={!page.hasNext}
          onClick={() => onPageChange(page.totalPages)}
          icon={<ChevronsRight size={14} />}
        />
      </div>
    </div>
  );
}

function PaginationIconButton({
  label,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded border transition-all duration-200 hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-35"
      style={{ background: "#0d0d16", borderColor: "#1a1a28", color: "#a09080" }}
    >
      {icon}
    </button>
  );
}

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const pageCount = Math.min(MAX_PAGE_BUTTONS, totalPages);
  const halfWindow = Math.floor(pageCount / 2);
  const startPage = Math.min(Math.max(1, currentPage - halfWindow), Math.max(1, totalPages - pageCount + 1));

  return Array.from({ length: pageCount }, (_, index) => startPage + index);
}

function MetricButton({
  active,
  label,
  value,
  onClick,
}: {
  active: boolean;
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-lg border p-4 text-left transition-all duration-200 hover:brightness-125"
      style={{
        background: active ? "#111827" : "#09090f",
        borderColor: active ? "#c9963a55" : "#1a1a28",
        boxShadow: active ? "0 8px 24px rgba(201,150,58,0.12)" : "none",
      }}
    >
      <div className="flex items-center gap-2">
        <ListFilter size={13} style={{ color: active ? "#f0c06a" : "#4a4a60" }} />
        <p className="text-xs font-mono" style={{ color: active ? "#f0c06a" : "#4a4a60" }}>{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>{value}</p>
    </button>
  );
}

function SkillDetailCard({
  item,
  compatibility,
}: {
  item: SkillInventoryItem | null;
  compatibility: SkillCompatibility["items"][number] | null | undefined;
}) {
  if (!item) {
    return (
      <section className="rounded-lg border p-5" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
        <p className="text-sm font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>Skill 详情</p>
        <p className="mt-2 text-xs" style={{ color: "#4a4a60" }}>选择一个 skill 查看来源和平台状态。</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border p-5" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
      <p className="text-sm font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>{item.name}</p>
      <p className="mt-2 text-xs leading-5" style={{ color: "#a09080" }}>{item.description}</p>
      <p className="mt-3 break-all text-xs font-mono" style={{ color: "#4a4a60" }}>{item.contentSha256}</p>

      <div className="mt-4 rounded border p-3" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
        <p className="text-xs font-bold" style={{ color: "#e8dcc8", fontFamily: "var(--font-display)" }}>决策分类</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.classification.roleIds.map((roleId) => (
            <Badge key={`role-${roleId}`} label={getDecisionFilterLabel(`role:${roleId}`)} tone="blue" />
          ))}
          {item.classification.stageIds.map((stageId) => (
            <Badge key={`stage-${stageId}`} label={getDecisionFilterLabel(`stage:${stageId}`)} tone="purple" />
          ))}
          <Badge label={DEPTH_DECISION_LABELS[item.classification.depth]} tone="gold" />
        </div>
        <p className="mt-2 text-xs leading-5" style={{ color: "#a09080" }}>
          置信度 {Math.round(item.classification.confidence * 100)}% · {item.classification.reason}
        </p>
      </div>

      {compatibility && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Object.entries(compatibility.platforms).map(([platformId, entry]) => {
            const tone = getPlatformStatusTone(entry.status);
            return (
              <span key={platformId} className="rounded-full border px-2 py-0.5 text-xs font-mono" style={{ background: tone.background, borderColor: tone.border, color: tone.color }}>
                {PLATFORM_LABELS[platformId as PlatformId]} · {getPlatformStatusLabel(entry.status)}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {item.occurrences.map((occurrence) => (
          <div key={occurrence.id} className="rounded border p-3" style={{ background: "#0d0d16", borderColor: occurrence.readOnly ? "#49316e" : "#1a1a28" }}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={PLATFORM_LABELS[occurrence.platformId]} tone={occurrence.readOnly ? "purple" : "green"} />
              <span className="text-xs font-mono" style={{ color: "#4a4a60" }}>{occurrence.sourceType}</span>
              {occurrence.readOnly && <Badge label="只读" tone="purple" />}
            </div>
            <p className="mt-2 break-all text-xs font-mono" style={{ color: "#a09080" }}>{occurrence.path}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function countStatuses(compatibility: SkillCompatibility, platformId: PlatformId) {
  const counts = {
    recognized: 0,
    missing: 0,
    duplicate: 0,
    conflict: 0,
    "readonly-source": 0,
    "bridge-required": 0,
  };

  for (const item of compatibility.items) {
    counts[item.platforms[platformId].status] += 1;
  }

  return Object.fromEntries(Object.entries(counts).filter(([, count]) => count > 0)) as typeof counts;
}

function Badge({ label, tone }: { label: string; tone: "green" | "gold" | "purple" | "red" | "blue" }) {
  const colors = {
    green: { background: "#0f1a15", border: "#2a5a3a", color: "#4db885" },
    gold: { background: "#19140a", border: "#5a4620", color: "#f0c06a" },
    purple: { background: "#141021", border: "#49316e", color: "#d8b4fe" },
    red: { background: "#1f1010", border: "#6a2a2a", color: "#ff8a8a" },
    blue: { background: "#10171f", border: "#25506a", color: "#7dd3fc" },
  }[tone];

  return (
    <span className="rounded-full border px-2 py-0.5 text-xs font-mono" style={{ background: colors.background, borderColor: colors.border, color: colors.color }}>
      {label}
    </span>
  );
}
