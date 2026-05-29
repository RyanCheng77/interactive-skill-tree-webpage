# v0.3 Cross-Platform Skill Management QA

Date: 2026-05-27

## Scope

Validated the first v0.3 implementation of cross-platform skill inventory management:

- Platform adapters for Codex, Claude, Trae, Cursor, and shared `.agents`.
- Canonical inventory grouped by `name + contentSha256`.
- Platform compatibility statuses.
- Sync plan actions and safe one-click apply.
- Frontend `管理` workbench entry and summary helpers.

Follow-up decision-support pass:

- Role and process decision filters on the management page.
- Deterministic inventory classification reused from the local skill graph.
- Beginner-facing `检查更新` / `安全补齐` copy that explains the action before the implementation detail.

## Automated Checks

Safe apply follow-up:

```bash
pnpm vitest run server/test/skillInventory.test.ts
```

Result: PASS. 1 file, 6 tests. Covered safe apply creating missing `SKILL.md` targets, creating Cursor bridge rules, skipping read-only/manual actions, and never overwriting existing target files.

```bash
pnpm vitest run src/app/components/SkillManagementView.test.tsx
```

Result: PASS. 1 file, 7 tests. Covered safe apply controls and result summary in the management panel.

Follow-up refresh loading and empty states:

```bash
pnpm vitest run src/app/components/SkillManagementView.test.tsx src/app/lib/skillManagement.test.ts
```

Result: PASS. 2 files, 13 tests. Covered structured skeleton loading, retryable API failure, true empty inventory, search/filter no-results, sync-plan progress/warnings, pagination controls, and pagination helper behavior.

```bash
pnpm build
```

Result: PASS. Vite production build completed.

State-matrix follow-up after management-page audit:

```bash
pnpm vitest run src/app/components/SkillManagementView.test.tsx src/app/lib/skillManagement.test.ts
```

Result: PASS. 2 files, 13 tests. Reconfirmed retryable API failure, skeleton loading, true empty state, no-results state, sync-plan progress, warning surfacing, and pagination.

```bash
pnpm test:server
```

Result: PASS. 6 files, 21 tests.

```bash
pnpm test:run
```

Result: PASS. 13 files, 57 tests.

```bash
pnpm build
```

Result: PASS. Vite production build completed.

Follow-up skill-list pagination:

```bash
pnpm vitest run src/app/lib/skillManagement.test.ts src/app/components/SkillManagementView.test.tsx
```

Result: PASS. 2 files, 8 tests. Covered pagination metadata, page clamping, empty list behavior, and server-rendered management view pagination controls.

```bash
pnpm build
```

Result: PASS. Vite production build completed.

Decision-support follow-up:

```bash
pnpm vitest run server/test/skillInventory.test.ts src/app/lib/skillManagement.test.ts src/app/components/SkillManagementView.test.tsx
```

Result: PASS. 3 files, 24 tests. Covered inventory classification, role/process decision buckets, `role:*` and `stage:*` filtering, and the management page's role/process decision panels plus simplified sync wording.

```bash
pnpm test:server
pnpm test:run
pnpm build
```

Result: PASS. `test:server` covered 6 files and 24 tests. `test:run` covered 13 files and 64 tests. Production build completed.

Temporary API smoke:

```bash
API_PORT=3012 pnpm dev:api
curl -fsS http://127.0.0.1:3012/api/skills/inventory
```

Result: PASS. The local inventory response returned canonical items with `classification` populated; the first sampled item included role and stage IDs. The temporary API and Vite dev servers were stopped after the check.

Follow-up interactive management fix:

```bash
pnpm vitest run src/app/lib/skillManagement.test.ts
```

Result: PASS. 1 file, 5 tests. Covered clickable filter counts, full inventory filtering, search, and sync-plan action filtering.

```bash
pnpm test:server
```

Result: PASS. 6 files, 21 tests.

```bash
pnpm test:run
```

Result: PASS. 12 files, 49 tests.

```bash
pnpm build
```

Result: PASS. Vite production build completed.

Original v0.3 implementation checks:

```bash
pnpm test:server server/test/skillInventory.test.ts
```

Result: PASS. Vitest ran all server tests: 6 files, 21 tests.

```bash
pnpm test:run src/app/lib/skillManagement.test.ts src/app/lib/storage.test.ts
```

Result: PASS. 2 files, 10 tests.

```bash
pnpm build
```

Result: PASS. Vite production build completed.

