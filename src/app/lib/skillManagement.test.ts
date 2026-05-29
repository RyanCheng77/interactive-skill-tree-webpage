import { describe, expect, it } from "vitest";
import type { SkillCompatibility, SkillInventory } from "./apiClient";
import {
  filterSkillInventoryItems,
  filterSyncPlanActions,
  getDecisionFilterLabel,
  getSkillDecisionBuckets,
  getPlatformStatusLabel,
  getSkillFilterCounts,
  getSyncPlanActionCounts,
  paginateSkillInventoryItems,
  summarizeSkillManagement,
} from "./skillManagement";

const inventory: SkillInventory = {
  roots: [],
  warnings: [],
  cursorRules: [],
  items: [
    {
      id: "alpha-aaa",
      name: "alpha",
      description: "Alpha skill",
      bodySummary: "Alpha",
      tags: ["plan"],
      contentSha256: "a".repeat(64),
      canonicalPath: "/tmp/alpha/SKILL.md",
      canonicalRoot: "/tmp",
      platformIds: ["codex", "trae"],
      occurrenceCount: 2,
      classification: {
        skillId: "alpha-aaa",
        roleIds: ["pm", "lead"],
        stageIds: ["requirements"],
        depth: "working",
        confidence: 0.74,
        reason: "命中关键词：planning。",
      },
      occurrences: [
        {
          id: "codex/alpha",
          name: "alpha",
          description: "Alpha skill",
          path: "/tmp/codex/alpha/SKILL.md",
          root: "/tmp/codex",
          rootId: "codex-home",
          relativeDir: "alpha",
          platformId: "codex",
          sourceType: "user",
          readOnly: false,
          mtimeMs: 1,
          contentSha256: "a".repeat(64),
        },
        {
          id: "trae/alpha",
          name: "alpha",
          description: "Alpha skill",
          path: "/tmp/trae/alpha/SKILL.md",
          root: "/tmp/trae",
          rootId: "trae-builtin",
          relativeDir: "alpha",
          platformId: "trae",
          sourceType: "builtin",
          readOnly: true,
          mtimeMs: 2,
          contentSha256: "a".repeat(64),
        },
      ],
    },
    {
      id: "beta-bbb",
      name: "beta",
      description: "Beta skill for Cursor bridge",
      bodySummary: "Beta",
      tags: ["cursor"],
      contentSha256: "b".repeat(64),
      canonicalPath: "/tmp/beta/SKILL.md",
      canonicalRoot: "/tmp",
      platformIds: ["claude"],
      occurrenceCount: 1,
      classification: {
        skillId: "beta-bbb",
        roleIds: ["designer"],
        stageIds: ["design", "development"],
        depth: "intro",
        confidence: 0.66,
        reason: "命中关键词：cursor。",
      },
      occurrences: [
        {
          id: "claude/beta",
          name: "beta",
          description: "Beta skill for Cursor bridge",
          path: "/tmp/claude/beta/SKILL.md",
          root: "/tmp/claude",
          rootId: "claude-home",
          relativeDir: "beta",
          platformId: "claude",
          sourceType: "user",
          readOnly: false,
          mtimeMs: 3,
          contentSha256: "b".repeat(64),
        },
      ],
    },
  ],
};

