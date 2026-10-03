---
name: Admin-managed settings
description: XPENG product settings that the user expects to control from the admin panel.
---

Business rates and bonuses, including referral percentages, must remain changeable through the administrator panel. Application constants may provide initial defaults, but runtime calculations must read the persisted settings and startup seeding must preserve administrator changes.

**Why:** the user explicitly said referral bonuses should not be hard-coded and must be fully editable from the admin panel.

**How to apply:** store editable values in platform settings, expose them in the admin form, validate them on save, and use database-backed values when calculating rewards.