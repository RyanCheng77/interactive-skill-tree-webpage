import type { ReactNode } from "react";
import { Compass, Route, Users } from "lucide-react";
import type { EntryMode } from "../types";

interface WorkbenchShellProps {
  activeMode: EntryMode;
  onModeChange: (mode: EntryMode) => void;
  children: ReactNode;
}

const NAV_ITEMS: Array<{ id: EntryMode; label: string; hint: string; icon: ReactNode }> = [
  { id: "goal", label: "按目标", hint: "生成方案", icon: <Compass size={16} /> },
  { id: "process", label: "按流程", hint: "阶段工作台", icon: <Route size={16} /> },
  { id: "role", label: "按角色", hint: "角色工作台", icon: <Users size={16} /> },
];

export function WorkbenchShell({ activeMode, onModeChange, children }: WorkbenchShellProps) {
  return (
    <div className="min-h-screen" style={{ background: "#070710", color: "#e8dcc8", fontFamily: "var(--font-ui)" }}>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside
          className="border-b px-4 py-4 lg:border-b-0 lg:border-r lg:px-5 lg:py-6"
          style={{ background: "#0a0a12", borderColor: "#1a1a28" }}
        >
          <div className="flex items-center gap-3 lg:block">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg, #c9963a, #7b4fd4)", boxShadow: "0 0 16px rgba(201,150,58,0.3)" }}
            >
              <span className="text-xs font-bold text-black">炉</span>
            </div>
            <div className="min-w-0 lg:mt-4">
              <h1
                className="text-base font-bold tracking-widest"
                style={{ fontFamily: "var(--font-display)", color: "#c9963a", lineHeight: 1.2 }}
              >
                技能熔炉
              </h1>
              <p className="text-xs font-mono" style={{ color: "#4a4a60", lineHeight: 1.2 }}>产研流程工作台</p>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-10 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV_ITEMS.map((item) => {
              const active = item.id === activeMode;
              return (
                <button
                  key={item.id}
                  onClick={() => onModeChange(item.id)}
                  className="group flex min-w-32 shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-left transition-all duration-200 hover:brightness-110 lg:w-full"
                  style={{
                    background: active ? "#111827" : "transparent",
                    border: `1px solid ${active ? "#c9963a55" : "transparent"}`,
                    boxShadow: active ? "0 8px 24px rgba(201,150,58,0.12)" : "none",
                  }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                    style={{
                      background: active ? "rgba(201,150,58,0.16)" : "#0d0d16",
                      color: active ? "#f0c06a" : "#4a4a60",
                      border: `1px solid ${active ? "#c9963a35" : "#1a1a28"}`,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block text-sm font-bold"
                      style={{ fontFamily: "var(--font-display)", color: active ? "#e8dcc8" : "#a09080" }}
                    >
                      {item.label}
                    </span>
                    <span className="block truncate text-xs font-mono" style={{ color: active ? "#c9963a" : "#3a3a50" }}>
                      {item.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 hidden lg:block">
            <p className="px-2 text-xs font-mono leading-5" style={{ color: "#2a2a38" }}>
              v0.2 本地 Skill 图谱
            </p>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
