# Wartenix Development

You are working on the Wartenix project, mounted at /workspace/wartenix.

## Critical Rules

- NEVER run `npm install`, `bun install`, or any package manager **inside this container**. Use `host_command(command_id="wartenix-install", action="start")` instead.
- NEVER start a dev server (`bun run dev`, `npm run dev`, etc.) **inside the container**. Use `host_command(command_id="wartenix-dev", action="start")` instead.
- NEVER run build commands **inside the container**. Use `host_command(command_id="wartenix-build", action="start")` instead.
- This container runs Linux — the host is macOS. Native modules are incompatible. All package/build/server commands must go through `host_command`.
- Read and edit files directly at /workspace/extra/wartenix. Use `cd /workspace/extra/wartenix` as your working directory.
- NEVER ask the user to test things for you or provide credentials. You have full browser access — test everything yourself.

## Host Commands

You can trigger whitelisted commands on the host machine via the `host_command` MCP tool. Check `/workspace/ipc/host_commands.json` for available commands and their status.

Available commands:
- **`wartenix-dev`** — Start/stop the dev server (`bun run dev`)
- **`wartenix-install`** — Install dependencies (`bun install`)
- **`wartenix-build`** — Production build (`bun run build`)
- **`wartenix-lint`** — Run linter (`bun run lint`)
- **`wartenix-db-seed`** — Seed the database (`bun run db:seed`)
- **`wartenix-db-push`** — Push schema changes (`bun run db:push`)
- **`wartenix-db-migrate`** — Run migrations (`bun run db:migrate`)
- **`wartenix-db-generate`** — Regenerate Prisma client (`bun run db:generate`)
- **`wartenix-setup-test-admin`** — Create test admin user with full access (creates better-auth account + ADMIN role on all tenants)
- **`wartenix-git-push`** — Push committed changes to GitHub (`git push`)
- **`wartenix-db-sql`** — Run SQL query against the database (reads query from `/workspace/ipc/sql-query.sql`)

All commands run on the macOS host where native modules work. Use these instead of running package managers or build tools inside the container.

Usage examples:
```
host_command(command_id="wartenix-dev", action="start")       # Start the dev server
host_command(command_id="wartenix-dev", action="status")      # Check if running
host_command(command_id="wartenix-dev", action="logs")        # Read recent output
host_command(command_id="wartenix-dev", action="stop")        # Stop the dev server
host_command(command_id="wartenix-install", action="start")   # Install dependencies
host_command(command_id="wartenix-db-seed", action="start")   # Seed the database
host_command(command_id="wartenix-db-push", action="start")   # Push schema changes
```

To restart the dev server, stop then start:
```
host_command(command_id="wartenix-dev", action="stop")
host_command(command_id="wartenix-dev", action="start")
```

## Testing & Verification

The dev server runs on the host and is accessible from this container at `http://host.docker.internal:7800`.

### Pre-flight checklist (before any browser testing)

1. Ensure dev server is running: `host_command(command_id="wartenix-dev", action="status")` — start it if not running
2. Check if you have saved auth state: `ls /workspace/group/auth-state.json`
3. If auth state exists, load it: `agent-browser state load /workspace/group/auth-state.json`

### Authentication — Handle it yourself

The app uses better-auth with email/password. Test credentials: `dev-agent@example.com` / `testpassword123`

**First-time setup (run once — gives you admin access to all tenants):**

```
host_command(command_id="wartenix-db-seed", action="start")              # Ensure seed data exists
host_command(command_id="wartenix-setup-test-admin", action="start")     # Create admin account
```

This creates a better-auth account with password + ADMIN role on all tenants. After this, you can login via browser.

**Login and save auth state:**

1. `agent-browser open http://host.docker.internal:7800/login`
2. Fill email (`dev-agent@example.com`) and password (`testpassword123`), submit
3. `agent-browser state save /workspace/group/auth-state.json`

**In future sessions**, just load saved state:

```bash
agent-browser state load /workspace/group/auth-state.json
agent-browser open http://host.docker.internal:7800/t/classic-cuts/admin/dashboard
```

If the saved state has expired, re-run login steps above.

**Key admin URLs (after login):**
- Dashboard: `http://host.docker.internal:7800/t/classic-cuts/admin/dashboard`
- Team: `http://host.docker.internal:7800/t/classic-cuts/admin/team`
- Team member edit: `http://host.docker.internal:7800/t/classic-cuts/admin/team/{id}/edit`
- Services: `http://host.docker.internal:7800/t/classic-cuts/admin/services`
- Settings: `http://host.docker.internal:7800/t/classic-cuts/admin/settings`

### Browser automation tips for React/Next.js forms

React forms use controlled components — `agent-browser fill` sometimes doesn't trigger React's onChange handlers. If fill doesn't work:

1. **Try `type` instead of `fill`** — types character by character, triggering key events:
   ```bash
   agent-browser click @e1          # Focus the field first
   agent-browser type @e1 "text"    # Type character by character
   ```

2. **Use semantic locators** instead of refs (more resilient to DOM changes):
   ```bash
   agent-browser find label "Email" fill "dev-agent@example.com"
   agent-browser find label "Password" fill "testpassword123"
   agent-browser find role button click --name "Sign Up"
   ```

3. **If form submission fails** (no POST request), try pressing Enter:
   ```bash
   agent-browser press Enter
   ```

4. **Debug form state** with JavaScript evaluation:
   ```bash
   agent-browser eval "document.querySelector('form')?.action"
   agent-browser eval "document.querySelectorAll('input').length"
   ```

5. **Always re-snapshot after navigation** — refs change when the DOM updates:
   ```bash
   agent-browser snapshot -i  # Get fresh refs
   ```

6. **Wait for navigation/network** before checking results:
   ```bash
   agent-browser wait --load networkidle
   agent-browser snapshot -i
   ```

### Verifying visual changes

```bash
agent-browser open http://host.docker.internal:7800/your-page
agent-browser snapshot -i
agent-browser screenshot result.png
```

### SQL Debugging

You can run SQL queries directly against the database. Write your query to the IPC file, then call the host command:

```bash
# 1. Write query to the IPC file
echo 'SELECT email, name FROM users LIMIT 10' > /workspace/ipc/sql-query.sql

# 2. Execute it
host_command(command_id="wartenix-db-sql", action="start")
```

**JSON output** (for scripting/automation):
```bash
echo '--json SELECT id, email FROM users LIMIT 5' > /workspace/ipc/sql-query.sql
host_command(command_id="wartenix-db-sql", action="start")
```

**Describe table schema:**
```bash
echo '--describe users' > /workspace/ipc/sql-query.sql
host_command(command_id="wartenix-db-sql", action="start")
```

Note: Prisma uses quoted table names — use `"User"` not `users` if the query fails. Check the schema at `/workspace/extra/wartenix/src/prisma/schema.prisma` for table names (look at `@@map()` annotations).

## Project Overview

Wartenix is a SaaS platform for service businesses (barber shops, salons, spas). See /workspace/extra/wartenix/CLAUDE.md for full project details.

- Stack: Next.js 15, React 19, TailwindCSS 4, better-auth, Prisma, TypeScript 5
- Package manager on host: bun
- Key dirs: src/actions/, src/app/, src/components/, src/lib/, src/prisma/
