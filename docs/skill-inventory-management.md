# Cross-Platform Skill Inventory Management (v0.3)

v0.3 extends the local Skill graph into an asset management workbench. It scans standard `SKILL.md` directories across AI tools, groups duplicate copies by content hash, detects same-name conflicts, classifies each canonical skill by role and process stage, generates a sync plan, and can safely fill missing writable targets.

This feature still runs locally. It does not call AI services and does not access the network. Safe apply mode only creates missing files in approved writable targets; it never overwrites existing files and never writes to read-only roots.

## Platforms

The management layer tracks five platform adapters:

| Platform | Native `SKILL.md` | Scanned Roots | Sync Target |
| --- | --- | --- | --- |
| Codex | yes | `~/.codex/skills` | yes |
| Claude | yes | `~/.claude/skills`, `./.claude/skills`, `~/.claude/.agents/skills`, `~/.claude/plugins/cache` | user roots only |
| Trae | yes for builtin skills | `~/.trae/builtin_skills`, `~/.trae-cn/builtin_skills` | no |
| Cursor | no | `./.cursor/rules` | bridge plan only |
| Shared agents | yes | `./skills`, `~/.agents/skills` | user root only |

Claude plugin cache and Trae builtin roots are marked read-only. They can appear in inventory and duplicate detection, but sync plans never write back to those roots.

Cursor is treated as a rule bridge target. The system does not include `.cursor/rules` files in the `SKILL.md` catalog; it reports whether a skill needs a `convert-to-cursor-rule` action and can create a missing Cursor rule bridge file during safe apply.

## Data Model

- `SkillOccurrence`: one discovered `SKILL.md` file with platform, source type, path, mtime, read-only flag, and `contentSha256`.
- `SkillInventoryItem`: canonical group keyed by `name + contentSha256`, with all matching occurrences and a deterministic decision profile (`roleIds`, `stageIds`, `depth`, `confidence`, `reason`).
- `PlatformCompatibility`: per-platform state for an inventory item: `recognized`, `missing`, `duplicate`, `conflict`, `readonly-source`, or `bridge-required`.
- `SyncPlanAction`: recommendation: `copy-to-target`, `link-to-target`, `convert-to-cursor-rule`, `skip-readonly-source`, or `manual-review-conflict`.
- `SkillSyncApplyResult`: safe apply result with created, skipped, error, and warning entries.

## API

```bash
GET  /api/skills/inventory
GET  /api/skills/compatibility
POST /api/skills/sync-plan
POST /api/skills/sync-apply
```

The v0.2 endpoints (`catalog`, `classified`, `recommend`) now use the canonical inventory list so role/process views avoid showing every duplicate copy as a separate skill.

## Frontend

The left navigation adds a fourth entry, `管理`.

The management view shows:

- Clickable total canonical skill, duplicate, conflict, read-only, and Cursor bridge counts.
- Role decision filters for product, design, frontend, backend, QA, ops, docs, and project lead viewpoints.
- Process decision filters for discovery, requirements, design, development, testing, release, and retro viewpoints.
- A refresh action with a structured skeleton loading state while local roots are rescanned.
- A retryable API failure state when the local management service is unavailable.
- Platform compatibility cards for Codex, Claude, Trae, Cursor, and `.agents`.
- A searchable paginated canonical skill list, currently 24 items per page.
- A clear empty state when no standard `SKILL.md` files are found.
- A distinct no-results state when search text or status filters match no existing skills.
- A selected skill detail panel with classification reason, confidence, source occurrences, read-only markers, and per-platform compatibility.
- Scanned roots with missing/read-only markers.
- A beginner-facing `检查更新` / `安全补齐` flow. The wording emphasizes “only fills missing files” instead of exposing sync internals first.
- A safe apply button after a check is generated. It executes copy and Cursor bridge actions only when the target file does not already exist.
- Apply-result summaries for filled, skipped, and needs-review actions.
- Sync-plan warnings surfaced in the update panel instead of only being stored in API data.
- Sync-plan action filters for copy, link, Cursor bridge, read-only skip, and manual conflict review.

## Safety

- Safe apply only creates missing files for `copy-to-target` and `convert-to-cursor-rule`.
- No overwrites, deletes, or automatic conflict resolution.
- Symlink actions remain plan-only in v0.3; the UI uses copy strategy.
- Read-only roots are explicitly labeled and skipped by sync planning.
- Same-name different-content skills become `manual-review-conflict` actions.
- Paths are displayed locally for debugging but not sent outside localhost.

## Known Limitations

- Trae user-writable custom skill roots are not assumed in v0.3; only builtin roots are scanned.
- Safe fill intentionally skips existing files, conflicts, read-only roots, and symlink actions.
- There is no file watcher or incremental cache yet.
- Conflict resolution remains manual.
