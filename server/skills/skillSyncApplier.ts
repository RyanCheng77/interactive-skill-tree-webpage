import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { SkillPlatformRoot, SkillSyncApplyResult, SkillSyncPlan, SyncApplyEntry, SyncPlanAction } from "../types";

interface ApplySkillSyncPlanInput {
  plan: SkillSyncPlan;
  roots: SkillPlatformRoot[];
}

export function applySkillSyncPlan({ plan, roots }: ApplySkillSyncPlanInput): SkillSyncApplyResult {
  const result: SkillSyncApplyResult = {
    dryRun: false,
    created: [],
    skipped: [],
    errors: [],
    warnings: [...plan.warnings],
  };

  for (const action of plan.actions) {
    try {
      applyAction({ action, roots, result });
    } catch (error) {
      result.errors.push({
        ...action,
        reason: error instanceof Error ? error.message : "执行更新动作失败。",
      });
    }
  }

  return result;
}

function applyAction({
  action,
  roots,
  result,
}: {
  action: SyncPlanAction;
  roots: SkillPlatformRoot[];
  result: SkillSyncApplyResult;
}) {
  if (action.type === "copy-to-target") {
    applyCopyAction({ action, roots, result });
    return;
  }

  if (action.type === "convert-to-cursor-rule") {
    applyCursorRuleAction({ action, roots, result });
    return;
  }

  result.skipped.push({
    ...action,
    reason: `${action.type} 需要人工处理或来自只读来源，安全更新不会自动执行。`,
  });
}

function applyCopyAction({
  action,
  roots,
  result,
}: {
  action: SyncPlanAction;
  roots: SkillPlatformRoot[];
  result: SkillSyncApplyResult;
}) {
  const sourcePath = requirePath(action.sourcePath, "缺少源文件路径。");
  const targetPath = requirePath(action.targetPath, "缺少目标文件路径。");

  if (!isInsideAllowedSkillTarget(targetPath, roots)) {
    result.skipped.push({ ...action, reason: "目标路径不在可写 skill 同步目录内。" });
    return;
  }

  if (!existsSync(sourcePath)) {
    result.errors.push({ ...action, reason: "源 SKILL.md 不存在。" });
    return;
  }

  if (existsSync(targetPath)) {
    result.skipped.push({ ...action, reason: "目标文件已存在，安全更新不会覆盖。" });
    return;
  }

  mkdirSync(path.dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
  result.created.push({ ...action, reason: "已复制到目标 skill 目录。" });
}

function applyCursorRuleAction({
  action,
  roots,
  result,
}: {
  action: SyncPlanAction;
  roots: SkillPlatformRoot[];
  result: SkillSyncApplyResult;
}) {
  const sourcePath = requirePath(action.sourcePath, "缺少源文件路径。");
  const targetPath = requirePath(action.targetPath, "缺少 Cursor rule 目标路径。");

  if (!isInsideCursorRulesTarget(targetPath, roots)) {
    result.skipped.push({ ...action, reason: "目标路径不在 Cursor rules 目录内。" });
    return;
  }

  if (!existsSync(sourcePath)) {
    result.errors.push({ ...action, reason: "源 SKILL.md 不存在。" });
    return;
  }

  if (existsSync(targetPath)) {
    result.skipped.push({ ...action, reason: "Cursor rule 已存在，安全更新不会覆盖。" });
    return;
  }

  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, createCursorRule(action, sourcePath), "utf8");
  result.created.push({ ...action, reason: "已创建 Cursor rule 桥接文件。" });
}

function createCursorRule(action: SyncPlanAction, sourcePath: string): string {
  const source = readFileSync(sourcePath, "utf8").trim();

  return [
    "---",
    `description: Skill bridge for ${action.skillName}`,
    "alwaysApply: false",
    "---",
    "",
    `# ${action.skillName}`,
    "",
    `Source skill: ${sourcePath}`,
    "",
    source,
    "",
  ].join("\n");
}

function requirePath(value: string | undefined, message: string): string {
  if (!value) throw new Error(message);
  return path.resolve(value);
}

function isInsideAllowedSkillTarget(targetPath: string, roots: SkillPlatformRoot[]): boolean {
  return roots.some(
    (root) =>
      root.syncTarget &&
      root.nativeSkillSupport &&
      !root.readOnly &&
      isPathInside(targetPath, root.path),
  );
}

function isInsideCursorRulesTarget(targetPath: string, roots: SkillPlatformRoot[]): boolean {
  return roots.some((root) => root.platformId === "cursor" && root.scansRules && !root.readOnly && isPathInside(targetPath, root.path));
}

function isPathInside(candidatePath: string, rootPath: string): boolean {
  const relativePath = path.relative(path.resolve(rootPath), path.resolve(candidatePath));

  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}
