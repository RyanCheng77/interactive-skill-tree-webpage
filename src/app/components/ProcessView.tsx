import { useMemo } from "react";
import type { ClassifiedSkill } from "../lib/apiClient";
import type { ProcessStage } from "../types";

interface ProcessViewProps {
  stages: ProcessStage[];
  activeStageId: string;
  onStageChange: (stageId: string) => void;
  classifiedSkills?: ClassifiedSkill[];
  graphAvailable?: boolean;
}

export function ProcessView({ stages, activeStageId, onStageChange, classifiedSkills, graphAvailable }: ProcessViewProps) {
  const activeStage = stages.find((stage) => stage.id === activeStageId) ?? stages[0];
  const nextStage = stages.find((stage) => stage.id === activeStage.nextStageId);

  const stageSkills = useMemo(() => {
    if (!graphAvailable || !classifiedSkills) return [];

    return classifiedSkills
      .filter((cs) => cs.classification.stageIds.includes(activeStage.id))
      .sort((a, b) => b.classification.confidence - a.classification.confidence)
      .slice(0, 6);
  }, [graphAvailable, classifiedSkills, activeStage.id]);

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-mono tracking-[0.28em]" style={{ color: "#c9963a" }}>按流程</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-display)", color: "#e8dcc8" }}>
            产研流程工作台
            {graphAvailable && (
              <span className="ml-3 inline-block rounded-full px-2.5 py-1 text-xs font-mono align-middle" style={{ background: "#0f1a15", color: "#4db885", border: "1px solid #2a5a3a" }}>
                本地 Skill 图谱
              </span>
            )}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "#a09080" }}>
            {graphAvailable
              ? "已加载本地 Skill 数据。选择流程阶段，查看基于真实 Skill 分类的阶段推荐。"
              : "先选择流程阶段，再查看该阶段的角色任务、阶段产物和建议 skill/tool。"}
          </p>
        </div>
        <button className="rounded-lg px-5 py-3 text-sm font-bold transition-all duration-200 hover:brightness-110 active:scale-95" style={{ background: "#111827", color: "#e8dcc8", border: "1px solid #c9963a55", fontFamily: "var(--font-display)" }}>
          反馈
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-lg border p-4" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
          <p className="mb-3 px-2 text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>选择流程阶段</p>
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {stages.map((stage) => {
              const active = stage.id === activeStage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => onStageChange(stage.id)}
                  className="min-w-52 rounded-lg border p-4 text-left transition-all duration-200 hover:brightness-110 lg:min-w-0"
                  style={{
                    background: active ? "#0d0d16" : "#070710",
                    borderColor: active ? "#c9963a66" : "#1a1a28",
                    boxShadow: active ? "0 0 18px rgba(201,150,58,0.18)" : "none",
                  }}
                >
                  <p className="text-xs font-mono" style={{ color: active ? "#c9963a" : "#4a4a60" }}>
                    {String(stage.index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 text-base font-bold" style={{ fontFamily: "var(--font-display)", color: active ? "#e8dcc8" : "#c8bca8" }}>
                    {stage.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5" style={{ color: "#a09080" }}>{stage.summary}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <article className="overflow-hidden rounded-lg border" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
          <header className="flex flex-col gap-4 border-b px-5 py-6 lg:flex-row lg:items-start lg:justify-between lg:px-7" style={{ borderColor: "#1a1a28", background: "#0a0a12" }}>
            <div>
              <p className="text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>当前阶段</p>
              <h3 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-display)", color: "#e8dcc8" }}>
                {activeStage.name}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "#a09080" }}>{activeStage.summary}</p>
            </div>
            <span className="rounded-full border px-3 py-2 text-xs font-mono" style={{ borderColor: "#c9963a35", color: "#f0c06a", background: "rgba(201,150,58,0.08)" }}>
              阶段 {activeStage.index + 1} / {stages.length}
            </span>
          </header>

          <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr] lg:p-7">
            <section>
              <p className="mb-3 text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>参与角色与任务</p>
              <div className="flex flex-col gap-3">
                {activeStage.roleTasks.map((task) => (
                  <div key={`${task.roleId}-${task.task}`} className="grid grid-cols-1 gap-2 rounded-lg border p-4 text-sm sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
                    <strong style={{ color: "#e0d0b8", fontFamily: "var(--font-display)" }}>{task.roleId}</strong>
                    <div>
                      <p style={{ color: "#a09080" }}>{task.task}</p>
                      <p className="mt-1 text-xs font-mono" style={{ color: "#c9963a" }}>skill: {task.skills.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>建议 skill/tool</p>
              <div className="mb-5 flex flex-wrap gap-2">
                {activeStage.skills.map((skill) => (
                  <span key={skill} className="rounded-full border px-3 py-2 text-xs font-mono" style={{ borderColor: "#c9963a35", color: "#f0c06a", background: "rgba(201,150,58,0.08)" }}>
                    {skill}
                  </span>
                ))}
              </div>

              {stageSkills.length > 0 && (
                <>
                  <p className="mb-3 text-xs font-mono tracking-[0.2em]" style={{ color: "#4db885" }}>本地 Skill 推荐</p>
                  <div className="mb-5 flex flex-col gap-2">
                    {stageSkills.map((cs) => (
                      <div key={cs.skill.id} className="rounded-lg border p-3" style={{ background: "#0d0d16", borderColor: "#2a5a3a" }}>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#4db885" }} />
                          <span className="text-sm font-bold" style={{ color: "#e0d0b8", fontFamily: "var(--font-display)" }}>{cs.skill.name}</span>
                          <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-mono" style={{ background: "#0f1a15", color: "#4db885" }}>
                            {Math.round(cs.classification.confidence * 100)}%
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5" style={{ color: "#a09080" }}>{cs.skill.description}</p>
                        <p className="mt-1 text-xs font-mono" style={{ color: "#3a5a48" }}>{cs.classification.reason}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <p className="mb-3 text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>阶段产物</p>
              <div className="flex flex-col gap-2">
                {activeStage.deliverables.map((item) => (
                  <div key={item} className="rounded-lg border p-4 text-sm font-semibold" style={{ background: "#0d0d16", borderColor: "#1a1a28", color: "#c8bca8" }}>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3">
                {[
                  { label: "输入", value: activeStage.input },
                  { label: "输出", value: activeStage.output },
                  { label: "下一步", value: nextStage?.name ?? "进入实施计划" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border px-4 py-3" style={{ background: "#070710", borderColor: "#1a1a28" }}>
                    <p className="text-xs font-mono" style={{ color: "#4a4a60" }}>{item.label}</p>
                    <p className="mt-1 text-sm leading-6" style={{ color: "#c8bca8" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </article>
      </div>
    </section>
  );
}
