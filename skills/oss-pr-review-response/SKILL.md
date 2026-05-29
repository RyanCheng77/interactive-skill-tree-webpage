---
name: oss-pr-review-response
description: Use when responding to review feedback on an open-source GitHub pull request: inspect reviewer comments and CI, classify blockers, implement focused fixes, validate locally, push updates to a fork branch, update the PR body/screenshots, and reply to reviewers.
metadata:
  short-description: Handle open-source PR review feedback
---

# OSS PR Review Response

Use this when a user asks to handle feedback on an open-source PR, especially when they are unsure what reviewers want or need help updating the PR.

## Workflow

1. Confirm context
   - Identify the repo, PR URL/number, local worktree, current branch, fork remote, and upstream remote.
   - Run `git status --short` before changing anything.
   - Verify auth with `gh auth status` when GitHub writes are needed.

2. Read the review
   - Use `gh pr view <pr> --json latestReviews,comments,reviews,statusCheckRollup,commits,url`.
   - If the user asks what reviewers said, summarize blockers first, then non-blocking asks.
   - Translate reviewer asks into concrete tasks: code, tests, docs, screenshots, PR body, or CI.
   - Treat bot conflict notices as actionable review feedback: confirm mergeability, merge or rebase onto upstream `main`, resolve conflicts, and push the updated fork branch.

3. Plan the smallest response
   - Keep the PR focused on reviewer feedback.
   - Do not mix unrelated refactors, dependency upgrades, or formatting churn.
   - Preserve user changes and existing commits unless the user explicitly asks to rewrite history.

4. Implement fixes
   - Fix blocking issues first.
   - Add regression tests for every reviewer-identified behavior bug.
   - Prefer a follow-up commit over amending once a PR is already reviewed, unless the project prefers a clean single commit.
   - If a CLI/API path must reject malformed data, assert both non-zero/failure behavior and error shape.
   - When a shared Web/CLI builder consumes API arrays, validate every array entry with a shared runtime parser before building derived UI/CLI structures; container-only checks like `Array.isArray()` can still allow malformed records to crash later.
   - If a UI path fails to load data, show a dedicated error state rather than reusing empty/search states.

5. Validate
   - Run the narrowest relevant tests first.
   - Then run required project checks from the PR template or reviewer comments.
   - Always run `git diff --check`.
   - If a command accidentally runs a broad suite with unrelated failures, stop it if needed and rerun a precise command. Record the unrelated failure clearly.
   - After merging upstream `main`, run impact checks for both sides of each conflict: the PR behavior and the newly merged upstream behavior must both survive.
   - If tests or typecheck fail on missing workspace-package exports after a large merge, check whether local `dist` outputs are stale before treating it as a code regression. Rebuild the affected workspace packages, then rerun the failing command.

6. Update PR materials
   - Fill PR body sections reviewers requested: Why, What users will see, Surface area, Validation, and Screenshots.
   - For screenshots, prefer page-scoped browser screenshots. Avoid full-screen captures that may expose unrelated private content.
   - Do not add screenshots to the feature PR diff unless the project expects that. Use release artifacts, GitHub uploads, or a separate image-hosting branch if needed.

7. Push and reply
   - Push to the fork branch that backs the PR.
   - Comment with a concise response: what changed, which commit addressed it, what validation ran, and any known caveats.
   - Re-check CI after push. If checks are pending, say they are pending; if they fail, inspect logs before claiming success.
   - If the account cannot formally re-request review in the upstream repo, leave a short tagged comment explaining the new head, CI status, and permission limitation.
   - Do not claim a change request is cleared until the reviewer, bot, or GitHub review decision updates on the new head.

## Merge Conflict Follow-up

When a reviewer or bot pauses review because the PR conflicts with `main`:

1. Fetch the upstream branch and inspect the current PR head.
2. Merge or rebase according to project preference; for already-reviewed fork PRs, prefer a normal merge commit unless maintainers asked for history cleanup.
3. Resolve only the conflicted files. Preserve unrelated user or upstream changes.
4. Check for conflict markers and unmerged paths.
5. Run targeted tests for every behavior touched by the conflict, then typecheck and `git diff --check`.
6. Push the updated fork branch and reply with the merge commit, conflicted files, conflict-resolution decision, validation, and CI state.

Conflict-resolution replies should say what was preserved from both sides. Example: "Resolved the `apps/daemon/src/cli.ts` conflict by keeping the PR's CLI protocol error handling and upstream's desktop auth/import structured errors."

## Validation Gotchas

- Workspace-package `dist` directories can be stale after merging upstream. If a child process imports a package export that exists in `src` but not `dist`, rebuild that package before debugging product logic.
- A command that unexpectedly runs a broader suite can still be useful if it passes; report the actual scope that ran.
- Some CI jobs are intentionally skipped by change-scope rules. Distinguish skipped-by-design checks from failures.
- GitHub may continue to show `CHANGES_REQUESTED` after the code is fixed until the reviewer re-reviews the new head.

## Command Patterns

```bash
gh pr view <number> --repo <owner/repo> --json url,title,reviewDecision,latestReviews,comments,statusCheckRollup,commits
git status --short
git log --oneline -5
git diff --check
gh pr edit <number> --repo <owner/repo> --body-file /path/to/pr-body.md
gh pr checks <number> --repo <owner/repo>
gh pr comment <number> --repo <owner/repo> --body "Pushed <sha> to address ..."
```

When pushing to a fork, prefer the explicit fork remote:

```bash
git fetch origin main
git merge origin/main --no-edit
git diff --name-only --diff-filter=U
git push fork <branch>
```

## Response Shape

When reporting back to the user, keep it practical:

- PR link
- commits pushed
- reviewer items addressed
- validation results
- remaining state, such as pending CI or awaiting reviewer re-review

Do not say the review is resolved until the reviewer or automation has re-reviewed or the review decision changes.
