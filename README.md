# Interactive Skill Tree Webpage

Interactive Skill Tree Webpage is a React and Vite prototype for exploring product-development roles, workflow stages, and recommended skills/tools. It helps a project lead move from a loose product problem, such as “不知道用什么 Skill？”, to a structured collaboration path that can be reviewed, exported, and reused.

The current MVP focuses on local, single-user exploration. It does not require a backend, account system, or live AI service.

## Features

- Goal-first planning view for recommending suitable skills/tools and generating a structured product-development path.
- Process view for browsing stages, role responsibilities, suggested skills/tools, and expected outputs.
- Role view with an interactive skill tree, prerequisites, update states, and skill details.
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

Start the development server:

```bash
pnpm dev
```

Run tests:

```bash
pnpm test:run
```

Build for production:

```bash
pnpm build
```

## Project Documentation

- [Current Codex goal](docs/current-goal.md)
- [Project overview](docs/project-overview.md)
- [Roadmap](docs/roadmap.md)
- [MVP design spec](docs/superpowers/specs/2026-05-22-product-rd-workbench-mvp-design.md)
- [MVP implementation plan](docs/superpowers/plans/2026-05-22-product-rd-workbench-mvp.md)
- [v0.2 local skill graph plan](docs/superpowers/plans/2026-05-25-local-skill-graph.md)
- [v0.2 local skill graph + AI planner](docs/superpowers/plans/2026-05-25-local-skill-graph-ai-planner.md)
- [v0.2 AI + backend closed-loop plan](docs/superpowers/plans/2026-05-25-ai-backend-closed-loop.md)
- [v0.2 local plan workspace plan](docs/superpowers/plans/2026-05-25-local-plan-workspace.md)
- [QA notes](docs/superpowers/qa/2026-05-23-product-rd-workbench-mvp-qa.md)

## Attribution

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

## License

This project is released under the [MIT License](LICENSE).
