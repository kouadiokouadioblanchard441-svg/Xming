---
name: SpolarPV brand color migration
description: Green brand color replaced by orange + sky-blue; semantic classes untouched.
---

Green (#00A651 family) brand replaced by orange + sky-blue (#87CEEB) across the SpolarPV UI. Semantic Tailwind classes named `green-*` (used for "success"/"active" states, not brand color) were deliberately left untouched — they are functional, not brand, colors.

**Why:** avoids breaking status indicators (active/success) while still executing the rebrand.
**How to apply:** when touching color tokens in this codebase, distinguish brand-color usages (should follow current orange/sky-blue palette) from semantic state colors (`green-*` = success/active, `red-*` = danger, etc. — leave these as-is).
