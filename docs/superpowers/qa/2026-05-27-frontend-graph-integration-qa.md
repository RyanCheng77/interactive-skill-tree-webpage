# QA: Frontend Graph Integration + Goal View Recommendations

日期：2026-05-27

分支：`codex/frontend-graph-integration`

## 范围

覆盖计划 Task 5（Frontend Graph Integration）和 Task 6（Goal View Rule Recommendations）。

## 变更文件

### Task 5 新建文件

- `src/app/lib/apiClient.ts`：前端 API 客户端，定义 `LocalSkill`、`ClassifiedSkill`、`SkillClassification`、`SkillRecommendation` 等类型，封装 `fetchHealth`、`fetchCatalog`、`fetchClassified`、`recommendSkills` 四个 API 函数。
- `src/app/lib/graphTransform.ts`：将后端 `ClassifiedSkill` 数据转换为前端 `Role` 和 `Skill` 格式，按角色分组、按深度映射 tier。

### Task 5 修改文件

- `src/app/types.ts`：新增 `LocalGraphState` 接口，re-export API 类型。
- `src/app/App.tsx`：启动时加载 classified skills，管理 `graphState`（loading/available/warnings），动态选择本地数据或静态演示数据。
- `src/app/components/RoleView.tsx`：新增 `graphAvailable` prop，显示"本地 Skill 图谱"标签。
- `src/app/components/ProcessView.tsx`：显示当前流程阶段对应的本地 Skill 推荐列表。
- `src/app/components/SkillTree.tsx`：本地 Skill 节点添加绿色圆点标识，图例增加"本地 Skill"。
- `src/app/components/SkillDetail.tsx`：显示本地 Skill 的路径、置信度和分类理由。
- `src/app/components/WorkbenchShell.tsx`：minor layout 适配。

### Task 6 修改文件

- `src/app/App.tsx`：新增 `recommendations` 和 `recommending` 状态；`handleGenerate` 改为异步，优先调用 `POST /api/skills/recommend`，失败时保留规则生成方案作为 fallback。
- `src/app/components/GoalView.tsx`：新增 `recommendations`、`recommending`、`graphAvailable` prop；生成按钮支持加载旋转动画；目标输入后显示推荐的本地 Skill 列表，含匹配度、描述和关键词标签。
- `src/app/components/ResultView.tsx`：新增 `recommendations`、`classifiedSkills` prop；生成结果页面底部显示推荐本地技能区域。

### 计划文件

- `docs/superpowers/plans/2026-05-25-local-skill-graph.md`：Task 5 全部 6 步和 Task 6 全部 4 步 checkbox 标记为 `[x]`。

## 验证

### 自动化测试

```bash
pnpm test:run
```

结果：8 个测试文件全部通过，32 个测试用例全部 PASS。

```bash
pnpm build
```

结果：Vite 生产构建成功，无 TypeScript 错误。

### API 集成

- 后端 API（`http://127.0.0.1:3001/api/skills/classified`）启动时自动尝试加载。
- 后端不可用时：前端降级为静态演示数据 + 顶部警告横幅。
- `POST /api/skills/recommend` 调用失败时：静默降级，保留规则生成方案。

### 浏览器 QA

- [ ] 空 skill roots 状态
- [ ] 角色视图本地 skill 树
- [ ] 流程视图本地 skill 推荐
- [ ] Skill 详情本地路径和分类理由
- [ ] 目标视图确定性推荐
- [ ] 390x844、768x1024、1440x900 布局

浏览器 QA 需启动后端 + 前端后手动验证。

## 风险

- `graphTransform.ts` 使用类型断言（`as Skill & { isLocal: ... }`）扩展 Skill 类型，后续应考虑正式的 `LocalSkillNode` 类型。
- Task 5 + Task 6 改动涉及同一组核心文件（`App.tsx`、`GoalView.tsx`、`ResultView.tsx`），若多 agent 并行需注意合并顺序。
- 浏览器 QA 尚未完成，需启动服务后手动验证。
