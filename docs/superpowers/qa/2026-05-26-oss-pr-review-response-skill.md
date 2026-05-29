# OSS PR Review Response Skill QA

## Scope

Added project skill `oss-pr-review-response` to capture the Open Design PR review response workflow used for PR #2987.

## Files

- `skills/oss-pr-review-response/SKILL.md`
- `skills/oss-pr-review-response/agents/openai.yaml`

## Validation

- Confirmed the skill has required `name` and `description` frontmatter.
- Kept the body as an operational checklist with concrete GitHub, validation, screenshot, and response guidance.
- Added UI-facing metadata for the skill catalog.
- 2026-05-28 update: added merge-conflict follow-up guidance after Open Design PR #2987 received a Looper conflict notice.
- 2026-05-28 update: added stale workspace-package `dist` troubleshooting, CI skipped-vs-failed distinction, and no-permission review re-request fallback.

## Notes

This is a project skill because it supports the repository goal of turning local workflow experience into reusable skill assets.
