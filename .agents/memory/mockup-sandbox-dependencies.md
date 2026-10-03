---
name: Mockup sandbox dependency isolation
description: Dependency-resolution pitfalls in the isolated canvas preview app.
---

The mockup sandbox is a separate package and Vite root, not just a route inside the main app. It can serve the Vite HTML shell while a component fails to render if the sandbox's local dependency installation is incomplete; the main app's packages are not a reliable substitute, especially when Tailwind versions differ.

**Why:** The sandbox and main application can have distinct manifests and Tailwind configurations.

**How to apply:** When a canvas iframe shows a Vite or Tailwind error, check the component preview route and sandbox workflow logs, ensure the sandbox manifest's dependencies are installed in its directory, then restart that workflow. Do not infer success from an HTTP 200 HTML shell alone.