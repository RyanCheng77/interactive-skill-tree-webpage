import { ChevronDown, ChevronUp, Cloud, Crown, FlaskConical, Lightbulb, Monitor, Palette, Server } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { ProcessStage, Role, Skill } from "../types";
import { countUnseenSkillUpdates } from "../lib/skillState";
import { SkillDetail } from "./SkillDetail";
import { SkillTree } from "./SkillTree";

interface RoleViewProps {
  roles: Role[];
  activeRoleId: string;
  activeStage: ProcessStage;
  selectedSkill: Skill | null;
  selectedSkillId: string | null;
  unlockedSkillIds: string[];
  onRoleChange: (roleId: string) => void;
  onSelectSkill: (skillId: string) => void;
  onUnlockSkill: (skillId: string) => void;
  onMarkSeen: (skillId: string) => void;
}

const ROLE_ICONS: Record<Role["icon"], ReactNode> = {
  lightbulb: <Lightbulb size={16} />,
  palette: <Palette size={16} />,
  monitor: <Monitor size={16} />,
  server: <Server size={16} />,
  flask: <FlaskConical size={16} />,
  cloud: <Cloud size={16} />,
  crown: <Crown size={16} />,
};

export function RoleView({
  roles,
  activeRoleId,
  activeStage,
  selectedSkill,
  selectedSkillId,
  unlockedSkillIds,
  onRoleChange,
  onSelectSkill,
  onUnlockSkill,
  onMarkSeen,
}: RoleViewProps) {
  const activeRole = roles.find((role) => role.id === activeRoleId) ?? roles[0];
  const roleTask = activeStage.roleTasks.find((task) => task.roleId === activeRole.id);
  const [treeExpanded, setTreeExpanded] = useState(true);

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-mono tracking-[0.28em]" style={{ color: activeRole.color }}>按角色</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-display)", color: "#e8dcc8" }}>
            角色工作台
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "#a09080" }}>
            选择产研角色，查看当前阶段任务、建议 skill/tool、关键产物和完整技能树。
          </p>
        </div>
        <button className="rounded-lg px-5 py-3 text-sm font-bold transition-all duration-200 hover:brightness-110 active:scale-95" style={{ background: "#111827", color: "#e8dcc8", border: `1px solid ${activeRole.color}55`, fontFamily: "var(--font-display)" }}>
          反馈
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-lg border p-4" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
          <p className="mb-3 px-2 text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>选择角色</p>
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {roles.map((role) => {
              const active = role.id === activeRole.id;
              const updateCount = countUnseenSkillUpdates(role.skills);
              return (
                <button
                  key={role.id}
                  onClick={() => onRoleChange(role.id)}
                  className="min-w-52 rounded-lg border p-4 text-left transition-all duration-200 hover:brightness-110 lg:min-w-0"
                  style={{
                    background: active ? "#0d0d16" : "#070710",
                    borderColor: active ? `${role.color}66` : "#1a1a28",
                    boxShadow: active ? `0 0 18px ${role.glowColor}` : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded" style={{ color: role.color, background: `${role.color}18`, border: `1px solid ${role.color}30` }}>
                      {ROLE_ICONS[role.icon]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold" style={{ fontFamily: "var(--font-display)", color: active ? "#e8dcc8" : "#c8bca8" }}>{role.name}</span>
                      <span className="mt-1 block truncate text-xs" style={{ color: "#a09080" }}>{role.title}</span>
                    </span>
                    {updateCount > 0 && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-mono" style={{ background: "#c9963a", color: "#0a0a10" }}>
                        {updateCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <article className="overflow-hidden rounded-lg border" style={{ background: "#09090f", borderColor: "#1a1a28" }}>
          <header className="border-b px-5 py-6 lg:px-7" style={{ borderColor: "#1a1a28", background: "#0a0a12" }}>
            <p className="text-xs font-mono tracking-[0.2em]" style={{ color: activeRole.color }}>当前角色</p>
            <h3 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-display)", color: "#e8dcc8" }}>
              {activeRole.name}
            </h3>
            <p className="mt-2 text-sm leading-6" style={{ color: "#a09080" }}>
              {activeRole.title} · 当前阶段：{activeStage.name}
            </p>
          </header>

          <div className="grid grid-cols-1 gap-5 border-b p-5 lg:grid-cols-[1fr_320px] lg:p-7" style={{ borderColor: "#1a1a28" }}>
            <section>
              <p className="mb-3 text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>本阶段核心任务</p>
              <div className="rounded-lg border p-5" style={{ background: "#0d0d16", borderColor: "#1a1a28" }}>
                <h4 className="font-bold" style={{ color: "#e0d0b8", fontFamily: "var(--font-display)" }}>{roleTask?.task ?? "当前阶段暂无明确任务"}</h4>
                <p className="mt-2 text-sm" style={{ color: "#a09080" }}>产物：{roleTask?.output ?? "无"}</p>
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>建议 skill/tool</p>
              <div className="flex flex-wrap gap-2">
                {(roleTask?.skills ?? activeRole.skills.slice(0, 3).map((skill) => skill.id)).map((skillId) => (
                  <span key={skillId} className="rounded-full border px-3 py-2 text-xs font-mono" style={{ borderColor: `${activeRole.color}35`, color: activeRole.accentColor, background: `${activeRole.color}12` }}>
                    {skillId}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div className="p-5 lg:p-7">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-mono tracking-[0.2em]" style={{ color: "#4a4a60" }}>完整技能树</p>
                <h3 className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "#e8dcc8" }}>
                  {activeRole.name}能力路径
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTreeExpanded((expanded) => !expanded)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-mono transition-all duration-200 hover:brightness-125 active:scale-95"
                style={{
                  borderColor: `${activeRole.color}55`,
                  color: activeRole.accentColor,
                  background: treeExpanded ? `${activeRole.color}12` : "#0d0d16",
                }}
                aria-expanded={treeExpanded}
              >
                {treeExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {treeExpanded ? "收起" : "展开技能树"}
              </button>
            </div>

            {treeExpanded ? (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                <SkillTree role={activeRole} selectedSkillId={selectedSkillId} onSelectSkill={onSelectSkill} />
                <SkillDetail
                  skill={selectedSkill}
                  role={activeRole}
                  unlocked={Boolean(selectedSkill && unlockedSkillIds.includes(selectedSkill.id))}
                  onUnlock={onUnlockSkill}
                  onMarkSeen={onMarkSeen}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setTreeExpanded(true)}
                className="w-full rounded-lg border px-5 py-6 text-left transition-all duration-200 hover:brightness-110"
                style={{ background: "#0d0d16", borderColor: "#1a1a28", color: "#a09080" }}
              >
                <span className="text-sm font-semibold" style={{ color: "#e0d0b8", fontFamily: "var(--font-display)" }}>
                  技能树已收起
                </span>
                <span className="mt-2 block text-xs font-mono" style={{ color: activeRole.accentColor }}>
                  点击展开完整能力路径
                </span>
              </button>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
