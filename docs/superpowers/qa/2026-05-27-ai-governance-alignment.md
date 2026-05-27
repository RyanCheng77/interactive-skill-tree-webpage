# QA: AI Governance Alignment

日期：2026-05-27

## 范围

本轮整理仓库治理结构，不涉及应用运行时代码。

变更内容：

- 新增 `CLAUDE.md`，让 Claude Code 进入项目时转向读取 `AGENTS.md`。
- 新增 `.github/copilot-instructions.md`，让 GitHub Copilot 使用同一项目规则入口。
- 新增 `.cursor/rules/project.mdc`，让 Cursor 使用同一项目规则入口。
- 新增 `docs/qa/README.md` 和 `docs/plans/README.md`，作为全局治理模板兼容入口，并指向现有 `docs/superpowers/qa/` 与 `docs/superpowers/plans/`。
- 扩充 `.gitignore`，补充 `output/`、`tmp/`、本地数据库、Python 缓存和 Playwright CLI 临时目录等运行产物忽略规则。

## 验证

- 运行 `~/.ai-governance/scripts/check-ai-governance.sh` 检查基础治理文件。
- 运行 `~/.ai-governance/scripts/final-git-safety-check.sh` 检查 staged 敏感信息；当前无 staged 文件，扫描通过。
- 对当前 changed/untracked 文件列表运行敏感信息扫描，未发现明文 API key、token、私钥或 JWT。
- 运行 `git check-ignore -v` 验证 `.playwright-cli/`、`output/`、`tmp/`、`temp/`、本地数据库、Python 缓存和 debug 文本命中忽略规则。
- 未运行应用测试，因为本轮只修改仓库治理入口、文档兼容入口和忽略规则，没有修改应用行为。

## 风险

- 当前工作区仍有多项既有未提交业务和文档改动；多 agent 并行前仍需按任务分批收口或补充 handoff。
- 本项目当前仍以 `docs/superpowers/*` 作为主要计划和 QA 路径，`docs/qa` 与 `docs/plans` 只是兼容入口。
