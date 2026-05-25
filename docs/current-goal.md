# Current Codex Goal

状态：当前目标已设为 v0.2 本地 Skill 图谱。

## 目标计划

执行：

`docs/superpowers/plans/2026-05-25-local-skill-graph.md`

## 核心目标

把当前写死的演示 skill tree 改为从任意设备本地读取真实 `SKILL.md`，并自动形成角色/流程技能图谱。

## 关键要求

- 自动读取任意设备本地 `SKILL.md`。
- 支持 `LOCAL_SKILL_ROOTS`、项目 `./skills`、`CODEX_HOME/skills`、`~/.codex/skills`、`~/.agents/skills`。
- 不依赖 AI。
- 不依赖联网。
- 用确定性规则归类 skill。
- 按角色生成技能树。
- 按流程阶段展示推荐 skill。
- 按目标输入时，用规则推荐相关本地 skill。
- 空 skill roots 也要有清晰空状态和配置引导。

## 暂缓

- AI 规划调用顺序。
- GitHub 候选检索。
- 后端方案历史和反馈闭环。
- 多用户协作和云端部署。

## Codex 执行提示

如果新会话需要恢复目标，可以对 Codex 说：

```text
读取 AGENTS.md 和 docs/current-goal.md，把 docs/superpowers/plans/2026-05-25-local-skill-graph.md 作为当前项目目标，从 Task 1 开始执行。
```
