# AGENTS.md

使用中文和用户对话。扮演项目负责人，可以指挥 agent 作为合适必要的角色协作。每个项目都要项目文档。调用 skill 时，请告知用户具体调用的 skill 名称以及是个人、公共还是项目，并用几个字简单描述用途。流程结束后，需要判断是否主动推荐用户沉淀 skill。

## 当前项目目标

优先执行 `docs/superpowers/plans/2026-05-25-local-skill-graph.md`，实现 v0.2 本地 Skill 图谱。

项目长期按三条轨道推进：

- 产品规划轨道：逐步完善本项目，从 MVP 推进到本地 Skill 图谱、AI 目标规划、Skill 沉淀和团队协作。
- 开源版本轨道：按版本持续更新到 Git，保持 README、roadmap、QA 和发布记录同步。
- Open Design 上游贡献轨道：持续维护已提交到 `nexu-io/open-design` 的 Skills Catalog Tree View PR，直到合并或被明确拆分。

三条轨道的详细约定见 `docs/project-operating-model.md`。每轮工作结束前，应判断是否需要同步项目文档、QA 记录、开源发布状态或 Open Design PR 状态。

除非用户明确调整目标，否则后续 Codex 工作都围绕该计划推进：

- 自动读取任意设备本地 `SKILL.md`。
- 不依赖 AI，不依赖联网。
- 使用确定性规则按角色、流程阶段、能力深度归类 skill。
- 生成按角色和按流程组织的可视化技能树。
- 按目标输入时，用规则推荐相关本地 skill。
- 保持跨设备路径发现能力。
- 实现后同步更新项目文档和 QA 记录。

## 当前项目进展

- MVP 已完成为本地优先的产研流程角色工作台。
- v0.2 本地 Skill 图谱计划仍是主线目标。
- 已完成一次 Open Design 上游贡献实战：向 `nexu-io/open-design` 提交 Skills Catalog Tree View PR，并处理 review、CI、PR 描述和截图。
- 已把该开源 PR review 响应流程沉淀为项目 skill：`skills/oss-pr-review-response/SKILL.md`。

Open Design 贡献是项目经验沉淀，不替代 v0.2 主线。后续除非用户明确切换目标，仍优先推进本地 skill 扫描、分类、推荐和可视化。

同时，Open Design PR 需要持续跟进 review、CI、维护者反馈和合并后的 follow-up。处理该类任务时优先调用项目 skill `oss-pr-review-response`。

## 项目 Skill 约定

项目级 skill 放在 `skills/<skill-name>/SKILL.md`，后续本地 skill 图谱应优先把 `./skills` 纳入扫描。

当前项目级 skill：

- `oss-pr-review-response`：处理开源 GitHub PR review，从读评论、修代码、补测试、更新 PR 描述/截图到回复 reviewer。
- `multi-agent-project-collaboration`：管理多 agent/多工具并行开发，包括分支、任务切片、交接、测试门禁和状态同步。

当用户要求处理开源 PR、review、CI、fork 分支、PR 描述或 reviewer 回复时，优先调用 `oss-pr-review-response`。

当用户提到多个 agent、多个工具、并行开发、分支协作、版本管理、交接、质量门禁或信息同步时，优先调用项目 skill `multi-agent-project-collaboration`。

## 多 Agent 协作要求

本项目允许多个 Codex、工具或 agent 并行推进，但必须保持边界清楚、状态可追踪、主线可运行。

- 主线分支 `main` 必须保持可运行；并行工作统一使用 `codex/<topic>` 功能分支。
- 每个 agent 应只负责一个边界清晰的任务包，避免多人同时修改同一核心模块。
- 分支命名应表达交付物，例如 `codex/local-skill-scanner`、`codex/skill-classifier`、`codex/skill-tree-view`。
- 每轮交接应更新或补充项目文档，优先记录当前状态、已验证命令、阻塞点、风险和下一步。
- 合并或阶段收口前必须说明改动范围、测试结果、文档同步情况和已知风险。
- 涉及功能行为变化时，补充 `docs/superpowers/qa/` QA 记录；仅文档或 skill 变更时，也应说明无需运行应用测试的原因。
- 多 agent 并行时，建议按扫描、分类、图谱数据、推荐逻辑、可视化、文档/QA 分工，减少冲突。
- Claude Code CLI 子 Agent 优先使用 `claude -p ... --no-session-persistence` 的非交互短任务；先跑无仓库内容 smoke test，再分发真实任务。
- 向外部 Claude 子 Agent 披露仓库内容、分支名、`git status`、diff、日志、路径或文件片段前，必须先说明披露范围并获得用户明确授权。
- GUI 工具（尤其 Trae CN）每次操作前必须确认左上角/窗口标题匹配本轮目标项目或目标仓库名；不要写死某个项目名。若窗口不是本轮目标项目，立即停止。

## 当前执行入口

从计划文件的 Task 1 开始执行：

`docs/superpowers/plans/2026-05-25-local-skill-graph.md`

每完成一个任务，应运行相关测试；阶段完成后运行：

```bash
pnpm test:run
pnpm test:server
pnpm build
```

如果 `test:server` 尚未实现，则说明原因，并在对应任务实现后补跑。
