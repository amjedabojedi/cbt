---
name: Production asset freshness
description: Prevent successful publishing from silently serving older frontend assets.
---

Keep the compiled production server and freshly built frontend in matching output locations, and verify built static assets rather than relying only on development-server tests.

**Why:** Thought-record and phone fixes passed development tests, but production still served an older interface. The frontend build output and the server's default static directory were in different trees, and an old checked-in static folder masked the mismatch.

**How to apply:** Check that the production start entry resolves the freshly built HTML, not a leftover generated folder. Run production-frontend browser checks using the disposable test database. Verify custom and platform domains separately: different public asset hashes were observed, so testing one address does not establish that another serves the same release.
