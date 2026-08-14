---
name: PowerAdd Supabase pooler
description: External Supabase PostgreSQL connection requirements for the imported PowerAdd app
---

Use the exact PostgreSQL URI copied from Supabase's Database connection string screen, with the current project reference, host, port, username, and a newly rotated password. The public `https://...supabase.co` API URL is not a PostgreSQL connection string, and a stale or malformed pooler tenant can produce `tenant/user not found` even when the URI looks syntactically valid.

**Why:** Login, sessions, seeding, schema synchronization, and payment persistence all depend on the same external PostgreSQL connection. When it was wrong, the app started but every database-backed route failed.

**How to apply:** Store the URI only as `SUPABASE_DATABASE_URL`, test `select 1` before debugging application routes, run the Drizzle schema push, then restart the workflow so the process reloads the secret.