```bash
API_PORT=3004 VITE_API_BASE_URL=http://127.0.0.1:3004 pnpm exec concurrently "pnpm dev:api" "pnpm dev -- --host 127.0.0.1 --port 5174"
curl -fsS http://127.0.0.1:3004/api/skills/inventory
curl -fsS http://127.0.0.1:3004/api/skills/compatibility
curl -fsS -X POST http://127.0.0.1:3004/api/skills/sync-plan -H 'Content-Type: application/json' -d '{}'
curl -fsS http://127.0.0.1:5173
```

Result: PASS. Temporary local run returned JSON for all v0.3 endpoints and served the Vite page. The Vite command ignored the requested `5174` port because of the package script invocation and served on `5173` in this run.

## Covered Scenarios

- Trae builtin roots are read-only scan roots and not sync targets.
- Cursor project rules are represented as a bridge target, not included as `SKILL.md` catalog items.
- Same-name same-content skills are grouped as duplicates.
- Same-name different-content skills are marked as conflicts.
- Sync plans include `copy-to-target`, `convert-to-cursor-rule`, `skip-readonly-source`, and `manual-review-conflict` as applicable.
- Sync planning does not create target files; `sync-apply` performs the constrained write step.
- Safe apply creates only missing writable `SKILL.md` copies and missing Cursor bridge rules.
- Safe apply skips existing targets, conflicts, read-only sources, and symlink actions.
- `manage` is accepted as a persisted workbench mode.
- Management summary cards are actionable filters.
- The management header has a `刷新资产` action, and refresh clears stale sync plans while showing a structured skeleton loading state.
- API failure renders a retryable `重新连接并刷新` state with `刷新资产`.
- Empty inventory renders a guided empty state with a refresh action and standard scan-root hints.
- Search/filter no-results renders a distinct `没有匹配的 Skill` state instead of the empty inventory message.
- The canonical Skill list is paginated at 24 items per page with first, previous, numbered, next, and last page controls.
- Canonical skill rows open a detail panel with occurrence paths and platform statuses.
- Skill inventory is searchable by name, path, platform, tags, and hash.
- Dry-run update actions are no longer capped at the first 20 results and can be filtered by action type.
- Sync-plan generation is framed as checking which skills can be safely filled, and sync-plan warnings are visible in the update panel.
- Safe update now reads as `检查更新` / `安全补齐`, and result counts are framed as filled/skipped/needs-review.
- The management page exposes role and process decision filters so non-technical users can judge what to do before acting.

## Browser QA

The `管理` view was inspected in the in-app browser at:

- 390x844
- 768x1024
- 1440x900

Result: PASS. `documentElement.scrollWidth` stayed equal to `clientWidth` at each size, so no horizontal overflow was detected. Long local paths wrapped inside list rows and detail cards.

Interactive browser checks:

- Clicked `Skill 367`; the list changed from `80 / 367` to `367 / 367`.
- Clicked `一键更新预案`; the UI generated `1039` dry-run actions.
- Clicked the Cursor bridge action filter; the action queue filtered successfully.
- Reopened the current dev page at `http://localhost:5174/` after the state-matrix follow-up.
- Confirmed the `管理` page loads 367 canonical skills with 24-per-page pagination.
- Confirmed `一键更新预案` shows `正在生成更新预案`, then renders `1039` dry-run actions and visible `预案警告`.
- Searched `not-in-inventory` and confirmed the distinct `没有匹配的 Skill` state with `清除筛选`.

## Current Manual QA Gap

The local app is currently reachable in Chrome at `http://localhost:5174/`. During this run, `pnpm dev:full` could not claim API port `3001` because another local API process was already using it, but that existing API served the inventory data used by the browser checks.

## Final Wrap Verification

Date: 2026-05-28

```bash
pnpm test:run
pnpm test:server
pnpm build
```

Result: PASS. `test:run` covered 13 files and 57 tests. `test:server` covered 6 files and 21 tests. Production build completed.

Fresh local API smoke used a temporary API port to avoid interfering with existing services:

```bash
API_PORT=3011 pnpm dev:api
```

Checked:

- `GET /api/skills/catalog`
- `GET /api/skills/classified`
- `GET /api/skills/inventory`
- `GET /api/skills/compatibility`
- `POST /api/skills/sync-plan`
- `POST /api/skills/sync-apply`

Result: PASS. The local machine returned 368 catalog/classified/inventory items, 5 compatibility platforms, and 1045 dry-run sync actions. These counts are environment-dependent because the feature scans local skill roots; future QA should treat response shape, safety behavior, and UI states as stable assertions, while exact counts may vary by machine.
