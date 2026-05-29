# Project Overview

## Purpose

Interactive Skill Tree Webpage is a local-first workbench for product-development collaboration. It connects goals, workflow stages, roles, and skill/tool recommendations so a project lead can turn a vague product problem into a clearer execution path and understand which Skill to use next.

## Current Scope

The workbench supports four entry points:

- Goal: describe a product-development problem, get suitable skill/tool recommendations, and generate a structured plan.
- Process: inspect each workflow stage, expected outputs, role tasks, and suggested skills/tools.
- Role: inspect role responsibilities and an interactive skill tree with unlock and update states.
- Manage: inspect cross-platform `SKILL.md` inventory, duplicate/conflict status, read-only roots, sync plans, and safe one-click updates.

v0.2 adds a local skill graph: a Node API server discovers `SKILL.md` files from local directories, classifies them by role/stage/depth with deterministic rules, and serves a typed catalog to the frontend. No AI provider or network access is required.

v0.3 adds cross-platform asset management for Codex, Claude, Trae, Cursor, and shared `.agents` skill surfaces. Planning remains read-only; safe apply can create missing files in approved writable roots and Cursor rules without overwriting existing files.

The app currently uses local data and browser storage. It does not include authentication, server persistence, multiplayer collaboration, or live AI model calls.

## Operating Model

The project is managed through three ongoing tracks:

- Product planning: evolve the app from MVP to v0.2 local Skill Graph, then later AI planning, skill sedimentation, and team workflows.
- Open-source release: keep Git, README, roadmap, QA records, and release-facing documentation updated by version.
- Open Design upstream contribution: maintain the Skills Catalog Tree View PR until it is merged, closed, or split into follow-up PRs.

See [Project Operating Model](project-operating-model.md).

## Current Project Assets

The project now includes a project-local skill directory:

- `skills/oss-pr-review-response/SKILL.md`: captures the workflow for responding to open-source PR review feedback, including reading comments, fixing blockers, validating, updating PR descriptions/screenshots, pushing fork branches, and replying to reviewers.

This directory is intentionally aligned with the v0.2 local skill graph discovery plan. It should be treated as a real local skill root, not just documentation.

## Primary Users

- Project leads who need a fast way to organize role collaboration.
- Product, design, engineering, QA, and operations contributors learning a shared process.
- Agent workflow users deciding which skills/tools to invoke for a product-development task.

## Architecture

- `src/app/App.tsx`: top-level state and view routing.
- `src/app/data/workbenchData.ts`: local role, stage, and template data.
- `src/app/components/`: workbench views and UI components.
- `src/app/lib/`: plan generation, export, skill state, local storage helpers, and API client.
- `server/`: Node API server (Hono) for local skill discovery, classification, and recommendation.
- `server/skills/`: skill root resolution, cross-platform adapters, inventory scanning, compatibility checks, sync planning, safe apply, deterministic classifier, and recommender.
- `server/routes/`: health and skills API endpoints.
- `src/styles/`: global styles, theme tokens, fonts, and Tailwind entry points.
- `skills/`: project-local skills that are discovered by the v0.2 local skill graph.
- `docs/superpowers/qa/`: QA and project-progress records for significant changes.

## Current UX Decisions

- Default entry headline is `不知道用什么 Skill？`.
- Role skill trees are expanded by default and can be temporarily collapsed with a `收起` / `展开技能树` control.
- Skill tree connectors use subtle animated flow lines; unexplained fixed connector midpoint markers are intentionally omitted.
- Chinese typography uses `Noto Serif SC` for display text and `Noto Sans SC` for UI copy, with `JetBrains Mono` for metadata and commands.

## Release Readiness

Before publishing a release:

- Run `pnpm test:run`.
- Run `pnpm build`.
- Update `docs/current-goal.md`, `docs/roadmap.md`, and the relevant QA record.
- Review `ATTRIBUTIONS.md` when adding third-party assets or generated design assets.
- Scan for secrets before pushing to a public remote.

## Roadmap Ideas

v0.2 local skill graph is now implemented. v0.3 extends it with cross-platform inventory management, sync planning, and safe one-click apply. See [Local Skill Graph](local-skill-graph.md), [Cross-Platform Skill Inventory Management](skill-inventory-management.md), and [v0.2 QA notes](superpowers/qa/2026-05-25-local-skill-graph-qa.md).

See [Roadmap](roadmap.md) and [v0.2 local skill graph plan](superpowers/plans/2026-05-25-local-skill-graph.md).

The Open Design contribution has also produced a reusable upstream-contribution workflow. See [Open Design Contribution](open-design-contribution.md).

Later candidates:

- Add editable skill classification and skill creation flow.
- Add AI goal planning on top of the local skill graph.
- Add backend plan history, progress, and feedback persistence.
- Add team spaces, permissions, and cloud deployment.
