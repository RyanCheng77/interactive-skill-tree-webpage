# Interactive Skill Tree Webpage

Interactive Skill Tree Webpage is a React and Vite prototype for exploring product-development roles, workflow stages, and recommended skills/tools. It helps a project lead move from a loose product problem, such as “不知道用什么 Skill？”, to a structured collaboration path that can be reviewed, exported, and reused.

The current MVP focuses on local, single-user exploration. It does not require a backend, account system, or live AI service.

## Features

- **Local skill graph (v0.2)**: Automatically discovers `SKILL.md` files from local directories, classifies them by role/stage/depth with deterministic rules, and renders them in skill trees without AI or network calls.
- **Cross-platform skill inventory (v0.3)**: Scans Codex, Claude, Trae, Cursor, and shared `.agents` skill surfaces, detects duplicate/conflicting `SKILL.md` assets, generates a sync plan, and can safely create missing writable copies or Cursor bridge rules.
- Goal-first planning view for recommending suitable skills/tools and generating a structured product-development path.
- Process view for browsing stages, role responsibilities, suggested skills/tools, and expected outputs.
- Role view with an interactive skill tree, prerequisites, update states, and skill details.
- Deterministic goal-to-skill recommendations based on local catalog matching.
- Local persistence through `localStorage`.
- Markdown and JSON export for generated plans.

## Tech Stack

- React 18
- Vite 6
- TypeScript
- Tailwind CSS 4
- Vitest
- Radix UI and shadcn/ui-style components

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the full stack (API server + frontend):

```bash
pnpm dev:full
```

Or start individually:

```bash
pnpm dev:api    # API server (default port 3001)
pnpm dev        # Vite frontend (default port 5173)
```

Run tests:

```bash
pnpm test:run     # Frontend tests
pnpm test:server  # API server tests
```

Build for production:

```bash
pnpm build
```

## Project Documentation

- [Current Codex goal](docs/current-goal.md)
- [Project overview](docs/project-overview.md)
- [Project operating model](docs/project-operating-model.md)
- [Roadmap](docs/roadmap.md)
- [Open Design contribution notes](docs/open-design-contribution.md)
- [MVP design spec](docs/superpowers/specs/2026-05-22-product-rd-workbench-mvp-design.md)
- [MVP implementation plan](docs/superpowers/plans/2026-05-22-product-rd-workbench-mvp.md)
- [v0.2 local skill graph plan](docs/superpowers/plans/2026-05-25-local-skill-graph.md)
- [v0.2 local skill graph + AI planner](docs/superpowers/plans/2026-05-25-local-skill-graph-ai-planner.md)
- [v0.2 AI + backend closed-loop plan](docs/superpowers/plans/2026-05-25-ai-backend-closed-loop.md)
- [v0.2 local plan workspace plan](docs/superpowers/plans/2026-05-25-local-plan-workspace.md)
- [v0.2 local skill graph docs](docs/local-skill-graph.md)
- [v0.3 cross-platform skill inventory docs](docs/skill-inventory-management.md)
- [v0.3 QA notes](docs/superpowers/qa/2026-05-27-cross-platform-skill-management-qa.md)
- [v0.2 QA notes](docs/superpowers/qa/2026-05-25-local-skill-graph-qa.md)
- [QA notes](docs/superpowers/qa/2026-05-23-product-rd-workbench-mvp-qa.md)

## Project Skills

- [`oss-pr-review-response`](skills/oss-pr-review-response/SKILL.md): reusable workflow for responding to open-source PR review feedback.

## Attribution

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

## License

This project is released under the [MIT License](LICENSE).
