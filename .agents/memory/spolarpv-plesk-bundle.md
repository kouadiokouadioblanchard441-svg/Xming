---
name: PowerAdd Plesk bundle
description: Production deployment convention for the prebuilt Git bundle and external SDK compatibility
---

Plesk deployment uses the committed `dist/index.cjs` and `dist/public/` artifacts; Plesk performs pull, deploy, and restart rather than rebuilding. Dependencies whose package exports only ESM must be bundled into the CommonJS entry point.

**Why:** The production entry is launched directly with Node CommonJS, and externalizing an ESM-only SDK caused startup failure even though the TypeScript dev server worked.

**How to apply:** Run the production build before pushing, keep `dist/**` unignored and tracked, and test `NODE_ENV=production node dist/index.cjs` before deployment.