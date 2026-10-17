---
name: Therapy test isolation
description: Safety boundary for authenticated persistence and authorization testing.
---

Authenticated persistence and access tests must never use existing client records or send real email.

**Why:** The user explicitly required this boundary; therapy records are sensitive, and a test cleanup mistake must not expose or delete them.

**How to apply:** Use a disposable database and synthetic accounts rather than seeding into a shared development database. Keep workspace credentials out of test app processes, disable background delivery, and block external network calls. Do not point browser tests at the normal app to gain authenticated coverage.
