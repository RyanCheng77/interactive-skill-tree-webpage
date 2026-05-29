import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SkillCompatibility, SkillInventory, SkillInventoryItem, SkillSyncApplyResult } from "../lib/apiClient";
import { SkillManagementView } from "./SkillManagementView";

function createSkillItem(index: number): SkillInventoryItem {
  const hash = `${index.toString(16).padStart(2, "0")}`.repeat(32).slice(0, 64);

  return {
    id: `skill-${index}`,
    name: `skill-${index}`,
    description: `Skill ${index} description`,
    bodySummary: `Skill ${index} body`,
    tags: ["test"],
    contentSha256: hash,
    canonicalPath: `/tmp/skills/skill-${index}/SKILL.md`,
    canonicalRoot: "/tmp/skills",
    platformIds: ["codex"],
    occurrenceCount: 1,
    classification: {
      skillId: `skill-${index}`,
      roleIds: index % 2 === 0 ? ["designer"] : ["pm"],
      stageIds: index % 3 === 0 ? ["design"] : ["requirements"],
      depth: index % 2 === 0 ? "intro" : "working",
      confidence: 0.7,
      reason: "测试分类。",
    },
    occurrences: [
      {
        id: `codex/skill-${index}`,
        name: `skill-${index}`,
        description: `Skill ${index} description`,
        path: `/tmp/skills/skill-${index}/SKILL.md`,
        root: "/tmp/skills",
        rootId: "codex-home",
        relativeDir: `skill-${index}`,
        platformId: "codex",
        sourceType: "user",
        readOnly: false,
        mtimeMs: index,
        contentSha256: hash,
      },
    ],
  };
}

const items = Array.from({ length: 30 }, (_, index) => createSkillItem(index + 1));

const inventory: SkillInventory = {
  items,
  roots: [],
  cursorRules: [],
  warnings: [],
};

const compatibility: SkillCompatibility = {
  platforms: ["codex", "claude", "trae", "cursor", "agents-shared"],
  warnings: [],
  items: items.map((item) => ({
    skillId: item.id,
    name: item.name,
    contentSha256: item.contentSha256,
    occurrenceCount: item.occurrenceCount,
    platforms: {
      codex: { platformId: "codex", status: "recognized", occurrenceCount: 1, reason: "" },
      claude: { platformId: "claude", status: "missing", occurrenceCount: 0, reason: "" },
      trae: { platformId: "trae", status: "missing", occurrenceCount: 0, reason: "" },
      cursor: { platformId: "cursor", status: "bridge-required", occurrenceCount: 0, reason: "" },
      "agents-shared": { platformId: "agents-shared", status: "missing", occurrenceCount: 0, reason: "" },
    },
  })),
};

const syncApplyResult: SkillSyncApplyResult = {
  dryRun: false,
  warnings: [],
  created: [
    {
      type: "copy-to-target",
      skillId: "skill-1",
      skillName: "skill-1",
      platformId: "claude",
      reason: "已复制到目标 skill 目录。",
      sourcePath: "/tmp/skills/skill-1/SKILL.md",
      targetPath: "/tmp/claude/skill-1/SKILL.md",
    },
  ],
  skipped: [],
  errors: [
    {
      type: "manual-review-conflict",
      skillId: "skill-2",
      skillName: "skill-2",
      platformId: "codex",
      reason: "需要人工复核。",
      sourcePath: "/tmp/skills/skill-2/SKILL.md",
    },
  ],
};

