---
name: Concurrent completion changes
description: Recheck combined files when completion synchronizes concurrent edits.
---

When a completion rejection describes code that differs from the just-tested checkout, inspect the current files before assuming the feedback is stale.

**Why:** Completion synchronized concurrent engagement-test edits after a successful isolated run, leaving duplicated helpers and detached test statements in the combined file.

**How to apply:** Preserve other completed work, repair the combined file, and rerun its focused isolated tests. Earlier passing results do not verify files changed during synchronization.
