import { CheckCircle2, Lock, Star } from "lucide-react";
import type { Role, Skill } from "../types";
import { TIER_LABELS } from "../data/workbenchData";

interface SkillTreeProps {
  role: Role;
  selectedSkillId: string | null;
  onSelectSkill: (skillId: string) => void;
}

const COL_X: Record<number, number> = { 0: 90, 1: 230, 2: 370 };
const TIER_Y: Record<number, number> = { 0: 70, 1: 210, 2: 350, 3: 490 };
const SVG_W = 460;
const SVG_H = 580;

function updateLabel(skill: Skill) {
  if (skill.updateType === "new") return "新增";
  if (skill.updateType === "review") return "复习";
  if (skill.updateType === "updated") return "更新";
  return null;
}

function Connectors({ skills, color }: { skills: Skill[]; color: string }) {
  const byId: Record<string, Skill> = {};
  skills.forEach((skill) => (byId[skill.id] = skill));

  return (
    <>
      {skills.flatMap((skill) =>
        skill.prereqs.map((prereqId) => {
          const prereq = byId[prereqId];
          if (!prereq) return null;
          const x1 = COL_X[prereq.col];
          const y1 = TIER_Y[prereq.tier];
          const x2 = COL_X[skill.col];
          const y2 = TIER_Y[skill.tier];
          const active = skill.status !== "locked" && prereq.status !== "locked";
          const flowColor = active ? color : `${color}66`;

          return (
            <g key={`${prereqId}-${skill.id}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={active ? `${color}50` : "#1e1e2a"}
                strokeWidth={active ? 2 : 1}
                strokeDasharray={active ? "none" : "4 4"}
              />
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={flowColor}
                strokeWidth={active ? 2.5 : 1.5}
                strokeLinecap="round"
                strokeDasharray={active ? "2 12" : "1 14"}
                opacity={active ? 0.75 : 0.28}
              >
                <animate attributeName="stroke-dashoffset" values="0;-28" dur={active ? "1.6s" : "2.8s"} repeatCount="indefinite" />
                <animate attributeName="opacity" values={active ? "0.25;0.85;0.25" : "0.12;0.34;0.12"} dur={active ? "1.6s" : "2.8s"} repeatCount="indefinite" />
              </line>
            </g>
          );
        }),
      )}
    </>
  );
}

function SkillNode({
  skill,
  color,
  glowColor,
  selected,
  onSelect,
}: {
  skill: Skill;
  color: string;
  glowColor: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const cx = COL_X[skill.col];
  const cy = TIER_Y[skill.tier];
  const r = skill.tier === 3 ? 34 : 26;
  const locked = skill.status === "locked";
  const label = updateLabel(skill);
  const showUpdate = Boolean(label && !skill.seen);

  return (
    <g style={{ cursor: "pointer" }} onClick={onSelect}>
      {selected && (
        <circle cx={cx} cy={cy} r={r + 10} fill={glowColor} opacity={0.45}>
          <animate attributeName="r" values={`${r + 7};${r + 14};${r + 7}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.45;0.15;0.45" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {skill.status === "available" && !selected && (
        <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={color} strokeWidth="1.2" opacity="0.5">
          <animate attributeName="r" values={`${r + 3};${r + 10};${r + 3}`} dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2.8s" repeatCount="indefinite" />
        </circle>
      )}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={locked ? "#0e0e18" : "#121220"}
        stroke={selected ? color : locked ? "#222230" : `${color}55`}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      <circle cx={cx} cy={cy} r={r - 6} fill="none" stroke={locked ? "#1a1a28" : `${color}25`} strokeWidth="1" />
      {skill.tier === 3 && <circle cx={cx} cy={cy} r={r - 12} fill="none" stroke={`${color}40`} strokeWidth="1" strokeDasharray="3 3" />}
      {locked ? (
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fill="#2e2e40">锁</text>
      ) : (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fontFamily="var(--font-display)" fontWeight="600" fill={selected ? "#e8dcc8" : "#b0a080"}>
            {skill.name.length > 8 ? `${skill.name.slice(0, 6)}...` : skill.name}
          </text>
          <circle cx={cx} cy={cy + 10} r={3} fill={color} opacity={selected ? 1 : 0.6} />
        </>
      )}
      <circle cx={cx + r - 5} cy={cy - r + 5} r={8} fill="#0a0a10" stroke={selected ? color : "#222230"} strokeWidth="1" />
      <text x={cx + r - 5} y={cy - r + 9} textAnchor="middle" fontSize="9" fontFamily="'JetBrains Mono', monospace" fill={locked ? "#2e2e40" : color}>
        T{skill.tier + 1}
      </text>
      {showUpdate && (
        <>
          <rect x={cx + r - 3} y={cy - r - 22} width={34} height={16} rx={8} fill="#c9963a" />
          <text x={cx + r + 14} y={cy - r - 10} textAnchor="middle" fontSize="9" fontFamily="'JetBrains Mono', monospace" fill="#0a0a10">
            {label}
          </text>
        </>
      )}
    </g>
  );
}

export function SkillTree({ role, selectedSkillId, onSelectSkill }: SkillTreeProps) {
  return (
    <div className="overflow-hidden rounded-lg" style={{ background: "#09090f", border: `1px solid ${role.color}18` }}>
      <div className="relative p-3 sm:p-6">
        <div className="absolute left-0 top-0 h-full select-none pointer-events-none" style={{ width: 48, paddingTop: TIER_Y[0] + 6 }}>
          {TIER_LABELS.map((label, index) => (
            <div
              key={label}
              style={{
                height: index === 0 ? TIER_Y[1] - TIER_Y[0] : index < 3 ? TIER_Y[index] - TIER_Y[index - 1] : 80,
                display: "flex",
                alignItems: "flex-start",
                paddingTop: 4,
              }}
            >
              <span className="text-xs font-mono" style={{ color: "#2a2a38", writingMode: "vertical-lr", transform: "rotate(180deg)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: "block", maxWidth: SVG_W, margin: "0 auto" }}>
          {Object.values(TIER_Y).map((y) => (
            <line key={y} x1={40} y1={y} x2={SVG_W - 20} y2={y} stroke="#14141e" strokeWidth="1" strokeDasharray="3 8" />
          ))}
          <Connectors skills={role.skills} color={role.color} />
          {role.skills.map((skill) => (
            <SkillNode
              key={skill.id}
              skill={skill}
              color={role.color}
              glowColor={role.glowColor}
              selected={selectedSkillId === skill.id}
              onSelect={() => onSelectSkill(skill.id)}
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-2.5" style={{ background: "#070710", borderColor: "#1a1a28" }}>
        <div className="flex flex-wrap items-center gap-5">
          {[
            { icon: <CheckCircle2 size={11} />, label: "已解锁", color: role.color },
            { icon: <Star size={11} />, label: "可解锁", color: role.accentColor },
            { icon: <Lock size={11} />, label: "未解锁", color: "#2e2e40" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5" style={{ color: item.color }}>
              {item.icon}
              <span className="text-xs font-mono" style={{ color: "#3a3a50" }}>{item.label}</span>
            </div>
          ))}
        </div>
        <span className="text-xs font-mono" style={{ color: "#2a2a38" }}>默认展开 · 点击节点查看详情</span>
      </div>
    </div>
  );
}
