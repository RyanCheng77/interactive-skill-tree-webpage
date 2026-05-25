import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolvePortablePath, resolveSkillRoots } from "../skills/skillRoots";

const tempDirs: string[] = [];

function makeTempDir(name: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), `skill-roots-${name}-`));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

describe("resolvePortablePath", () => {
  it("expands tilde to the provided home directory", () => {
    expect(resolvePortablePath("~/.codex/skills", "/project", "/home/example")).toBe(
      path.resolve("/home/example/.codex/skills"),
    );
  });

  it("resolves relative paths from the project root", () => {
    expect(resolvePortablePath("./skills", "/workspace/app", "/home/example")).toBe(
      path.resolve("/workspace/app/skills"),
    );
  });
});

describe("resolveSkillRoots", () => {
  it("uses LOCAL_SKILL_ROOTS first and deduplicates resolved paths", () => {
    const projectRoot = makeTempDir("project");
    const envRoot = path.join(projectRoot, "custom-skills");
    mkdirSync(envRoot);

    const roots = resolveSkillRoots({
      env: { LOCAL_SKILL_ROOTS: `${envRoot},${envRoot},~/missing-skills` },
      homeDir: path.join(projectRoot, "home"),
      projectRoot,
    });

    expect(roots).toEqual([
      { path: path.normalize(envRoot), exists: true, source: "env" },
      { path: path.normalize(path.join(projectRoot, "home/missing-skills")), exists: false, source: "env" },
    ]);
  });

  it("falls back to project, CODEX_HOME, and current user home roots", () => {
    const projectRoot = makeTempDir("project");
    const homeDir = path.join(projectRoot, "home");
    const codexHome = path.join(projectRoot, "codex-home");
    const projectSkills = path.join(projectRoot, "skills");
    const codexSkills = path.join(codexHome, "skills");

    mkdirSync(projectSkills, { recursive: true });
    mkdirSync(codexSkills, { recursive: true });

    const roots = resolveSkillRoots({
      env: { CODEX_HOME: codexHome },
      homeDir,
      projectRoot,
    });

    expect(roots).toEqual([
      { path: path.normalize(projectSkills), exists: true, source: "project" },
      { path: path.normalize(codexSkills), exists: true, source: "codex-home" },
      { path: path.normalize(path.join(homeDir, ".codex/skills")), exists: false, source: "home-codex" },
      { path: path.normalize(path.join(homeDir, ".agents/skills")), exists: false, source: "home-agents" },
    ]);
  });
});
