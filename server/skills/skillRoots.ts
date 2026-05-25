import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { LocalSkillRoot, LocalSkillRootSource } from "../types";

interface ResolveSkillRootsInput {
  env?: NodeJS.ProcessEnv;
  projectRoot?: string;
  homeDir?: string;
}

interface RootCandidate {
  path: string;
  source: LocalSkillRootSource;
}

export function resolveSkillRoots({
  env = process.env,
  projectRoot = process.cwd(),
  homeDir = os.homedir(),
}: ResolveSkillRootsInput = {}): LocalSkillRoot[] {
  const candidates = getRootCandidates(env, projectRoot);
  const seen = new Set<string>();
  const roots: LocalSkillRoot[] = [];

  for (const candidate of candidates) {
    const resolvedPath = resolvePortablePath(candidate.path, projectRoot, homeDir);
    const normalizedPath = path.normalize(resolvedPath);
    const key = process.platform === "win32" ? normalizedPath.toLowerCase() : normalizedPath;

    if (seen.has(key)) continue;
    seen.add(key);

    roots.push({
      path: normalizedPath,
      exists: existsSync(normalizedPath),
      source: candidate.source,
    });
  }

  return roots;
}

function getRootCandidates(env: NodeJS.ProcessEnv, projectRoot: string): RootCandidate[] {
  const configuredRoots = parseConfiguredRoots(env.LOCAL_SKILL_ROOTS);

  if (configuredRoots.length > 0) {
    return configuredRoots.map((rootPath) => ({ path: rootPath, source: "env" }));
  }

  const roots: RootCandidate[] = [{ path: path.join(projectRoot, "skills"), source: "project" }];

  if (env.CODEX_HOME) {
    roots.push({ path: path.join(env.CODEX_HOME, "skills"), source: "codex-home" });
  }

  roots.push({ path: "~/.codex/skills", source: "home-codex" });
  roots.push({ path: "~/.agents/skills", source: "home-agents" });

  return roots;
}

function parseConfiguredRoots(value: string | undefined): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolvePortablePath(inputPath: string, projectRoot: string, homeDir: string): string {
  if (inputPath === "~") return homeDir;

  if (inputPath.startsWith("~/") || inputPath.startsWith(`~${path.sep}`)) {
    return path.resolve(homeDir, inputPath.slice(2));
  }

  if (path.isAbsolute(inputPath)) {
    return path.resolve(inputPath);
  }

  return path.resolve(projectRoot, inputPath);
}
