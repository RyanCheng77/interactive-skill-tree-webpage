# Claude Code Handoff: v0.2 Local Skill Graph Task 7

日期：2026-05-27

## Scope

请执行 v0.2 本地 Skill 图谱的 Task 7：QA 与文档收口。不要扩大到 AI 规划、GitHub 候选、后端方案历史、多用户协作或云端部署。

主计划：

`docs/superpowers/plans/2026-05-25-local-skill-graph.md`

## Current State

当前分支：

`codex/frontend-graph-integration`

已完成：

- Task 1：API skeleton and root discovery。
- Task 2：Local skill catalog scanner。
- Task 3：Deterministic classification。
- Task 4：Deterministic goal recommendation。
- Task 5：Frontend graph integration。
- Task 6：Goal view rule recommendations。

待完成：

- Task 7：QA and Documentation。

当前已有 QA 记录：

- `docs/superpowers/qa/2026-05-27-frontend-graph-integration-qa.md`

该记录说明 Task 5/6 自动化验证已通过，但浏览器 QA 尚未完成。

## Expected Work

1. 阅读以下文件，确认当前目标和边界：
   - `AGENTS.md`
   - `docs/current-goal.md`
   - `docs/project-operating-model.md`
   - `docs/superpowers/plans/2026-05-25-local-skill-graph.md`
   - `docs/superpowers/qa/2026-05-27-frontend-graph-integration-qa.md`

2. 完成或补充文档：
   - 新建或更新 `docs/local-skill-graph.md`
   - 新建或更新 `docs/superpowers/qa/2026-05-25-local-skill-graph-qa.md`
   - 必要时更新 `README.md`、`docs/project-overview.md`、`docs/roadmap.md`

3. 运行验证：
   - `pnpm test:run`
   - `pnpm test:server`
   - `pnpm build`

4. 启动服务并做 API smoke：
   - `pnpm dev:api`
   - `curl -s http://127.0.0.1:3001/api/health`
   - `curl -s http://127.0.0.1:3001/api/skills/catalog`
   - `curl -s http://127.0.0.1:3001/api/skills/classified`

5. 浏览器 QA：
   - 启动后端和前端。
   - 验证空 skill roots 状态。
   - 验证角色视图本地 skill 树。
   - 验证流程视图本地 skill 推荐。
   - 验证 Skill 详情本地路径和分类理由。
   - 验证目标视图确定性推荐。
   - 检查 390x844、768x1024、1440x900 布局。

6. 风险审查：
   - 检查 `src/app/App.tsx` 是否仍有硬编码 `http://127.0.0.1:3001`；若有，建议改用 `src/app/lib/apiClient.ts`。
   - 检查 `src/app/lib/graphTransform.ts` 的本地 skill 类型扩展是否需要正式类型化。
   - 检查目标推荐分数展示是否合理，例如不要把 `score * 100` 渲染成夸张百分比。

## Guardrails

- 不要引入 AI。
- 不要引入 GitHub 搜索。
- 不要自动安装或执行任何外部 skill。
- 不要做云端部署。
- 不要改动 Open Design 上游 PR。
- 不要运行 `git reset`、`git checkout`、`git clean`、`git stash drop`、`git push`。
- 不要提交或合并，除非项目负责人另行授权。

## Stop Condition

完成 Task 7 收口后停止，并报告：

- branch
- changed files
- validation commands and results
- browser QA result
- docs updated
- risks found
- remaining uncommitted files

如果遇到环境问题，例如 Claude Code 无法启动浏览器、API 端口被占用、依赖缺失，请记录阻塞点，不要绕过安全限制。
