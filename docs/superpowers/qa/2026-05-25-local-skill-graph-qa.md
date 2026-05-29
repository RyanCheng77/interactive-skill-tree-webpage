# Local Skill Graph v0.2 QA

Date: 2026-05-27
Branch: `codex/frontend-graph-integration`
Plan: `docs/superpowers/plans/2026-05-25-local-skill-graph.md`

## Automated Verification

### Frontend Tests

```bash
pnpm test:run
```

**Result: PASS** — 10 test files, 39 tests passed.

### Server Tests

```bash
pnpm test:server
```

**Result: PASS** — 5 test files, 17 tests passed.

### Production Build

```bash
pnpm build
```

**Result: PASS** — Vite production build completed without errors.

## API Smoke Test

API server running on port 3002 (see known issues below for port choice).

### Health

```bash
curl -s http://127.0.0.1:3002/api/health
```

**Result: 200** — Returned `{"ok":true,"service":"skill-workbench-api"}` with discovered skill roots.

### Catalog

```bash
curl -s http://127.0.0.1:3002/api/skills/catalog
```

**Result: 200** — Returned 167 skills from local `~/.codex/skills` root. Each skill includes `id`, `name`, `description`, `path`, `root`, `bodySummary`, `tags`.

### Classified

```bash
curl -s http://127.0.0.1:3002/api/skills/classified
```

**Result: 200** — Returned 167 skills with deterministic `roleIds`, `stageIds`, `depth`, `confidence`, and `reason` classifications.

### Recommend

```bash
curl -s -X POST http://127.0.0.1:3002/api/skills/recommend \
  -H "Content-Type: application/json" \
  -d '{"goal":"我要规划 MVP 需求评审"}'
```

**Result: 200** — Returned 8 recommendations with `skillId`, numeric rule `score`, `reason`, and `matchedTerms`. The frontend displays the rounded score as a compact number, not a percentage.

## Browser QA

### Configuration

- **API**: `API_PORT=3002`
- **Frontend**: `VITE_API_BASE_URL=http://127.0.0.1:3002`, dev server on port 5174
- **CORS**: Fixed during QA — the API CORS configuration was corrected to allow the frontend origin.

### Viewport Checklist

| Viewport | Result |
|----------|--------|
| 390x844 (mobile) | PASS — no horizontal overflow, cards stack, navigation usable |
| 768x1024 (tablet) | PASS — two-column layout functional, selectors scrollable |
| 1440x900 (desktop) | PASS — full workbench layout, skill tree fully expanded |

### Feature Verification

#### Goal View

- Goal input accepts Chinese text.
- Submit triggers `POST /api/skills/recommend`.
- Result view shows recommended local skills with rounded rule scores (e.g. 60, 50).
- Recommendation descriptions remain visible in the generated result.
- Fallback to a generated plan remains available when recommendation fetch fails.

#### Process View

- Stage selector shows all workflow stages.
- Each stage displays local skill recommendations derived from classified catalog.
- Skills are grouped by stage classification.
- Deliverables, role tasks, input/output sections preserved from MVP.

#### Role View

- Role selector shows all defined roles.
- Each role displays local skill tree built from catalog classifications.
- Skill tree shows depth tiers (intro → working → advanced → expert).
- Skills are grouped by role classification.

#### Skill Detail

- Clicking a skill node shows detail panel.
- Detail includes: skill name, description, local file path, source root, tags, depth, classification reason.
- Path and root fields show actual filesystem locations.
- Note: SVG skill nodes with subtle animation required a DOM-dispatched click in Playwright because the standard click waited for element stability and timed out.

### Console

Only remaining console message: favicon 404 (cosmetic, pre-existing).

## Known Issues and Risks

### Port Conflict During Validation

Port 3001 had an old Node process still bound during initial validation. Clean browser QA was conducted with:
- API on port 3002
- Frontend on port 5174

This is an environment hygiene issue, not a code bug. The `.env.example` default remains 3001.

### CORS Bug (Fixed)

During QA, the frontend on port 5174 could not reach the API on port 3002 due to a missing CORS configuration. This was identified and fixed during the QA session. The fix added proper CORS headers to the Hono API server.

### Favicon 404

The browser console shows a 404 for `/favicon.ico`. This is a pre-existing cosmetic issue unrelated to v0.2 changes.

## Summary

All automated checks pass. API endpoints return correct JSON for health, catalog, classification, and recommendation. Browser QA confirms local skill graph renders correctly across all three views (goal, process, role) at all three viewports. The deterministic classification and recommendation system works as designed, producing scored, explained results without AI or network calls.
