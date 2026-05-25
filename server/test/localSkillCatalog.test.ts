import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readLocalSkillCatalog } from "../skills/localSkillCatalog";
import type { LocalSkillRoot } from "../types";

const tempDirs: string[] = [];

function makeTempDir(name: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), `skill-catalog-${name}-`));
  tempDirs.push(dir);
  return dir;
}

function writeSkill(root: string, skillDir: string, content: string): string {
  const dir = path.join(root, skillDir);
  mkdirSync(dir, { recursive: true });
  const skillPath = path.join(dir, "SKILL.md");
  writeFileSync(skillPath, content);
  return skillPath;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

describe("readLocalSkillCatalog", () => {
  it("parses SKILL.md frontmatter and body summary from existing roots", () => {
    const root = makeTempDir("root");
    const skillPath = writeSkill(
      root,
      "product/planner",
      `---
name: product-lead-planner
description: Use when clarifying product scope and roadmap.
---

# Product Lead Planner

Use this skill for product planning work.
It helps define MVP scope.
`,
    );

    const skills = readLocalSkillCatalog({
      roots: [{ path: root, exists: true, source: "env" }],
    });

    expect(skills).toHaveLength(1);
    expect(skills[0]).toMatchObject({
      id: "env/product/planner",
      name: "product-lead-planner",
      description: "Use when clarifying product scope and roadmap.",
      path: skillPath,
      root,
      bodySummary: "# Product Lead Planner Use this skill for product planning work. It helps define MVP scope.",
    });
    expect(skills[0].tags).toEqual(expect.arrayContaining(["plan", "skill"]));
  });

  it("returns an empty catalog for missing roots", () => {
    const missingRoot: LocalSkillRoot = {
      path: path.join(makeTempDir("missing-parent"), "missing"),
      exists: false,
      source: "project",
    };

    expect(readLocalSkillCatalog({ roots: [missingRoot] })).toEqual([]);
  });

  it("falls back to directory name and first body line when frontmatter is absent", () => {
    const root = makeTempDir("fallback");
    const skillPath = writeSkill(root, "qa-check", "# QA Check\n\nValidate the workflow with tests.");

    const skills = readLocalSkillCatalog({
      roots: [{ path: root, exists: true, source: "project" }],
    });

    expect(skills[0]).toMatchObject({
      id: "project/qa-check",
      name: "qa-check",
      description: "# QA Check",
      path: skillPath,
      root,
    });
    expect(skills[0].tags).toEqual(expect.arrayContaining(["qa", "test"]));
  });
});
