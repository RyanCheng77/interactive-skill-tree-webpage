# Project Operating Model

日期：2026-05-27

本项目按三条长期轨道推进：产品规划、开源版本发布、Open Design 上游贡献。后续 Codex 会话应同时看这三条轨道的状态，而不是只处理眼前单个任务。

## 1. 产品规划轨道

目标：把 Interactive Skill Tree Webpage 从 MVP 逐步演进成本地优先的 Skill 图谱与项目工作台。

当前产品节奏：

- v0.1：已完成产研流程角色工作台 MVP。
- v0.2：进行中，本地 Skill 图谱。读取本地 `SKILL.md`，用确定性规则做角色、流程、深度分类，并替换演示数据。
- v0.3：候选，AI 目标规划。等本地图谱稳定后，再让 AI 基于本地 skill catalog 生成调用顺序和验收标准。
- v0.4：候选，Skill 沉淀与编辑。允许用户修正分类，并把项目复盘沉淀成新的本地 skill。
- v0.5：候选，AI + 后端工作流闭环。
- v0.6：候选，团队协作、权限和云端部署。

每推进一个产品版本，应同步更新：

- `docs/current-goal.md`
- `docs/roadmap.md`
- `docs/project-overview.md`
- 对应 `docs/superpowers/plans/` 计划
- 对应 `docs/superpowers/qa/` QA 记录

## 2. 开源版本轨道

目标：项目自身按版本持续更新到 Git，保持可追踪、可复现、可对外展示。

每个版本至少包含：

- 明确的版本目标和非目标。
- 已完成能力列表。
- 验证记录，包括测试、构建、浏览器 QA 或未运行原因。
- README 和 roadmap 更新。
- 必要时补充项目 skill、贡献说明或迁移说明。

建议版本发布节奏：

- 小功能和文档改进可以按常规提交累积。
- 完成一个版本里程碑后，创建清晰的版本提交或 tag。
- 对外开源前检查 `LICENSE`、`ATTRIBUTIONS.md`、`CONTRIBUTING.md`、`SECURITY.md`、README 和截图。
- 任何新增依赖、第三方素材或生成资产都要同步更新 attribution 或说明来源。

当前近期发布目标：

- 把 v0.2 本地 Skill 图谱完成到可演示状态。
- 用 `./skills/oss-pr-review-response/SKILL.md` 作为首个真实本地 skill 样例。
- 完成后更新 README、roadmap、QA，并准备一次面向 Git 的 v0.2 开源更新。

## 3. Open Design 上游贡献轨道

目标：持续完善已经 PR 到 `nexu-io/open-design` 的 Skills Catalog Tree View，不让贡献停在“一次提交”。

当前状态：

- PR：`nexu-io/open-design#2987`
- 分支：`RyanCheng77:codex/skill-catalog-tree`
- 当前状态：Looper 已审核通过，CI 全绿，等待维护者后续处理。

后续维护原则：

- 定期检查 PR review、comments、CI 和维护者新反馈。
- 有反馈时优先调用项目 skill `oss-pr-review-response`。
- 只补维护者明确需要的修改，保持 PR 小而聚焦。
- 如果上游 main 有冲突或 CI 环境变化，先同步分支并补最小修复。
- 如果 PR 合并，记录合并版本、后续 follow-up issue 或第二阶段 PR 候选。
- 如果维护者要求缩小范围，把未合并能力拆到后续 PR，不强行扩大当前 PR。

Open Design 贡献不替代本项目路线。它是外部验证场：把在上游学到的 review、CLI、i18n、测试和视觉经验，反哺本项目的本地 Skill 图谱。

## Codex 工作约定

每轮工作结束前，Codex 应判断是否需要同步以下内容：

- 产品进展是否需要更新 `docs/current-goal.md` 或 `docs/roadmap.md`。
- 代码或行为变化是否需要新增 QA 记录。
- 是否形成了可复用流程，值得沉淀为 `skills/<skill-name>/SKILL.md`。
- 是否影响开源发布状态或 README。
- 是否影响 Open Design PR 状态、截图、回复或后续任务。

## 4. 多 Agent 协作与版本管理

目标：允许多个 Codex、工具或 agent 同时推进项目，但保持主线稳定、分支边界清晰、状态可追踪、质量可验证。

触发场景：

- 用户提到多个 agent、多个工具或并行开发。
- 需要安排分支、任务分工、交接、合并顺序或版本节奏。
- 需要判断某个分支是否可合并、是否需要补测试或文档。

优先调用项目 skill：

- `skills/multi-agent-project-collaboration/SKILL.md`

分支规则：

- `main` 是稳定基线，必须保持可运行。
- 并行开发统一使用 `codex/<topic>` 功能分支。
- 分支名应表达交付物，不表达个人身份。
- 一个分支只承载一个清晰任务包，避免把扫描、分类、UI、推荐和文档混在同一轮改动里。

建议并行任务 lane：

