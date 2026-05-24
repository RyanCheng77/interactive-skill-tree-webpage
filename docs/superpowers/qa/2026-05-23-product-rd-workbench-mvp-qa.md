# Product RD Workbench MVP QA

Date: 2026-05-23
Branch: `codex/product-rd-workbench-mvp`
Latest implementation commit: `ec2f35e`

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
  - update count at role level
  - update badge/ring at skill-node level
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

The implementation preserves the dark forge palette, role colors, `Cinzel` headings, `Crimson Pro` copy, monospace metadata, compact `rounded-lg` panels, and SVG skill-tree pulse motion.

Responsive behavior is implemented in code with single-column mobile layouts, local horizontal scrolling for selectors, and desktop two-column workbench layouts from `lg` breakpoints.

## Manual Visual QA Still Recommended

This environment did not expose a usable browser screenshot/click automation tool. Manual visual QA should still confirm:

- no horizontal page overflow at `390x844`
- recommendation cards stack cleanly on mobile
- result/process/role pages remain readable on mobile
- export buttons trigger downloads in the target browser
- selected and available skill-node pulse animations are visually correct
- updated skill badges are readable for the default `lead` role
