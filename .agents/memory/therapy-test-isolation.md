---
name: Therapy test isolation
description: Safety boundary for authenticated persistence and authorization testing.
---

Authenticated persistence and access tests must never use existing client records or send real email.

**Why:** The user explicitly required this boundary; therapy records are sensitive, and a test cleanup mistake must not expose or delete them.

**How to apply:** Use a disposable database and synthetic accounts rather than seeding into a shared development database. Keep workspace credentials out of test app processes, disable background delivery, and block external network calls. Do not point browser tests at the normal app to gain authenticated coverage.

Give each isolated browser-test server its own temporary Vite dependency cache.

**Why:** Sharing the preview's optimized dependency cache lets a preview restart invalidate modules in the test server, causing unrelated lazy-loaded pages to fail and misleading journey timeouts.

**How to apply:** Keep the test cache inside the disposable test directory so it is removed with the test database. Do not repair this by weakening browser assertions or adding retries that hide module-loading failures.

Verify ordinary typing and focus retention, not only setting entire field values.

**Why:** Whole-field fill operations previously passed while normal typing in a challenge accepted only the first character because the input lost focus. A passing save/API check did not establish that the form was usable.

**How to apply:** Exercise character-by-character entry on desktop and phone layouts, assert the full value and focus, and enter through each actual user-facing start action before claiming the complete flow works.

Check browser-spec types and collection explicitly after syncing concurrent changes, even when only the runner is reported as conflicting.

**Why:** A sync once moved valid browser-test statements outside test callbacks and mixed fixtures between journeys without leaving conflict markers in that spec. Configuration-only checks still passed, so they did not establish that the journeys could load.

**How to apply:** Type-check the affected E2E specs explicitly and execute their intended projects after a sync; the regular application compiler does not substitute for this check.
