import { Download, FileJson, RefreshCw } from "lucide-react";
import type { GeneratedPlan } from "../types";

interface ResultViewProps {
  plan: GeneratedPlan;
  activeStageId: string;
  onStageChange: (stageId: string) => void;
  onBackToGoal: () => void;
  onRegenerate: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onOpenProcess: () => void;
}

export function ResultView({
  plan,
  activeStageId,
  onStageChange,
  onBackToGoal,
  onRegenerate,
  onExportMarkdown,
  onExportJson,
  onOpenProcess,
}: ResultViewProps) {
  const activeStage = plan.stages.find((stage) => stage.id === activeStageId) ?? plan.stages[0];
  const nextStage = plan.stages.find((stage) => stage.id === activeStage.nextStageId);

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <button onClick={onBackToGoal} className="font-semibold transition-all duration-150 hover:brightness-110" style={{ color: "#c9963a" }}>
          按目标
        </button>
        <span style={{ color: "#3a3a50" }}>›</span>
        <span style={{ color: "#a09080" }}>生成结果</span>
        <span style={{ color: "#3a3a50" }}>›</span>
        <span className="truncate" style={{ color: "#4a4a60" }}>{plan.title}</span>
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
        <header className="flex flex-col gap-5 border-b px-5 py-6 lg:flex-row lg:items-start lg:justify-between lg:px-7" style={{ borderColor: "#1a1a28", background: "#0a0a12" }}>
          <div>
            <p className="text-xs font-mono tracking-[0.24em]" style={{ color: "#c9963a" }}>生成方案</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-display)", color: "#e8dcc8" }}>
              {plan.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "#a09080" }}>{plan.goal}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onRegenerate} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all duration-200 hover:brightness-110" style={{ borderColor: "#1a1a28", color: "#c8bca8" }}>
              <RefreshCw size={14} />
              重新生成
            </button>
            <button onClick={onExportJson} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all duration-200 hover:brightness-110" style={{ borderColor: "#1a1a28", color: "#c8bca8" }}>
              <FileJson size={14} />
              JSON
            </button>
            <button onClick={onExportMarkdown} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 hover:brightness-110 active:scale-95" style={{ background: "#c9963a", color: "#0a0a10" }}>
              <Download size={14} />
              导出文档
            </button>
          </div>
        </header>

        <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b p-4 lg:border-b-0 lg:border-r" style={{ borderColor: "#1a1a28", background: "#070710" }}>
            <p className="mb-3 px-2 text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>阶段目录</p>
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {plan.stages.map((stage) => {
                const active = stage.id === activeStage.id;
                return (
                  <button
                    key={stage.id}
                    onClick={() => onStageChange(stage.id)}
                    className="min-w-52 rounded-lg border p-4 text-left transition-all duration-200 hover:brightness-110 lg:min-w-0"
                    style={{
                      background: active ? "#111827" : "#0d0d16",
                      borderColor: active ? "#c9963a55" : "#1a1a28",
                      boxShadow: active ? "0 8px 24px rgba(201,150,58,0.1)" : "none",
                    }}
                  >
                    <p className="text-xs font-mono" style={{ color: active ? "#c9963a" : "#4a4a60" }}>
                      {String(stage.index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-1 text-base font-bold" style={{ fontFamily: "var(--font-display)", color: active ? "#e8dcc8" : "#c8bca8" }}>
                      {stage.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5" style={{ color: "#a09080" }}>{stage.output}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          <article className="p-5 lg:p-7">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>当前阶段</p>
                <h3 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-display)", color: "#e8dcc8" }}>
                  {activeStage.name}
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "#a09080" }}>{activeStage.summary}</p>
              </div>
              <button onClick={onOpenProcess} className="rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:brightness-110" style={{ borderColor: "#1a1a28", color: "#c8bca8" }}>
                进入按流程查看
              </button>
            </div>

            <section>
              <p className="mb-3 text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>角色任务</p>
              <div className="overflow-hidden rounded-lg border" style={{ borderColor: "#1a1a28", background: "#0d0d16" }}>
                {activeStage.roleTasks.map((task, index) => (
                  <div
                    key={`${task.roleId}-${task.task}`}
                    className="grid grid-cols-1 gap-2 px-5 py-4 text-sm lg:grid-cols-[132px_minmax(0,1fr)_180px] lg:gap-4"
                    style={{ borderBottom: index < activeStage.roleTasks.length - 1 ? "1px solid #1a1a28" : "none" }}
                  >
                    <strong style={{ color: "#e0d0b8", fontFamily: "var(--font-display)" }}>{task.roleId}</strong>
                    <span style={{ color: "#a09080" }}>{task.task}</span>
                    <span className="font-mono text-xs" style={{ color: "#c9963a" }}>{task.skills.join(", ")}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-5" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
                <p className="text-xs font-mono" style={{ color: "#4a4a60" }}>输入</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "#c8bca8" }}>{activeStage.input}</p>
              </div>
              <div className="rounded-lg border p-5" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
                <p className="text-xs font-mono" style={{ color: "#4a4a60" }}>输出</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "#c8bca8" }}>{activeStage.output}</p>
              </div>
              <div className="rounded-lg border p-5" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
                <p className="text-xs font-mono" style={{ color: "#4a4a60" }}>下一步</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "#c8bca8" }}>{nextStage?.name ?? "进入实施计划"}</p>
              </div>
            </section>

            <section className="mt-5 rounded-lg border p-5" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
              <p className="text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>阶段产物</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeStage.deliverables.map((item) => (
                  <span key={item} className="rounded-full border px-3 py-1 text-xs font-mono" style={{ borderColor: "#c9963a35", color: "#f0c06a", background: "rgba(201,150,58,0.08)" }}>
                    {item}
                  </span>
                ))}
              </div>
            </section>
          </article>
        </div>
      </div>
    </section>
  );
}
