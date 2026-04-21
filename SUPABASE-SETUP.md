# Multi-user setup (Supabase)

This app was originally single-user SQLite. The Supabase scaffolding here
converts it to a 2-admin multi-user app. The SQLite code in `db/` and
`lib/db.ts` still exists and works — the port is incremental.

## Sharing model

| Data                                                       | Scope                         |
| ---------------------------------------------------------- | ----------------------------- |
| tasks, notes, recurring_templates, calendar_events         | Private to each user          |
| projects, project_items, project_links, report_docs        | Shared — both admins full RW  |
| system_state (e.g. `last_monday_reset`)                    | Shared                        |
| user_integrations (Google / Notion OAuth tokens)           | Private to each user          |

Both users are created as admins with equal permissions. There is no role
hierarchy; the `profiles.role` column exists only as a hook for the future.

## One-time setup

### 1. Create the Supabase project

1. Create a new project at https://supabase.com/dashboard.
2. Copy the project URL and the `anon` public key from **Settings → API**.
3. `cp .env.local.example .env.local` and paste in the values.

### 2. Apply the schema + RLS policies

In the Supabase SQL editor, run these files **in this order**:

1. [db/supabase-schema.sql](db/supabase-schema.sql) — tables, indexes, triggers
2. [db/supabase-rls.sql](db/supabase-rls.sql) — row-level security policies

### 3. Create the two admin users

In the Supabase dashboard, go to **Authentication → Users → Add user**.
Create exactly two users with email + password. The `handle_new_user`
trigger will auto-create matching rows in `public.profiles`.

Because signup is **not** exposed in the UI, no third user can register.

### 4. Install dependencies + run

```
npm install
npm run dev
```

Visiting any page while logged out redirects to `/auth/login`.

## File layout added by this scaffold

```
db/
  supabase-schema.sql       Postgres schema
  supabase-rls.sql          RLS policies (run after schema)
lib/
  supabase/
    server.ts               Server client (uses next/headers cookies)
    client.ts               Browser client
    middleware.ts           Session refresh helper called from proxy.ts
  auth.ts                   getCurrentUser / requireUser helpers
  types.supabase.ts         Postgres-shaped types (booleans, user_id)
app/
  auth/
    login/page.tsx          Email + password login UI
    callback/route.ts       OAuth/magic-link callback (future-proof)
    signout/route.ts        POST to sign out
proxy.ts                    Next.js 16 proxy (formerly middleware) — runs updateSession on every non-static request
.env.local.example          Required env vars
```

## Migration plan from SQLite to Supabase (not yet done)

The scaffolding above sets up auth + schema. The remaining work is to port
the data layer away from `better-sqlite3`:

1. **Rewrite `lib/db.ts`**: replace each function with Supabase queries. RLS
   means most queries don't need an explicit `user_id` filter — the current
   session scopes automatically.
2. **Update API routes in `app/api/**`** to call `requireUser()` and use the
   new `lib/db.ts`. Return 401 when unauthenticated.
3. **Update `lib/notion.ts` and `lib/google-calendar.ts`** to read OAuth
   tokens from `user_integrations` (keyed by the current user's id) instead
   of the shared `system_state` table.
4. **Swap imports** from `@/lib/types` to `@/lib/types.supabase` as each
   caller is ported. When `lib/db.ts` is fully migrated, delete the old
   `lib/types.ts` and rename `lib/types.supabase.ts` → `lib/types.ts`.
5. **Delete SQLite code**: `db/index.ts`, `db/schema.sql`, and the
   `better-sqlite3` / `@types/better-sqlite3` dependencies.

Consider porting one route at a time (e.g. start with `/api/tasks`) so the
app stays runnable during the migration.

## Assumptions to verify

- `cookies()` from `next/headers` returns a Promise in Next.js 16.2.4 —
  verified against the installed Next typings.
- Next.js 16 renamed `middleware.ts` → `proxy.ts` at the project root, with
  the exported function renamed from `middleware` to `proxy`. The helper
  file [lib/supabase/middleware.ts](lib/supabase/middleware.ts) kept its
  name because it is a regular module, not subject to the file convention.
