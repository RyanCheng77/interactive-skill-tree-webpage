---
name: multi-agent-project-collaboration
description: Use when coordinating multiple agents, tools, branches, versions, handoffs, quality gates, browser or visual acceptance, or project status updates in this repository.
metadata:
  short-description: Coordinate multi-agent project work
---

# Multi-Agent Project Collaboration

Use this when the user mentions multiple agents, parallel tools, branch coordination, version management, handoffs, status syncing, merge quality, or cross-agent project hygiene.

## Goals

- Keep `main` runnable.
- Keep each agent's work scoped to one clear deliverable.
- Make status, validation, risks, and next steps visible to the next agent.
- Avoid accidental overwrites of another agent's changes.
- Keep project docs, QA records, and release state aligned with code changes.

## Workflow

1. Inspect coordination state
   - Run `git status --short`.
   - Identify current branch, active plan, touched files, and likely ownership boundaries.
   - Read `AGENTS.md` and `docs/project-operating-model.md` when coordination rules may matter.

2. Choose a work lane
   - Use `main` only as the stable baseline.
   - Use `codex/<topic>` for feature or task branches.
   - Keep one branch focused on one deliverable, such as scanning, classification, graph transform, UI, recommendation, docs, or QA.

3. Slice work for parallel agents
   - Define task owner, files likely touched, expected output, and validation commands.
   - Prefer slices that minimize overlapping edits.
   - If overlap is unavoidable, name the shared files and expected merge order.

4. Maintain shared context
   - Record important status in project docs, not only chat.
   - For handoff notes, include: branch, scope, changed files, validation, blockers, risks, and next step.
   - For important decisions, update the relevant project doc or add a concise decision note.

5. Validate before merge or handoff
   - For functional changes, run the narrowest relevant tests first.
   - Treat agent reports as advisory until the project lead verifies repository state, diff, tests, API behavior, and browser behavior where relevant.
   - At milestone closure, run:

```bash
pnpm test:run
pnpm test:server
pnpm build
```

   - If `pnpm test:server` is not implemented or cannot run, document the reason and when to revisit it.
   - Always state commands run and results in the handoff or final response.
   - Clean up temporary servers, browser sessions, and generated QA artifacts that are not intended project files.

6. Prepare merge summary
   - Scope: what this branch solves.
   - Changed: main files and behavior changed.
   - Tests: commands run and results.
   - Docs: documentation or QA records updated.
   - Risks: known gaps, conflicts, or deferred work.
   - Next: the next safe task for another agent.

## Recommended Task Lanes

- `codex/local-skill-scanner`: local `SKILL.md` discovery and path handling.
- `codex/skill-classifier`: deterministic role, process, and depth classification.
- `codex/skill-graph-transform`: catalog-to-tree data model and transforms.
- `codex/skill-recommendation`: goal input and rules-based skill recommendations.
- `codex/skill-tree-view`: visualization and UI integration.
- `codex/project-docs-qa`: docs, QA records, release notes, and handoffs.

## External Tool Direction

Use this when directing another local tool or agent through Computer Use, such as Trae, Claude, Goose, Kiro, or another IDE agent.

- Before interacting with a GUI tool, verify the visible workspace/project name in the window chrome or left sidebar matches the current target project or repository for this turn. Do not hard-code a single project name into the workflow. If it does not match, stop immediately; do not send prompts, approve commands, or edit agent settings in the wrong project window.
- For Trae CN specifically, check the top-left workspace name before every task dispatch or approval. Treat a window switch away from the current target project as a failed test until the intended project is visible again.
- Send short, single-task instructions. Avoid long multi-stage prompts that mix branch commands, implementation details, and next tasks.
- State the exact stop condition, such as "commit Task 5 + Task 6 checkpoint, then stop".
- Ask the tool to report back branch, commit hash, changed files, validation, and remaining uncommitted files before doing the next step.
- Re-read the tool's interpretation before allowing it to continue. If it adds extra steps, correct it before execution.
- For read-only checks, use an explicit allowlist of commands. Treat every command outside the allowlist as forbidden, even if it is read-only.
- Never phrase forbidden commands as a plain command list without a clear "forbidden" label. Some agents may invert negative instructions into an execution plan.
- If the tool repeats forbidden commands, Task numbers, or next-phase language in its plan, treat the run as failed. Stop or skip the UI action before it executes.
- Treat branch switching, checkout, merge, push, delete, and broad cleanup as high-risk coordination actions. Inspect before approving.
- Treat `stash drop`, `stash push --include-untracked`, `checkout`, `reset`, `merge`, `rebase`, and `push` as approval-only actions. Do not allow an external agent to run them from an inferred plan.
- If the tool starts the wrong action, stop or skip it in the UI first, then verify with `git branch --show-current`, `git log --oneline --decorate -3`, and `git status --short`.
- Use repository state as the source of truth. Do not rely only on the external tool's chat summary.
- Prefer checkpoint commits on the active feature branch over letting the external tool continue into the next task.

## Claude CLI Subagents

Prefer Claude Code CLI subagents for fast, parallel, non-interactive analysis when the user asks to coordinate multiple AI executors.

