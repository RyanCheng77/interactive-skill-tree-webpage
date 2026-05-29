import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { PlatformId, SkillPlatformRoot, SkillSourceType } from "../types";
import { resolvePortablePath } from "./skillRoots";

interface ResolvePlatformSkillRootsInput {
  projectRoot?: string;
  homeDir?: string;
}

interface PlatformRootCandidate {
  id: string;
  label: string;
  platformId: PlatformId;
  path: string;
  sourceType: SkillSourceType;
  readOnly: boolean;
  nativeSkillSupport: boolean;
  syncTarget: boolean;
  scansSkills: boolean;
  scansRules: boolean;
}

export const PLATFORM_IDS: PlatformId[] = ["codex", "claude", "trae", "cursor", "agents-shared"];

export function resolvePlatformSkillRoots({
  projectRoot = process.cwd(),
  homeDir = os.homedir(),
}: ResolvePlatformSkillRootsInput = {}): SkillPlatformRoot[] {
  const seen = new Set<string>();
  const roots: SkillPlatformRoot[] = [];

  for (const candidate of getPlatformRootCandidates(projectRoot)) {
    const resolvedPath = path.normalize(resolvePortablePath(candidate.path, projectRoot, homeDir));
    const dedupeKey = process.platform === "win32" ? resolvedPath.toLowerCase() : resolvedPath;

    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    roots.push({
      ...candidate,
      path: resolvedPath,
      exists: existsSync(resolvedPath),
    });
  }

  return roots;
}

function getPlatformRootCandidates(projectRoot: string): PlatformRootCandidate[] {
  return [
    {
      id: "project-skills",
      label: "Project skills",
      platformId: "agents-shared",
      path: path.join(projectRoot, "skills"),
      sourceType: "project",
      readOnly: false,
      nativeSkillSupport: true,
      syncTarget: false,
      scansSkills: true,
      scansRules: false,
    },
    {
      id: "codex-home",
      label: "Codex user skills",
      platformId: "codex",
      path: "~/.codex/skills",
      sourceType: "user",
      readOnly: false,
      nativeSkillSupport: true,
      syncTarget: true,
      scansSkills: true,
      scansRules: false,
    },
    {
      id: "agents-home",
      label: "Shared agent skills",
      platformId: "agents-shared",
      path: "~/.agents/skills",
      sourceType: "user",
      readOnly: false,
      nativeSkillSupport: true,
      syncTarget: true,
      scansSkills: true,
      scansRules: false,
    },
    {
      id: "claude-home",
      label: "Claude user skills",
      platformId: "claude",
      path: "~/.claude/skills",
      sourceType: "user",
      readOnly: false,
      nativeSkillSupport: true,
      syncTarget: true,
      scansSkills: true,
      scansRules: false,
    },
    {
      id: "claude-project",
      label: "Claude project skills",
      platformId: "claude",
      path: path.join(projectRoot, ".claude/skills"),
      sourceType: "project",
      readOnly: false,
      nativeSkillSupport: true,
      syncTarget: false,
      scansSkills: true,
      scansRules: false,
    },
    {
      id: "claude-agents",
      label: "Claude shared agent skills",
      platformId: "claude",
      path: "~/.claude/.agents/skills",
      sourceType: "user",
      readOnly: false,
      nativeSkillSupport: true,
      syncTarget: true,
      scansSkills: true,
      scansRules: false,
    },
    {
      id: "claude-plugin-cache",
      label: "Claude plugin cache",
      platformId: "claude",
      path: "~/.claude/plugins/cache",
      sourceType: "cache",
      readOnly: true,
      nativeSkillSupport: true,
      syncTarget: false,
      scansSkills: true,
      scansRules: false,
    },
    {
      id: "trae-builtin",
      label: "Trae builtin skills",
      platformId: "trae",
      path: "~/.trae/builtin_skills",
      sourceType: "builtin",
      readOnly: true,
      nativeSkillSupport: true,
      syncTarget: false,
      scansSkills: true,
      scansRules: false,
    },
    {
      id: "trae-cn-builtin",
      label: "Trae CN builtin skills",
      platformId: "trae",
      path: "~/.trae-cn/builtin_skills",
      sourceType: "builtin",
      readOnly: true,
      nativeSkillSupport: true,
      syncTarget: false,
      scansSkills: true,
      scansRules: false,
    },
    {
      id: "cursor-project-rules",
      label: "Cursor project rules",
      platformId: "cursor",
      path: path.join(projectRoot, ".cursor/rules"),
      sourceType: "rules",
      readOnly: false,
      nativeSkillSupport: false,
      syncTarget: false,
      scansSkills: false,
      scansRules: true,
    },
  ];
}
