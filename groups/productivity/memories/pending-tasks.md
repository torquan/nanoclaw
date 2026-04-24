---
name: Pending tasks
description: Running list of agent tasks to complete after session restart
type: project
---

## Pending

- **Provision Coolify PostgreSQL** — create a new DB (separate from fitness-challenge) and populate `.env` with `DATABASE_URL`
- **Run initial schema push** — `npx prisma db push && npx prisma generate` against the new DB
- **Seed users** — insert Luis and Miley into the `User` table (with GitHub usernames when known)
- **Register host commands** — `productivity-git-push`, `productivity-git-pull`, `productivity-db-backup`, `productivity-db-restore` on the nanoclaw host
- **First deployment** — build a minimal dashboard (tasks/habits/scoreboard) and deploy to Coolify once v1 data flows
- **Wire GitHub ingestion** — `ExternalActivity` entries from daily commits/PRs for both users (after GitHub usernames confirmed)

## Completed
