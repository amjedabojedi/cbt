---
name: Client entry safety
description: Privacy and progress interpretation decisions for client CBT workflows.
---

Keep unfinished therapy writing in memory and warn before discarding; do not silently introduce localStorage drafts.

**Why:** Therapy entries can contain sensitive information on shared devices. Entry-loss protection should not create a new persistence or cross-account exposure risk.

**How to apply:** Any future draft saving needs an explicit privacy-aware design. Navigation protection must run before the form unmounts; verify actual pointer and keyboard activation in a browser, not just a confirmation helper.

Use native browser Back/Forward to verify history protection, not only a synthetic `popstate`.

**Why:** Chromium delivers native `popstate` to `window` at the target phase, where registration order can let an earlier router listener unmount a form before its later capture listener runs. Synthetic dispatch alone did not expose this loss.

**How to apply:** Preserve history interception before router subscriptions and test browser history with real unfinished writing. For a declined native reload, wait for the dialog handling rather than a navigation completion that must never happen.

Use the same alias imports for shared singleton modules in both the eager entrypoint and lazy pages.

**Why:** This app's development entrypoint has a cache-busting query. Vite propagates it to relative imports, creating a second module instance when lazy pages import the same file through an alias. A shared guard registry can then be split between two instances.

**How to apply:** Do not mix a relative entrypoint import with alias imports of stateful singleton modules. Verify in the isolated browser harness, whose development loading behavior can expose this while a bundled build hides it.

Do not describe dismissing a therapy form as cancelling an already-issued save.

**Why:** A write may already have reached the database while its response is delayed or lost. A local discard decision cannot undo it.

**How to apply:** Keep pending-save feedback distinct from unsaved-draft discard warnings, and test delayed responses rather than assuming a closed form means no write occurred.

Show completion after a confirmed write without waiting for background History or report refreshes.

**Why:** A delayed History read reproduced a stuck Save screen on both desktop and phone even though the server had already acknowledged persistence. Treating refresh completion as save completion misrepresented the result.

**How to apply:** Separate write success from cache refresh. Update an already-loaded in-memory list with the acknowledged record while refetching; do not invent a complete list when it has never loaded. Preserve writing on write failure, show a persistent error near the action, and never label a confirmed save as failed because a later read could not refresh.

Do not declare the user's live thought-challenge failure resolved solely because isolated browser checks pass.

**Why:** The user repeatedly reported that the History menu's challenge entry did not work after earlier reports said the flow passed. Successful isolated checks and publicly present handler code do not establish what happens in the user's authenticated browser.

**How to apply:** Trace the exact reported entry point and distinguish local test evidence from live-session verification. If the failure cannot be reproduced, say that explicitly and establish what happens immediately after the click. Do not infer a database fault or an outdated release without evidence.

Treat practice milestones as encouragement, never a recovery score or a validated treatment target.

**Why:** More records do not necessarily indicate clinical improvement, and fixed activity thresholds are not a clinical assessment.

**How to apply:** Keep count definitions explicit and consistent across dashboard and progress views, label the reporting period, and do not infer clinical outcomes from usage totals alone.

Never reconstruct missing historical belief ratings or treat original-versus-alternative belief ratings as a measured change over time.

**Why:** The challenge asks about two different thoughts at the same point in time. Their difference is not a before/after measurement, and older missing ratings cannot be recovered from the alternative rating.

**How to apply:** Preserve the distinction in forms, success messages, charts, and exports. Unknown observations must remain unavailable, not become zero intensity or inferred improvement.