- Use `claude -p` with `--no-session-persistence` for short-lived subagents.
- Run Claude CLI subagents outside the Codex command sandbox when needed; sandboxed runs may fail API/network access even when interactive Claude Code works in Terminal.
- Start each session with a no-repository smoke test, such as asking for an exact `OK`, before dispatching real work.
- If the default Claude model is unavailable after `cc-switch`, retry once with the default model after the user confirms switching. Do not silently change models unless the user asks.
- Keep prompts short and role-specific: one subagent, one question, one expected output shape.
- Do not give repository content, branch names, `git status`, file excerpts, diffs, logs, or paths to an external Claude subagent unless the user has explicitly approved that disclosure for the task.
- Default Claude subagents to no tools. If tools are needed, allowlist only the narrow commands required for that task.
- For read-only repository checks, state the exact commands allowed and forbid all other commands. If approval is denied or blocked by policy, run the check locally instead and do not route repository state through the subagent.
- Never allow Claude subagents to run write or coordination git commands (`add`, `commit`, `checkout`, `stash`, `reset`, `merge`, `rebase`, `push`, `clean`, `rm`) unless the user explicitly asks for that exact operation and the project lead has reviewed the worktree first.
- Collect all subagent outputs before deciding. Treat subagent results as advisory; Codex remains responsible for final integration, edits, validation, and user-facing conclusions.
- If a subagent hangs, returns API errors, or produces no output, stop that lane and record it as an infrastructure failure, not a project finding.

### Claude CLI Lane Pattern

Use short lanes with explicit command and file boundaries. A lane prompt should include:

- Scope: one deliverable only, such as automated checks, API smoke, small bugfix, CORS regression, or documentation.
- Disclosure: exactly what repository paths, API payloads, local paths, or logs the user has approved sharing.
- Allowed tools: exact command allowlist, for example `pnpm test:run`, `pnpm test:server`, `pnpm build`, `curl`, `sleep`, `kill`, or specific read/edit operations.
- Forbidden tools: always label forbidden commands clearly, including `git add`, `commit`, `checkout`, `stash`, `reset`, `merge`, `rebase`, `push`, `clean`, `rm`, and dependency install commands.
- Stop condition: report and stop after the lane; do not continue into adjacent tasks.
- Report shape: `Scope`, `Files changed`, `Commands`, `Results`, `Failures`, `Risks`, `Remaining`.

Recommended lane sequence for QA-heavy work:

1. Automated checks lane: run `pnpm test:run`, `pnpm test:server`, `pnpm build`.
2. API smoke lane: start or use the local API, `curl` key endpoints, and report response shapes and counts.
3. Small fix lane: handle one verified bug with tests first where practical.
4. Browser acceptance lane: project lead performs or supervises browser/visual QA.
5. Documentation lane: update plans, QA records, and operating notes after behavior is verified.

### Local API And Service Lanes

- Do not let subagents run long-lived dev servers in the foreground. Require background startup, PID capture, short wait, smoke checks, and cleanup.
- Before using a default port, check whether an old process is already listening. If a process was not started by the current lane, do not kill it automatically.
- Prefer alternate ports for clean validation when a default port is occupied, for example API `3002` and frontend `5174`.
- When API responses include local skill metadata or filesystem paths, get explicit user approval before routing results to an external subagent.
- Verify API shape from the project lead side after the subagent reports success. Distinguish project failures from execution-environment failures such as sandbox network isolation or stale services.
- Browser CORS issues must be debugged at the browser boundary: `curl` success does not prove browser integration. Check preflight behavior and console errors.

### Browser And Visual Acceptance

Use browser QA when the changed behavior involves frontend rendering, API integration, responsive layout, visual hierarchy, or interactive controls.

- Start from console and network evidence, not just DOM snapshots.
- Verify the actual user path: load page, switch views, submit input, inspect result, and check detail panels.
- Check target viewports required by the project QA record, typically `390x844`, `768x1024`, and `1440x900`.
- Treat console errors as findings unless they are clearly cosmetic and documented, such as a pre-existing `favicon.ico` 404.
- Animated SVG or canvas controls may be unstable for standard automation clicks. If the project lead uses DOM-dispatched clicks or coordinate clicks, record that as a QA note rather than hiding it.
- Clean up temporary Playwright output directories, browser sessions, and temporary dev servers unless the artifacts are intentionally kept.

### Project Lead Verification Gate

After any subagent lane reports success, the project lead must independently verify:

- `git status --short --branch` to detect unexpected edits.
- `git diff --stat` and targeted diffs for touched files.
- The exact tests or commands that prove the lane's claim.
- Browser/API behavior for integration claims.
- Whether docs and QA records match the verified facts, not just the subagent's summary.

Do not mark a lane complete if:

- The subagent changed files outside its scope.
- It relied on an old service process or stale build without disclosing it.
- It reported a shape different from the implemented API contract.
- It overclaimed untested UI behavior.
- It left temporary servers or generated artifacts behind.

### Visual Agent Candidates

Tools such as Mano-P or other GUI-VLA / Computer Use agents can be added as an optional visual acceptance lane when normal DOM automation is insufficient.

- Use them to complement, not replace, deterministic tests, API smoke, and Playwright checks.
- Best fit: real GUI operation, visual-only controls, dynamic canvas/SVG interactions, and workflows where accessibility selectors are incomplete.
- Keep the same disclosure, allowlist, stop-condition, and project-lead verification rules.
- Do not add a new visual agent to the default lane sequence until it has passed a no-repository smoke test and a bounded repository QA dry run.

## Guardrails

- Do not revert files changed by another agent unless the user explicitly asks.
- Do not mix unrelated refactors into a coordination branch.
- Do not claim a merge is safe without current validation.
- Prefer small, reviewable changes over broad edits across many lanes.
- If two agents touched the same file, inspect both intents before editing.

## Response Shape

When reporting back, keep it concise:

- branch or lane
- scope completed
- files changed
- validation
- docs/QA updated
- remaining coordination risks or recommended next lane
