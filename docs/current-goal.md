# Current Codex Goal

状态：当前目标推进到 v0.3 跨平台 Skill 资产管理、决策分类与安全补齐闭环。

## 项目经营期望

后续项目按三条轨道持续推进：

- 项目本身逐步规划完善，从 MVP 到 v0.2 本地 Skill 图谱，再到 v0.3 跨平台 Skill 管理、AI 目标规划、Skill 沉淀和团队协作。
- 项目按版本持续更新开源到 Git，每个里程碑同步 README、roadmap、QA 和发布说明。
- 已 PR 到 Open Design 的 Skills Catalog Tree View 持续维护，直到合并或拆分为后续 PR。

详细约定见 `docs/project-operating-model.md`。

## 最近进展

- Open Design 上游贡献已推进到可合并状态：Skills Catalog Tree View PR 已获得 Looper 审核通过，CI 全绿，后续等待维护者处理。
- 本轮贡献流程已沉淀为项目 skill：`skills/oss-pr-review-response/SKILL.md`。
- v0.3 新增 Codex、Claude、Trae、Cursor、`.agents` 的跨平台 skill 资产盘点、角色/流程决策分类、同步预案和受限安全补齐。

## 目标计划

执行：在 `docs/superpowers/plans/2026-05-25-local-skill-graph.md` 的 v0.2 基础上追加 v0.3 管理工作台。

## 核心目标

把本机标准 `SKILL.md` 资产整理为跨平台清单，识别重复、冲突、只读来源和平台缺失状态，按角色/流程辅助用户判断缺口，生成同步预案，并对缺失的可写目标执行不覆盖的安全补齐。

## 关键要求

- 自动读取任意设备本地 `SKILL.md`。
- 支持 `LOCAL_SKILL_ROOTS`、项目 `./skills`、`CODEX_HOME/skills`、`~/.codex/skills`、`~/.agents/skills`。
- 不依赖 AI。
- 不依赖联网。
- 用确定性规则归类 skill。
- 按角色生成技能树。
- 按流程阶段展示推荐 skill。
- 按目标输入时，用规则推荐相关本地 skill。
- 新增「管理」入口，展示 Codex、Claude、Trae、Cursor、`.agents` 状态矩阵。
- 管理页必须提供按角色、按流程的分类入口，帮助用户先判断该补齐哪些能力，而不是只看工程状态。
- Cursor 作为规则桥接目标，生成 `convert-to-cursor-rule` 预案；安全更新可创建缺失的 `.cursor/rules/*.md` 桥接文件，但不覆盖已有规则。
- Trae builtin skill 作为只读来源扫描，不建议写回。
- 安全补齐不覆盖已有文件、不写只读来源、不自动处理冲突。
- 空 skill roots 也要有清晰空状态和配置引导。

## 暂缓

- AI 规划调用顺序。
- GitHub 候选检索。
- 后端方案历史和反馈闭环。
- 多用户协作和云端部署。

## Codex 执行提示

如果新会话需要恢复目标，可以对 Codex 说：

```text
读取 AGENTS.md、docs/current-goal.md 和 docs/project-operating-model.md，把 v0.3 跨平台 Skill 资产管理作为当前产品目标，同时维护开源版本和 Open Design PR 两条轨道。
```

如果新会话需要处理上游 PR review，可以对 Codex 说：

```text
调用项目 skill oss-pr-review-response，检查当前 PR 的 review、comments 和 CI，判断是否需要新提交。
```
