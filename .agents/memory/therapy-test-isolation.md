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
