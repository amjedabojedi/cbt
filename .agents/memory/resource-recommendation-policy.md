---
name: Resource recommendation deletion policy
description: Why resources referenced in saved recommendations cannot be deleted.
---

Block resource deletion while any saved recommendation references it, regardless of recommendation status. Do not silently rewrite clinical recommendation history.

**Why:** Resource links are stored in JSON rather than foreign keys. Preserving saved history was chosen over removing references from recommendations, and creation-time existence checks alone cannot prevent concurrent deletion.

**How to apply:** Any new writer of recommendation resource references must coordinate with deletion through transaction-scoped resource row locks and revalidate existence under those locks. Keep reference checks after deletion acquires its lock, at READ COMMITTED isolation, so concurrent committed recommendations are visible.
