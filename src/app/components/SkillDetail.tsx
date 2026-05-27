import { Check, Copy, ExternalLink, FileText, Lock, Terminal } from "lucide-react";
import { useState } from "react";
import { getLocalSkillMeta } from "../lib/graphTransform";
import type { Role, Skill } from "../types";
import { TIER_LABELS } from "../data/workbenchData";

interface SkillDetailProps {
  skill: Skill | null;
  role: Role;
  unlocked: boolean;
  onUnlock: (skillId: string) => void;
  onMarkSeen: (skillId: string) => void;
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}k+` : String(n);
}

function updateLabel(skill: Skill) {
  if (skill.updateType === "new") return "新增";
  if (skill.updateType === "review") return "建议复习";
  if (skill.updateType === "updated") return "更新";
  return null;
}

function CopyButton({ text, color }: { text: string; color: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={copy}
      className="shrink-0 rounded p-1.5 transition-all duration-200 hover:opacity-80"
      style={{ color: copied ? color : "#5a5a6e", background: copied ? `${color}15` : "transparent" }}
      title="复制命令"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export function SkillDetail({ skill, role, unlocked, onUnlock, onMarkSeen }: SkillDetailProps) {
  if (!skill) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border p-8 text-center" style={{ background: "#09090f", borderColor: "#12121e" }}>
        <p className="text-sm" style={{ color: "#2e2e40", fontFamily: "var(--font-display)" }}>选择一个 skill 查看详情</p>
      </div>
    );
  }

  const locked = skill.status === "locked";
  const label = updateLabel(skill);

  return (
    <div className="flex min-h-[360px] flex-col overflow-hidden rounded-lg" style={{ background: "#0d0d16", border: `1px solid ${role.color}25` }}>
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${role.color}, transparent)` }} />

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono tracking-widest" style={{ color: role.color }}>
              {role.name} · {TIER_LABELS[skill.tier]}阶
            </span>
            {label && !skill.seen && (
              <button
                onClick={() => onMarkSeen(skill.id)}
                className="rounded-full px-2 py-0.5 text-xs font-mono transition-all duration-200 hover:brightness-110"
                style={{ background: "#c9963a", color: "#0a0a10" }}
              >
                {label} · 标为已读
              </button>
            )}
          </div>
          <h2 className="mb-0.5 text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "#e8dcc8" }}>
            {skill.name}
          </h2>
          <p className="text-sm" style={{ color: `${role.accentColor}bb`, fontFamily: "var(--font-ui)", fontSize: "1rem" }}>
            {skill.tagline}
          </p>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: "#a09080", fontFamily: "var(--font-ui)", fontSize: "0.95rem" }}>
          {skill.intro}
        </p>

        {skill.changeSummary && (
          <div className="rounded-lg border p-3 text-sm" style={{ background: "rgba(201,150,58,0.08)", borderColor: "#c9963a35", color: "#f0c06a" }}>
            <span className="font-mono text-xs">更新摘要</span>
            <p className="mt-1 leading-6" style={{ color: "#c8bca8" }}>{skill.changeSummary}</p>
          </div>
        )}

        {getLocalSkillMeta(skill).isLocal && (
          <div className="rounded-lg border p-3" style={{ background: "#0f1a15", borderColor: "#2a5a3a" }}>
            <div className="mb-2 flex items-center gap-2">
              <FileText size={12} style={{ color: "#4db885" }} />
              <span className="text-xs font-mono" style={{ color: "#4db885" }}>本地 Skill</span>
              <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-mono" style={{ background: "#0f1a15", color: "#4db885" }}>
                {Math.round(getLocalSkillMeta(skill).confidence * 100)}%
              </span>
            </div>
            <p className="text-xs font-mono leading-5" style={{ color: "#3a5a48" }}>
              路径：{getLocalSkillMeta(skill).localPath}
            </p>
            <p className="mt-1 text-xs font-mono leading-5" style={{ color: "#3a5a48" }}>
              {getLocalSkillMeta(skill).classificationReason}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "版本", value: skill.version },
            { label: "体积", value: skill.size },
            { label: "下载量", value: fmt(skill.downloads) },
          ].map((item) => (
            <div key={item.label} className="rounded p-2.5" style={{ background: "#0a0a12", border: "1px solid #1a1a28" }}>
              <div className="mb-0.5 text-xs font-mono" style={{ color: "#4a4a60" }}>{item.label}</div>
              <div className="truncate text-sm font-semibold font-mono" style={{ color: "#c8bca8" }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {skill.tags.map((tag) => (
            <span key={tag} className="rounded-full px-2 py-0.5 text-xs font-mono" style={{ background: `${role.color}15`, color: role.accentColor, border: `1px solid ${role.color}20` }}>
              {tag}
            </span>
          ))}
        </div>

        <div className="flex-1" />

        {!locked && (
          <div className="overflow-hidden rounded-md" style={{ background: "#080810", border: "1px solid #1a1a28" }}>
            <div className="flex items-center gap-2 border-b px-3 py-1.5" style={{ borderColor: "#1a1a28" }}>
              <Terminal size={12} style={{ color: role.color }} />
              <span className="text-xs font-mono" style={{ color: "#4a4a60" }}>一句话安装</span>
            </div>
            <div className="flex items-start gap-2 px-3 py-2.5">
              <code className="flex-1 break-all text-xs leading-relaxed font-mono" style={{ color: "#a0e0b0" }}>{skill.installCmd}</code>
              <CopyButton text={skill.installCmd} color={role.color} />
            </div>
          </div>
        )}

        {locked ? (
          <div className="flex items-center gap-2 rounded px-4 py-3" style={{ background: "#0e0e16", border: "1px solid #1a1a28" }}>
            <Lock size={14} style={{ color: "#3a3a50" }} />
            <span className="text-sm" style={{ color: "#3a3a50" }}>请先解锁前置技能以访问此节点</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <a
              href={skill.tryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded py-2.5 text-sm font-semibold transition-all duration-200 hover:brightness-110"
              style={{ background: `${role.color}18`, color: role.accentColor, border: `1px solid ${role.color}35`, fontFamily: "var(--font-display)" }}
            >
              <ExternalLink size={14} />
              在线试用
            </a>
            <button
              onClick={() => onUnlock(skill.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded py-2.5 text-sm font-semibold transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                background: unlocked ? "#0a1a0f" : role.color,
                color: unlocked ? "#4db885" : "#0a0a10",
                border: unlocked ? "1px solid #2a5a3a" : "none",
                fontFamily: "var(--font-display)",
                boxShadow: unlocked ? "none" : `0 4px 18px ${role.glowColor}`,
              }}
            >
              {unlocked ? "已解锁" : "解锁"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
