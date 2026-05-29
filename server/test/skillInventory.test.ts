import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildSkillCompatibility } from "../skills/skillCompatibility";
import { buildSkillInventory } from "../skills/skillInventory";
import { applySkillSyncPlan } from "../skills/skillSyncApplier";
import { createSkillSyncPlan } from "../skills/skillSyncPlanner";
import { resolvePlatformSkillRoots } from "../skills/toolAdapters";

const tempDirs: string[] = [];

function makeTempDir(name: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), `skill-inventory-${name}-`));
  tempDirs.push(dir);
  return dir;
}

function writeSkill(root: string, skillDir: string, name: string, description: string): string {
  const dir = path.join(root, skillDir);
  mkdirSync(dir, { recursive: true });
  const skillPath = path.join(dir, "SKILL.md");
  writeFileSync(
    skillPath,
    `---
name: ${name}
description: ${description}
---

# ${name}

${description}
`,
  );
  return skillPath;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

describe("resolvePlatformSkillRoots", () => {
  it("declares Codex, Claude, Trae, Cursor, and shared agent roots with platform capabilities", () => {
    const projectRoot = makeTempDir("project");
    const homeDir = path.join(projectRoot, "home");
    mkdirSync(path.join(projectRoot, "skills"), { recursive: true });
    mkdirSync(path.join(homeDir, ".trae/builtin_skills"), { recursive: true });
    mkdirSync(path.join(projectRoot, ".cursor/rules"), { recursive: true });

    const roots = resolvePlatformSkillRoots({ projectRoot, homeDir });

    expect(roots.map((root) => root.platformId)).toEqual(
      expect.arrayContaining(["codex", "claude", "trae", "cursor", "agents-shared"]),
    );
    expect(roots.find((root) => root.id === "trae-builtin")).toMatchObject({
      platformId: "trae",
      readOnly: true,
      syncTarget: false,
      scansSkills: true,
    });
    expect(roots.find((root) => root.id === "cursor-project-rules")).toMatchObject({
      platformId: "cursor",
      nativeSkillSupport: false,
      scansRules: true,
      scansSkills: false,
    });
  });
});

describe("buildSkillInventory", () => {
  it("groups matching SKILL.md files by name and content hash while preserving every occurrence", () => {
    const projectRoot = makeTempDir("project");
    const homeDir = path.join(projectRoot, "home");
    const projectSkills = path.join(projectRoot, "skills");
    const codexSkills = path.join(homeDir, ".codex/skills");
    const traeSkills = path.join(homeDir, ".trae/builtin_skills");
    const claudeSkills = path.join(homeDir, ".claude/skills");

    writeSkill(projectSkills, "alpha", "alpha-skill", "Shared skill for planning.");
    writeSkill(codexSkills, "alpha", "alpha-skill", "Shared skill for planning.");
    writeSkill(traeSkills, "alpha", "alpha-skill", "Shared skill for planning.");
    writeSkill(claudeSkills, "alpha", "alpha-skill", "Different Claude copy.");

    const roots = resolvePlatformSkillRoots({ projectRoot, homeDir });
    const inventory = buildSkillInventory({ roots });
    const alphaItems = inventory.items.filter((item) => item.name === "alpha-skill");
    const sharedAlpha = alphaItems.find((item) => item.occurrences.length === 3);

    expect(alphaItems).toHaveLength(2);
    expect(sharedAlpha?.contentSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(sharedAlpha?.platformIds).toEqual(expect.arrayContaining(["agents-shared", "codex", "trae"]));
    expect(sharedAlpha?.occurrences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ platformId: "trae", readOnly: true, sourceType: "builtin" }),
        expect.objectContaining({ platformId: "codex", readOnly: false, sourceType: "user" }),
      ]),
    );
  });

  it("adds deterministic role and process decision profiles to inventory items", () => {
    const projectRoot = makeTempDir("project");
    const homeDir = path.join(projectRoot, "home");

    writeSkill(path.join(projectRoot, "skills"), "design", "design-skill", "Figma UI prototype design workflow.");

    const roots = resolvePlatformSkillRoots({ projectRoot, homeDir });
    const inventory = buildSkillInventory({ roots });
    const designSkill = inventory.items.find((item) => item.name === "design-skill");

    expect(designSkill?.classification).toMatchObject({
      skillId: designSkill?.id,
      roleIds: expect.arrayContaining(["designer"]),
      stageIds: expect.arrayContaining(["design"]),
      depth: expect.any(String),
      confidence: expect.any(Number),
    });
  });
});

describe("buildSkillCompatibility", () => {
  it("marks readonly Trae skills, Cursor bridge requirements, and same-name conflicts", () => {
    const projectRoot = makeTempDir("project");
    const homeDir = path.join(projectRoot, "home");

    writeSkill(path.join(projectRoot, "skills"), "alpha", "alpha-skill", "Shared skill for planning.");
    writeSkill(path.join(homeDir, ".trae/builtin_skills"), "alpha", "alpha-skill", "Shared skill for planning.");
    writeSkill(path.join(homeDir, ".claude/skills"), "alpha", "alpha-skill", "Different Claude copy.");
    mkdirSync(path.join(projectRoot, ".cursor/rules"), { recursive: true });

    const roots = resolvePlatformSkillRoots({ projectRoot, homeDir });
    const inventory = buildSkillInventory({ roots });
    const compatibility = buildSkillCompatibility({ inventory, roots });
    const sharedAlpha = compatibility.items.find((item) => item.name === "alpha-skill" && item.occurrenceCount === 2);

    expect(sharedAlpha?.platforms.trae.status).toBe("readonly-source");
    expect(sharedAlpha?.platforms.cursor.status).toBe("bridge-required");
    expect(sharedAlpha?.platforms.claude.status).toBe("conflict");
  });
});