- `codex/local-skill-scanner`：本地 `SKILL.md` 扫描、路径发现和跨设备目录处理。
- `codex/skill-classifier`：角色、流程阶段、能力深度的确定性分类规则和测试样例。
- `codex/skill-graph-transform`：skill catalog 到树结构的数据模型和转换逻辑。
- `codex/skill-recommendation`：目标输入后的规则推荐逻辑。
- `codex/skill-tree-view`：可视化、交互和前端集成。
- `codex/project-docs-qa`：README、roadmap、QA、发布记录和交接文档。

交接要求：

- 每轮结束必须说明当前分支、任务范围、主要文件、测试结果、文档更新、阻塞点和下一步。
- 涉及功能行为变化时，在 `docs/superpowers/qa/` 增加 QA 记录。
- 仅文档或 skill 变更时，也应记录未运行应用测试的原因。
- 如两个 agent 可能改同一文件，先明确所有权或合并顺序，再继续实现。

合并前质量门禁：

- 功能分支应至少运行与本次改动直接相关的测试。
- 多 agent 执行结果只能作为建议，必须由 Codex 主控复核 `git status`、diff、测试输出、API 行为和浏览器行为后才能认定完成。
- 阶段收口时运行：

```bash
pnpm test:run
pnpm test:server
pnpm build
```

- 如果 `pnpm test:server` 尚未实现或无法运行，必须写明原因和补跑时机。
- 合并摘要必须包含 Scope、Changed、Tests、Docs、Risks、Next。
- 对前端/API 集成类改动，必须补浏览器或等价视觉验收；至少检查 console、核心用户路径和目标视口。
- 验收后必须清理临时 dev server、浏览器会话和非交付 QA 产物。

## 5. Claude Code 子 Agent 调度协议

目标：在需要多路分析或并行审查时，用 Claude Code CLI 非交互子 Agent 提升效率，同时控制仓库信息披露和写入风险。

默认方式：

- 优先使用 `claude -p "..." --no-session-persistence` 拉起短生命周期子 Agent。
- 子 Agent 默认不使用工具，只回答指定问题。
- 每个子 Agent 只负责一个明确问题，例如架构审查、测试建议、文档一致性审查或风险枚举。
- Codex 作为项目负责人统一整合子 Agent 输出，子 Agent 不直接决定合并、发布、切分支或提交。

稳定性要求：

- 首次使用或环境变化后，先运行无仓库内容的 smoke test，例如要求精确返回 `OK`。
- Claude CLI 在 Codex 沙箱内可能无法访问 API；需要时使用非沙箱执行。
- 如果 `cc-switch` 切换了默认模型，优先按用户要求重试默认模型；不要未经用户同意静默换模型。
- 如果子 Agent API 连接失败、无输出或超时，应记录为基础设施失败，不作为项目结论。

信息披露门禁：

- 不把仓库内容、分支名、`git status`、diff、日志、文件片段或绝对路径交给外部 Claude 子 Agent，除非用户明确授权该任务的披露范围。
- 涉及仓库状态或代码内容时，先说明会披露哪些信息，再执行。
- 如果授权被拒绝或安全策略拦截，则由 Codex 本地读取并完成分析，不绕过限制。

工具和命令门禁：

- 需要工具时使用 allowlist，只开放本任务必需的只读命令。
- 默认禁止 `git add`、`commit`、`checkout`、`stash`、`reset`、`merge`、`rebase`、`push`、`clean`、`rm`。
- 写入型任务必须先由 Codex 检查工作区和文件归属，再决定是否让子 Agent 产出建议补丁；实际落地仍由 Codex 控制。
- 本地 API smoke 若会返回 skill catalog、绝对路径或本机元数据，必须先取得用户对披露范围的明确授权。
- 子 Agent 启动 dev server 时必须后台运行、记录 PID、完成 smoke 后只停止自己启动的进程；遇到端口占用时不要杀未知进程，可改用临时端口验证。
- `curl` 成功不等于浏览器集成成功；浏览器验收需要检查 CORS preflight、console 和前端实际状态。

建议执行 lane：

- 自动化验证 lane：只运行 `pnpm test:run`、`pnpm test:server`、`pnpm build` 并报告结果。
- API smoke lane：验证 `health`、`catalog`、`classified`、`recommend` 的状态码、JSON shape 和关键数量。
- 小修复 lane：只处理一个已复现问题，必要时先补红测试，再做最小修复。
- 浏览器验收 lane：由 Codex 主控或受控 GUI agent 执行核心路径、console 和视口检查。
- 文档收口 lane：行为验证后再更新计划、QA、README 或项目说明。

浏览器/视觉验收补充：

- 默认用 Playwright 或等价浏览器工具检查 390x844、768x1024、1440x900。
- 动态 SVG/canvas 控件若标准 click 不稳定，可以使用 DOM 事件或坐标点击完成验证，但必须在 QA 记录中说明。
- Mano-P 这类 GUI-VLA / Computer Use 工具可作为后续视觉验收增强 lane，适合纯视觉控件、复杂 GUI 操作和无稳定 DOM selector 的场景；它不替代测试、API smoke 和 Codex 主控复核。

推荐输出格式：

- `Scope`：子 Agent 负责的问题。
- `Findings`：事实或建议。
- `Evidence`：依据，避免长篇引用。
- `Risk`：不确定性和风险。
- `Next`：建议动作。
