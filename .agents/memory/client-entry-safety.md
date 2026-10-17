---
name: Client entry safety
description: Privacy and progress interpretation decisions for client CBT workflows.
---

Keep unfinished therapy writing in memory and warn before discarding; do not silently introduce localStorage drafts.

**Why:** Therapy entries can contain sensitive information on shared devices. Entry-loss protection should not create a new persistence or cross-account exposure risk.

**How to apply:** Any future draft saving needs an explicit privacy-aware design. Navigation protection must run before the form unmounts; verify actual pointer and keyboard activation in a browser, not just a confirmation helper.

Treat practice milestones as encouragement, never a recovery score or a validated treatment target.

**Why:** More records do not necessarily indicate clinical improvement, and fixed activity thresholds are not a clinical assessment.

**How to apply:** Keep count definitions explicit and consistent across dashboard and progress views, label the reporting period, and do not infer clinical outcomes from usage totals alone.