describe("SkillManagementView", () => {
  it("renders a paginated skill list instead of show-all controls", () => {
    const html = renderToStaticMarkup(
      <SkillManagementView
        inventory={inventory}
        compatibility={compatibility}
        syncPlan={null}
        loading={false}
        planning={false}
        applying={false}
        syncApplyResult={null}
        onRefresh={() => {}}
        onCreateSyncPlan={() => {}}
        onApplySyncPlan={() => {}}
      />,
    );

    expect(html).toContain("显示 1-24 / 30，第 1 / 2 页。");
    expect(html).toContain("1-24 / 30 条");
    expect(html).toContain("aria-label=\"下一页\"");
    expect(html).toContain("aria-label=\"最后一页\"");
    expect(html).not.toContain("显示全部");
    expect(html).not.toContain("再显示");
  });

  it("renders a structured skeleton while skill assets are refreshing", () => {
    const html = renderToStaticMarkup(
      <SkillManagementView
        inventory={null}
        compatibility={null}
        syncPlan={null}
        loading={true}
        planning={false}
        applying={false}
        syncApplyResult={null}
        onRefresh={() => {}}
        onCreateSyncPlan={() => {}}
        onApplySyncPlan={() => {}}
      />,
    );

    expect(html).toContain("正在刷新 Skill 资产");
    expect(html).toContain("data-testid=\"skill-management-skeleton\"");
    expect(html).toContain("data-testid=\"skill-skeleton-row\"");
  });

  it("renders an empty state when no standard SKILL.md files are found", () => {
    const emptyInventory: SkillInventory = {
      ...inventory,
      items: [],
    };
    const emptyCompatibility: SkillCompatibility = {
      ...compatibility,
      items: [],
    };

    const html = renderToStaticMarkup(
      <SkillManagementView
        inventory={emptyInventory}
        compatibility={emptyCompatibility}
        syncPlan={null}
        loading={false}
        planning={false}
        applying={false}
        syncApplyResult={null}
        onRefresh={() => {}}
        onCreateSyncPlan={() => {}}
        onApplySyncPlan={() => {}}
      />,
    );

    expect(html).toContain("还没有发现标准 SKILL.md");
    expect(html).toContain("刷新资产");
    expect(html).toContain("检查这些扫描根是否存在");
  });

  it("renders a retryable API error state when management data is unavailable", () => {
    const html = renderToStaticMarkup(
      <SkillManagementView
        inventory={null}
        compatibility={null}
        syncPlan={null}
        loading={false}
        planning={false}
        applying={false}
        syncApplyResult={null}
        onRefresh={() => {}}
        onCreateSyncPlan={() => {}}
        onApplySyncPlan={() => {}}
      />,
    );

    expect(html).toContain("管理数据不可用");
    expect(html).toContain("重新连接并刷新");
    expect(html).toContain("刷新资产");
  });

  it("renders a no-results state for searches that match no skills", () => {
    const html = renderToStaticMarkup(
      <SkillManagementView
        inventory={inventory}
        compatibility={compatibility}
        syncPlan={null}
        loading={false}
        planning={false}
        applying={false}
        syncApplyResult={null}
        initialQuery="not-in-inventory"
        onRefresh={() => {}}
        onCreateSyncPlan={() => {}}
        onApplySyncPlan={() => {}}
      />,
    );

    expect(html).toContain("没有匹配的 Skill");
    expect(html).toContain("清除筛选");
    expect(html).not.toContain("还没有发现标准 SKILL.md");
  });

  it("renders sync plan progress and warning states", () => {
    const planningHtml = renderToStaticMarkup(
      <SkillManagementView
        inventory={inventory}
        compatibility={compatibility}
        syncPlan={null}
        loading={false}
        planning={true}
        applying={false}
        syncApplyResult={null}
        onRefresh={() => {}}
        onCreateSyncPlan={() => {}}
        onApplySyncPlan={() => {}}
      />,
    );
    const warningHtml = renderToStaticMarkup(
      <SkillManagementView
        inventory={inventory}
        compatibility={compatibility}
        syncPlan={{ dryRun: true, actions: [], warnings: ["同步预案生成失败。"] }}
        loading={false}
        planning={false}
        applying={false}
        syncApplyResult={null}
        onRefresh={() => {}}
        onCreateSyncPlan={() => {}}
        onApplySyncPlan={() => {}}
      />,
    );

    expect(planningHtml).toContain("正在检查哪些 Skill 可以安全补齐");
    expect(warningHtml).toContain("同步预案生成失败。");
  });

  it("renders safe one-click apply controls and results after a sync plan is generated", () => {
    const html = renderToStaticMarkup(
      <SkillManagementView
        inventory={inventory}
        compatibility={compatibility}
        syncPlan={{ dryRun: true, actions: [], warnings: [] }}
        loading={false}
        planning={false}
        applying={false}
        syncApplyResult={syncApplyResult}
        onRefresh={() => {}}
        onCreateSyncPlan={() => {}}
        onApplySyncPlan={() => {}}
      />,
    );

    expect(html).toContain("安全补齐");
    expect(html).toContain("已补齐 1");
    expect(html).toContain("跳过 0");
    expect(html).toContain("需处理 1");
    expect(html).toContain("需要人工复核。");
  });

  it("renders combined role, process, and tool decision filters", () => {
    const html = renderToStaticMarkup(
      <SkillManagementView
        inventory={inventory}
        compatibility={compatibility}
        syncPlan={null}
        loading={false}
        planning={false}
        applying={false}
        syncApplyResult={null}
        onRefresh={() => {}}
        onCreateSyncPlan={() => {}}
        onApplySyncPlan={() => {}}
      />,
    );

    expect(html).toContain("决策筛选");
    expect(html).toContain("角色");
    expect(html).toContain("流程");
    expect(html).toContain("工具");
    expect(html).toContain("产品");
    expect(html).toContain("设计");
    expect(html).toContain("需求");
    expect(html).toContain("Codex");
    expect(html).not.toContain("先看哪个角色缺能力");
    expect(html).not.toContain("定位当前阶段缺口");
  });
});
