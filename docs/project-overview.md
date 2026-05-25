# Project Overview

## Purpose

Interactive Skill Tree Webpage is a local-first workbench for product-development collaboration. It connects goals, workflow stages, roles, and skill/tool recommendations so a project lead can turn a vague product problem into a clearer execution path and understand which Skill to use next.

## Current Scope

The MVP supports three entry points:

- Goal: describe a product-development problem, get suitable skill/tool recommendations, and generate a structured plan.
- Process: inspect each workflow stage, expected outputs, role tasks, and suggested skills/tools.
- Role: inspect role responsibilities and an interactive skill tree with unlock and update states.

The app currently uses local data and browser storage only. It does not include authentication, server persistence, multiplayer collaboration, or live AI model calls.

## Primary Users

- Project leads who need a fast way to organize role collaboration.
- Product, design, engineering, QA, and operations contributors learning a shared process.
- Agent workflow users deciding which skills/tools to invoke for a product-development task.

## Architecture

- `src/app/App.tsx`: top-level state and view routing.
- `src/app/data/workbenchData.ts`: local role, stage, and template data.
- `src/app/components/`: workbench views and UI components.
- `src/app/lib/`: plan generation, export, skill state, and local storage helpers.
- `src/styles/`: global styles, theme tokens, fonts, and Tailwind entry points.

## Current UX Decisions

- Default entry headline is `不知道用什么 Skill？`.
- Role skill trees are expanded by default and can be temporarily collapsed with a `收起` / `展开技能树` control.
- Skill tree connectors use subtle animated flow lines; unexplained fixed connector midpoint markers are intentionally omitted.
- Chinese typography uses `Noto Serif SC` for display text and `Noto Sans SC` for UI copy, with `JetBrains Mono` for metadata and commands.

## Release Readiness

Before publishing a release:

- Run `pnpm test:run`.
- Run `pnpm build`.
- Review `ATTRIBUTIONS.md` when adding third-party assets or generated design assets.
- Scan for secrets before pushing to a public remote.

## Roadmap Ideas

- Replace rule-based local planning with configurable AI-backed generation.
- Add editable templates for roles, stages, and skills.
- Add import/export for full workbench configuration.
- Add optional backend persistence for teams.
