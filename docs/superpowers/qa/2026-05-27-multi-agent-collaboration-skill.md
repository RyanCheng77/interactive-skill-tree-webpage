# QA: Multi-Agent Collaboration Skill

日期：2026-05-27

## 范围

本轮为项目协作规范和项目级 skill 沉淀，不涉及应用运行时代码。

变更内容：

- 在 `AGENTS.md` 增加多 agent 协作要求和触发 project skill 的规则。
- 在 `docs/project-operating-model.md` 增加“多 Agent 协作与版本管理”章节。
- 新增项目 skill `skills/multi-agent-project-collaboration/SKILL.md`。
- 新增 skill UI 元数据 `skills/multi-agent-project-collaboration/agents/openai.yaml`。
- 补充 Claude Code CLI 子 Agent 调度协议，包括 smoke test、非沙箱执行、仓库信息披露授权、工具 allowlist 和失败处理。
- 补充 GUI 工具窗口核验规则：操作 Trae CN 等桌面工具前必须确认窗口项目名匹配本轮目标项目或目标仓库，不能写死某个项目名。

## 验证

- 文档结构检查：新增内容与现有三轨项目模型兼容。
- Skill 结构检查：包含必需的 YAML frontmatter、`name`、`description` 和正文工作流。
- Claude CLI 无仓库内容并发 smoke test：并行拉起 3 个 `claude -p` 子 Agent，分别返回 `A_OK`、`B_OK`、`C_OK`。
- Claude CLI 非沙箱最小 smoke test：`claude -p "Reply only OK. Do not run tools." --no-session-persistence` 返回 `OK`。
- Claude CLI 仓库状态只读测试：未执行；安全审核拦截了向外部子 Agent 披露分支和 `git status` 元数据的尝试。流程已改为需要用户按任务明确授权披露范围。
- OpenCode CLI 排查结果：沙箱内因 `opencode.db` 只读导致 SQLite WAL checkpoint 失败；非沙箱继续报 `no providers found`，当前 `opencode.json` 的 `provider` 为空对象。
- 未运行 `pnpm test:run`、`pnpm test:server`、`pnpm build`，因为本轮没有修改应用代码、构建配置或运行时行为。

## 风险

- 后续若多个 agent 已经在不同分支上工作，需要人工或后续 agent 对齐当前分支状态与这些新增协作规则。
- `pnpm test:server` 是否已实现仍应在功能阶段收口时重新确认。
- Claude 子 Agent 涉及仓库内容时存在外部披露边界；必须先说明披露范围并获取明确授权。
- Trae CN 输入链路可能吞空格或切换项目窗口；后续只适合在确认窗口项目名匹配本轮目标项目后执行短任务。

## 2026-05-27 补充：Task 7 实战经验回写

本次把 v0.2 Task 7 多 agent 验收中的实战经验补回协作流程：

- 在 `skills/multi-agent-project-collaboration/SKILL.md` 增加 Claude CLI lane 模板，要求明确 scope、披露范围、allowlist、forbidden commands、stop condition 和报告格式。
- 增加本地 API / dev server lane 规则：后台启动、记录 PID、只停止自己启动的进程、端口冲突时不要杀未知进程、必要时用临时端口验证。
- 增加浏览器和视觉验收规则：检查 console/network、核心用户路径、三档视口、动态 SVG/canvas 点击不稳定时记录 QA 说明。
- 增加项目负责人复核门禁：子 Agent 成功报告后，必须由 Codex 复核 `git status`、diff、测试、API/browser 行为和文档事实。
- 在 `docs/project-operating-model.md` 同步多 agent 质量门禁、Claude CLI 调度细节、API smoke 注意事项和 Mano-P 类视觉 agent 候选 lane。

### 本次经验来源

- Claude CLI 默认模型配置曾因 `gpt-5.5` 不可用失败；用户通过 `cc-switch` 切换后，按默认模型重试成功。因此流程要求不要静默换模型，除非用户明确要求。
- API smoke 返回本地 skill 元数据和绝对路径，触发披露边界；流程已要求先获得用户对披露范围的明确授权。
- API smoke 首次遇到 3001 旧进程占用；流程已要求不杀未知进程，优先用临时端口做干净验证。
- 浏览器 QA 发现 `curl` 通过但浏览器 CORS preflight 失败；流程已要求浏览器集成不能只靠 curl 判断。
- Playwright 标准 click 对动态 SVG skill 节点不稳定；流程已要求视觉验收记录这类自动化局限。
- Mano-P 被记录为后续视觉验收增强候选：用于复杂 GUI、纯视觉控件和 DOM selector 不稳定场景，但不替代自动化测试、API smoke 和 Codex 主控复核。

### 验证

- 文档结构检查：新增内容分别落在项目 skill 和项目运营模型，未改应用运行时代码。
- 事实一致性检查：新增规则均来自本轮 Task 7 实际调度、CORS 修复、API smoke 和浏览器 QA 过程。
- 未运行 `pnpm test:run`、`pnpm test:server`、`pnpm build`，因为本次只更新流程文档和项目 skill，不改变应用代码或构建配置。
