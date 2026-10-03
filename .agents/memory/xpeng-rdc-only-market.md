---
name: XPENG RDC-only market
description: User-stated country scope and database transition rule for XPENG.
---

XPENG supports only the Democratic Republic of the Congo (country code CD). Keep public and administrative country choices and payment configuration limited to CD.

The user plans to move to a new database. Do not clear or migrate the currently configured database as part of this change. Initialize RDC-only data only after the new database has been securely connected.

**Why:** the user explicitly requested RDC-only support and said a new database will be provided separately; the scope of deleting existing user and transaction data is not confirmed.

**How to apply:** when changing country handling or initializing the replacement database, preserve the existing database and wait for the secure database-connection flow before seeding the new one.