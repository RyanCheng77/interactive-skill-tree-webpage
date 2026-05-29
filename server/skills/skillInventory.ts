import { readdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import type { CursorRuleContext, LocalSkill, SkillInventory, SkillInventoryItem, SkillOccurrence, SkillPlatformRoot } from "../types";
import { classifySkill } from "./skillClassifier";
import { resolvePlatformSkillRoots } from "./toolAdapters";

interface BuildSkillInventoryInput {
  roots?: SkillPlatformRoot[];
}

interface ParsedSkillFile {
  frontmatter: Record<string, string>;
  body: string;
}

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", "telemetry", "file-history"]);

const TAG_TERMS = [
  "ai",
  "android",
  "api",
  "backend",
  "browser",
  "claude",
  "codex",
  "cursor",
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
  "trae",
  "ui",
  "workflow",
];

export function buildSkillInventory({ roots = resolvePlatformSkillRoots() }: BuildSkillInventoryInput = {}): SkillInventory {
  const warnings = roots.filter((root) => !root.exists).map((root) => `Skill root not found: ${root.path}`);
  const occurrences = roots.flatMap((root) => readOccurrencesFromRoot(root));
  const items = groupOccurrences(occurrences);
  const cursorRules = roots.filter((root) => root.scansRules).map((root) => readCursorRuleContext(root));

  return {
    items,
    roots,
    cursorRules,
    warnings,
  };
}

export function inventoryItemsToLocalSkills(inventory: SkillInventory): LocalSkill[] {
  return inventory.items
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      path: item.canonicalPath,
      root: item.canonicalRoot,
      bodySummary: item.bodySummary,
      tags: item.tags,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-CN"));
}

function readOccurrencesFromRoot(root: SkillPlatformRoot): SkillOccurrence[] {
  if (!root.exists || !root.scansSkills) return [];

  return findSkillFiles(root.path).map((skillPath) => {
    const content = readFileSync(skillPath, "utf8");
    const parsed = parseSkillFile(content);
    const skillDir = path.dirname(skillPath);
    const relativeDir = path.relative(root.path, skillDir) || path.basename(skillDir);
    const fallbackName = path.basename(skillDir);
    const name = parsed.frontmatter.name || fallbackName;
    const description = parsed.frontmatter.description || firstNonEmptyLine(parsed.body) || "No description provided.";
    const contentSha256 = createHash("sha256").update(content).digest("hex");
    const stats = statSync(skillPath);

    return {
      id: `${root.id}/${slugify(relativeDir) || "root"}/${contentSha256.slice(0, 12)}`,
      name,
      description,
      path: skillPath,
      root: root.path,
      rootId: root.id,
      relativeDir,
      platformId: root.platformId,
      sourceType: root.sourceType,
      readOnly: root.readOnly,
      mtimeMs: stats.mtimeMs,
      contentSha256,
    };
  });
}

function groupOccurrences(occurrences: SkillOccurrence[]): SkillInventoryItem[] {
  const grouped = new Map<string, SkillOccurrence[]>();

  for (const occurrence of occurrences) {
    const key = `${occurrence.name.toLowerCase()}:${occurrence.contentSha256}`;
    grouped.set(key, [...(grouped.get(key) ?? []), occurrence]);
  }

  return Array.from(grouped.values())
    .map(createInventoryItem)
    .sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-CN") || left.contentSha256.localeCompare(right.contentSha256));
}

function createInventoryItem(occurrences: SkillOccurrence[]): SkillInventoryItem {
  const sortedOccurrences = [...occurrences].sort((left, right) => Number(left.readOnly) - Number(right.readOnly) || left.path.localeCompare(right.path));
  const canonical = sortedOccurrences[0];
  const parsed = parseSkillFile(readFileSync(canonical.path, "utf8"));
  const platformIds = Array.from(new Set(sortedOccurrences.map((occurrence) => occurrence.platformId))).sort();
  const id = `${slugify(canonical.name)}-${canonical.contentSha256.slice(0, 12)}`;
  const bodySummary = summarizeBody(parsed.body);
  const tags = inferTags(`${canonical.name} ${canonical.description} ${parsed.body} ${platformIds.join(" ")}`);
  const localSkill: LocalSkill = {
    id,
    name: canonical.name,
    description: canonical.description,
    path: canonical.path,
    root: canonical.root,
    bodySummary,
    tags,
  };

  return {
    id,
    name: canonical.name,
    description: canonical.description,
    bodySummary,
    tags,
    contentSha256: canonical.contentSha256,
    canonicalPath: canonical.path,
    canonicalRoot: canonical.root,
    platformIds,
    occurrenceCount: sortedOccurrences.length,
    classification: classifySkill(localSkill),
    occurrences: sortedOccurrences,
  };
}

function findSkillFiles(rootPath: string): string[] {
  const files: string[] = [];
  const entries = safeReadDir(rootPath);

  for (const entry of entries) {
    const fullPath = path.join(rootPath, entry);
    const stats = safeStat(fullPath);

    if (!stats) continue;
    if (stats.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      files.push(...findSkillFiles(fullPath));
    } else if (entry === "SKILL.md") {
      files.push(fullPath);
    }
  }

  return files;
}

function readCursorRuleContext(root: SkillPlatformRoot): CursorRuleContext {
  if (!root.exists) {
    return { root: root.path, exists: false, fileCount: 0 };
  }

  return {
    root: root.path,
    exists: true,
    fileCount: safeReadDir(root.path).filter((entry) => entry.endsWith(".md") || entry.endsWith(".mdc")).length,
  };
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
  return (
    body
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? null
  );
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

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/[^a-z0-9/._-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^-+|-+$/g, "");
}
