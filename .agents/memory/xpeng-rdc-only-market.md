---
name: XPENG RDC-only market
description: User-stated country scope and database transition rule for XPENG.
---

XPENG supports only the Democratic Republic of the Congo (country code CD). Keep public and administrative country choices and payment configuration limited to CD.

The user plans to move to a new database. Do not clear or migrate the currently configured database as part of this change. Initialize RDC-only data only after the new database has been securely connected.

**Why:** the user explicitly requested RDC-only support and said a new database will be provided separately; the scope of deleting existing user and transaction data is not confirmed.

The development workflow was observed with `RDC_ONLY_MODE=true` on 2026-10-03, while the replacement-database task was still pending; restarting it ran the seed against the currently configured database. Do not infer that seeding is disabled from task status.

**Why:** the user explicitly requested RDC-only support and said a new database will be provided separately; the scope of deleting existing user and transaction data is not confirmed. The observed environment flag made an ordinary server restart capable of running database mutations.

**How to apply:** before restarting any process that calls `seed()`, confirm both `RDC_ONLY_MODE` and the database target through the approved environment flow. Preserve the existing database and wait for the secure database-connection flow before initializing the replacement.