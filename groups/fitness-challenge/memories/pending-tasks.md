---
name: Pending tasks from 2026-03-19 session
description: Tasks that need to be completed after session restart — stats page build + Miley food log
type: project
---

## 1. Build Stats Page with Chart.js (HIGH PRIORITY — Luis waiting)
- Full plan at: `/home/node/.claude/plans/kind-percolating-marble.md`
- File to modify: `/workspace/extra/fitness-challenge/apps/report/server.js`
- The server already has: `getStatsData()` function (lines 230-276), `USERS` config (lines 598-601), and a working `GET /stats/:name` route (lines 603-853) with server-rendered SVGs
- **Task**: Replace SVG charts with Chart.js (CDN) for better UX (tooltips, animations, responsive)
- Remove `lineChart()` (lines 96-174) and `barChart()` (lines 176-227)
- Rewrite the route to embed JSON data + Chart.js client-side rendering
- Add nav links from main dashboard person names to `/stats/luis` and `/stats/miley` (around lines 496 and 544)
- After changes: commit, push via `host_command(fitness-git-push)`, Coolify auto-deploys

## 2. Log Miley's Lunch (2026-03-19)
- Pulled pork (full portion, she ate 1/3 then the rest) + baked potato + sour cream
- Estimates:
  - Pulled pork ~240g: 540 kcal, 60g protein, 0g carbs, 30g fat
  - Baked potato ~200g: 186 kcal, 4g protein, 43g carbs, 0.2g fat
  - Sour cream ~40g: 77 kcal, 1g protein, 1.5g carbs, 7.5g fat
  - **Total: ~803 kcal | 65g protein | 44.5g carbs | 37.7g fat**
- Log as LUNCH for Miley (userId: efca95a8-425e-45fe-8faf-aecf3884d5c8), date 2026-03-19

**Why:** Luis threatened to drink a litre of coke if the stats page wasn't deployed. He's been waiting 30+ minutes. Ship ASAP.

**How to apply:** Start implementing immediately on session restart. No planning phase needed — plan is complete.
