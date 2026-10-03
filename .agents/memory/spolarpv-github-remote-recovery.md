---
name: PowerAdd GitHub remote recovery
description: Safe recovery rule for a GitHub remote with missing objects or no visible branches.
---

When a GitHub remote has no visible branch and rejects otherwise valid pushes with a missing-object or remote-unpack error, do not force-push the existing local history blindly. Preserve the local history on a separate branch, get explicit approval to recreate the remote root, and publish a clean snapshot only if that history reset is acceptable.

**Why:** A server-side object error is not a code or TypeScript problem, and retrying normal/thin-pack pushes does not repair a remote object database. Recreating the root can restore connectivity but changes the history visible on GitHub.

When direct Git transport is unavailable, local `origin/main` may be stale. Confirm the live default branch and commit through the connected GitHub API before comparing histories. Push only when the remote tip is an ancestor of the local tip; if histories are unrelated or the local commit is absent from the remote, stop rather than force-pushing or replacing the remote root.

**Why:** A stale tracking ref or an unreachable Git transport can make a local ahead/behind count misleading. A forced push or replacement root can erase the history users see on GitHub.

Replit's GitHub App connector for Agent API calls, the Git Providers authorization for the workspace Git pane, and HTTPS credentials used by shell `git push` are separate paths. Reconnecting Git Providers may not configure shell Git when no credential helper is installed.

**Why:** A successful pane/account reconnection does not prove that command-line Git has a usable credential; shell transport can still reject its token or have no helper.

**How to apply:** Test the pane and shell transport separately. For shell Git, use a secure credential flow and a dry-run; never display or copy credential values. Verify the live default branch and ancestry before any push. If the remote tip is not an ancestor of local, stop without pushing or rewriting history.