const compatibility: SkillCompatibility = {
  platforms: ["codex", "claude", "trae", "cursor", "agents-shared"],
  warnings: [],
  items: [
    {
      skillId: "alpha-aaa",
      name: "alpha",
      contentSha256: "a".repeat(64),
      occurrenceCount: 2,
      platforms: {
        codex: { platformId: "codex", status: "recognized", occurrenceCount: 1, reason: "" },
        claude: { platformId: "claude", status: "conflict", occurrenceCount: 0, reason: "" },
        trae: { platformId: "trae", status: "readonly-source", occurrenceCount: 1, reason: "" },
        cursor: { platformId: "cursor", status: "bridge-required", occurrenceCount: 0, reason: "" },
        "agents-shared": { platformId: "agents-shared", status: "missing", occurrenceCount: 0, reason: "" },
      },
    },
    {
      skillId: "beta-bbb",
      name: "beta",
      contentSha256: "b".repeat(64),
      occurrenceCount: 1,
      platforms: {
        codex: { platformId: "codex", status: "missing", occurrenceCount: 0, reason: "" },
        claude: { platformId: "claude", status: "recognized", occurrenceCount: 1, reason: "" },
        trae: { platformId: "trae", status: "missing", occurrenceCount: 0, reason: "" },
        cursor: { platformId: "cursor", status: "bridge-required", occurrenceCount: 0, reason: "" },
        "agents-shared": { platformId: "agents-shared", status: "missing", occurrenceCount: 0, reason: "" },
      },
    },
  ],
};

describe("summarizeSkillManagement", () => {
  it("summarizes inventory, readonly occurrences, conflicts, and Cursor bridge requirements", () => {
    expect(summarizeSkillManagement(inventory, compatibility)).toEqual({
      totalSkills: 2,
      totalOccurrences: 3,
      duplicateSkills: 1,
      readonlyOccurrences: 1,
      conflictSkills: 1,
      cursorBridgeRequired: 2,
    });
  });
});

describe("getSkillFilterCounts", () => {
  it("counts clickable management filters from the full inventory", () => {
    expect(getSkillFilterCounts(inventory, compatibility)).toEqual({
      all: 2,
      duplicates: 1,
      conflicts: 1,
      readonly: 1,
      cursorBridge: 2,
    });
  });
});

describe("filterSkillInventoryItems", () => {
  it("filters by duplicate, conflict, readonly, Cursor bridge, role, stage, and search query", () => {
    expect(filterSkillInventoryItems({ inventory, compatibility, filter: "duplicates", query: "" }).map((item) => item.id)).toEqual([
      "alpha-aaa",
    ]);
    expect(filterSkillInventoryItems({ inventory, compatibility, filter: "conflicts", query: "" }).map((item) => item.id)).toEqual([
      "alpha-aaa",
    ]);
    expect(filterSkillInventoryItems({ inventory, compatibility, filter: "readonly", query: "" }).map((item) => item.id)).toEqual([
      "alpha-aaa",
    ]);
    expect(filterSkillInventoryItems({ inventory, compatibility, filter: "cursorBridge", query: "" }).map((item) => item.id)).toEqual([
      "alpha-aaa",
      "beta-bbb",
    ]);
    expect(filterSkillInventoryItems({ inventory, compatibility, filter: "all", query: "cursor" }).map((item) => item.id)).toEqual([
      "beta-bbb",
    ]);
    expect(filterSkillInventoryItems({ inventory, compatibility, filter: "role:pm", query: "" }).map((item) => item.id)).toEqual([
      "alpha-aaa",
    ]);
    expect(filterSkillInventoryItems({ inventory, compatibility, filter: "stage:design", query: "" }).map((item) => item.id)).toEqual([
      "beta-bbb",
    ]);
    expect(filterSkillInventoryItems({ inventory, compatibility, filter: "stage:implementation", query: "" }).map((item) => item.id)).toEqual([
      "beta-bbb",
    ]);
    expect(
      filterSkillInventoryItems({
        inventory,
        compatibility,
        filter: "all",
        query: "",
        roleId: "pm",
        stageId: "requirements",
        platformId: "codex",
      }).map((item) => item.id),
    ).toEqual(["alpha-aaa"]);
    expect(
      filterSkillInventoryItems({
        inventory,
        compatibility,
        filter: "all",
        query: "",
        roleId: "pm",
        stageId: "requirements",
        platformId: "claude",
      }).map((item) => item.id),
    ).toEqual([]);
  });
});

