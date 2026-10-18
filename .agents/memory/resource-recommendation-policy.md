---
name: Resource recommendation deletion policy
description: Why resources referenced in saved recommendations cannot be deleted.
---

Block resource deletion while any saved recommendation references it, regardless of recommendation status. Do not silently rewrite clinical recommendation history.

**Why:** Resource links are stored in JSON rather than foreign keys. Preserving saved history was chosen over removing references from recommendations, and creation-time existence checks alone cannot prevent concurrent deletion.

**How to apply:** Any new writer of recommendation resource references must coordinate with deletion through transaction-scoped resource row locks and revalidate existence under those locks. Keep reference checks after deletion acquires its lock, at READ COMMITTED isolation, so concurrent committed recommendations are visible.

Historical integrity audits must be opt-in and aggregate-only. Do not inspect
existing client records while implementing or testing them; use synthetic
disposable data. Any repair of clinical history requires a separate explicit
decision.

**Why:** The user requires a privacy-safe audit, not permission to inspect or
rewrite existing clinical records.

**How to apply:** Obtain approval of the target before any operational audit.
Keep diagnosis separate from repair; findings alone do not authorize changes.

Deletion explanations must follow current recommendation read permissions, not the original recommendation author's identity. Show only reference IDs, statuses, and dates; hidden references may disclose only that deletion is blocked, never their count, client identities, or clinical text.

**Why:** Staff need an actionable explanation without gaining access to another therapist's clients or losing access to history after a legitimate client reassignment.

**How to apply:** Keep the global deletion guard independent of the viewer-scoped summary. A summary is advisory: concurrent references must still be rejected by deletion, and the dialog must refresh after a conflict.
