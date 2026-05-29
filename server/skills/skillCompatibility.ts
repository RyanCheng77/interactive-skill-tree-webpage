import path from "node:path";
import type {
  PlatformCompatibilityEntry,
  PlatformId,
  SkillCompatibility,
  SkillCompatibilityItem,
  SkillInventory,
  SkillInventoryItem,
  SkillPlatformRoot,
} from "../types";
import { PLATFORM_IDS } from "./toolAdapters";
import { slugify } from "./skillInventory";

interface BuildSkillCompatibilityInput {
  inventory: SkillInventory;
  roots: SkillPlatformRoot[];
}

export function buildSkillCompatibility({ inventory, roots }: BuildSkillCompatibilityInput): SkillCompatibility {
  return {
    items: inventory.items.map((item) => createCompatibilityItem(item, inventory, roots)),
    platforms: PLATFORM_IDS,
    warnings: inventory.warnings,
  };
}

function createCompatibilityItem(item: SkillInventoryItem, inventory: SkillInventory, roots: SkillPlatformRoot[]): SkillCompatibilityItem {
  return {
    skillId: item.id,
    name: item.name,
    contentSha256: item.contentSha256,
    occurrenceCount: item.occurrenceCount,
    platforms: {
      codex: createPlatformEntry("codex", item, inventory, roots),
      claude: createPlatformEntry("claude", item, inventory, roots),
      trae: createPlatformEntry("trae", item, inventory, roots),
      cursor: createPlatformEntry("cursor", item, inventory, roots),
      "agents-shared": createPlatformEntry("agents-shared", item, inventory, roots),
    },
  };
}

function createPlatformEntry(
  platformId: PlatformId,
  item: SkillInventoryItem,
  inventory: SkillInventory,
  roots: SkillPlatformRoot[],
): PlatformCompatibilityEntry {
  if (platformId === "cursor") {
    return {
      platformId,
      status: "bridge-required",
      occurrenceCount: 0,
      targetPath: path.join(getProjectRootFromRoots(roots), ".cursor/rules", `${slugify(item.name)}.md`),
      reason: "Cursor 当前通过项目规则文件工作，需要把 SKILL.md 转换为 .cursor/rules 规则后才能桥接。",
    };
  }

  const occurrences = item.occurrences.filter((occurrence) => occurrence.platformId === platformId);
  const conflictingItem = inventory.items.find(
    (other) =>
      other.name === item.name &&
      other.contentSha256 !== item.contentSha256 &&
      other.occurrences.some((occurrence) => occurrence.platformId === platformId),
  );

  if (conflictingItem) {
    return {
      platformId,
      status: "conflict",
      occurrenceCount: occurrences.length,
      reason: `平台上存在同名 skill 的不同内容版本：${conflictingItem.contentSha256.slice(0, 12)}。`,
    };
  }

  if (occurrences.length === 0) {
    return {
      platformId,
      status: "missing",
      occurrenceCount: 0,
      reason: "该平台未发现这一版 skill。",
    };
  }

  if (occurrences.every((occurrence) => occurrence.readOnly)) {
    return {
      platformId,
      status: "readonly-source",
      occurrenceCount: occurrences.length,
      reason: "只在内置或缓存目录中发现，默认不建议写回该来源。",
    };
  }

  if (occurrences.length > 1) {
    return {
      platformId,
      status: "duplicate",
      occurrenceCount: occurrences.length,
      reason: "该平台存在多个相同内容副本，可考虑后续合并。",
    };
  }

  return {
    platformId,
    status: "recognized",
    occurrenceCount: occurrences.length,
    reason: "该平台已识别这一版 skill。",
  };
}

function getProjectRootFromRoots(roots: SkillPlatformRoot[]): string {
  const projectRoot = roots.find((root) => root.id === "project-skills");

  if (!projectRoot) return process.cwd();

  return path.dirname(projectRoot.path);
}
