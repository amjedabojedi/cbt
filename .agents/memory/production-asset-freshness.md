---
name: Production asset freshness
description: Prevent successful publishing from silently serving older frontend assets.
---

Keep the compiled production server and freshly built frontend in matching output locations, and verify built static assets rather than relying only on development-server tests.

**Why:** Thought-record and phone fixes passed development tests, but production still served an older interface. The frontend build output and the server's default static directory were in different trees, and an old checked-in static folder masked the mismatch.

**How to apply:** Check that the production start entry resolves the freshly built HTML, not a leftover generated folder. Run production-frontend browser checks using the disposable test database. Verify custom and platform domains separately: different public asset hashes were observed, so testing one address does not establish that another serves the same release.

Matching public frontend hashes establish parity, not recency. Only compare against an expected identity when it comes from the exact intended published build; an unrelated workspace rebuild is not authoritative.

**Why:** Two domains can both serve the same older frontend even after a successful publish.

**How to apply:** Obtain fresh deployment metadata first, then compare the public origins without authentication. Treat missing metadata, failed requests, redirects, and unsupported frontend identities as unknown freshness, not a successful match. Never infer which release is newer from hash ordering.
