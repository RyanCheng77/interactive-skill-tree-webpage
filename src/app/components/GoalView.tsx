import { ArrowUp, RefreshCw, Sparkles } from "lucide-react";
import type { GoalTemplate } from "../types";

interface GoalViewProps {
  goalInput: string;
  templates: GoalTemplate[];
  onGoalInputChange: (value: string) => void;
  onTemplatePick: (template: GoalTemplate) => void;
  onNextBatch: () => void;
  onGenerate: () => void;
}

export function GoalView({
  goalInput,
  templates,
  onGoalInputChange,
  onTemplatePick,
  onNextBatch,
  onGenerate,
}: GoalViewProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center py-6 lg:py-10">
      <div className="mb-8 text-center lg:mb-10">
        <p className="mb-3 text-xs font-mono tracking-[0.28em]" style={{ color: "#c9963a" }}>按目标生成</p>
        <h2
          className="text-3xl font-bold sm:text-4xl lg:text-5xl"
          style={{ fontFamily: "var(--font-display)", color: "#e8dcc8", lineHeight: 1.12 }}
        >
          不知道用什么 Skill？
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7" style={{ color: "#a09080" }}>
          说出你要解决的产研问题，我会推荐合适的 skill/tool，并生成协作路径和阶段任务。
        </p>
      </div>

      <div
        className="overflow-hidden rounded-lg border"
        style={{ background: "#0d0d16", borderColor: "#1a1a28", boxShadow: "0 18px 60px rgba(0,0,0,0.35)" }}
      >
        <textarea
          value={goalInput}
          onChange={(event) => onGoalInputChange(event.target.value)}
          className="min-h-36 w-full resize-none border-0 bg-transparent px-5 py-5 text-lg font-semibold outline-none placeholder:text-[#4a4a60] sm:min-h-40 sm:px-7 sm:py-6 sm:text-xl"
          style={{ color: "#e8dcc8", fontFamily: "var(--font-ui)" }}
          placeholder="尽管问，比如：我们要从 0 到 1 做一个内部 AI 协作门户"
        />
        <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "#1a1a28" }}>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-xl leading-none" style={{ color: "#4a4a60" }}>+</span>
            <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: "#f0c06a", fontFamily: "var(--font-display)" }}>
              <Sparkles size={14} />
              自动规划
            </span>
            <span className="font-mono text-xs" style={{ color: "#4a4a60" }}>输出：协作路径 + 任务清单</span>
          </div>
          <button
            onClick={onGenerate}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ background: "#c9963a", color: "#0a0a10", boxShadow: "0 4px 18px rgba(201,150,58,0.35)" }}
            aria-label="生成"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "#e0d0b8" }}>推荐任务</h3>
          <p className="mt-1 text-sm" style={{ color: "#4a4a60" }}>不知道该选哪个 skill 时，可以先从这些目标开始。</p>
        </div>
        <button
          onClick={onNextBatch}
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:brightness-110"
          style={{ background: "#0d0d16", borderColor: "#1a1a28", color: "#c8bca8", fontFamily: "var(--font-display)" }}
        >
          <RefreshCw size={14} />
          换一批
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplatePick(template)}
            className="min-h-40 rounded-lg border p-5 text-left transition-all duration-200 hover:brightness-110"
            style={{ background: "#09090f", borderColor: "#1a1a28" }}
          >
            <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-full" style={{ border: "1px solid #c9963a55", color: "#c9963a" }}>
              ◎
            </div>
            <p className="mb-2 text-xs font-mono" style={{ color: "#4a4a60" }}>{template.category}</p>
            <h4 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "#e0d0b8" }}>{template.title}</h4>
            <p className="mt-3 text-sm leading-6" style={{ color: "#a09080" }}>{template.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
