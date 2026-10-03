---
name: XPENG RDC-only market
description: User-stated country scope and database transition rule for XPENG.
---

XPENG supports only the Democratic Republic of the Congo (country code CD). Keep public and administrative country choices and payment configuration limited to CD.

The user plans to move to a new database. Do not clear or migrate the currently configured database as part of this change. Initialize RDC-only data only after the new database has been securely connected.

The user clarified that earnings remain daily; Africa/Kinshasa is the local time basis for withdrawal hours and calendar-day limits, not a request for hourly earnings.

The development workflow was observed with `RDC_ONLY_MODE=true` on 2026-10-03, while the replacement-database task was still pending; restarting it ran the seed against the currently configured database. Do not infer that seeding is disabled from task status.

**Why:** the user explicitly requested RDC-only support, clarified daily earnings, and said a new database will be provided separately; the scope of altering existing user and transaction data is not confirmed.

**How to apply:** preserve the current database and wait for the secure database-connection flow before initializing the replacement. Before restarting any process that calls the seed, confirm both `RDC_ONLY_MODE` and the database target through the approved environment flow. Use Kinshasa local time for withdrawal windows and per-day limits.