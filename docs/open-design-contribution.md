# Open Design Contribution

## Status

As of 2026-05-29, the Open Design contribution branch still reflects the latest validated follow-up on top of upstream `main`, and the PR is waiting on remaining review gates rather than code changes:

- PR: `nexu-io/open-design#2987`
- Title: `Add skills catalog tree view`
- Head branch: `RyanCheng77:codex/skill-catalog-tree`
- Latest PR head: `afa615a0 Validate skills catalog response entries`
- Engineering review: Looper / `nettee` approved the current head `afa615a0` and reported no additional actionable problems.
- Product review: `elihahah666` approved the feature overall, then requested one product adjustment before merge: keep both `SkillTree` and `ListView`, but make `ListView` the default entry presentation.
- Response: pushed `c41fc2b4` to make `ListView` the initial view while preserving the switchable tree view, with updated web regression tests.
- Follow-up response: `nettee` requested a distinct CLI contract error for malformed successful `/api/skills` responses. Pushed `6b5d573c` so `od skills tree` reports `daemon-protocol-error` with exit code 74 instead of `daemon-not-running`.
- Latest reviewer comment: `nettee` flagged a non-blocking ListView UX copy mismatch after the default view changed to `ListView`: the empty detail panel still said "Select a skill node to inspect it."
- Latest response: pushed `1d8ca34b` so `SkillListView` uses list-specific empty detail copy while `SkillTreeGraph` keeps node-specific copy. Replied in the inline review thread.
- Merge-conflict response: Looper paused review because the PR conflicted with `main`. Merged `origin/main`, resolved the single manual conflict in `apps/daemon/src/cli.ts`, preserved both the Skills tree CLI contract path and upstream desktop auth/import structured errors, then pushed `e9112c81`.
- PR replies: posted the merge-conflict resolution and validation summary at `https://github.com/nexu-io/open-design/pull/2987#issuecomment-4563056941`, then followed up with `@nettee` after CI went green at `https://github.com/nexu-io/open-design/pull/2987#issuecomment-4563118087`.
- Latest reviewer comment: after `e9112c81`, `nettee` requested one more blocking contract-safety fix: malformed entries inside a successful `/api/skills` array should not crash the shared skills catalog builder or bypass explicit failure states.
- Latest response: pushed `afa615a0` with shared `parseSkillSummaries()` runtime validation in `@open-design/contracts`, wired it into Web `fetchSkills()` and CLI `od skills tree`, and added contracts, CLI, and Integrations tab regressions. Replied at `https://github.com/nexu-io/open-design/pull/2987#issuecomment-4563428714`.
- Latest review: `nettee` re-checked `afa615a0` and approved it, explicitly confirming the `parseSkillSummaries` contract, `od skills tree` protocol-failure path, and Skills tab default list/error states are clean.
- Latest PR reply: posted a concise status note at `https://github.com/nexu-io/open-design/pull/2987#issuecomment-4563898137`, confirming engineering review and CI are green and asking product reviewers to flag any remaining product-review work before merge.
- Latest maintainer reply: `lefarcen` confirmed on 2026-05-27 that there was nothing else for the author to address from the engineering side, and later nudged the remaining product review gate.
- CI: all current checks are green on `afa615a0`; `Runtime trace` is skipped by scoped CI behavior.
- Verified current PR state on 2026-05-29: `OPEN`, `mergeable=MERGEABLE`, `mergeStateStatus=BLOCKED`, latest head commit still `afa615a0`.
- Remaining state: no new actionable reviewer feedback, CI failure, or merge conflict is present. GitHub still shows pending review requests as the merge gate; the current `gh pr view` response includes `Eli-tangerine`, `elihahah666`, and `nettee` in `reviewRequests` even though `nettee` already approved `afa615a0`, so the gate appears to be review-state metadata rather than code readiness. No current code or test action is pending from the author side.

## What Was Contributed

The PR contributes a focused Skills Catalog Tree View to Open Design:

- Integrations -> Skills tab now exposes a skills catalog instead of a placeholder.
- Tree/List view toggle.
- List view as the default entry point.
- Tree view grouped by mode and scenario and still available through the view toggle.
- XMind-style tree connectors with selectable leaf skill nodes.
- Read-only list view using the same filtered result set.
- Facet filters for mode, scenario, category, platform, preview type, and design-system requirement.
- Dedicated `/api/skills` load failure UI.
- Shared deterministic tree builder for Web and CLI usage.
- CLI `od skills tree --json`.
- i18n keys and regression tests.

## Review Lessons

Review feedback surfaced several reusable contribution practices:

- Treat API load failure, empty catalog, and filtered-empty states as separate UX states.
- CLI automation surfaces must fail fast on malformed successful responses.
- CLI help paths should not require a running daemon.
- Plain documented commands must remain functional when no optional flags are passed.
- Malformed successful daemon responses should use protocol/contract error codes, not daemon availability error codes.
- Do not stop at container-level payload checks; if a shared builder consumes array entries, validate each entry before building UI/CLI derived structures.
- After large upstream merges, rebuild stale local workspace package `dist` outputs before interpreting failures from package exports.
- Merge conflicts in shared CLI files need an impact check across both feature paths and newly merged upstream behavior; in this case `daemon-protocol-error`, `desktop-auth-pending`, and `desktop-import-token-rejected` all needed to survive the resolution.
- UI labels introduced in a localized surface must use i18n keys, including diagram legends and guide labels.
- PR bodies should keep the repository's standard checklist wording because release/review tooling may parse it.
- Screenshots should show the entry point where users discover the feature, not only the isolated component.
- Product reviewers may prefer the scannable list as the default even when the feature's structural tree view remains the headline capability.
- Default-view UX copy must match the active interaction model; list views should talk about rows, while tree views can talk about nodes.

## Project Impact

This contribution does not replace the local Skill Graph roadmap. It strengthens it in two ways:

- It validated the tree/list/filter interaction model against another real codebase.
- It produced the project skill `skills/oss-pr-review-response/SKILL.md`, which is now a real local skill fixture for v0.2 scanning.

## Follow-up

This PR remains an active upstream-maintenance track until it is merged, closed, or explicitly split by maintainers.

Continue to:

- check review comments, conversations, CI, and mergeability,
- reply to maintainers with concise evidence and validation,
- push small follow-up commits only when there is actionable feedback,
- update screenshots or PR descriptions when UI behavior changes,
- record merge outcome or follow-up PR candidates after the upstream decision.

When continuing this project, use the Open Design work as a reference for:

- deterministic tree builders,
- shared Web/CLI data contracts,
- empty/error state separation,
- reviewer-friendly PR hygiene,
- and project skill sedimentation after meaningful workflows.
