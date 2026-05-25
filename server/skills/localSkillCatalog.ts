import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { LocalSkill, LocalSkillRoot } from "../types";

interface ReadLocalSkillCatalogInput {
  roots: LocalSkillRoot[];
}

interface ParsedSkillFile {
  frontmatter: Record<string, string>;
  body: string;
}

const TAG_TERMS = [
  "ai",
  "android",
  "api",
  "backend",
  "browser",
  "design",
  "docs",
  "figma",
  "frontend",
  "github",
  "lark",
  "macos",
  "pdf",
  "plan",
  "qa",
  "security",
  "skill",
  "test",
  "ui",
  "workflow",
];

export function readLocalSkillCatalog({ roots }: ReadLocalSkillCatalogInput): LocalSkill[] {
  const skills = roots.flatMap((root) => readSkillsFromRoot(root));

  return skills.sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-CN"));
}

function readSkillsFromRoot(root: LocalSkillRoot): LocalSkill[] {
  if (!root.exists) return [];

  const skillFiles = findSkillFiles(root.path);

  return skillFiles.map((skillFile) => {
    const parsed = parseSkillFile(readFileSync(skillFile, "utf8"));
    const skillDir = path.dirname(skillFile);
    const relativeDir = path.relative(root.path, skillDir) || path.basename(skillDir);
    const fallbackName = path.basename(skillDir);
    const name = parsed.frontmatter.name || fallbackName;
    const description = parsed.frontmatter.description || firstNonEmptyLine(parsed.body) || "No description provided.";

    return {
      id: createSkillId(root, relativeDir || fallbackName),
      name,
      description,
      path: skillFile,
      root: root.path,
      bodySummary: summarizeBody(parsed.body),
      tags: inferTags(`${name} ${description} ${relativeDir} ${parsed.body}`),
    };
  });
}

function findSkillFiles(rootPath: string): string[] {
  const files: string[] = [];
  const entries = safeReadDir(rootPath);

  for (const entry of entries) {
    const fullPath = path.join(rootPath, entry);
    const stats = safeStat(fullPath);

    if (!stats) continue;
    if (stats.isDirectory()) {
      files.push(...findSkillFiles(fullPath));
    } else if (entry === "SKILL.md") {
      files.push(fullPath);
    }
  }

  return files;
}

function safeReadDir(dirPath: string): string[] {
  try {
    return readdirSync(dirPath);
  } catch {
    return [];
  }
}

function safeStat(filePath: string) {
  try {
    return statSync(filePath);
  } catch {
    return null;
  }
}

function parseSkillFile(content: string): ParsedSkillFile {
  if (!content.startsWith("---")) {
    return { frontmatter: {}, body: content };
  }

  const endIndex = content.indexOf("\n---", 3);
  if (endIndex === -1) {
    return { frontmatter: {}, body: content };
  }

  const rawFrontmatter = content.slice(3, endIndex).trim();
  const body = content.slice(endIndex + 4).trim();

  return {
    frontmatter: parseFrontmatter(rawFrontmatter),
    body,
  };
}

function parseFrontmatter(rawFrontmatter: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const line of rawFrontmatter.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    values[key] = stripQuotes(rawValue.trim());
  }

  return values;
}

function stripQuotes(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

function firstNonEmptyLine(body: string): string | null {
  return body
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) ?? null;
}

function summarizeBody(body: string): string {
  return body
    .replace(/^---[\s\S]*?---/, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ")
    .slice(0, 280);
}

function inferTags(text: string): string[] {
  const normalizedText = text.toLowerCase();

  return TAG_TERMS.filter((term) => normalizedText.includes(term));
}

function createSkillId(root: LocalSkillRoot, relativeDir: string): string {
  const normalized = relativeDir
    .split(path.sep)
    .filter(Boolean)
    .join("/")
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, "-");

  return `${root.source}/${normalized || "root"}`;
}
