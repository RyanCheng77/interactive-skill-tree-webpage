# Product RD Workbench MVP QA

Date: 2026-05-25
Branch: `main`
Current repository baseline: `48d07b5`

## Automated Verification

- `pnpm run test:run`
  - Result: pass
  - Coverage: 4 test files, 18 tests
- `pnpm run build`
  - Result: pass
  - Vite production build completed
- `curl -I http://127.0.0.1:5173/`
  - Result: HTTP 200 from local Vite dev server

## Feature Checklist

- Left workbench navigation contains only: `按目标`, `按流程`, `按角色`.
- Goal entry view includes:
  - AI-style large goal input
  - hero title: `不知道用什么 Skill？`
  - helper copy oriented around recommending the right `skill/tool`
  - `自动规划`
  - `输出：协作路径 + 任务清单`
  - submit action
  - three recommendation cards
  - `换一批`
- Generated result view includes:
  - breadcrumb: `按目标 > 生成结果 > 当前方案`
  - plan header
  - regenerate action
  - Markdown and JSON export actions
  - stage directory and stage detail
  - role tasks, skills, deliverables, input/output, and next stage
- Process view includes:
  - stage selector
  - current-stage workbench
  - feedback entry
  - role tasks, suggested skills, deliverables, input/output, and next stage
- Role view includes:
  - role selector
  - current role workbench
  - feedback entry
  - full skill tree visible by default
  - `收起` / `展开技能树` control for temporary collapse
  - update count at role level
  - update badge at skill-node level
  - update summary and mark-seen action at detail level
- Local persistence includes:
  - active entry mode
  - active role
  - active stage
  - selected skill
  - goal input
  - recommendation batch
  - unlocked skills
  - seen skills
  - generated plan
  - invalid snapshot fallback

## Visual And Responsive Notes

The implementation preserves the dark forge palette, role colors, compact `rounded-lg` panels, and SVG skill-tree pulse motion.

Typography is now optimized for Chinese UI readability:

- Display text and skill names use `Noto Serif SC` / `Source Han Serif SC` fallback stack.
- UI copy, input, and controls use `Noto Sans SC` / `PingFang SC` fallback stack.
- Metadata, command strings, tier labels, and counters use `JetBrains Mono`.

Skill-tree connector motion is present as subtle animated flow lines. The previous fixed midpoint dot on active connectors was removed because it had no clear product meaning.

Responsive behavior is implemented in code with single-column mobile layouts, local horizontal scrolling for selectors, and desktop two-column workbench layouts from `lg` breakpoints.

## Manual Visual QA Still Recommended

This environment did not expose a usable browser screenshot/click automation tool. Manual visual QA should still confirm:

- no horizontal page overflow at `390x844`
- recommendation cards stack cleanly on mobile
- result/process/role pages remain readable on mobile
- export buttons trigger downloads in the target browser
- selected and available skill-node pulse animations are visually correct
- connector flow animation is visible without adding unexplained midpoint markers
- updated skill badges are readable for the default `lead` role
- role skill tree defaults to expanded and the collapse/expand control is understandable

## Documentation Alignment Check

On 2026-05-25 the project documentation was checked against the current implementation.

- `README.md`: present and linked to overview, spec, and QA notes.
- `docs/project-overview.md`: present and aligned with local-only MVP scope.
- `docs/superpowers/specs/2026-05-22-product-rd-workbench-mvp-design.md`: updated to reflect current title, typography, connector animation, and skill-tree collapse behavior.
- `docs/superpowers/plans/2026-05-22-product-rd-workbench-mvp.md`: retained as implementation plan/history. Some embedded early snippets still show intermediate code examples, but the mandatory contract and current spec supersede those snippets.
- `ATTRIBUTIONS.md`, `LICENSE`, `CONTRIBUTING.md`, and `SECURITY.md`: present for open-source release hygiene.
