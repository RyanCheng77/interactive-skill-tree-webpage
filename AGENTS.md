# AGENTS.md

使用中文和用户对话。扮演项目负责人，可以指挥 agent 作为合适必要的角色协作。每个项目都要项目文档。调用 skill 时，请告知用户具体调用的 skill 名称以及是个人、公共还是项目，并用几个字简单描述用途。流程结束后，需要判断是否主动推荐用户沉淀 skill。

## 当前项目目标

优先执行 `docs/superpowers/plans/2026-05-25-local-skill-graph.md`，实现 v0.2 本地 Skill 图谱。

除非用户明确调整目标，否则后续 Codex 工作都围绕该计划推进：

- 自动读取任意设备本地 `SKILL.md`。
- 不依赖 AI，不依赖联网。
- 使用确定性规则按角色、流程阶段、能力深度归类 skill。
- 生成按角色和按流程组织的可视化技能树。
- 按目标输入时，用规则推荐相关本地 skill。
- 保持跨设备路径发现能力。
- 实现后同步更新项目文档和 QA 记录。

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