describe("createSkillSyncPlan", () => {
  it("returns dry-run actions without creating target files", () => {
    const projectRoot = makeTempDir("project");
    const homeDir = path.join(projectRoot, "home");
    const projectSkills = path.join(projectRoot, "skills");
    const codexSkills = path.join(homeDir, ".codex/skills");
    mkdirSync(codexSkills, { recursive: true });

    writeSkill(projectSkills, "beta", "beta-skill", "Skill that should be synced.");
    writeSkill(path.join(homeDir, ".trae/builtin_skills"), "trae-only", "trae-only", "Built in Trae skill.");
    mkdirSync(path.join(projectRoot, ".cursor/rules"), { recursive: true });

    const roots = resolvePlatformSkillRoots({ projectRoot, homeDir });
    const inventory = buildSkillInventory({ roots });
    const compatibility = buildSkillCompatibility({ inventory, roots });
    const plan = createSkillSyncPlan({ inventory, compatibility, roots, projectRoot });
    const betaTarget = path.join(codexSkills, "beta-skill", "SKILL.md");

    expect(plan.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "copy-to-target", platformId: "codex", targetPath: betaTarget }),
        expect.objectContaining({ type: "convert-to-cursor-rule", platformId: "cursor" }),
        expect.objectContaining({ type: "skip-readonly-source", platformId: "trae" }),
      ]),
    );
    expect(existsSync(betaTarget)).toBe(false);
  });
});

describe("applySkillSyncPlan", () => {
  it("copies missing SKILL.md files and creates Cursor bridge rules without touching unsafe actions", () => {
    const projectRoot = makeTempDir("project");
    const homeDir = path.join(projectRoot, "home");
    const projectSkills = path.join(projectRoot, "skills");
    const codexSkills = path.join(homeDir, ".codex/skills");
    mkdirSync(codexSkills, { recursive: true });
    mkdirSync(path.join(projectRoot, ".cursor/rules"), { recursive: true });

    const sourcePath = writeSkill(projectSkills, "gamma", "gamma-skill", "Skill that should be applied.");
    writeSkill(path.join(homeDir, ".trae/builtin_skills"), "trae-only", "trae-only", "Built in Trae skill.");

    const roots = resolvePlatformSkillRoots({ projectRoot, homeDir });
    const inventory = buildSkillInventory({ roots });
    const compatibility = buildSkillCompatibility({ inventory, roots });
    const plan = createSkillSyncPlan({ inventory, compatibility, roots, projectRoot });
    const result = applySkillSyncPlan({ plan, roots });
    const copiedSkillPath = path.join(codexSkills, "gamma-skill", "SKILL.md");
    const cursorRulePath = path.join(projectRoot, ".cursor/rules", "gamma-skill.md");

    expect(result.dryRun).toBe(false);
    expect(result.created).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "copy-to-target", targetPath: copiedSkillPath }),
        expect.objectContaining({ type: "convert-to-cursor-rule", targetPath: cursorRulePath }),
      ]),
    );
    expect(result.skipped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "skip-readonly-source", platformId: "trae" }),
      ]),
    );
    expect(existsSync(copiedSkillPath)).toBe(true);
    expect(existsSync(cursorRulePath)).toBe(true);
    expect(readFile(copiedSkillPath)).toBe(readFile(sourcePath));
    expect(readFile(cursorRulePath)).toContain("gamma-skill");
    expect(readFile(cursorRulePath)).toContain("Skill that should be applied.");
  });

  it("never overwrites existing target files", () => {
    const projectRoot = makeTempDir("project");
    const homeDir = path.join(projectRoot, "home");
    const projectSkills = path.join(projectRoot, "skills");
    const codexSkills = path.join(homeDir, ".codex/skills");
    const targetDir = path.join(codexSkills, "delta-skill");
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(path.join(targetDir, "SKILL.md"), "existing local version");

    writeSkill(projectSkills, "delta", "delta-skill", "Newer skill content.");

    const roots = resolvePlatformSkillRoots({ projectRoot, homeDir });
    const sourcePath = path.join(projectSkills, "delta", "SKILL.md");
    const targetPath = path.join(targetDir, "SKILL.md");
    const plan = {
      dryRun: true as const,
      warnings: [],
      actions: [
        {
          type: "copy-to-target" as const,
          skillId: "delta-skill",
          skillName: "delta-skill",
          platformId: "codex" as const,
          reason: "test existing target",
          sourcePath,
          targetPath,
        },
      ],
    };
    const result = applySkillSyncPlan({ plan, roots });

    expect(result.skipped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ targetPath, reason: expect.stringContaining("已存在") }),
      ]),
    );
    expect(readFile(targetPath)).toBe("existing local version");
  });
});

function readFile(filePath: string): string {
  return readFileSync(filePath, "utf8");
}
