---
name: PowerAdd GitHub remote recovery
description: Safe recovery rule for a GitHub remote with missing objects or no visible branches.
---

When a GitHub remote has no visible branch and rejects otherwise valid pushes with a missing-object or remote-unpack error, do not force-push the existing local history blindly. Preserve the local history on a separate branch, get explicit approval to recreate the remote root, and publish a clean snapshot only if that history reset is acceptable.

**Why:** A server-side object error is not a code or TypeScript problem, and retrying normal/thin-pack pushes does not repair a remote object database. Recreating the root can restore connectivity but changes the history visible on GitHub.

**How to apply:** Verify the remote URL and repository identity, confirm the token has write access, run local integrity checks, preserve the old local tip, and only then create and publish a clean root commit with user approval.