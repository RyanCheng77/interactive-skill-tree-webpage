# Project Docs Refresh QA

## Scope

Updated project guidance after the Open Design contribution, `oss-pr-review-response` skill sedimentation, and the user's clarified long-term expectations:

- progressively plan and improve this project,
- keep publishing versioned open-source updates to Git,
- continue improving the version PR'd to Open Design.

## Files Updated

- `AGENTS.md`
- `README.md`
- `docs/current-goal.md`
- `docs/project-overview.md`
- `docs/project-operating-model.md`
- `docs/roadmap.md`
- `docs/superpowers/plans/2026-05-25-local-skill-graph.md`
- `docs/open-design-contribution.md`

## Files Added Earlier In This Flow

- `skills/oss-pr-review-response/SKILL.md`
- `skills/oss-pr-review-response/agents/openai.yaml`
- `docs/superpowers/qa/2026-05-26-oss-pr-review-response-skill.md`

## Validation

- Documentation keeps v0.2 local Skill Graph as the active project goal.
- Open Design contribution is recorded as a completed upstream contribution workflow, not as a replacement goal.
- Project-local `./skills` is documented as a real discovery root.
- `oss-pr-review-response` is documented as the first project-local skill fixture.
- Three long-running tracks are documented: product planning, versioned open-source Git updates, and ongoing Open Design PR maintenance.
- `git diff --check` passed.
- App tests were not run because this change only updates Markdown documentation and project skill metadata.