describe("getSkillDecisionBuckets", () => {
  it("groups inventory items into role and process decision buckets", () => {
    const buckets = getSkillDecisionBuckets(inventory);

    expect(buckets.roles.find((bucket) => bucket.id === "pm")).toMatchObject({
      label: "产品",
      count: 1,
    });
    expect(buckets.roles.find((bucket) => bucket.id === "designer")).toMatchObject({
      label: "设计",
      count: 1,
    });
    expect(buckets.stages.find((bucket) => bucket.id === "requirements")).toMatchObject({
      label: "需求",
      count: 1,
    });
    expect(buckets.stages.find((bucket) => bucket.id === "design")).toMatchObject({
      label: "设计",
      count: 1,
    });
    expect(buckets.stages.find((bucket) => bucket.id === "development")).toMatchObject({
      label: "研发",
      count: 1,
    });
  });
});

describe("getDecisionFilterLabel", () => {
  it("returns human-readable labels for role and process filters", () => {
    expect(getDecisionFilterLabel("role:pm")).toBe("产品");
    expect(getDecisionFilterLabel("stage:testing")).toBe("测试");
    expect(getDecisionFilterLabel("stage:implementation")).toBe("研发");
    expect(getDecisionFilterLabel("all")).toBe("Skill");
  });
});

describe("paginateSkillInventoryItems", () => {
  const items = Array.from({ length: 53 }, (_, index) => ({
    ...inventory.items[index % inventory.items.length],
    id: `skill-${index + 1}`,
    name: `skill-${index + 1}`,
  }));

  it("returns page metadata and the requested slice for a large skill list", () => {
    const page = paginateSkillInventoryItems(items, { page: 2, pageSize: 20 });

    expect(page).toMatchObject({
      page: 2,
      pageSize: 20,
      totalItems: 53,
      totalPages: 3,
      startItem: 21,
      endItem: 40,
      hasPrevious: true,
      hasNext: true,
    });
    expect(page.items.map((item) => item.id)).toEqual(
      Array.from({ length: 20 }, (_, index) => `skill-${index + 21}`),
    );
  });

  it("clamps out-of-range pages and keeps empty lists stable", () => {
    const lastPage = paginateSkillInventoryItems(items, { page: 99, pageSize: 20 });
    const emptyPage = paginateSkillInventoryItems([], { page: 3, pageSize: 20 });

    expect(lastPage.page).toBe(3);
    expect(lastPage.items.map((item) => item.id)).toEqual(
      Array.from({ length: 13 }, (_, index) => `skill-${index + 41}`),
    );
    expect(emptyPage).toMatchObject({
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 1,
      startItem: 0,
      endItem: 0,
      hasPrevious: false,
      hasNext: false,
      items: [],
    });
  });
});

describe("sync plan filters", () => {
  const syncPlan = {
    dryRun: true as const,
    warnings: [],
    actions: [
      {
        type: "copy-to-target" as const,
        skillId: "alpha-aaa",
        skillName: "alpha",
        platformId: "codex" as const,
        reason: "copy",
        targetPath: "/tmp/codex/alpha/SKILL.md",
      },
      {
        type: "convert-to-cursor-rule" as const,
        skillId: "beta-bbb",
        skillName: "beta",
        platformId: "cursor" as const,
        reason: "bridge",
        targetPath: "/tmp/.cursor/rules/beta.md",
      },
    ],
  };

  it("counts and filters dry-run update actions without dropping hidden items", () => {
    expect(getSyncPlanActionCounts(syncPlan)).toEqual({
      all: 2,
      "copy-to-target": 1,
      "link-to-target": 0,
      "convert-to-cursor-rule": 1,
      "skip-readonly-source": 0,
      "manual-review-conflict": 0,
    });
    expect(filterSyncPlanActions(syncPlan, "convert-to-cursor-rule").map((action) => action.skillId)).toEqual(["beta-bbb"]);
  });
});

describe("getPlatformStatusLabel", () => {
  it("returns concise Chinese labels for platform statuses", () => {
    expect(getPlatformStatusLabel("readonly-source")).toBe("只读来源");
    expect(getPlatformStatusLabel("bridge-required")).toBe("需桥接");
  });
});
