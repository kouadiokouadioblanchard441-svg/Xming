---
name: PowerAdd Plesk Git work tree
description: Plesk remote-Git deployment path constraint for the PowerAdd app.
---

Plesk's remote-Git deployment needs a real work tree for the checkout destination. Configure the deployment path as the domain's website root (for example `/httpdocs`), not the internal Git repository directory or `.git`.

**Why:** Plesk can validate the GitHub deploy key while still failing during file deployment with `fatal: this operation must be run in a work tree` when its deployment target points at a bare repository or a corrupted repository record.

**How to apply:** If changing the deployment path does not repair the existing record, remove and recreate the Plesk Git repository using the GitHub URL and `main` branch, then set the website-root deployment path. Keep `dist/index.cjs` and `dist/public/` committed because Plesk runs the prebuilt bundle.

Plesk also rejects creating a second Node.js application with the same application root. Edit the existing Node.js application when it is the intended app; otherwise remove only the duplicate Node.js application record or assign the new app a distinct subdirectory containing its own document root.